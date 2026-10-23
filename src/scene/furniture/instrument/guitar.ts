import { Group, Mesh, TorusGeometry } from "three";
import { box } from "../../primitives";
import { metricTorusUv } from "../../materials/uv";
import { cylinder, rod, roundBox } from "../geometry";
import { guitarBody } from "./body";
import type { FurnitureMaterials } from "../materials";

export function guitar(materials: FurnitureMaterials): Group {
  const instrument = new Group();
  instrument.name = "acoustic-guitar";
  instrument.add(guitarBody(materials));
  roundBox(instrument, [0.11, 0.027, 0.012], [0, 0.177, -0.01], materials.walnut, 0.004);
  box(instrument, [0.08, 0.006, 0.006], [0, 0.183, -0.019], materials.plasticIvory);
  roundBox(instrument, [0.054, 0.51, 0.042], [0, 0.775, 0.012], materials.walnut, 0.006);
  box(instrument, [0.05, 0.51, 0.008], [0, 0.775, -0.014], materials.fingerboard);
  roundBox(instrument, [0.077, 0.16, 0.025], [0, 1.091, 0], materials.walnut, 0.012);
  box(instrument, [0.05, 0.008, 0.012], [0, 1.026, -0.017], materials.plasticIvory);
  for (let fret = 0; fret < 17; fret++) {
    const y = 1.022 - 0.475 * (1 - 2 ** (-fret / 12));
    rod(instrument, [-0.026, y, -0.019], [0.026, y, -0.019], 0.0011, materials.metal);
  }
  for (let string = 0; string < 6; string++) {
    const x = (string - 2.5) * 0.006;
    const radius = 0.00016 + string * 0.00008;
    const side = string < 3 ? -1 : 1;
    const tuner = string < 3 ? string : 5 - string;
    const postX = side * 0.024;
    const postY = 1.05 + tuner * 0.041;
    rod(
      instrument,
      [x, 0.183, -0.022 - radius],
      [x, 1.026, -0.023 - radius],
      radius,
      materials.metal,
    );
    rod(
      instrument,
      [x, 1.026, -0.023 - radius],
      [postX, postY, -0.019 - radius],
      radius,
      materials.metal,
    );
    const post = cylinder(instrument, 0.0025, 0.034, [postX, postY, -0.003], materials.metal);
    post.rotation.x = Math.PI / 2;
    const coilGeometry = new TorusGeometry(0.0025 + radius, radius, 5, 20);
    metricTorusUv(coilGeometry);
    const coil = new Mesh(coilGeometry, materials.metal);
    coil.position.set(postX, postY, -0.019);
    coil.castShadow = coil.receiveShadow = true;
    instrument.add(coil);
    const pin = cylinder(instrument, 0.0018, 0.003, [x, 0.17, -0.017], materials.plasticIvory);
    pin.rotation.x = Math.PI / 2;
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
        materials.plasticIvory,
        0.004,
      );
    }
  return instrument;
}
