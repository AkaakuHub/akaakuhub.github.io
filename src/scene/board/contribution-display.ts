import {
  BufferAttribute,
  Frustum,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";
import type { PerspectiveCamera } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { loadContributionSource } from "./contribution-source";

export function createContributionDisplay(
  mount: Mesh<PlaneGeometry, MeshStandardMaterial>,
  invalidate: () => void,
) {
  const time = { value: 0 };
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
        const material = new MeshStandardMaterial({
          map: source.animatedMap,
          transparent: true,
          depthWrite: false,
          roughness: 1,
        });
        material.onBeforeCompile = (shader) => {
          shader.uniforms.contributionTime = time;
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              "#include <common>\nattribute vec2 revealTiming;\nvarying vec2 vRevealTiming;",
            )
            .replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\nvRevealTiming = revealTiming;",
            );
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              "#include <common>\nuniform float contributionTime;\nvarying vec2 vRevealTiming;",
            )
            .replace(
              "#include <alphatest_fragment>",
              "diffuseColor.a *= clamp((contributionTime - vRevealTiming.x) / max(vRevealTiming.y, 0.0001), 0.0, 1.0);\n#include <alphatest_fragment>",
            );
        };
        material.customProgramCacheKey = () => "contribution-reveal";
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
        mount.add(surface, logo);
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
    update(camera: PerspectiveCamera, now: number): { active: boolean; changed: boolean } {
      if (!surface) return { active: false, changed: false };
      if (startedAt === undefined) {
        camera.updateMatrixWorld();
        surface.updateWorldMatrix(true, false);
        projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projection);
        if (!frustum.intersectsObject(surface)) return { active: false, changed: false };
        startedAt = now;
      }
      const previous = time.value;
      time.value = Math.min(duration, (now - startedAt) / 1000);
      return { active: time.value < duration, changed: time.value !== previous };
    },
  };
}
