uniform float snow;
uniform float strength;
uniform vec3 color;
varying vec2 particleUv;

void main() {
  vec2 p = particleUv * 2.0 - 1.0;
  float edge = mix(abs(p.x), length(p), snow);
  float opacity = (1.0 - smoothstep(0.5, 1.0, edge)) * (1.0 - p.y * p.y);
  gl_FragColor = vec4(color, opacity * mix(mix(0.35, 0.7, strength), 0.85, snow));
}
