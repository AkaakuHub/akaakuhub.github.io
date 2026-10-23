uniform sampler2D sceneDepth;
uniform highp sampler2DShadow sunDepth;
uniform mat4 inverseProjection;
uniform mat4 cameraWorld;
uniform mat4 sunMatrix;
uniform vec3 eye;
uniform vec3 sunDirection;
uniform vec3 sunRadiance;
uniform float sunShadowBias;
const float extinction = 0.055;

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

float sunlightAt(vec3 world) {
  vec4 projected = sunMatrix * vec4(world, 1.0);
  vec3 shadow = projected.xyz / projected.w;
  if (any(lessThan(shadow, vec3(0.0))) || any(greaterThan(shadow, vec3(1.0)))) return 0.0;
  return texture(sunDepth, vec3(shadow.xy, shadow.z + sunShadowBias));
}

float phaseFunction(float cosine) {
  const float g = 0.4;
  return (1.0 - g * g) / (12.5663706 * pow(max(0.01, 1.0 + g * g - 2.0 * g * cosine), 1.5));
}

float illuminatedFraction(vec3 start, vec3 finish, float first, float last) {
  if (abs(first - last) < 0.01) return (first + last) * 0.5;
  float lower = 0.0;
  float upper = 1.0;
  float threshold = (first + last) * 0.5;
  bool rising = last > first;
  for (int refinement = 0; refinement < 6; refinement++) {
    float midpoint = (lower + upper) * 0.5;
    float visibility = sunlightAt(mix(start, finish, midpoint));
    if ((visibility < threshold) == rising) lower = midpoint;
    else upper = midpoint;
  }
  return mix(last, first, (lower + upper) * 0.5);
}

vec4 integrateScattering(vec2 screenUv) {
  vec3 delta = surfaceAt(screenUv) - eye;
  float surfaceDistance = length(delta);
  vec3 direction = delta / max(surfaceDistance, 0.0001);
  vec2 interval = roomInterval(eye, direction);
  float segment = max(0.0, min(surfaceDistance, interval.y) - interval.x);
  if (segment <= 0.0 || length(sunRadiance) <= 0.0) return vec4(0.0, 0.0, 0.0, surfaceDistance);
  float stepSize = segment / float(SCATTER_STEPS);
  float illuminated = 0.0;
  vec3 start = eye + direction * interval.x;
  float first = sunlightAt(start);
  for (int index = 0; index < SCATTER_STEPS; index++) {
    float distanceAlongRay = interval.x + (float(index) + 0.5) * stepSize;
    vec3 world = eye + direction * distanceAlongRay;
    vec3 finish = eye + direction * (interval.x + float(index + 1) * stepSize);
    float last = sunlightAt(finish);
    float fraction = illuminatedFraction(start, finish, first, last);
    float sunPath = roomInterval(world, sunDirection).y;
    float transmittance = exp(-extinction * (distanceAlongRay - interval.x + sunPath));
    illuminated += fraction * transmittance * stepSize;
    start = finish;
    first = last;
  }
  float phase = phaseFunction(dot(direction, sunDirection));
  return vec4(sunRadiance * (extinction * illuminated * phase), surfaceDistance);
}
