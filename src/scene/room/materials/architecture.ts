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
      normalScale: new Vector2(0.3, 0.3),
    }),
    ceiling: scannedSurface(maps.ceiling, {
      name: "room-ceiling",
      color: "#ffffff",
      normalScale: new Vector2(0.5, 0.5),
    }),
    boards: scannedSurface(maps.ash, {
      color: "#d8cbb5",
      roughness: 0.72,
      normalScale: new Vector2(0.22, 0.22),
    }),
    trim: scannedSurface(maps.walnut, {
      color: "#d5cebb",
      roughness: 0.62,
      normalScale: new Vector2(0.18, 0.18),
    }),
    frame: scannedSurface(maps.paint, {
      color: "#d8d8ce",
      roughness: 0.6,
      normalScale: new Vector2(0.1, 0.1),
    }),
    sill: scannedSurface(maps.walnut, {
      roughness: 0.58,
      normalScale: new Vector2(0.18, 0.18),
    }),
    door: scannedSurface(maps.ash, {
      color: "#c9b998",
      roughness: 0.72,
      normalScale: new Vector2(0.12, 0.12),
    }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
