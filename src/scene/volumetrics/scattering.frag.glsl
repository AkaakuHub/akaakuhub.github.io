varying vec2 vUv;
void main() {
  gl_FragColor = integrateScattering(vUv);
}
