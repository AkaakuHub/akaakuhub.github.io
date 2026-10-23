import type { PbrMaps } from "../materials/library";
import { Group, Mesh, Vector2 } from "three";
import type { Object3D } from "three";
import type { PropMaterials } from "../materials/props";
import { latheGeometry } from "../geometry/curves";
import type { MetalMaterials } from "../materials/metal";
import { createFrame } from "./frame";
import { boardNotices } from "./notices";
import type { Notice } from "./notices";
import { createPaper } from "./paper";

export type { Notice } from "./notices";

export function createBoard(
  metals: MetalMaterials,
  paperMaps: PbrMaps,
  props: PropMaterials,
): {
  group: Group;
  notices: Map<Object3D, Notice>;
} {
  const group = createFrame(metals, props);
  group.name = "notice-board";
  group.position.z = -2.12;
  const notices = new Map<Object3D, Notice>();
  for (const notice of boardNotices) {
    const [width, height] = notice.size;
    const sheet = new Group();
    sheet.position.set(...notice.position, 0.045);
    sheet.rotation.z = notice.angle;
    const paper = createPaper(width, height, notice, paperMaps);
    sheet.add(paper);
    const magnetMaterial = props.plasticGraphite.clone();
    magnetMaterial.color.set(notice.ink);
    magnetMaterial.roughness = 0.5;
    const magnetGeometry = latheGeometry(
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
    for (const x of [-width * 0.34, width * 0.34]) {
      const magnet = new Mesh(magnetGeometry, magnetMaterial);
      magnet.rotation.x = Math.PI / 2;
      magnet.position.set(x, height / 2 - 0.035, 0.0073);
      magnet.castShadow = true;
      magnet.receiveShadow = true;
      sheet.add(magnet);
    }
    group.add(sheet);
    notices.set(paper, { title: notice.title, size: notice.size, link: notice.link });
  }
  return { group, notices };
}
