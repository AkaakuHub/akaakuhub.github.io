import {
  Box3,
  Color,
  Frustum,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Scene,
  Vector3,
} from "three";
import type { PerspectiveCamera, RenderTarget } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import {
  attribute,
  cameraProjectionMatrix,
  cameraViewMatrix,
  modelViewMatrix,
  uniform,
  uv,
  wgslFn,
} from "three/tsl";
import type { TokyoWeather } from "../../weather/schema";

const capacity = 4096;
const bounds = new Box3(new Vector3(-6.7, 0, -3.1), new Vector3(-2.7, 5, 3.1));
const vertex = wgslFn(`
fn weatherVertex(seed: vec3f, position: vec3f, modelView: mat4x4f, view: mat4x4f,
  projection: mat4x4f, time: f32, snow: f32, strength: f32, velocity: vec3f) -> vec4f {
  let extent = vec3f(3.95, 5.0, 6.0);
  var center = (seed * extent + velocity * time) % extent;
  center = (center + extent) % extent + vec3f(-6.7, 0.0, -3.0);
  center.z += snow * 0.06 * sin(time * 1.8 + seed.x * 40.0);
  var eye = modelView * vec4f(center, 1.0);
  let fall = (view * vec4f(velocity, 0.0)).xy;
  let along = normalize(fall + vec2f(0.0, -0.001));
  let across = vec2f(along.y, -along.x);
  let width = mix(mix(0.006, 0.012, strength), 0.024, snow);
  let length = mix(mix(0.1, 0.24, strength), 0.024, snow);
  let offset = across * position.x * width + along * position.y * length;
  eye = vec4f(eye.xy + offset, eye.zw);
  return projection * eye;
}`);
const fragment = wgslFn(`
fn weatherColor(uv: vec2f, snow: f32, strength: f32, color: vec3f) -> vec4f {
  let p = uv * 2.0 - 1.0;
  let edge = mix(abs(p.x), length(p), snow);
  let opacity = (1.0 - smoothstep(0.5, 1.0, edge)) * (1.0 - p.y * p.y);
  return vec4f(color, opacity * mix(mix(0.35, 0.7, strength), 0.85, snow));
}`);

function particles(snow: boolean) {
  const plane = new PlaneGeometry();
  const geometry = new InstancedBufferGeometry();
  geometry.setIndex(plane.index);
  geometry.setAttribute("position", plane.getAttribute("position"));
  geometry.setAttribute("uv", plane.getAttribute("uv"));
  const seeds = new Float32Array(capacity * 3);
  for (let index = 0; index < seeds.length; index++) {
    const value = Math.sin((index + 1) * 127.1) * 43758.5453;
    seeds[index] = value - Math.floor(value);
  }
  geometry.setAttribute("seed", new InstancedBufferAttribute(seeds, 3));
  geometry.instanceCount = 0;
  const uniforms = {
    time: uniform(0),
    snow: uniform(snow ? 1 : 0),
    strength: uniform(0),
    velocity: uniform(new Vector3(0, snow ? -1.2 : -8, 0)),
    color: uniform(new Color()),
  };
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  material.vertexNode = vertex({
    seed: attribute("seed", "vec3"),
    position: attribute("position", "vec3"),
    modelView: modelViewMatrix,
    view: cameraViewMatrix,
    projection: cameraProjectionMatrix,
    time: uniforms.time,
    snow: uniforms.snow,
    strength: uniforms.strength,
    velocity: uniforms.velocity,
  });
  material.fragmentNode = fragment({
    uv: uv(),
    snow: uniforms.snow,
    strength: uniforms.strength,
    color: uniforms.color,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return { mesh, geometry, uniforms };
}

export class WeatherPass {
  private readonly scene = new Scene();
  private readonly rain = particles(false);
  private readonly snow = particles(true);
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  constructor(private readonly camera: PerspectiveCamera) {
    this.scene.add(this.rain.mesh, this.snow.mesh);
  }
  update(weather: TokyoWeather, sky: Color): void {
    const bearing = (weather.windDirection * Math.PI) / 180;
    for (const [layer, amount] of [
      [this.rain, weather.rain],
      [this.snow, weather.snowfall],
    ] as const) {
      layer.geometry.instanceCount = Math.min(capacity, Math.ceil(Math.sqrt(amount) * 700));
      layer.mesh.visible = amount > 0;
      layer.uniforms.strength.value = Math.min(1, Math.sqrt(amount / 20));
      layer.uniforms.velocity.value.set(
        Math.cos(bearing) * weather.windSpeed,
        layer === this.snow ? -1.2 : -Math.min(14, 6 + Math.sqrt(amount) * 2),
        Math.sin(bearing) * weather.windSpeed,
      );
      layer.uniforms.color.value.copy(sky).lerp(new Color(0.65, 0.7, 0.75), 0.3);
    }
  }
  get active(): boolean {
    if (!this.rain.mesh.visible && !this.snow.mesh.visible) return false;
    this.camera.updateMatrixWorld();
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    return this.frustum
      .setFromProjectionMatrix(this.projection, this.camera.coordinateSystem)
      .intersectsBox(bounds);
  }
  render(renderer: Renderer, target: RenderTarget): void {
    if (!this.active) return;
    this.rain.uniforms.time.value = this.snow.uniforms.time.value = performance.now() / 1000;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(target);
    try {
      renderer.render(this.scene, this.camera);
    } finally {
      renderer.autoClear = autoClear;
    }
  }
}
