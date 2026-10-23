import { ExtrudeGeometry, Group, Mesh, Shape, TorusGeometry } from "three";
import { box } from "../primitives";
import { cylinder, rod, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

function bodyOutline(): Shape {
  const shape = new Shape();
  shape.moveTo(0, 0.025);
  shape.bezierCurveTo(-0.23, 0.02, -0.255, 0.18, -0.19, 0.285);
  shape.bezierCurveTo(-0.125, 0.38, -0.158, 0.365, -0.17, 0.445);
  shape.bezierCurveTo(-0.19, 0.57, -0.068, 0.59, 0, 0.575);
  shape.bezierCurveTo(0.068, 0.59, 0.19, 0.57, 0.17, 0.445);
  shape.bezierCurveTo(0.158, 0.365, 0.125, 0.38, 0.19, 0.285);
  shape.bezierCurveTo(0.255, 0.18, 0.23, 0.02, 0, 0.025);
  return shape;
}

function guitar(materials: FurnitureMaterials): Group {
  const instrument = new Group();
  const geometry = new ExtrudeGeometry(bodyOutline(), {
    depth: 0.07,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.007,
    bevelThickness: 0.008,
    curveSegments: 28,
  });
  const body = new Mesh(geometry, [materials.amber, materials.walnut]);
  body.castShadow = body.receiveShadow = true;
  instrument.add(body);
  const soundhole = cylinder(instrument, 0.058, 0.004, [0, 0.408, -0.01], materials.graphite);
  soundhole.rotation.x = Math.PI / 2;
  const rosette = new Mesh(new TorusGeometry(0.067, 0.003, 8, 48), materials.ivory);
  rosette.position.set(0, 0.408, -0.013);
  instrument.add(rosette);
  roundBox(instrument, [0.11, 0.027, 0.012], [0, 0.177, -0.016], materials.walnut, 0.004);
  box(instrument, [0.08, 0.006, 0.006], [0, 0.183, -0.026], materials.ivory);
  roundBox(instrument, [0.054, 0.51, 0.042], [0, 0.775, 0.012], materials.walnut, 0.006);
  box(instrument, [0.05, 0.51, 0.008], [0, 0.775, -0.014], materials.graphite);
  roundBox(instrument, [0.077, 0.16, 0.025], [0, 1.091, 0], materials.walnut, 0.012);
  box(instrument, [0.05, 0.008, 0.012], [0, 1.026, -0.017], materials.ivory);
  for (let fret = 0; fret < 17; fret++) {
    const y = 1.022 - 0.475 * (1 - 2 ** (-fret / 12));
    rod(instrument, [-0.026, y, -0.021], [0.026, y, -0.021], 0.0011, materials.metal);
  }
  for (let string = 0; string < 6; string++) {
    const x = (string - 2.5) * 0.006;
    rod(instrument, [x, 0.18, -0.032], [x, 1.08, -0.032], 0.00055, materials.metal);
  }
  for (const x of [-0.043, 0.043])
    for (let tuner = 0; tuner < 3; tuner++) {
      rod(
        instrument,
        [Math.sign(x) * 0.031, 1.05 + tuner * 0.041, 0.008],
        [x, 1.05 + tuner * 0.041, 0.008],
        0.004,
        materials.metal,
      );
      roundBox(
        instrument,
        [0.017, 0.022, 0.011],
        [x, 1.05 + tuner * 0.041, 0.008],
        materials.ivory,
        0.004,
      );
    }
  return instrument;
}

function hardCase(materials: FurnitureMaterials): Group {
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
  const shell = new Mesh(
    new ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.013,
      bevelThickness: 0.01,
      curveSegments: 20,
    }),
    materials.graphite,
  );
  shell.castShadow = shell.receiveShadow = true;
  caseGroup.add(shell);
  roundBox(caseGroup, [0.13, 0.03, 0.025], [0.22, 0.4, 0.07], materials.metal, 0.006);
  for (const height of [0.15, 0.54, 0.88])
    box(
      caseGroup,
      [0.026, 0.04, 0.018],
      [height > 0.7 ? 0.08 : 0.232, height, -0.015],
      materials.brass,
    );
  caseGroup.rotation.set(0, -Math.PI / 2, -0.04);
  caseGroup.position.set(-2.39, 0.03, 1.73);
  return caseGroup;
}

export function createInstrumentCorner(materials: FurnitureMaterials): Group {
  const group = new Group();
  const instrument = guitar(materials);
  instrument.rotation.set(-0.09, -Math.PI / 2 + 0.2, -0.1);
  instrument.position.set(-2.04, 0.12, 1.25);
  const stand = new Group();
  for (const z of [-0.15, 0.15])
    rod(stand, [-0.2, 0.02, z], [0.2, 0.02, z], 0.01, materials.graphite);
  rod(stand, [0.08, 0.03, 0], [-0.05, 0.65, 0], 0.012, materials.graphite);
  for (const z of [-0.12, 0.12])
    rod(stand, [-0.02, 0.17, z], [0.12, 0.17, z], 0.017, materials.rubber);
  stand.position.set(-2.08, 0, 1.25);
  group.add(instrument, stand, hardCase(materials));
  return group;
}
