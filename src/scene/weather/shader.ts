import type { Node } from "three/webgpu";
import { Fn, mix, smoothstep, vec2, vec3, vec4 } from "three/tsl";

export const weatherVertex = Fn(
  ({
    seed,
    position,
    modelView,
    view,
    projection,
    time,
    snow,
    strength,
    velocity,
  }: {
    seed: Node<"vec3">;
    position: Node<"vec3">;
    modelView: Node<"mat4">;
    view: Node<"mat4">;
    projection: Node<"mat4">;
    time: Node<"float">;
    snow: Node<"float">;
    strength: Node<"float">;
    velocity: Node<"vec3">;
  }) => {
    const extent = vec3(3.95, 5, 6);
    const center = seed
      .mul(extent)
      .add(velocity.mul(time))
      .mod(extent)
      .add(extent)
      .mod(extent)
      .add(vec3(-6.7, 0, -3))
      .toVar();
    center.z.addAssign(snow.mul(0.06).mul(time.mul(1.8).add(seed.x.mul(40)).sin()));
    const eye = modelView.mul(vec4(center, 1)).toVar();
    const fall = view.mul(vec4(velocity, 0)).xy;
    const along = fall.add(vec2(0, -0.001)).normalize().toVar();
    const across = vec2(along.y, along.x.negate());
    const width = mix(mix(0.006, 0.012, strength), 0.024, snow);
    const length = mix(mix(0.1, 0.24, strength), 0.024, snow);
    const offset = across.mul(position.x).mul(width).add(along.mul(position.y).mul(length));
    return projection.mul(vec4(eye.xy.add(offset), eye.zw));
  },
);

export const weatherColor = Fn(
  ({
    uv,
    snow,
    strength,
    color,
  }: {
    uv: Node<"vec2">;
    snow: Node<"float">;
    strength: Node<"float">;
    color: Node<"color">;
  }) => {
    const point = uv.mul(2).sub(1).toVar();
    const edge = mix(point.x.abs(), point.length(), snow);
    const opacity = smoothstep(0.5, 1, edge).oneMinus().mul(point.y.mul(point.y).oneMinus());
    return vec4(color, opacity.mul(mix(mix(0.35, 0.7, strength), 0.85, snow)));
  },
);
