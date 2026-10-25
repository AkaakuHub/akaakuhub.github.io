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
      normalScale: new Vector2(0.18, 0.18),
    }),
    ceiling: scannedSurface(maps.ceiling, {
      name: "room-ceiling",
      color: "#ffffff",
      normalScale: new Vector2(0.5, 0.5),
    }),
    boards: scannedSurface(maps.ash, {
      color: "#f4eee3",
      roughnessMap: null,
      roughness: 0.86,
      normalScale: new Vector2(0.1, 0.1),
    }),
    trim: scannedSurface(maps.walnut, {
      color: "#d5cebb",
      roughnessMap: null,
      roughness: 0.8,
      normalScale: new Vector2(0.18, 0.18),
    }),
    frame: scannedSurface(maps.paint, {
      color: "#d8d8ce",
      roughnessMap: null,
      roughness: 0.82,
      normalScale: new Vector2(0.1, 0.1),
    }),
    sill: scannedSurface(maps.walnut, {
      roughnessMap: null,
      roughness: 0.76,
      normalScale: new Vector2(0.18, 0.18),
    }),
    door: scannedSurface(maps.ash, {
      color: "#c9b998",
      roughnessMap: null,
      roughness: 0.8,
      normalScale: new Vector2(0.12, 0.12),
    }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
