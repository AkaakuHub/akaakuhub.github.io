fn roomInterval(origin: vec3f, direction: vec3f) -> vec2f {
  let lower = vec3f(-2.58, 0.02, -2.58);
  let upper = vec3f(2.58, 2.88, 2.58);
  var start = 0.0;
  var finish = 20.0;
  for (var axis = 0; axis < 3; axis++) {
    if (abs(direction[axis]) < 0.00001) {
      if (origin[axis] < lower[axis] || origin[axis] > upper[axis]) { return vec2f(0.0); }
    } else {
      let a = (lower[axis] - origin[axis]) / direction[axis];
      let b = (upper[axis] - origin[axis]) / direction[axis];
      start = max(start, min(a, b));
      finish = min(finish, max(a, b));
    }
  }
  return vec2f(start, max(start, finish));
}

