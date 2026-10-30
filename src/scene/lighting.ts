import { Color, DirectionalLight, Mesh, MeshStandardMaterial } from "three";
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
import type { createSky } from "./daylight/sky";

export function illuminate(
  scene: Scene,
  renderer: Renderer,
  weather: TokyoWeather,
  monitor: Mesh,
  sky: Awaited<ReturnType<typeof createSky>>,
) {
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

  const tubes = new Map<MeshStandardMaterial, number>();
  const exterior = new Set<MeshStandardMaterial>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (object.name === "room-fluorescent" && material instanceof MeshStandardMaterial)
        tubes.set(material, material.emissiveIntensity);
      if (material.name === "exterior-surface" && material instanceof MeshStandardMaterial)
        exterior.add(material);
    }
  });
  const background = new Color();
  scene.background = background;
  let roomLightsOn = true;
  let modulation = 1;
  let natural: ReturnType<typeof roomCelestialLighting>;
  let transmission = 1;
  const skyLight = new Color();

  function applyNaturalLight(): void {
    celestialLight.intensity = natural.intensity * transmission;
    const diffuse = natural.skyIntensity * (0.92 + 0.08 * transmission);
    fixtures.updateSky(skyLight, diffuse / Math.PI);
    for (const material of exterior)
      material.emissive
        .copy(material.color)
        .multiply(skyLight)
        .multiplyScalar((diffuse * 0.08) / (2 * Math.PI));
  }

  function applyRoomLights(): void {
    const level = roomLightsOn ? modulation : 0;
    fixtures.setRoomLightLevel(level);
    for (const [material, intensity] of tubes) material.emissiveIntensity = intensity * level;
  }

  function update(date: Date, currentWeather: TokyoWeather): void {
    const state = roomCelestialLighting(date, currentWeather);
    natural = state;
    sky.update(state, currentWeather);
    transmission = sky.transmission;
    celestialLight.position
      .copy(state.direction)
      .multiplyScalar(16)
      .add(celestialLight.target.position);
    celestialLight.color.copy(state.color);
    fitShadowCamera(celestialLight, shadowBounds);
    celestialLight.shadow.needsUpdate = true;
    skyLight.copy(unitLuminance(state.sky.clone()));
    applyNaturalLight();
    background.copy(state.exterior).multiplyScalar(1 / cameraExposure);
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
    setCloudTransmission(value: number): boolean {
      if (Math.abs(transmission - value) < 0.005) return false;
      transmission = value;
      applyNaturalLight();
      return true;
    },
    invalidateShadows: () => {
      celestialLight.shadow.needsUpdate = true;
    },
  };
}
