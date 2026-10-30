import { wgslFn } from "three/tsl";

export const skyCoordinates = wgslFn(`
fn skyCoordinates(direction: vec3f, sun: vec3f) -> vec2f {
  let heading = atan2(direction.z, direction.x) - atan2(sun.z, sun.x);
  return vec2f(fract(heading / 6.2831853 + 0.6),
    clamp(acos(clamp(direction.y, 0.0, 1.0)) / 1.5707963, 0.002, 0.998));
}`);

export const skyColor = wgslFn(`
fn skyColor(clear: vec3f, cloudy: vec3f, sunset: vec3f, blend: f32,
  daylight: f32, twilight: f32, brightness: f32, tint: vec3f,
  stars: f32, coordinates: vec2f, direction: vec3f, moon: vec3f,
  moonFraction: f32, cloud: f32, exposure: f32) -> vec3f {
  let photograph = mix(mix(clear, cloudy, blend), sunset, twilight);
  let luminance = dot(photograph, vec3f(0.2126, 0.7152, 0.0722));
  let night = vec3f(0.004, 0.008, 0.019) * (0.4 + luminance);
  let daylightColor = photograph * tint * brightness * 5.5;
  var color = mix(night, daylightColor, daylight);
  let cell = floor(coordinates * vec2f(1600.0, 700.0));
  let seed = fract(sin(dot(cell, vec2f(127.1, 311.7))) * 43758.5453);
  let point = fract(coordinates * vec2f(1600.0, 700.0)) - 0.5;
  let star = step(0.9993, seed) * (1.0 - smoothstep(0.02, 0.16, length(point)));
  color += vec3f(star * stars * 0.8 * step(0.02, direction.y));
  let moonDisk = smoothstep(0.999982, 0.999991, dot(direction, moon));
  color += vec3f(0.7, 0.8, 1.0) * moonDisk * moonFraction
    * (1.0 - daylight) * (1.0 - cloud) * 3.0;
  return color / exposure;
}`);
