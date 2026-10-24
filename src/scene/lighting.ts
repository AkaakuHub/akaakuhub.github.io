import { Color, DirectionalLight, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import type { Scene, WebGLRenderer } from "three";
import { roomCelestialLighting } from "./daylight/celestial";
import { cameraExposure, unitLuminance } from "./lighting/photometry";
import { createRoomReflection } from "./lighting/room-reflection";
import { createRoomLights } from "./lighting/room-lights";

export function illuminate(scene: Scene, renderer: WebGLRenderer) {
  const fixtures = createRoomLights(scene);
  const celestialLight = new DirectionalLight();
  celestialLight.target.position.set(0, 1.2, 0);
  celestialLight.castShadow = true;
  celestialLight.shadow.mapSize.set(2048, 2048);
  celestialLight.shadow.camera.left = -4.4;
  celestialLight.shadow.camera.right = 4.4;
  celestialLight.shadow.camera.top = 4.4;
  celestialLight.shadow.camera.bottom = -4.4;
  celestialLight.shadow.camera.near = 10;
  celestialLight.shadow.camera.far = 22;
  celestialLight.shadow.normalBias = 0.004;
  celestialLight.shadow.bias = -0.0001;
  celestialLight.shadow.radius = 2;
  scene.add(celestialLight, celestialLight.target);

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
  const exteriorSky = new Color();
  scene.background = background;
  const updateReflection = createRoomReflection(scene, renderer);
  let roomLightsOn = true;
  let daylight = 0;

  function updateExposure(): void {
    const exposure = cameraExposure(daylight, roomLightsOn);
    renderer.toneMappingExposure = exposure;
    background.copy(exteriorSky).multiplyScalar(1 / exposure);
    for (const material of skyMaterials) material.color.copy(background);
  }

  function update(date: Date, captureReflection = true): void {
    const state = roomCelestialLighting(date);
    daylight = state.daylight;
    celestialLight.position
      .copy(state.direction)
      .multiplyScalar(16)
      .add(celestialLight.target.position);
    celestialLight.color.copy(state.color);
    celestialLight.intensity = state.intensity;
    celestialLight.shadow.needsUpdate = true;
    const sky = unitLuminance(state.sky.clone());
    fixtures.updateSky(sky, state.skyIntensity / Math.PI);
    exteriorSky.copy(state.sky);
    updateExposure();
    if (captureReflection) updateReflection(date);
  }

  function setRoomLights(on: boolean): void {
    roomLightsOn = on;
    fixtures.setRoomLights(on);
    for (const [material, intensity] of tubes) material.emissiveIntensity = on ? intensity : 0;
    updateExposure();
    updateReflection(new Date(), true);
  }
  update(new Date(), false);
  return { celestialLight, update, setRoomLights };
}
