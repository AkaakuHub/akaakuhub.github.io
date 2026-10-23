import { DoubleSide, Vector2 } from "three";
import type { MaterialLibrary } from "../../materials/library";
import { physicalSurface, scannedSurface } from "../../materials/surface";
import { bookLabelMaterial, pageEdgeMaterial } from "./book-labels";

export function createPropMaterials(maps: MaterialLibrary) {
  const cloth = (color: string) =>
    physicalSurface(maps.fabric, {
      color,
      sheen: 0.8,
      sheenColor: color,
      sheenRoughness: 0.9,
      normalScale: new Vector2(0.35, 0.35),
    });
  const plastic = (color: string, roughness: number) =>
    physicalSurface(maps.plastic, {
      color,
      roughness,
      normalScale: new Vector2(0.2, 0.2),
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    });
  return {
    bookLabels: bookLabelMaterial(maps.paper),
    pageEdges: pageEdgeMaterial(maps.paper),
    paper: scannedSurface(maps.paper, {
      color: "#f2ebda",
      normalScale: new Vector2(0.12, 0.12),
    }),
    navy: cloth("#54697b"),
    rust: cloth("#a5654c"),
    mustard: cloth("#b49a57"),
    bookCream: cloth("#e9e0c4"),
    bookGreen: cloth("#627566"),
    porcelain: physicalSurface(maps.plastic, {
      color: "#fff0d3",
      roughness: 0.45,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
      normalScale: new Vector2(0.08, 0.08),
    }),
    terracotta: physicalSurface(maps.plaster, {
      color: "#bc795a",
      roughness: 1,
      clearcoat: 0.05,
      normalScale: new Vector2(0.32, 0.32),
    }),
    plasticIvory: plastic("#e4decb", 0.8),
    plasticGraphite: plastic("#303633", 0.9),
    cuttingMat: plastic("#4d7065", 1),
    signalRed: plastic("#b94c35", 0.4),
    leather: physicalSurface(maps.leather, {
      color: "#556362",
      roughness: 1,
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
      normalScale: new Vector2(0.55, 0.55),
    }),
    fingerboard: scannedSurface(maps.walnut, { color: "#49473d", roughness: 1 }),
    foliage: physicalSurface(maps.leaves, {
      color: "#d7e6b1",
      side: DoubleSide,
      alphaTest: 0.45,
      alphaToCoverage: true,
      normalScale: new Vector2(0.6, 0.6),
      clearcoat: 0.18,
      clearcoatRoughness: 0.5,
      roughness: 0.9,
    }),
    stem: scannedSurface(maps.ash, { color: "#627844", roughness: 1 }),
  };
}
