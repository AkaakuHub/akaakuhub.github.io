attribute vec3 seed;
uniform float time;
uniform float snow;
uniform vec3 velocity;
varying vec2 particleUv;

void main() {
  vec3 extent = vec3(3.95, 5.0, 6.0);
  vec3 center = mod(seed * extent + velocity * time, extent) + vec3(-6.7, 0.0, -3.0);
  center.z += snow * 0.06 * sin(time * 1.8 + seed.x * 40.0);
  vec4 eye = modelViewMatrix * vec4(center, 1.0);
  vec2 fall = (viewMatrix * vec4(velocity, 0.0)).xy;
  vec2 along = normalize(fall + vec2(0.0, -0.001));
  vec2 across = vec2(-along.y, along.x);
  float width = mix(0.004, 0.024, snow);
  float length = mix(0.16, 0.024, snow);
  eye.xy += across * position.x * width + along * position.y * length;
  gl_Position = projectionMatrix * eye;
  particleUv = uv;
}
