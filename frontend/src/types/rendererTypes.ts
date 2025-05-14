import * as d3 from "d3";

export type D3Selection<T extends d3.BaseType, U = unknown> = d3.Selection<
  T,
  U,
  null,
  undefined
>;
export type D3GSelection = D3Selection<SVGGElement>;
export type D3PathSelection = D3Selection<SVGPathElement>;
