import { Vector2 } from "three";
import type { MaterialLibrary } from "../../materials/library";
import { scannedSurface } from "../../materials/surface";

export function createArchitectureMaterials(maps: MaterialLibrary) {
  return {
    floor: scannedSurface(maps.floor, {
      roughness: 0.78,
      normalScale: new Vector2(0.12, 0.12),
    }),
    wall: scannedSurface(maps.plaster, {
      color: "#f0eee5",
      normalScale: new Vector2(0.16, 0.16),
    }),
    ceiling: scannedSurface(maps.ceiling, {
      name: "room-ceiling",
      color: "#ffffff",
      normalScale: new Vector2(0.5, 0.5),
    }),
    boards: scannedSurface(maps.ash, { color: "#c2af91", normalScale: new Vector2(0.15, 0.15) }),
    trim: scannedSurface(maps.walnut, { color: "#b8b4a5" }),
    frame: scannedSurface(maps.plaster, {
      color: "#d8d8ce",
      roughness: 0.9,
      normalScale: new Vector2(0.1, 0.1),
    }),
    sill: scannedSurface(maps.walnut),
    door: scannedSurface(maps.ash, {
      color: "#c9b998",
      roughness: 0.72,
      normalScale: new Vector2(0.12, 0.12),
    }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
