import type { DepthTexture, LightShadow } from "three";
import type { Node } from "three/webgpu";
import { ConvertNode } from "three/webgpu";
import { dFdx, dFdy, float, reference, texture, vec2 } from "three/tsl";

export function receiverShadow({
  depthTexture,
  shadowCoord,
  shadow,
}: {
  depthTexture: DepthTexture;
  shadowCoord: Node<"vec3">;
  shadow: LightShadow;
}) {
  const dx = dFdx(shadowCoord).toVar();
  const dy = dFdy(shadowCoord).toVar();
  const determinant = dx.x.mul(dy.y).sub(dx.y.mul(dy.x));
  const inverse = determinant.div(determinant.mul(determinant).max(1e-20));
  const gradient = vec2(dy.y.mul(dx.z).sub(dx.y.mul(dy.z)), dx.x.mul(dy.z).sub(dy.x.mul(dx.z)))
    .mul(inverse)
    .toVar();
  const texel = vec2(1)
    .div(reference("mapSize", "vec2", shadow))
    .toVar();
  const footprint = gradient.abs().dot(texel).mul(0.5).toVar();
  const radius = reference("radius", "float", shadow).mul(texel.x);
  let sum: Node<"float"> = float(0);
  for (const [x, y] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ]) {
    const offset = vec2(x, y).mul(radius);
    const depth = shadowCoord.z.add(gradient.dot(offset)).sub(footprint);
    const comparison = texture(depthTexture, shadowCoord.xy.add(offset)).compare(depth);
    sum = sum.add(new ConvertNode<"float">(comparison, "float"));
  }
  return sum.mul(0.25);
}
