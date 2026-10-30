import {
  BackSide,
  Color,
  LinearFilter,
  Mesh,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector3,
} from "three";
import { ConvertNode, MeshBasicNodeMaterial } from "three/webgpu";
import { positionWorld, texture, uniform, vec2 } from "three/tsl";
import type { RoomAssetLoader } from "../../assets/loading";
import { skyAssetId } from "../../assets/environment";
import type { TokyoWeather } from "../../weather/schema";
import type { roomCelestialLighting } from "./celestial";
import { cameraExposure } from "../lighting/photometry";
import { skyAppearance } from "./sky-state";
import { skyColor, skyCoordinates } from "./sky-shader";

export async function createSky(assets: RoomAssetLoader) {
  const bitmap = await assets.loadImage(skyAssetId, {
    imageOrientation: "none",
    premultiplyAlpha: "none",
    colorSpaceConversion: "none",
  });
  const atlas = new Texture(bitmap);
  atlas.flipY = false;
  atlas.wrapS = RepeatWrapping;
  atlas.minFilter = LinearFilter;
  atlas.generateMipmaps = false;
  atlas.colorSpace = SRGBColorSpace;
  atlas.needsUpdate = true;
  const uniforms = {
    lower: uniform(0),
    upper: uniform(1),
    blend: uniform(0),
    daylight: uniform(1),
    twilight: uniform(0),
    brightness: uniform(1),
    tint: uniform(new Color()),
    stars: uniform(0),
    cloud: uniform(0),
    sun: uniform(new Vector3(0, 1, 0)),
    moon: uniform(new Vector3(0, -1, 0)),
    moonFraction: uniform(0),
  };
  const direction = positionWorld.normalize();
  const coordinates = new ConvertNode<"vec2">(
    skyCoordinates({ direction, sun: uniforms.sun }),
    "vec2",
  );
  const material = new MeshBasicNodeMaterial({ side: BackSide, depthWrite: false });
  material.colorNode = new ConvertNode<"vec3">(
    skyColor({
      clear: texture(atlas, vec2(coordinates.x, coordinates.y.add(uniforms.lower).div(4))).rgb,
      cloudy: texture(atlas, vec2(coordinates.x, coordinates.y.add(uniforms.upper).div(4))).rgb,
      sunset: texture(atlas, vec2(coordinates.x, coordinates.y.add(3).div(4))).rgb,
      blend: uniforms.blend,
      daylight: uniforms.daylight,
      twilight: uniforms.twilight,
      brightness: uniforms.brightness,
      tint: uniforms.tint,
      stars: uniforms.stars,
      coordinates,
      direction,
      moon: uniforms.moon,
      moonFraction: uniforms.moonFraction,
      cloud: uniforms.cloud,
      exposure: cameraExposure,
    }),
    "vec3",
  );
  const object = new Mesh(new SphereGeometry(30, 24, 12), material);
  object.name = "world-sky";
  object.matrixAutoUpdate = false;
  return {
    object,
    update(state: ReturnType<typeof roomCelestialLighting>, weather: TokyoWeather): void {
      const appearance = skyAppearance(state.sunAltitude, weather);
      uniforms.lower.value = appearance.lower;
      uniforms.upper.value = appearance.upper;
      uniforms.blend.value = appearance.blend;
      uniforms.daylight.value = appearance.daylight;
      uniforms.twilight.value = appearance.twilight;
      uniforms.brightness.value = appearance.brightness;
      uniforms.tint.value.copy(appearance.tint);
      uniforms.stars.value = appearance.stars;
      uniforms.cloud.value = appearance.cloud;
      uniforms.sun.value.copy(state.sunDirection);
      uniforms.moon.value.copy(state.moonDirection);
      uniforms.moonFraction.value = state.moonFraction;
    },
  };
}
