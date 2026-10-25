fn surfaceAt(depth: texture_depth_2d, uv: vec2f, inverseProjection: mat4x4f, cameraWorld: mat4x4f) -> vec3f {
  let size = vec2f(textureDimensions(depth));
  let pixel = vec2i(clamp(uv * size, vec2f(0.0), size - 1.0));
  let z = textureLoad(depth, pixel, 0);
  let view = inverseProjection * vec4f(uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), z, 1.0);
  return (cameraWorld * vec4f(view.xyz / view.w, 1.0)).xyz;
}

