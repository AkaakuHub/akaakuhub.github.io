import { Curve, Group, Mesh, Vector2, Vector3 } from "three";
import { latheGeometry, tubeGeometry } from "../geometry/curves";
import type { FurnitureMaterials } from "./materials";

class WoundWire extends Curve<Vector3> {
  constructor() {
    super();
  }

  override getPoint(t: number, target = new Vector3()): Vector3 {
    const angle = t * Math.PI * 2 * 31;
    return target.set(Math.cos(angle) * 0.0336, 0.0066 + t * 0.0403, Math.sin(angle) * 0.0336);
  }
}

export function solderSpool(materials: FurnitureMaterials): Group {
  const spool = new Group();
  spool.name = "wound-solder-spool";
  const flangeProfile = [
    new Vector2(0.008, 0),
    new Vector2(0.046, 0),
    new Vector2(0.047, 0.001),
    new Vector2(0.047, 0.005),
    new Vector2(0.046, 0.006),
    new Vector2(0.008, 0.006),
    new Vector2(0.008, 0),
  ];
  const flange = latheGeometry(flangeProfile, 48);
  for (const y of [0, 0.048]) {
    const disc = new Mesh(flange, materials.plasticIvory);
    disc.position.y = y;
    disc.castShadow = disc.receiveShadow = true;
    spool.add(disc);
  }
  const core = new Mesh(
    latheGeometry(
      [
        new Vector2(0.008, 0.006),
        new Vector2(0.016, 0.006),
        new Vector2(0.016, 0.048),
        new Vector2(0.008, 0.048),
        new Vector2(0.008, 0.006),
      ],
      32,
    ),
    materials.plasticGraphite,
  );
  const winding = new Mesh(tubeGeometry(new WoundWire(), 992, 0.0006, 6, false), materials.metal);
  core.castShadow = core.receiveShadow = true;
  winding.castShadow = winding.receiveShadow = true;
  spool.add(core, winding);
  return spool;
}
