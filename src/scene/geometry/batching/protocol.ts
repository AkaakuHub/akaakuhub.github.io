import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from "three";
import type { TypedArray } from "three";

export interface GeometryData {
  attributes: Record<string, { array: TypedArray; itemSize: number; normalized: boolean }>;
  index: TypedArray | null;
  metricUv: boolean;
  bounds: { min: number[]; max: number[]; center: number[]; radius: number } | null;
}

interface BatchPart {
  geometry: number;
  matrix: number[];
}

export interface BatchRequest {
  geometries: GeometryData[];
  batches: BatchPart[][];
}

export type BatchResponse =
  | { ok: true; geometries: GeometryData[] }
  | { ok: false; message: string };

export function encodeGeometry(geometry: BufferGeometry, copyArrays: boolean): GeometryData {
  const attributes: GeometryData["attributes"] = {};
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (!(attribute instanceof BufferAttribute))
      throw new Error("結合する頂点属性が独立した配列ではありません。");
    attributes[name] = {
      array: copyArrays ? attribute.array.slice() : attribute.array,
      itemSize: attribute.itemSize,
      normalized: attribute.normalized,
    };
  }
  return {
    attributes,
    index: geometry.index
      ? copyArrays
        ? geometry.index.array.slice()
        : geometry.index.array
      : null,
    metricUv: geometry.userData.metricUv === true,
    bounds:
      geometry.boundingBox && geometry.boundingSphere
        ? {
            min: geometry.boundingBox.min.toArray(),
            max: geometry.boundingBox.max.toArray(),
            center: geometry.boundingSphere.center.toArray(),
            radius: geometry.boundingSphere.radius,
          }
        : null,
  };
}

export function decodeGeometry(data: GeometryData): BufferGeometry {
  const geometry = new BufferGeometry();
  for (const [name, attribute] of Object.entries(data.attributes))
    geometry.setAttribute(
      name,
      new BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized),
    );
  if (data.index) geometry.setIndex(new BufferAttribute(data.index, 1));
  geometry.userData.metricUv = data.metricUv;
  if (data.bounds) {
    geometry.boundingBox = new Box3(
      new Vector3().fromArray(data.bounds.min),
      new Vector3().fromArray(data.bounds.max),
    );
    geometry.boundingSphere = new Sphere(
      new Vector3().fromArray(data.bounds.center),
      data.bounds.radius,
    );
  }
  return geometry;
}

export function geometryTransfers(geometries: readonly GeometryData[]): ArrayBuffer[] {
  const buffers = new Set<ArrayBuffer>();
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes)) {
      if (!(attribute.array.buffer instanceof ArrayBuffer))
        throw new Error("頂点属性をWorkerへ転送できません。");
      buffers.add(attribute.array.buffer);
    }
    if (geometry.index) {
      if (!(geometry.index.buffer instanceof ArrayBuffer))
        throw new Error("頂点のインデックスをWorkerへ転送できません。");
      buffers.add(geometry.index.buffer);
    }
  }
  return [...buffers];
}
