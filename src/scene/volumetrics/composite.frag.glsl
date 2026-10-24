uniform sampler2D sceneColor;
uniform sampler2D scattering;
uniform vec2 scatteringSize;
varying vec2 vUv;

void main() {
  vec3 delta = surfaceAt(vUv) - eye;
  float surfaceDistance = length(delta);
  vec2 pixel = vUv * scatteringSize - 0.5;
  vec2 base = floor(pixel);
  vec2 fraction = fract(pixel);
  vec3 radiance = vec3(0.0);
  float total = 0.0;
  for (int y = 0; y < 2; y++) {
    for (int x = 0; x < 2; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 sampleUv = (clamp(base + offset, vec2(0.0), scatteringSize - 1.0) + 0.5) / scatteringSize;
      vec4 sampleValue = texture2D(scattering, sampleUv);
      float difference = abs(sampleValue.a - surfaceDistance);
      if (difference > max(0.08, surfaceDistance * 0.015)) continue;
      vec2 spatial = mix(1.0 - fraction, fraction, offset);
      float weight = spatial.x * spatial.y / (1.0 + difference * 20.0);
      radiance += sampleValue.rgb * weight;
      total += weight;
    }
  }
  if (total > 0.00001) radiance /= total;
  vec3 direction = delta / max(surfaceDistance, 0.0001);
  vec2 interval = roomInterval(eye, direction);
  float segment = max(0.0, min(surfaceDistance, interval.y) - interval.x);
  gl_FragColor = vec4(texture2D(sceneColor, vUv).rgb * exp(-extinction * segment) + radiance, 1.0);
}
