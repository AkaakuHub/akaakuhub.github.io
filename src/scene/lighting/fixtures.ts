import { Color } from "three";
import { photometry, unitLuminance } from "./photometry";

export const fixturePositions = [-1.05, 1.35] as const;
export const fixtureHeight = 2.765;
export const fluorescentColor = unitLuminance(new Color(1.414516, 0.923789, 0.534348));
export const fluorescentRadiance =
  (photometry.tubesPerFixture * photometry.tubeLumens * photometry.scale) /
  (photometry.fixtureWidth * photometry.fixtureLength * Math.PI);
