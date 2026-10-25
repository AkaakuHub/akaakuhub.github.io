import type { PbrMaps } from "../materials/library";
import { Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector2 } from "three";
import type { Object3D } from "three";
import type { PropMaterials } from "../materials/props";
import { latheGeometry } from "../geometry/curves";
import type { MetalMaterials } from "../materials/metal";
import { createFrame } from "./frame";
import { boardNotices } from "./notices";
import type { BoardState, Notice } from "./notices";
import { createPaper, updatePaper } from "./paper";
import { createBoardHeading } from "./heading";

export type { Notice } from "./notices";

export function createBoard(
  metals: MetalMaterials,
  paperMaps: PbrMaps,
  props: PropMaterials,
): {
  group: Group;
  notices: Map<Object3D, Notice>;
  contributions: Mesh;
  setState: (state: BoardState) => void;
} {
  const group = createFrame(metals, props);
  group.name = "notice-board";
  group.position.z = -2.12;
  const notices = new Map<Object3D, Notice>();
  const contributions = new Mesh(
    new PlaneGeometry(1.08, 0.38),
    new MeshStandardMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  contributions.name = "github-contributions";
  contributions.position.set(-0.62, 2.1, 0.0455);
  group.add(contributions);
  notices.set(contributions, {
    title: "GitHubの記録",
    size: [1.08, 0.38],
    link: { label: "GitHubを開く", href: "https://github.com/AkaakuHub" },
  });
  const papers: ReturnType<typeof createPaper>[] = [];
  group.add(createBoardHeading());
  for (const notice of boardNotices({ status: "loading" })) {
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
    const magnets = [-width * 0.34, width * 0.34];
    for (const x of magnets) {
      const magnet = new Mesh(magnetGeometry, magnetMaterial);
      magnet.rotation.x = Math.PI / 2;
      magnet.position.set(x, height / 2 - 0.035, 0.0073);
      magnet.castShadow = true;
      magnet.receiveShadow = true;
      sheet.add(magnet);
    }
    group.add(sheet);
    notices.set(paper, { title: notice.title, size: notice.size, link: notice.link });
    papers.push(paper);
  }
  return {
    group,
    notices,
    contributions,
    setState(state): void {
      boardNotices(state).forEach((notice, index) => {
        const paper = papers[index];
        if (!paper) throw new Error("掲示の表示先がありません。");
        const metadata = notices.get(paper);
        if (!metadata) throw new Error("掲示の情報がありません。");
        metadata.title = notice.title;
        metadata.link = notice.link;
        updatePaper(paper, notice, paperMaps);
      });
    },
  };
}
