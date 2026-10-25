import { CatmullRomCurve3, Group, Mesh, SphereGeometry, Vector2, Vector3 } from "three";
import { latheGeometry, tubeGeometry } from "../geometry/curves";
import { cylinder } from "./geometry";
import type { FurnitureMaterials } from "./materials";

export function createDeskLamp(materials: FurnitureMaterials, surfaceY: number): Group {
  const lamp = new Group();
  lamp.name = "desk-lamp";
  cylinder(lamp, 0.085, 0.025, [0, 0.015, 0], materials.enamel);
  cylinder(lamp, 0.062, 0.014, [0, 0.035, 0], materials.enamel);
  const curve = new CatmullRomCurve3([
    new Vector3(0, 0.04, 0),
    new Vector3(0, 0.3, 0),
    new Vector3(0.06, 0.615, 0),
    new Vector3(0.18, 0.585, 0),
  ]);
  const arm = new Mesh(tubeGeometry(curve, 24, 0.008, 8, false), materials.metal);
  arm.castShadow = true;
  lamp.add(arm);
  const shade = new Group();
  shade.name = "open-desk-lamp-shade";
  const outerProfile = [
    new Vector2(0.075, -0.0375),
    new Vector2(0.076, -0.035),
    new Vector2(0.027, 0.0375),
    new Vector2(0.023, 0.0375),
  ];
  const innerProfile = [
    new Vector2(0.023, 0.0375),
    new Vector2(0.023, 0.031),
    new Vector2(0.071, -0.034),
    new Vector2(0.075, -0.0375),
  ];
  const shell = new Mesh(latheGeometry(outerProfile, 48), materials.enamel);
  const reflector = new Mesh(latheGeometry(innerProfile, 48), materials.ivory);
  shell.castShadow = shell.receiveShadow = true;
  reflector.castShadow = reflector.receiveShadow = true;
  shade.add(shell, reflector);
  cylinder(shade, 0.013, 0.022, [0, 0.024, 0], materials.graphite);
  const bulb = new Mesh(new SphereGeometry(0.015, 20, 12), materials.porcelain);
  bulb.position.y = 0.003;
  bulb.scale.y = 1.3;
  shade.add(bulb);
  shade.position.set(0.18, 0.55, 0);
  shade.rotation.z = -0.25;
  lamp.add(shade);
  lamp.position.set(-0.25, surfaceY - 0.0025, 0.43);
  return lamp;
}
