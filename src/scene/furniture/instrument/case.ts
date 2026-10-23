import { Box3, CatmullRomCurve3, ExtrudeGeometry, Group, Mesh, Shape, Vector3 } from "three";
import { tubeGeometry } from "../../geometry/curves";
import { caseLatch } from "./latch";
import type { FurnitureMaterials } from "../materials";

export function hardCase(materials: FurnitureMaterials): Group {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.21, 0, -0.26, 0.08, -0.26, 0.23);
  shape.bezierCurveTo(-0.26, 0.4, -0.18, 0.49, -0.12, 0.57);
  shape.lineTo(-0.075, 1.17);
  shape.quadraticCurveTo(0, 1.25, 0.075, 1.17);
  shape.lineTo(0.12, 0.57);
  shape.bezierCurveTo(0.18, 0.49, 0.26, 0.4, 0.26, 0.23);
  shape.bezierCurveTo(0.26, 0.08, 0.21, 0, 0, 0);
  const caseGroup = new Group();
  caseGroup.name = "closed-guitar-case";
  const shell = new Mesh(
    new ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.013,
      bevelThickness: 0.01,
      curveSegments: 20,
    }),
    materials.leather,
  );
  shell.castShadow = shell.receiveShadow = true;
  caseGroup.add(shell);
  const contour = shape.getPoints(48);
  contour.pop();
  const seam = new CatmullRomCurve3(
    contour.map((point) => new Vector3(point.x, point.y, 0.06)),
    true,
    "centripetal",
  );
  const piping = new Mesh(tubeGeometry(seam, 160, 0.0035, 6, true), materials.rubber);
  piping.castShadow = true;
  caseGroup.add(piping);
  const gripCurve = new CatmullRomCurve3([
    new Vector3(0.24, 0.34, 0.06),
    new Vector3(0.285, 0.35, 0.06),
    new Vector3(0.29, 0.4, 0.06),
    new Vector3(0.285, 0.45, 0.06),
    new Vector3(0.24, 0.46, 0.06),
  ]);
  const grip = new Mesh(tubeGeometry(gripCurve, 24, 0.009, 8, false), materials.leather);
  grip.castShadow = grip.receiveShadow = true;
  caseGroup.add(grip);
  const edgePoints = shape.getPoints(128);
  function edgeAt(height: number): number {
    let edge = 0;
    let previous = edgePoints[0];
    if (!previous) throw new Error("ケースの輪郭を読み取れませんでした。");
    for (const point of edgePoints.slice(1)) {
      if ((height - previous.y) * (height - point.y) <= 0 && point.y !== previous.y) {
        const fraction = (height - previous.y) / (point.y - previous.y);
        edge = Math.max(edge, previous.x + (point.x - previous.x) * fraction);
      }
      previous = point;
    }
    if (edge === 0) throw new Error("ケースの留め具の接触面が見つかりませんでした。");
    return edge;
  }
  for (const height of [0.15, 0.54, 0.88]) {
    const latch = caseLatch(materials.brass);
    latch.position.set(edgeAt(height) + 0.013, height, 0.06);
    const slope = (edgeAt(height + 0.002) - edgeAt(height - 0.002)) / 0.004;
    latch.rotation.z = -Math.atan(slope);
    caseGroup.add(latch);
  }
  caseGroup.rotation.set(0, -Math.PI / 2, -0.04);
  caseGroup.position.set(-2.39, 0.03, 1.73);
  caseGroup.position.y -= new Box3().setFromObject(caseGroup).min.y;
  return caseGroup;
}
