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
  ShaderMaterial,
  Uniform,
  Vector3,
} from "three";
import type { PerspectiveCamera, WebGLRenderer, WebGLRenderTarget } from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";
import type { TokyoWeather } from "../../weather/schema";
import vertexShader from "./particles.vert.glsl?raw";
import fragmentShader from "./particles.frag.glsl?raw";

const capacity = 4096;
const bounds = new Box3(new Vector3(-6.7, 0, -3.1), new Vector3(-2.7, 5, 3.1));

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
    time: new Uniform(0),
    snow: new Uniform(snow ? 1 : 0),
    strength: new Uniform(0),
    velocity: new Uniform(new Vector3(0, snow ? -1.2 : -8, 0)),
    color: new Uniform(new Color()),
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return { mesh, geometry, uniforms };
}

export class WeatherPass extends Pass {
  private readonly scene = new Scene();
  private readonly rain = particles(false);
  private readonly snow = particles(true);
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();

  constructor(private readonly camera: PerspectiveCamera) {
    super();
    this.needsSwap = false;
    this.scene.add(this.rain.mesh, this.snow.mesh);
  }

  update(weather: TokyoWeather, sky: Color): void {
    const bearing = (weather.windDirection * Math.PI) / 180;
    const x = Math.cos(bearing) * weather.windSpeed;
    const z = Math.sin(bearing) * weather.windSpeed;
    for (const [layer, amount] of [
      [this.rain, weather.rain],
      [this.snow, weather.snowfall],
    ] as const) {
      layer.geometry.instanceCount = Math.min(capacity, Math.ceil(Math.sqrt(amount) * 700));
      layer.mesh.visible = amount > 0;
      layer.uniforms.strength.value = Math.min(1, Math.sqrt(amount / 20));
      layer.uniforms.velocity.value.y =
        layer === this.snow ? -1.2 : -Math.min(14, 6 + Math.sqrt(amount) * 2);
      layer.uniforms.velocity.value.x = x;
      layer.uniforms.velocity.value.z = z;
      layer.uniforms.color.value.copy(sky).lerp(new Color(0.65, 0.7, 0.75), 0.3);
    }
  }

  get active(): boolean {
    if (!this.rain.mesh.visible && !this.snow.mesh.visible) return false;
    this.camera.updateMatrixWorld();
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    return this.frustum.setFromProjectionMatrix(this.projection).intersectsBox(bounds);
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    if (!this.active) return;
    const time = performance.now() / 1000;
    this.rain.uniforms.time.value = time;
    this.snow.uniforms.time.value = time;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? writeBuffer : readBuffer);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }
}
