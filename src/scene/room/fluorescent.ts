import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import type { MetalMaterials } from "../materials/metal";
import { fixturePositions, fluorescentColor } from "../lighting/fixtures";
import { photometry } from "../lighting/photometry";
import { box } from "../primitives";
import { roundBox } from "../furniture/geometry";

export function createFluorescentFixtures(metals: MetalMaterials): Group {
  const fixtures = new Group();
  const tubeMaterial = new MeshStandardMaterial({
    color: "#f3f3ed",
    emissive: fluorescentColor,
    emissiveIntensity:
      (photometry.tubeLumens * photometry.scale) / (2 * Math.PI ** 2 * 0.013 * 1.06),
    roughness: 0.32,
  });
  for (const z of fixturePositions) {
    roundBox(fixtures, [0.35, 0.042, 1.19], [0, 2.83, z], metals.ivory, 0.004);
    for (const side of [-1, 1]) {
      box(fixtures, [0.012, 0.04, 1.19], [side * 0.17, 2.806, z], metals.ivory);
      const reflector = box(fixtures, [0.145, 0.002, 1.13], [side * 0.085, 2.804, z], metals.ivory);
      reflector.rotation.z = side * 0.22;
      box(fixtures, [0.31, 0.04, 0.012], [0, 2.807, z + side * 0.588], metals.ivory);
    }
    for (const x of [-0.085, 0.085]) {
      for (const edge of [-1, 1]) {
        roundBox(
          fixtures,
          [0.033, 0.039, 0.025],
          [x, 2.787, z + edge * 0.552],
          metals.ivory,
          0.003,
        );
        const cap = new Mesh(new CylinderGeometry(0.0135, 0.0135, 0.019, 16), metals.aluminum);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(x, 2.776, z + edge * 0.529);
        cap.castShadow = cap.receiveShadow = true;
        fixtures.add(cap);
      }
      const tube = new Mesh(new CylinderGeometry(0.013, 0.013, 1.04, 16), tubeMaterial);
      tube.name = "room-fluorescent";
      tube.rotation.x = Math.PI / 2;
      tube.position.set(x, 2.776, z);
      fixtures.add(tube);
    }
  }
  return fixtures;
}
