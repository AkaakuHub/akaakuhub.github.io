fn compositeScattering(sceneColor: texture_2d<f32>, scattering: texture_2d<f32>,
  sceneDepth: texture_depth_2d, uv: vec2f, inverseProjection: mat4x4f,
  cameraWorld: mat4x4f, eye: vec3f, extinction: f32) -> vec4f {
  let delta = surfaceAt(sceneDepth, uv, inverseProjection, cameraWorld) - eye;
  let distance = length(delta);
  let size = vec2f(textureDimensions(scattering));
  let pixel = uv * size - 0.5;
  let base = floor(pixel);
  let fraction = fract(pixel);
  var radiance = vec3f(0.0);
  var total = 0.0;
  for (var y = 0; y < 2; y++) {
    for (var x = 0; x < 2; x++) {
      let offset = vec2f(f32(x), f32(y));
      let sample = textureLoad(scattering, vec2i(clamp(base + offset, vec2f(0.0), size - 1.0)), 0);
      let difference = abs(sample.a - distance);
      if (difference > max(0.08, distance * 0.015)) { continue; }
      let spatial = mix(1.0 - fraction, fraction, offset);
      let weight = spatial.x * spatial.y / (1.0 + difference * 20.0);
      radiance += sample.rgb * weight;
      total += weight;
    }
  }
  if (total > 0.00001) { radiance /= total; }
  let direction = delta / max(distance, 0.0001);
  let interval = roomInterval(eye, direction);
  let segment = max(0.0, min(distance, interval.y) - interval.x);
  let colorSize = vec2f(textureDimensions(sceneColor));
  let color = textureLoad(sceneColor, vec2i(clamp(uv * colorSize, vec2f(0.0), colorSize - 1.0)), 0).rgb;
  return vec4f(color * exp(-extinction * segment) + radiance, 1.0);
}

