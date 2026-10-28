import { Color } from "three";
import { photometry, unitLuminance } from "./photometry";

export const fixturePositions = [-1.05, 1.35] as const;
export const fixtureHeight = 2.776;
export const fixtureEmitterWidth = 0.22;
export const tubeRadius = 0.013;
export const tubeLength = 1.04;
export const fluorescentColor = unitLuminance(new Color("#ebf4ff"));
export const fluorescentRadiance =
  (photometry.tubeLumens * photometry.scale) / (2 * Math.PI ** 2 * tubeRadius * tubeLength);
