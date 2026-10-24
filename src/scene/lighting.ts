import { Color, DirectionalLight, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import type { Scene, WebGLRenderer } from "three";
import { roomSunlight } from "./daylight/solar";
import { cameraExposure, photometry, unitLuminance } from "./lighting/photometry";
import { createRoomReflection } from "./lighting/room-reflection";
import { createRoomLights } from "./lighting/room-lights";

export function illuminate(scene: Scene, renderer: WebGLRenderer) {
  const fixtures = createRoomLights(scene);
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

  const skyMaterials = new Set<MeshBasicMaterial>();
  const tubes = new Map<MeshStandardMaterial, number>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (object.name === "room-fluorescent" && material instanceof MeshStandardMaterial)
        tubes.set(material, material.emissiveIntensity);
      if (object.name === "world-sky" && material instanceof MeshBasicMaterial)
        skyMaterials.add(material);
    }
  });
  const background = new Color();
  scene.background = background;
  const updateReflection = createRoomReflection(scene, renderer);

  function update(date: Date, captureReflection = true): void {
    const state = roomSunlight(date);
    sun.position.copy(state.direction).multiplyScalar(16).add(sun.target.position);
    sun.color.copy(state.color);
    sun.intensity = state.intensity;
    sun.shadow.needsUpdate = true;
    const sky = unitLuminance(state.sky.clone());
    fixtures.updateSky(
      sky,
      (photometry.skyIlluminance * photometry.scale * state.daylight) / Math.PI,
    );
    background.copy(state.sky);
    for (const material of skyMaterials) material.color.copy(state.sky);
    renderer.toneMappingExposure = cameraExposure(state.daylight);
    if (captureReflection) updateReflection(date);
  }

  function setRoomLights(on: boolean): void {
    fixtures.setRoomLights(on);
    for (const [material, intensity] of tubes) material.emissiveIntensity = on ? intensity : 0;
    updateReflection(new Date(), true);
  }
  update(new Date(), false);
  return { sun, update, setRoomLights };
}
