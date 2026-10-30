import {
  BackSide,
  LinearMipmapLinearFilter,
  Mesh,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector3,
} from "three";
import { ConvertNode, MeshBasicNodeMaterial } from "three/webgpu";
import {
  cameraPosition,
  dFdx,
  dFdy,
  positionLocal,
  positionWorld,
  round,
  texture,
  uniform,
  vec2,
} from "three/tsl";
import type { RoomAssetLoader } from "../../assets/loading";
import { cloudFieldId, cloudTextureId, horizonTextureId } from "../../assets/environment";
import type { TokyoWeather } from "../../weather/schema";
import type { roomCelestialLighting } from "./celestial";
import { cameraExposure } from "../lighting/photometry";
import { skyAppearance } from "./sky-state";
import { skyColor, cloudCoordinates } from "./sky-shader";
import { CloudField, cloudElevation, cloudHeight } from "./cloud-field";
import { createHorizon } from "./horizon";

export async function createSky(assets: RoomAssetLoader) {
  const options: ImageBitmapOptions = {
    imageOrientation: "none",
    premultiplyAlpha: "none",
    colorSpaceConversion: "none",
  };
  const [bitmap, shadow, horizonBitmap] = await Promise.all([
    assets.loadImage(cloudTextureId, options),
    assets.load(cloudFieldId, async (bytes) => bytes),
    assets.loadImage(horizonTextureId, options),
  ]);
  const horizon = createHorizon(horizonBitmap);
  const field = new CloudField(shadow);
  const source = new Vector3(0, 1, 0);
  const clouds = new Texture(bitmap);
  clouds.flipY = false;
  clouds.wrapS = RepeatWrapping;
  clouds.colorSpace = SRGBColorSpace;
  clouds.minFilter = LinearMipmapLinearFilter;
  clouds.anisotropy = 2;
  clouds.needsUpdate = true;
  const uniforms = {
    offset: uniform(field.offset),
    daylight: uniform(1),
    twilight: uniform(0),
    brightness: uniform(1),
    stars: uniform(0),
    cloud: uniform(0),
    sun: uniform(new Vector3(0, 1, 0)),
    moon: uniform(new Vector3(0, -1, 0)),
    moonFraction: uniform(0),
  };
  const direction = positionWorld.sub(cameraPosition).normalize();
  const coordinates = new ConvertNode<"vec2">(
    cloudCoordinates({
      direction,
      offset: uniforms.offset,
      height: cloudHeight,
      elevation: (cloudElevation * Math.PI) / 180,
    }),
    "vec2",
  );
  const material = new MeshBasicNodeMaterial({ side: BackSide, depthWrite: false });
  material.positionNode = positionLocal.add(cameraPosition);
  const photographCoordinates = vec2(coordinates.x, coordinates.y.div(3));
  const dx = dFdx(photographCoordinates);
  const dy = dFdy(photographCoordinates);
  const gradientX = vec2(dx.x.sub(round(dx.x)), dx.y);
  const gradientY = vec2(dy.x.sub(round(dy.x)), dy.y);
  material.colorNode = new ConvertNode<"vec3">(
    skyColor({
      partly: texture(clouds, photographCoordinates).grad(gradientX, gradientY).rgb,
      overcast: texture(clouds, photographCoordinates.add(vec2(0, 1 / 3))).grad(
        gradientX,
        gradientY,
      ).rgb,
      evening: texture(clouds, photographCoordinates.add(vec2(0, 2 / 3))).grad(gradientX, gradientY)
        .rgb,
      daylight: uniforms.daylight,
      twilight: uniforms.twilight,
      brightness: uniforms.brightness,
      stars: uniforms.stars,
      direction,
      sun: uniforms.sun,
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
    horizon: horizon.object,
    get moving(): boolean {
      return field.moving;
    },
    get transmission(): number {
      return field.transmission(source);
    },
    advance: (seconds: number) => field.advance(seconds),
    update(state: ReturnType<typeof roomCelestialLighting>, weather: TokyoWeather): void {
      const appearance = skyAppearance(state.sunAltitude, weather);
      horizon.update(state, appearance);
      field.update(weather, appearance.cloud);
      source.copy(state.direction);
      uniforms.daylight.value = appearance.daylight;
      uniforms.twilight.value = appearance.twilight;
      uniforms.brightness.value = appearance.brightness;
      uniforms.stars.value = appearance.stars;
      uniforms.cloud.value = appearance.cloud;
      uniforms.sun.value.copy(state.sunDirection);
      uniforms.moon.value.copy(state.moonDirection);
      uniforms.moonFraction.value = state.moonFraction;
    },
  };
}
