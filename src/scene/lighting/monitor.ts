import { Color, RectAreaLight } from "three";
import type { Mesh } from "three";
import { photometry, unitLuminance } from "./photometry";

export function createMonitorLight(monitor: Mesh): RectAreaLight {
  const parent = monitor.parent;
  if (!parent) throw new Error("モニターが配置されていません。");
  const light = new RectAreaLight(unitLuminance(new Color("#e8f2ff")), 0, 0.589, 0.331);
  light.position.copy(monitor.position);
  light.position.z += 0.004;
  light.rotation.copy(monitor.rotation);
  light.rotateY(Math.PI);
  light.visible = false;
  parent.add(light);
  return light;
}

export function setMonitorLight(light: RectAreaLight, on: boolean): void {
  light.visible = on;
  light.intensity = on ? photometry.monitorNits * photometry.scale : 0;
}
