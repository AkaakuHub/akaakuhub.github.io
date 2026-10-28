import { LightShadow, MathUtils, Object3D, PerspectiveCamera, RectAreaLight } from "three";
import type { Color } from "three";
import { fixtureEmitterWidth, fixtureHeight, tubeLength } from "./fixtures";
import { receiverShadow } from "./receiver-shadow";

class FixtureShadow extends LightShadow<PerspectiveCamera> {
  readonly filterNode = receiverShadow;
  constructor(z: number) {
    const height = fixtureHeight - 0.02;
    const halfExtent = 2.7 + Math.abs(z) + 0.03;
    super(
      new PerspectiveCamera(MathUtils.radToDeg(2 * Math.atan(halfExtent / height)), 1, 0.03, 8),
    );
    this.camera.up.set(0, 0, -1);
    this.mapSize.set(512, 512);
    this.normalBias = (2 * halfExtent) / (512 * 8);
    this.bias = -0.00001;
    this.radius = 1.5;
    this.autoUpdate = false;
    this.needsUpdate = true;
  }
}

export function createFixtureLight(color: Color, intensity: number, z: number) {
  const light = Object.assign(
    new RectAreaLight(color, intensity, fixtureEmitterWidth, tubeLength),
    {
      target: new Object3D(),
      shadow: new FixtureShadow(z),
    },
  );
  light.position.set(0, fixtureHeight - 0.02, z);
  light.rotation.x = -Math.PI / 2;
  light.target.position.set(0, 0, z);
  light.castShadow = true;
  return light;
}
