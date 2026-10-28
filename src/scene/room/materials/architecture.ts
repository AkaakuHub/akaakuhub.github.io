import { Vector2 } from "three";
import type { MaterialLibrary } from "../../materials/library";
import { scannedSurface } from "../../materials/surface";
import { paintedSurface } from "../../materials/paint";

export function createArchitectureMaterials(maps: MaterialLibrary) {
  return {
    floor: scannedSurface(maps.floor, {
      roughnessMap: null,
      roughness: 0.7,
    }),
    wall: scannedSurface(maps.plaster, {
      color: "#faf9f6",
    }),
    ceiling: scannedSurface(maps.ceiling, {
      name: "room-ceiling",
      color: "#ffffff",
      normalScale: new Vector2(0.5, 0.5),
    }),
    boards: scannedSurface(maps.oak, {
      color: "#f4eee3",
      roughness: 1,
    }),
    trim: scannedSurface(maps.walnut, {
      color: "#d5cebb",
    }),
    frame: paintedSurface(maps.paint, {
      color: "#d8d8ce",
    }),
    sill: scannedSurface(maps.walnut),
    door: scannedSurface(maps.oak, {
      color: "#c9b998",
      roughness: 1,
    }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
