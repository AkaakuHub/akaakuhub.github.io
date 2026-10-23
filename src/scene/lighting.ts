import {
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RectAreaLight,
} from "three";
import type { Scene, WebGLRenderer } from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { tokyoSunlight } from "./daylight/solar";
import { createRoomReflection } from "./lighting/room-reflection";

export function illuminate(scene: Scene, renderer: WebGLRenderer) {
  const sun = new DirectionalLight();
  sun.target.position.set(0, 1.2, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -4.4;
  sun.shadow.camera.right = 4.4;
  sun.shadow.camera.top = 4.4;
  sun.shadow.camera.bottom = -4.4;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 22;
  sun.shadow.normalBias = 0.004;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);

  RectAreaLightUniformsLib.init();
  const ceilingLights = [-1.05, 1.35].map((z) => {
    const light = new RectAreaLight("#f4fff2", 80, 0.36, 1.03);
    light.position.set(0, 2.765, z);
    light.rotation.x = -Math.PI / 2;
    scene.add(light);
    return light;
  });
  const skylight = new RectAreaLight(0xffffff, 0, 3.8, 1.48);
  skylight.position.set(-2.58, 1.78, 0);
  skylight.lookAt(0, 1.78, 0);
  scene.add(skylight);
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
  scene.background = background;
  const updateReflection = createRoomReflection(scene, renderer);

  function update(date: Date): void {
    const state = tokyoSunlight(date);
    sun.position.copy(state.direction).multiplyScalar(16).add(sun.target.position);
    sun.color.copy(state.color);
    sun.intensity = state.intensity;
    sun.shadow.needsUpdate = true;
    skylight.color.copy(state.sky);
    skylight.intensity = state.daylight * 1.4;
    background.copy(state.sky);
    for (const material of skyMaterials) material.color.copy(state.sky);
    const lampRadiance = 80 - state.daylight * 45;
    for (const light of ceilingLights) light.intensity = lampRadiance;
    for (const material of tubeMaterials) {
      material.emissive.set("#f4fff2");
      material.emissiveIntensity = lampRadiance;
    }
    updateReflection(date);
  }

  update(new Date());
  return { sun, update };
}
