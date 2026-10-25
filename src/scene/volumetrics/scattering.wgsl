fn integrateScattering(sceneDepth: texture_depth_2d, lightDepth: texture_depth_2d,
  uv: vec2f, inverseProjection: mat4x4f, cameraWorld: mat4x4f, lightMatrix: mat4x4f,
  eye: vec3f, lightDirection: vec3f, lightRadiance: vec3f, bias: f32, steps: i32) -> vec4f {
  let extinction = 0.000762 / 0.0254;
  let delta = surfaceAt(sceneDepth, uv, inverseProjection, cameraWorld) - eye;
  let distance = length(delta);
  let direction = delta / max(distance, 0.0001);
  let interval = roomInterval(eye, direction);
  let segment = max(0.0, min(distance, interval.y) - interval.x);
  if (segment <= 0.0 || length(lightRadiance) <= 0.0) { return vec4f(0.0, 0.0, 0.0, distance); }
  let stepSize = segment / f32(steps);
  var illuminated = 0.0;
  for (var index = 0; index < steps; index++) {
    let along = interval.x + (f32(index) + 0.5) * stepSize;
    let world = eye + direction * along;
    let projected = lightMatrix * vec4f(world, 1.0);
    let shadow = projected.xyz / projected.w;
    var visibility = 0.0;
    if (all(shadow >= vec3f(0.0)) && all(shadow <= vec3f(1.0))) {
      let size = vec2f(textureDimensions(lightDepth));
      let pixel = vec2i(clamp(shadow.xy * size, vec2f(0.0), size - 1.0));
      visibility = select(0.0, 1.0, shadow.z + bias <= textureLoad(lightDepth, pixel, 0));
    }
    let path = roomInterval(world, lightDirection).y;
    illuminated += visibility * exp(-extinction * (along - interval.x + path)) * stepSize;
  }
  let g = 0.4;
  let cosine = clamp(dot(direction, lightDirection), -1.0, 1.0);
  let phase = (1.0 - g * g) / (12.5663706 * pow(1.0 + g * g - 2.0 * g * cosine, 1.5));
  return vec4f(lightRadiance * (extinction * illuminated * phase), distance);
}

