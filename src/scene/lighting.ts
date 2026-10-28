import { Color, DirectionalLight, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import type { Scene } from "three";
import type { Renderer } from "three/webgpu";
import { roomCelestialLighting } from "./daylight/celestial";
import { cameraExposure, unitLuminance } from "./lighting/photometry";
import { createRoomLights } from "./lighting/room-lights";
import { createMonitorLight, setMonitorLight } from "./lighting/monitor";
import type { TokyoWeather } from "../weather/schema";
import { renderingProfile } from "./quality";
import { fitShadowCamera, shadowCasterBounds } from "./lighting/shadow-camera";
import { receiverShadow } from "./lighting/receiver-shadow";

export function illuminate(scene: Scene, renderer: Renderer, weather: TokyoWeather, monitor: Mesh) {
  renderer.toneMappingExposure = cameraExposure;
  const fixtures = createRoomLights(scene);
  const monitorLight = createMonitorLight(monitor);
  const celestialLight = new DirectionalLight();
  celestialLight.target.position.set(0, 1.2, 0);
  celestialLight.castShadow = true;
  celestialLight.shadow.autoUpdate = false;
  Object.assign(celestialLight.shadow, { filterNode: receiverShadow });
  const shadowSize = renderingProfile().shadowSize;
  celestialLight.shadow.mapSize.set(shadowSize, shadowSize);
  celestialLight.shadow.radius = 2;
  scene.add(celestialLight, celestialLight.target);
  const shadowBounds = shadowCasterBounds(scene);

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
  let roomLightsOn = true;
  let modulation = 1;

  function applyRoomLights(): void {
    const level = roomLightsOn ? modulation : 0;
    fixtures.setRoomLightLevel(level);
    for (const [material, intensity] of tubes) material.emissiveIntensity = intensity * level;
  }

  function update(date: Date, currentWeather: TokyoWeather): void {
    const state = roomCelestialLighting(date, currentWeather);
    celestialLight.position
      .copy(state.direction)
      .multiplyScalar(16)
      .add(celestialLight.target.position);
    celestialLight.color.copy(state.color);
    celestialLight.intensity = state.intensity;
    fitShadowCamera(celestialLight, shadowBounds);
    celestialLight.shadow.needsUpdate = true;
    const sky = unitLuminance(state.sky.clone());
    fixtures.updateSky(sky, state.skyIntensity / Math.PI);
    background.copy(state.exterior).multiplyScalar(1 / cameraExposure);
    for (const material of skyMaterials) material.color.copy(background);
  }

  function setRoomLights(on: boolean): void {
    roomLightsOn = on;
    modulation = 1;
    applyRoomLights();
  }
  function setMonitorPower(on: boolean): void {
    setMonitorLight(monitorLight, on);
  }
  update(new Date(), weather);
  return {
    update,
    setRoomLights,
    setFluorescentModulation(value: number): boolean {
      if (!roomLightsOn || modulation === value) return false;
      if (value !== 1 && Math.abs(modulation - value) < 0.00005) return false;
      modulation = value;
      applyRoomLights();
      return true;
    },
    setMonitorPower,
    invalidateShadows: () => {
      celestialLight.shadow.needsUpdate = true;
    },
  };
}
