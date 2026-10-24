import { MeshStandardMaterial, Vector2 } from "three";
import type { MaterialLibrary } from "../../materials/library";
import { scannedSurface } from "../../materials/surface";

export function createArchitectureMaterials(maps: MaterialLibrary) {
  return {
    floor: scannedSurface(maps.floor, {
      roughnessMap: null,
      roughness: 0.78,
      normalScale: new Vector2(0.12, 0.12),
    }),
    wall: scannedSurface(maps.plaster, {
      map: null,
      color: "#d9d7ca",
      normalScale: new Vector2(0.08, 0.08),
    }),
    ceiling: scannedSurface(maps.plaster, {
      name: "room-ceiling",
      map: null,
      color: "#e5e5db",
      normalScale: new Vector2(0.08, 0.08),
    }),
    boards: scannedSurface(maps.ash, { color: "#c2af91", normalScale: new Vector2(0.15, 0.15) }),
    trim: scannedSurface(maps.walnut, { color: "#b8b4a5" }),
    frame: new MeshStandardMaterial({ color: "#d8d8ce", roughness: 0.72 }),
    sill: scannedSurface(maps.walnut),
    door: scannedSurface(maps.ash, {
      color: "#c9b998",
      roughness: 0.72,
      normalScale: new Vector2(0.12, 0.12),
    }),
  };
}

export type ArchitectureMaterials = ReturnType<typeof createArchitectureMaterials>;
