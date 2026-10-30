import type { Node } from "three/webgpu";
import { float } from "three/tsl";

export function displayTone(color: Node<"vec3">, exposure: Node<"float">, headroom: Node<"float">) {
  const exposed = color.mul(exposure).max(0);
  const shoulder = float(4).sub(headroom.sub(1).div(3).clamp(0, 1));
  const standard = float(1).sub(exposed.div(shoulder).negate().exp());
  const highlights = exposed.sub(12).max(0);
  return standard.add(headroom.sub(1).mul(highlights.div(highlights.add(16))));
}
