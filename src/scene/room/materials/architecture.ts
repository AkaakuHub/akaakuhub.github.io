import { Vector2 } from "three";
import type { MaterialLibrary } from "../../materials/library";
import { scannedSurface } from "../../materials/surface";

export function createArchitectureMaterials(maps: MaterialLibrary) {
  return {
    floor: scannedSurface(maps.floor, { normalScale: new Vector2(0.7, 0.7) }),
    wall: scannedSurface(maps.plaster, { normalScale: new Vector2(0.25, 0.25) }),
    ceiling: scannedSurface(maps.plaster, { color: "#e5e5db", normalScale: new Vector2(0.2, 0.2) }),
    boards: scannedSurface(maps.ash, { color: "#a4987d" }),
    trim: scannedSurface(maps.walnut, { color: "#b8b4a5" }),
    frame: scannedSurface(maps.ash, { color: "#e1dfcd", roughness: 0.8 }),
    sill: scannedSurface(maps.walnut),
    door: scannedSurface(maps.ash, { color: "#b5ac94" }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
