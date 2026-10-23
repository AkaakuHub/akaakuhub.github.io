import { CylinderGeometry, Group, Mesh } from "three";
import type { Object3D } from "three";
import { surface } from "../primitives";
import { createFrame } from "./frame";
import { boardNotices } from "./notices";
import type { Notice } from "./notices";
import { createPaper } from "./paper";

export type { Notice } from "./notices";

export function createBoard(): { group: Group; notices: Map<Object3D, Notice> } {
  const group = createFrame();
  group.name = "notice-board";
  group.position.z = -2.12;
  const notices = new Map<Object3D, Notice>();
  for (const notice of boardNotices) {
    const [width, height] = notice.size;
    const sheet = new Group();
    sheet.position.set(...notice.position, 0.045);
    sheet.rotation.z = notice.angle;
    const paper = createPaper(width, height, notice);
    sheet.add(paper);
    for (const x of [-width * 0.34, width * 0.34]) {
      const magnet = new Mesh(
        new CylinderGeometry(0.019, 0.022, 0.014, 18),
        surface(notice.ink, 0.4, 0.08),
      );
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
