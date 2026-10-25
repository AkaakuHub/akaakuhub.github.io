import { PlaneGeometry, RectAreaLight } from "three";
import type { Group, Mesh } from "three";

export function createDisplayOrientation(head: Group, screen: Mesh<PlaneGeometry>) {
  let current: boolean | undefined;
  return (portrait: boolean): boolean => {
    if (portrait === current) return false;
    current = portrait;
    head.rotation.z = portrait ? Math.PI / 2 : 0;
    head.position.y = portrait ? 0.38 : 0.333;
    screen.rotation.z = portrait ? -Math.PI / 2 : 0;
    screen.geometry.dispose();
    screen.geometry = new PlaneGeometry(portrait ? 0.331 : 0.589, portrait ? 0.589 : 0.331);
    const light = head.getObjectByName("computer-monitor-light");
    if (light instanceof RectAreaLight) {
      light.width = screen.geometry.parameters.width;
      light.height = screen.geometry.parameters.height;
      light.rotation.copy(screen.rotation);
      light.rotateY(Math.PI);
    }
    head.updateWorldMatrix(true, true);
    return true;
  };
}
