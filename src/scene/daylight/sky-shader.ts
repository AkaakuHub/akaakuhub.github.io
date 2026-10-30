import { wgslFn } from "three/tsl";

export const cloudCoordinates = wgslFn(`
fn cloudCoordinates(direction: vec3f, offset: vec2f, height: f32, elevation: f32) -> vec2f {
  let distance = height / max(0.02, direction.y);
  let point = direction.xz * distance - offset;
  let altitude = atan2(height, length(point));
  return vec2f(atan2(-point.y, -point.x) / 6.2831853 + 0.5,
    clamp(1.0 - altitude / elevation, 0.001, 0.999));
}`);

export const skyColor = wgslFn(`
fn skyColor(partly: vec3f, overcast: vec3f, evening: vec3f,
  daylight: f32, twilight: f32, brightness: f32, stars: f32,
  direction: vec3f, sun: vec3f, moon: vec3f, moonFraction: f32,
  cloud: f32, exposure: f32) -> vec3f {
  let horizon = pow(1.0 - max(0.0, direction.y), 3.0);
  let high = vec3f(0.075, 0.3, 0.68);
  let edge = vec3f(0.58, 0.76, 0.94);
  let clear = mix(high, edge, horizon);
  let photograph = mix(partly, overcast, smoothstep(0.45, 1.0, cloud));
  let daytime = mix(clear, photograph, smoothstep(0.0, 0.5, cloud));
  let glow = pow(max(0.0, dot(direction, sun)), 3.0);
  let sunset = mix(evening, vec3f(0.46, 0.25, 0.22), horizon * glow * 0.15);
  let lit = mix(daytime, sunset, twilight);
  let luminance = dot(photograph, vec3f(0.2126, 0.7152, 0.0722));
  let night = mix(vec3f(0.001, 0.003, 0.009), vec3f(0.008, 0.014, 0.029), horizon);
  let cloudiness = smoothstep(0.48, 0.9, partly.r / max(0.001, partly.b));
  let cloudAlpha = mix(cloudiness * smoothstep(0.0, 0.5, cloud), 1.0, smoothstep(0.5, 1.0, cloud));
  let nightClouds = night + vec3f(0.008, 0.009, 0.012) * luminance * cloudAlpha;
  let haze = smoothstep(-0.015, 0.09, direction.y);
  let horizonColor = mix(night, mix(edge, sunset, twilight) * 3.8 * brightness, daylight);
  var color = mix(horizonColor, mix(nightClouds, lit * 3.8 * brightness, daylight), haze);
  let sunDisk = smoothstep(0.999976, 0.999991, dot(direction, sun));
  color += vec3f(1.0, 0.87, 0.7) * sunDisk * daylight * (1.0 - cloudAlpha) * 8.0;
  let coordinates = vec2f(atan2(direction.z, direction.x), asin(clamp(direction.y, -1.0, 1.0)));
  let cell = floor(coordinates * 650.0);
  let seed = fract(sin(dot(cell, vec2f(127.1, 311.7))) * 43758.5453);
  let point = fract(coordinates * 650.0) - 0.5;
  let star = step(0.9993, seed) * (1.0 - smoothstep(0.02, 0.16, length(point)));
  color += vec3f(star * stars * 0.6 * step(0.02, direction.y) * (1.0 - cloudAlpha));
  let moonDisk = smoothstep(0.999982, 0.999991, dot(direction, moon));
  color += vec3f(0.7, 0.8, 1.0) * moonDisk * moonFraction * (1.0 - daylight) * (1.0 - cloudAlpha) * 3.0;
  return color / exposure;
}`);
