import { Vector2 } from "three";
import type { MaterialLibrary } from "../library";
import { physicalSurface, scannedSurface } from "../surface";
import { bookLabelMaterial, pageEdgeMaterial } from "./books";
import { thinGlassMaterial } from "./glass";

export function createPropMaterials(maps: MaterialLibrary) {
  const cloth = (color: string) =>
    scannedSurface(maps.fabric, {
      color,
      roughnessMap: null,
      roughness: 0.94,
      normalScale: new Vector2(0.22, 0.22),
    });
  const cover = (color: string) =>
    scannedSurface(maps.paper, {
      color,
      roughnessMap: null,
      roughness: 0.9,
      normalScale: new Vector2(0.45, 0.45),
    });
  const plastic = (color: string, roughness: number) =>
    physicalSurface(maps.plastic, {
      color,
      roughness,
      roughnessMap: null,
      normalScale: new Vector2(0.2, 0.2),
    });
  return {
    glass: thinGlassMaterial(),
    frostedGlass: physicalSurface(maps.plastic, {
      map: null,
      color: "#bdc6b9",
      roughness: 0.9,
      roughnessMap: null,
      ior: 1.52,
      normalScale: new Vector2(0.1, 0.1),
    }),
    felt: cloth("#3d453e"),
    bookLabels: bookLabelMaterial(maps.paper),
    pageEdges: pageEdgeMaterial(maps.paper),
    paper: scannedSurface(maps.paper, {
      color: "#f2ebda",
      normalScale: new Vector2(0.12, 0.12),
    }),
    navy: cover("#54697b"),
    rust: cover("#a5654c"),
    mustard: cover("#b49a57"),
    bookCream: cover("#e9e0c4"),
    porcelain: physicalSurface(maps.plastic, {
      map: null,
      color: "#e6e2d8",
      roughness: 0.45,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
      normalScale: new Vector2(0.08, 0.08),
    }),
    plasticIvory: plastic("#e4decb", 0.8),
    plasticGraphite: plastic("#303633", 0.9),
  };
}

export type PropMaterials = ReturnType<typeof createPropMaterials>;
