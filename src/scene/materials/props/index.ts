import { DoubleSide, Vector2 } from "three";
import type { MaterialLibrary } from "../library";
import { physicalSurface, scannedSurface } from "../surface";
import { bookLabelMaterial, pageEdgeMaterial } from "./books";

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
      normalScale: new Vector2(0.2, 0.2),
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    });
  return {
    glass: physicalSurface(maps.plastic, {
      map: null,
      color: "#f5faf7",
      roughness: 0.065,
      ior: 1.52,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      normalScale: new Vector2(0.025, 0.025),
    }),
    frostedGlass: physicalSurface(maps.plastic, {
      map: null,
      color: "#bdc6b9",
      roughness: 0.9,
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
    bookGreen: cover("#627566"),
    porcelain: physicalSurface(maps.plastic, {
      map: null,
      color: "#e6e2d8",
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

export type PropMaterials = ReturnType<typeof createPropMaterials>;
