import { Color, RectAreaLight, Vector3 } from "three";
import type { Mesh } from "three";
import { photometry, unitLuminance } from "./photometry";

export function createMonitorLight(monitor: Mesh): RectAreaLight {
  const parent = monitor.parent;
  if (!parent) throw new Error("モニターが配置されていません。");
  monitor.geometry.computeBoundingBox();
  const bounds = monitor.geometry.boundingBox;
  if (!bounds) throw new Error("モニターの発光面を計算できません。");
  const size = bounds.getSize(new Vector3());
  const light = new RectAreaLight(unitLuminance(new Color("#e8f2ff")), 0, size.x, size.y);
  light.name = "computer-monitor-light";
  light.position.copy(monitor.position);
  light.position.z += 0.004;
  light.rotation.copy(monitor.rotation);
  light.rotateY(Math.PI);
  parent.add(light);
  return light;
}

export function setMonitorLight(light: RectAreaLight, on: boolean): void {
  light.intensity = on ? photometry.monitorNits * photometry.scale : 0;
}
