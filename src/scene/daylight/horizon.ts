import { Color, Mesh, PlaneGeometry, SRGBColorSpace, Texture } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { mix, texture, uniform, vec3 } from "three/tsl";
import type { roomCelestialLighting } from "./celestial";
import type { skyAppearance } from "./sky-state";
import { cameraExposure } from "../lighting/photometry";

export function createHorizon(bitmap: ImageBitmap) {
  const map = new Texture(bitmap);
  map.colorSpace = SRGBColorSpace;
  map.needsUpdate = true;
  const daylight = uniform(1);
  const brightness = uniform(1);
  const tint = uniform(new Color());
  const haze = uniform(new Color());
  const sample = texture(map);
  const daytime = mix(sample.rgb.mul(tint), haze, 0.4);
  const night = sample.rgb.dot(vec3(0.2126, 0.7152, 0.0722)).mul(vec3(0.008, 0.012, 0.023));
  const material = new MeshBasicNodeMaterial({ alphaTest: 0.25 });
  material.colorNode = mix(night, daytime, daylight)
    .mul(brightness)
    .mul(3.2 / cameraExposure);
  material.opacityNode = sample.a;
  const object = new Mesh(new PlaneGeometry(60, 10), material);
  object.name = "world-horizon";
  object.position.set(-22, -1.7, 0);
  object.rotation.y = Math.PI / 2;
  object.updateMatrix();
  object.matrixAutoUpdate = false;
  return {
    object,
    update(
      state: ReturnType<typeof roomCelestialLighting>,
      appearance: ReturnType<typeof skyAppearance>,
    ): void {
      daylight.value = appearance.daylight;
      brightness.value = appearance.brightness;
      tint.value.set("#ffffff").lerp(new Color("#ffb984"), appearance.twilight * 0.8);
      haze.value.copy(state.exterior);
    },
  };
}
