varying vec3 surfaceNormal;
varying vec2 maskUv;
uniform sampler2D alphaMask;
uniform float alphaThreshold;
uniform bool clearGlass;

void main() {
  if (clearGlass) discard;
  if (alphaThreshold > 0.0 && texture2D(alphaMask, maskUv).g < alphaThreshold) discard;
  vec3 normal = normalize(surfaceNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
