import { Vector2 } from "three";
import type { MaterialLibrary } from "../../materials/library";
import { scannedSurface } from "../../materials/surface";

export function createArchitectureMaterials(maps: MaterialLibrary) {
  return {
    floor: scannedSurface(maps.floor, {
      roughnessMap: null,
      roughness: 0.7,
      normalScale: new Vector2(0.12, 0.12),
    }),
    wall: scannedSurface(maps.plaster, {
      color: "#faf9f6",
      normalScale: new Vector2(0.75, 0.75),
    }),
    ceiling: scannedSurface(maps.ceiling, {
      name: "room-ceiling",
      color: "#ffffff",
      normalScale: new Vector2(0.5, 0.5),
    }),
    boards: scannedSurface(maps.oak, {
      color: "#f4eee3",
      roughness: 1,
      normalScale: new Vector2(0.4, 0.4),
    }),
    trim: scannedSurface(maps.walnut, {
      color: "#d5cebb",
      roughnessMap: null,
      roughness: 0.8,
      normalScale: new Vector2(0.4, 0.4),
    }),
    frame: scannedSurface(maps.paint, {
      color: "#d8d8ce",
      roughness: 1,
      normalScale: new Vector2(0.35, 0.35),
    }),
    sill: scannedSurface(maps.walnut, {
      roughnessMap: null,
      roughness: 0.76,
      normalScale: new Vector2(0.4, 0.4),
    }),
    door: scannedSurface(maps.oak, {
      color: "#c9b998",
      roughness: 1,
      normalScale: new Vector2(0.4, 0.4),
    }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
