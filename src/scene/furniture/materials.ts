import { MeshPhysicalMaterial, Vector2 } from "three";
import type { MaterialLibrary } from "../materials/library";
import { scannedSurface } from "../materials/surface";
import { surface } from "../primitives";

export function createFurnitureMaterials(maps: MaterialLibrary) {
  const paint = (color: string, roughness: number, metalness = 0) =>
    scannedSurface(maps.metal, {
      map: null,
      color,
      roughness,
      metalness,
      normalScale: new Vector2(0.22, 0.22),
    });
  return {
    ash: scannedSurface(maps.ash),
    walnut: scannedSurface(maps.walnut),
    amber: scannedSurface(maps.ash, { color: "#d7b07a", roughness: 0.65 }),
    ivory: paint("#e0dfd2", 0.72),
    enamel: paint("#6a786c", 0.46, 0.22),
    deepGreen: paint("#3d514c", 0.52, 0.25),
    metal: surface("#a8aaa3", 0.28, 0.85),
    brass: surface("#a59057", 0.35, 0.78),
    graphite: paint("#323a39", 0.65),
    rubber: surface("#272b28", 0.97),
    paper: surface("#eae3cf", 0.94),
    terracotta: surface("#a97055", 0.89),
    foliage: surface("#5c714e", 0.86),
    navy: surface("#526371", 0.82),
    rust: surface("#9f634f", 0.85),
    mustard: surface("#b49b5c", 0.88),
    glass: new MeshPhysicalMaterial({
      color: "#dce9df",
      roughness: 0.065,
      metalness: 0,
      transmission: 0.9,
      thickness: 0.006,
      ior: 1.52,
      transparent: true,
      depthWrite: false,
    }),
  };
}

export type FurnitureMaterials = ReturnType<typeof createFurnitureMaterials>;
