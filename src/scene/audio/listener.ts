export type ListenerPose = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const keys = [
  "positionX",
  "positionY",
  "positionZ",
  "forwardX",
  "forwardY",
  "forwardZ",
  "upX",
  "upY",
  "upZ",
] as const;
type Parameter = Pick<AudioParam, "setValueAtTime" | "setTargetAtTime">;
type Listener = Pick<AudioListener, "setPosition" | "setOrientation"> &
  Partial<Record<(typeof keys)[number], Parameter>>;

export function createListenerUpdater(listener: Listener) {
  const parameters = keys.map((key) => listener[key]);
  let previous: ListenerPose | undefined;
  return (pose: ListenerPose, now: number): void => {
    if (previous && pose.every((value, index) => value === previous?.[index])) return;
    if (parameters.every((parameter) => parameter !== undefined)) {
      parameters.forEach((parameter, index) => {
        const value = pose[index];
        if (value === undefined || value === previous?.[index]) return;
        if (!previous) parameter.setValueAtTime(value, now);
        else parameter.setTargetAtTime(value, now, 0.015);
      });
    } else {
      listener.setPosition(pose[0], pose[1], pose[2]);
      listener.setOrientation(pose[3], pose[4], pose[5], pose[6], pose[7], pose[8]);
    }
    previous = pose;
  };
}
