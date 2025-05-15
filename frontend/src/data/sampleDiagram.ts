import { Diagram } from "@/types";

export const sampleDiagram: Diagram = {
  body: {
    id: "block1",
    shape: "square",
    angle: 30,
  },
  forces: [
    {
      label: "N",
      name: "normal force",
      unit: "N",
      magnitude: 0,
      angle: 120,
      location: "centroid",
      type: "reaction",
    },
    {
      label: "mg",
      name: "weight",
      unit: "N",
      magnitude: 0,
      angle: 270,
      location: "centroid",
      type: "applied",
    },
    {
      label: "F_f",
      name: "frictional force",
      unit: "N",
      magnitude: 0,
      angle: 30,
      location: "bottom",
      type: "reaction",
    },
  ],
  moments: [],
  axes: {
    rotation: 30,
  },
};
