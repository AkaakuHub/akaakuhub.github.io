export const materialDefinitions = {
  floor: { id: "herringbone_parquet", meters: 3.4, format: "arm" },
  plaster: { id: "painted_plaster_wall", meters: 3.2, format: "arm" },
  ash: { id: "ash_veneer", meters: 1, format: "arm" },
  walnut: { id: "walnut_veneer", meters: 1.8, format: "arm" },
  fabric: { id: "terlenka", meters: 0.266, format: "arm" },
  aluminum: { id: "Metal050B", meters: 0.25, format: "arm" },
  paint: { id: "PaintedMetal001", meters: 0.8, format: "arm" },
  steel: { id: "Metal049B", meters: 0.25, format: "metal" },
  brass: { id: "Metal048B", meters: 0.2, format: "metal" },
  powder: { id: "Metal027", meters: 0.1, format: "metal" },
  paper: { id: "Paper001", meters: 0.3, format: "dielectric" },
  plastic: { id: "Plastic010", meters: 0.2, format: "dielectric" },
  leaves: { id: "LeafSet024", meters: 1, format: "leaf" },
} as const;

type MaterialDefinition = (typeof materialDefinitions)[keyof typeof materialDefinitions];

export const materialAssetIds = Object.values(materialDefinitions).flatMap((definition) => {
  const files =
    definition.format === "metal"
      ? ["normal"]
      : definition.format === "arm"
        ? ["color", "normal", "arm"]
        : definition.format === "leaf"
          ? ["color", "normal", "roughness", "opacity"]
          : ["color", "normal", "roughness"];
  return files.map((file) => `materials/${definition.id}/${file}.webp`);
});

export type SurfaceDefinition = Exclude<MaterialDefinition, { format: "metal" }>;
export type MetalDefinition = Extract<MaterialDefinition, { format: "metal" }>;
