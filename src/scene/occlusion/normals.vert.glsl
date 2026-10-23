varying vec3 surfaceNormal;
varying vec2 maskUv;
uniform mat3 maskTransform;

void main() {
  surfaceNormal = normalMatrix * normal;
  maskUv = (maskTransform * vec3(uv, 1.0)).xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
