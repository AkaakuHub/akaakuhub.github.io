import type { Node } from "three/webgpu";
import { Fn, atan, float, mix, smoothstep, vec2, vec3 } from "three/tsl";

export const cloudCoordinates = Fn(
  ({
    direction,
    offset,
    height,
    elevation,
  }: {
    direction: Node<"vec3">;
    offset: Node<"vec2">;
    height: Node<"float">;
    elevation: Node<"float">;
  }) => {
    const distance = height.div(direction.y.max(0.02));
    const point = direction.xz.mul(distance).sub(offset).toVar();
    const altitude = atan(height, point.length());
    return vec2(
      atan(point.y.negate(), point.x.negate()).div(6.2831853).add(0.5),
      float(1).sub(altitude.div(elevation)).clamp(0.001, 0.999),
    );
  },
);

export const skyColor = Fn(
  ({
    partly,
    overcast,
    evening,
    daylight,
    twilight,
    brightness,
    stars,
    direction,
    sun,
    moon,
    moonFraction,
    cloud,
    exposure,
  }: {
    partly: Node<"vec3">;
    overcast: Node<"vec3">;
    evening: Node<"vec3">;
    daylight: Node<"float">;
    twilight: Node<"float">;
    brightness: Node<"float">;
    stars: Node<"float">;
    direction: Node<"vec3">;
    sun: Node<"vec3">;
    moon: Node<"vec3">;
    moonFraction: Node<"float">;
    cloud: Node<"float">;
    exposure: Node<"float">;
  }) => {
    const horizon = float(1).sub(direction.y.max(0)).pow(3).toVar();
    const edge = vec3(0.58, 0.76, 0.94);
    const clear = mix(vec3(0.075, 0.3, 0.68), edge, horizon);
    const photograph = mix(partly, overcast, smoothstep(0.45, 1, cloud)).toVar();
    const daytime = mix(clear, photograph, smoothstep(0, 0.5, cloud));
    const glow = direction.dot(sun).max(0).pow(3);
    const sunset = mix(evening, vec3(0.46, 0.25, 0.22), horizon.mul(glow).mul(0.15)).toVar();
    const lit = mix(daytime, sunset, twilight);
    const luminance = photograph.dot(vec3(0.2126, 0.7152, 0.0722));
    const night = mix(vec3(0.001, 0.003, 0.009), vec3(0.008, 0.014, 0.029), horizon).toVar();
    const cloudiness = smoothstep(0.48, 0.9, partly.r.div(partly.b.max(0.001)));
    const cloudAlpha = mix(
      cloudiness.mul(smoothstep(0, 0.5, cloud)),
      1,
      smoothstep(0.5, 1, cloud),
    ).toVar();
    const nightClouds = night.add(vec3(0.008, 0.009, 0.012).mul(luminance).mul(cloudAlpha));
    const haze = smoothstep(-0.015, 0.09, direction.y);
    const horizonColor = mix(night, mix(edge, sunset, twilight).mul(3.8).mul(brightness), daylight);
    const color = mix(
      horizonColor,
      mix(nightClouds, lit.mul(3.8).mul(brightness), daylight),
      haze,
    ).toVar();
    const sunDisk = smoothstep(0.999976, 0.999991, direction.dot(sun));
    color.addAssign(
      vec3(1, 0.87, 0.7).mul(sunDisk).mul(daylight).mul(cloudAlpha.oneMinus()).mul(8),
    );
    const coordinates = vec2(
      atan(direction.z, direction.x),
      direction.y.clamp(-1, 1).asin(),
    ).toVar();
    const cell = coordinates.mul(650).floor();
    const seed = cell.dot(vec2(127.1, 311.7)).sin().mul(43758.5453).fract();
    const point = coordinates.mul(650).fract().sub(0.5);
    const star = seed.step(0.9993).mul(smoothstep(0.02, 0.16, point.length()).oneMinus());
    color.addAssign(
      vec3(star.mul(stars).mul(0.6).mul(direction.y.step(0.02)).mul(cloudAlpha.oneMinus())),
    );
    const moonDisk = smoothstep(0.999982, 0.999991, direction.dot(moon));
    color.addAssign(
      vec3(0.7, 0.8, 1)
        .mul(moonDisk)
        .mul(moonFraction)
        .mul(daylight.oneMinus())
        .mul(cloudAlpha.oneMinus())
        .mul(3),
    );
    return color.div(exposure);
  },
);
