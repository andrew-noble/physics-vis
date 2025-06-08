import { Diagram } from "@/types/diagrams/fbdSchema";

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
      angle: 120,
      location: "centroid",
      type: "reaction",
    },
    {
      label: "mg",
      name: "weight",
      unit: "N",
      angle: 270,
      location: "centroid",
      type: "applied",
    },
    {
      label: "F_f",
      name: "frictional force",
      unit: "N",
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
