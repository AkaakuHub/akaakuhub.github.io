uniform sampler2D sceneDepth;
uniform highp sampler2DShadow lightDepth;
uniform mat4 inverseProjection;
uniform mat4 cameraWorld;
uniform mat4 lightMatrix;
uniform vec3 eye;
uniform vec3 lightDirection;
uniform vec3 lightRadiance;
uniform float lightShadowBias;
uniform int scatteringSteps;
const float extinction = 0.000762 / 0.0254;

vec3 surfaceAt(vec2 screenUv) {
  float depth = texture2D(sceneDepth, screenUv).r;
  vec4 view = inverseProjection * vec4(screenUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  return (cameraWorld * vec4(view.xyz / view.w, 1.0)).xyz;
}

vec2 roomInterval(vec3 origin, vec3 direction) {
  vec3 roomMin = vec3(-2.58, 0.02, -2.58);
  vec3 roomMax = vec3(2.58, 2.88, 2.58);
  float start = 0.0;
  float finish = 20.0;
  for (int axis = 0; axis < 3; axis++) {
    if (abs(direction[axis]) < 0.00001) {
      if (origin[axis] < roomMin[axis] || origin[axis] > roomMax[axis]) return vec2(0.0);
    } else {
      float a = (roomMin[axis] - origin[axis]) / direction[axis];
      float b = (roomMax[axis] - origin[axis]) / direction[axis];
      start = max(start, min(a, b));
      finish = min(finish, max(a, b));
    }
  }
  return vec2(start, max(start, finish));
}

float visibilityAt(vec3 world) {
  vec4 projected = lightMatrix * vec4(world, 1.0);
  vec3 shadow = projected.xyz / projected.w;
  if (any(lessThan(shadow, vec3(0.0))) || any(greaterThan(shadow, vec3(1.0)))) return 0.0;
  return texture(lightDepth, vec3(shadow.xy, shadow.z + lightShadowBias));
}

float phaseFunction(float cosine) {
  const float g = 0.4;
  return (1.0 - g * g) / (12.5663706 * pow(1.0 + g * g - 2.0 * g * clamp(cosine, -1.0, 1.0), 1.5));
}

vec4 integrateScattering(vec2 screenUv) {
  vec3 delta = surfaceAt(screenUv) - eye;
  float surfaceDistance = length(delta);
  vec3 direction = delta / max(surfaceDistance, 0.0001);
  vec2 interval = roomInterval(eye, direction);
  float segment = max(0.0, min(surfaceDistance, interval.y) - interval.x);
  if (segment <= 0.0 || length(lightRadiance) <= 0.0) return vec4(0.0, 0.0, 0.0, surfaceDistance);
  float stepSize = segment / float(scatteringSteps);
  float illuminated = 0.0;
  for (int index = 0; index < SCATTER_STEPS; index++) {
    if (index >= scatteringSteps) break;
    float distanceAlongRay = interval.x + (float(index) + 0.5) * stepSize;
    vec3 world = eye + direction * distanceAlongRay;
    float lightPath = roomInterval(world, lightDirection).y;
    float transmittance = exp(-extinction * (distanceAlongRay - interval.x + lightPath));
    illuminated += visibilityAt(world) * transmittance * stepSize;
  }
  float phase = phaseFunction(dot(direction, lightDirection));
  return vec4(lightRadiance * (extinction * illuminated * phase), surfaceDistance);
}
