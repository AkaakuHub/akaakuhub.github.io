import { Matrix4 } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { offsetSurfaceUv } from "../../materials/surface-uv.ts";
import { decodeGeometry, encodeGeometry } from "./protocol.ts";
import type { BatchRequest, GeometryData } from "./protocol.ts";

export function mergeBatches(request: BatchRequest): GeometryData[] {
  const sources = request.geometries.map(decodeGeometry);
  const indexed = new Map<number, ReturnType<typeof mergeVertices>>();
  const matrix = new Matrix4();
  try {
    return request.batches.map((batch) => {
      const parts = batch.map((part) => {
        let source = sources[part.geometry];
        if (!source) throw new Error("結合元の形状が見つかりません。");
        if (batch.length > 1 && !source.index) {
          let welded = indexed.get(part.geometry);
          if (!welded) {
            welded = mergeVertices(source);
            indexed.set(part.geometry, welded);
          }
          source = welded;
        }
        const geometry = source.clone();
        matrix.fromArray(part.matrix);
        offsetSurfaceUv(geometry, matrix);
        if (batch.length > 1) geometry.applyMatrix4(matrix);
        return geometry;
      });
      const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts);
      if (!geometry) throw new Error("静止した部材の描画をまとめられませんでした。");
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const data = encodeGeometry(geometry, false);
      if (parts.length > 1) geometry.dispose();
      for (const part of parts) part.dispose();
      return data;
    });
  } finally {
    for (const source of sources) source.dispose();
    for (const geometry of indexed.values()) geometry.dispose();
  }
}
