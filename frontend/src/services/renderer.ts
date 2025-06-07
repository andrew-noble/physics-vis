import * as d3 from "d3";
import {
  Diagram,
  Force,
  Moment,
  Body,
  BodyShape,
} from "@/types/diagrams/fbdSchema";
import { DiagramTheme } from "@/types/diagrams/fbdTheme";

interface ShapePositions {
  top: { x: number; y: number };
  bottom: { x: number; y: number };
  left: { x: number; y: number };
  right: { x: number; y: number };
  centroid: { x: number; y: number };
}

export class Renderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private dimensions: { width: number; height: number };
  private unitLength: number;
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private origin: { x: number; y: number };
  private theme: DiagramTheme;

  constructor(
    svgElement: SVGSVGElement,
    theme: DiagramTheme,
    width: number,
    height: number
  ) {
    this.svg = d3.select(svgElement);
    this.dimensions = { width, height };
    this.unitLength = 1;
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.origin = { x: 0, y: 0 };
    this.initializeScales();
    this.theme = theme;
  }

  private initializeScales(): void {
    const domain = [-3, 3]; //domain of diagram, 6 units wide

    // this creates renderer-owned d3 scaleLinear objects used to place shit
    this.xScale = d3
      .scaleLinear()
      .domain(domain)
      .range([0, this.dimensions.width]);
    this.yScale = d3
      .scaleLinear()
      .domain(domain)
      .range([this.dimensions.height, 0]); //inverted bc y+ is down in web

    this.unitLength = this.xScale(1) - this.xScale(0);
    this.origin = { x: this.xScale(0), y: this.yScale(0) };
  }

  public updateDimensions(width: number, height: number): void {
    this.dimensions = { width, height };
    this.initializeScales();
  }

  public render(diagram: Diagram): void {
    // Clear previous render
    this.svg.selectAll("*").remove();

    // Setup SVG definitions/reusables (including markers)
    this.setupSvg();

    // Create root group
    const rootGroup = this.svg
      .append("g")
      .attr("class", "svg-root-group")
      .attr("transform", `translate(${this.origin.x}, ${this.origin.y})`);

    // render axes
    // rootGroup
    //   .append("g")
    //   .attr("class", "axes-group")
    //   .call(() => this.renderAxes());

    // render body
    const bodyGroup = rootGroup
      .append("g")
      .attr("class", "body-group")
      .call((selection) => this.renderBody(selection, diagram.body));

    // render forces
    rootGroup
      .append("g")
      .attr("class", "force-group")
      .selectAll("path.force")
      .data(diagram.forces)
      .join("path")
      .attr("class", "force")
      // draw the arrow path at its local angle
      .attr("marker-end", "url(#arrow)")
      .attr("d", (d) => this.createForcePath(d))
      // place the arrow at the tail position (which depends on body)
      .attr(
        "transform",
        (d) =>
          `translate(${this.getPositionOnBody(d, diagram.body)}) ` +
          `rotate(${d.referenceFrame === "body" ? diagram.body.angle : 0})`
      )
      .attr("stroke", this.theme.arrowTheme.color)
      .attr("stroke-width", this.theme.arrowTheme.strokeWidth)
      .call((selection) => this.addLabel(selection, (d: Force) => d.label));

    // render moments
    rootGroup
      .append("g")
      .attr("class", "moment-group")
      .selectAll("path.moment")
      .data(diagram.moments)
      .join("path")
      .attr("class", "moment")
      .attr("d", this.createMomentPath)
      .attr(
        "transform",
        (d) =>
          `translate(${this.getPositionOnBody(d, diagram.body)}) rotate(${
            diagram.body.angle
          }, ${this.origin.x}, ${this.origin.y})`
      )
      .attr("fill", "none")
      .attr("stroke", this.theme.momentTheme.color)
      .attr("stroke-width", this.theme.momentTheme.strokeWidth);
  }

  private setupSvg(): void {
    this.svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto") //makes it so both ends point out
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z");
  }

  private renderAxes(): void {
    // Add X axis
    this.svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.yScale(0)})`)
      .call(d3.axisBottom(this.xScale));

    // Add Y axis
    this.svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${this.xScale(0)},0)`)
      .call(d3.axisLeft(this.yScale));
  }

  private renderBody(
    parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    bodyData: Body
  ): d3.Selection<SVGGElement, unknown, null, undefined> {
    const group = parentGroup
      .append("g")
      .attr("class", "body")
      .attr("transform", `rotate(${-bodyData.angle})`);

    switch (bodyData.shape) {
      case "rectangle":
        // * 2 so that the edge of the square is unit length from centroid

        const width = this.unitLength * 2 * 1.5; //have to convert to pixels vis scale
        const height = this.unitLength * 2;
        group
          .append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("x", -width / 2)
          .attr("y", -height / 2)
          .attr("fill", this.theme.bodyTheme.fillColor)
          .attr("stroke", this.theme.bodyTheme.strokeColor)
          .attr("stroke-width", 2);
        break;
      case "circle":
        const radius = this.unitLength;
        group
          .append("circle")
          .attr("r", radius)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", this.theme.bodyTheme.fillColor)
          .attr("stroke", this.theme.bodyTheme.strokeColor)
          .attr("stroke-width", 2);
        break;
      case "square":
        // * 2 so that the edge of the square is unit length from centroid
        const side = this.unitLength * 2;
        group
          .append("rect")
          .attr("width", side)
          .attr("height", side)
          .attr("x", -side / 2)
          .attr("y", -side / 2)
          .attr("fill", this.theme.bodyTheme.fillColor)
          .attr("stroke", this.theme.bodyTheme.strokeColor)
          .attr("stroke-width", 2);
    }
    return group;
  }

  private getShapePositions(shape: BodyShape): ShapePositions {
    const basePositions: ShapePositions = {
      top: { x: 0, y: -this.unitLength },
      bottom: { x: 0, y: this.unitLength },
      left: { x: -this.unitLength, y: 0 },
      right: { x: this.unitLength, y: 0 },
      centroid: { x: 0, y: 0 },
    };

    switch (shape) {
      case "rectangle":
        return {
          ...basePositions,
          left: {
            x: (-this.unitLength * 1.5) / 2,
            y: 0,
          },
          right: {
            x: (this.unitLength * 1.5) / 2,
            y: 0,
          },
        };
      case "circle":
      case "square":
        return basePositions;
    }
  }

  // this gets a force's proper tail position per body rotation
  private getPositionOnBody(target: Force | Moment, body: Body): string {
    const positions = this.getShapePositions(body.shape);
    const pos = positions[target.location];

    // Convert body angle to radians and negate it for correct rotation direction
    const angleRad = (-body.angle * Math.PI) / 180;

    // Rotate the position around the origin
    const rotatedX = pos.x * Math.cos(angleRad) - pos.y * Math.sin(angleRad);
    const rotatedY = pos.x * Math.sin(angleRad) + pos.y * Math.cos(angleRad);

    return `${rotatedX},${rotatedY}`;
  }

  private createForcePath(force: Force): string {
    const length = this.unitLength + 50; // Arrow length
    const angle = (-force.angle * Math.PI) / 180; // Negate angle for SVG y-axis

    const endX = length * Math.cos(angle);
    const endY = length * Math.sin(angle);

    return `M 0 0 L ${endX} ${endY}`;
  }

  private createMomentPath(moment: Moment): string {
    const r = this.theme.momentTheme.arcRadius; // radius of the curve
    const sweep = moment.direction === "cw" ? 1 : 0; // 1 = CW, 0 = CCW

    // Half-circle from (0, -r) to (0, r)
    // large-arc-flag = 0  (exactly 180°)
    // sweep-flag       = sweep (CW vs CCW)
    return `M 0 ${-r} A ${r} ${r} 0 0 ${sweep} 0 ${r}`;
  }

  private addLabel(
    selection: d3.Selection<
      d3.BaseType | SVGPathElement,
      Force,
      SVGGElement,
      unknown
    >,
    textFn: (d: Force) => string
  ): void {
    selection
      .append("text")
      .attr("x", this.theme.labelTheme.offset.x)
      .attr("y", this.theme.labelTheme.offset.y)
      .attr("text-anchor", "middle")
      .attr("font-family", this.theme.labelTheme.fontFamily)
      .text(textFn);
  }
}
