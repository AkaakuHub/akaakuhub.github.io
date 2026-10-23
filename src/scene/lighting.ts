import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  RectAreaLight,
} from "three";
import type { Scene, WebGLRenderer } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { tokyoSunlight } from "./daylight/solar";

export function illuminate(scene: Scene, renderer: WebGLRenderer) {
  const generator = new PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const reflection = generator.fromScene(environment, 0.04);
  scene.environment = reflection.texture;
  environment.dispose();
  generator.dispose();

  const hemisphere = new HemisphereLight("#dce9fa", "#a39172");
  const sun = new DirectionalLight();
  sun.target.position.set(0, 1.2, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 36;
  sun.shadow.normalBias = 0.015;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 2;
  scene.add(hemisphere, sun, sun.target);

  RectAreaLightUniformsLib.init();
  const ceilingLights = [-1.05, 1.35].map((z) => {
    const light = new RectAreaLight("#f4fff2", 12, 0.36, 1.03);
    light.position.set(0, 2.765, z);
    light.rotation.x = -Math.PI / 2;
    scene.add(light);
    return light;
  });
  const skyMaterials = new Set<MeshBasicMaterial>();
  const tubeMaterials = new Set<MeshStandardMaterial>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (object.name === "world-sky" && material instanceof MeshBasicMaterial)
        skyMaterials.add(material);
      if (object.name === "room-fluorescent" && material instanceof MeshStandardMaterial)
        tubeMaterials.add(material);
    }
  });
  const background = new Color();
  const ceilingBounce = new Color("#dce2cb");
  scene.background = background;

  function update(date: Date): void {
    const state = tokyoSunlight(date);
    sun.position.copy(state.direction).multiplyScalar(16).add(sun.target.position);
    sun.color.copy(state.color);
    sun.intensity = state.intensity;
    sun.shadow.needsUpdate = true;
    hemisphere.color.copy(state.sky).lerp(ceilingBounce, 1 - state.daylight);
    hemisphere.groundColor.set("#6e6654");
    hemisphere.intensity = 0.26 + state.daylight * 0.45;
    scene.environmentIntensity = 0.08 + state.daylight * 0.2;
    background.copy(state.sky);
    for (const material of skyMaterials) material.color.copy(state.sky);
    for (const light of ceilingLights) light.intensity = 80 - state.daylight * 45;
    for (const material of tubeMaterials) material.emissiveIntensity = 2.5 - state.daylight;
  }

  update(new Date());
  return { sun, update };
}
