import {
  BufferAttribute,
  Frustum,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";
import type { PerspectiveCamera } from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { attribute, texture, uniform } from "three/tsl";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { loadContributionSource } from "./contribution-source";

export function createContributionDisplay(
  mount: Mesh<PlaneGeometry, MeshStandardMaterial>,
  invalidate: () => void,
) {
  const object = new Group();
  mount.add(object);
  const time = uniform(0);
  const frustum = new Frustum();
  const projection = new Matrix4();
  let surface: Mesh | undefined;
  let startedAt: number | undefined;
  let duration = 0;

  async function load(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const source = await loadContributionSource();
        const scale = 0.97 / source.width;
        const geometries = source.cells.map((cell) => {
          const geometry = new PlaneGeometry(cell.width * scale, cell.height * scale);
          geometry.translate(
            (cell.x + cell.width / 2 - source.width / 2) * scale,
            (source.height / 2 - cell.y - cell.height / 2) * scale + 0.043,
            0.006,
          );
          const uv = geometry.getAttribute("uv");
          const timing = new Float32Array(uv.count * 2);
          for (let index = 0; index < uv.count; index++) {
            uv.setXY(
              index,
              (cell.x + uv.getX(index) * cell.width) / source.width,
              1 - (cell.y + (1 - uv.getY(index)) * cell.height) / source.height,
            );
            timing[index * 2] = cell.begin;
            timing[index * 2 + 1] = cell.duration;
          }
          geometry.setAttribute("revealTiming", new BufferAttribute(timing, 2));
          duration = Math.max(duration, cell.begin + cell.duration);
          return geometry;
        });
        const geometry = mergeGeometries(geometries);
        geometries.forEach((part) => part.dispose());
        if (!geometry) throw new Error("GitHubの草を組み立てられませんでした。");
        const material = new MeshStandardNodeMaterial({
          transparent: true,
          depthWrite: false,
          roughness: 1,
        });
        const sample = texture(source.animatedMap);
        const timing = attribute("revealTiming", "vec2");
        material.colorNode = sample.rgb;
        material.opacityNode = sample.a.mul(
          time.sub(timing.x).div(timing.y.max(0.0001)).clamp(0, 1),
        );
        surface = new Mesh(geometry, material);
        surface.receiveShadow = true;
        surface.renderOrder = 1;
        const logo = new Mesh(
          new PlaneGeometry(source.width * scale, source.height * scale),
          new MeshStandardMaterial({
            map: source.stillMap,
            transparent: true,
            depthWrite: false,
            roughness: 1,
          }),
        );
        logo.position.set(0, 0.043, 0.0061);
        logo.receiveShadow = true;
        logo.renderOrder = 2;
        object.add(surface, logo);
        invalidate();
        return;
      } catch (error) {
        console.error(error);
        if (attempt < 2)
          await new Promise<void>((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
      }
    }
  }
  void load();

  return {
    object,
    update(camera: PerspectiveCamera, now: number): boolean {
      if (!surface) return false;
      camera.updateMatrixWorld();
      surface.updateWorldMatrix(true, false);
      projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projection, camera.coordinateSystem);
      const visible = frustum.intersectsObject(surface);
      if (startedAt === undefined) {
        if (!visible) return false;
        startedAt = now;
      }
      time.value = Math.min(duration, (now - startedAt) / 1000);
      return visible && time.value < duration;
    },
  };
}
