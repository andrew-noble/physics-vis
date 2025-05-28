export type ForceType =
  | "applied"
  | "reaction"
  | "component"
  | "net"
  | "fictitious";

export type Location = "top" | "bottom" | "left" | "right" | "centroid";

export type BodyShape = "rectangle" | "circle" | "square";

export type MomentDirection = "cw" | "ccw";

export interface Body {
  id: string;
  shape: BodyShape;
  angle: number;
}

export interface Force {
  label: string;
  name: string;
  unit: string;
  magnitude: number;
  angle: number; // these are absolute
  location: Location; // this location might change in svg bc of body rotation
  type: ForceType;
}

export interface Moment {
  label: string;
  name: string;
  unit: string;
  magnitude: number;
  direction: MomentDirection;
  location: Location;
}

export interface Axes {
  rotation: number;
}

export interface Diagram {
  body: Body;
  forces: Force[];
  moments: Moment[];
  axes: Axes;
}
