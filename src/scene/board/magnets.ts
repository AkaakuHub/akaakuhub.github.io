import { Mesh, Vector2 } from "three";
import type { Group } from "three";
import { latheGeometry } from "../geometry/curves";
import type { PropMaterials } from "../materials/props";

const geometry = latheGeometry(
  [
    new Vector2(0, -0.007),
    new Vector2(0.019, -0.007),
    new Vector2(0.021, -0.005),
    new Vector2(0.022, -0.003),
    new Vector2(0.022, 0.003),
    new Vector2(0.021, 0.006),
    new Vector2(0.019, 0.007),
    new Vector2(0, 0.007),
  ],
  32,
);

export function addMagnets(
  sheet: Group,
  offset: number,
  height: number,
  color: string,
  props: PropMaterials,
): void {
  const material = props.plasticGraphite.clone();
  material.color.set(color);
  material.roughness = 0.38;
  material.clearcoat = 0.35;
  material.clearcoatRoughness = 0.28;
  material.normalScale.set(0.1, 0.1);
  for (const x of [-offset, offset]) {
    const magnet = new Mesh(geometry, material);
    magnet.rotation.x = Math.PI / 2;
    magnet.position.set(x, height / 2 - 0.035, 0.0073);
    magnet.castShadow = magnet.receiveShadow = true;
    sheet.add(magnet);
  }
}
