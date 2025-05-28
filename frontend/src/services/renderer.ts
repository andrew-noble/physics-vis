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
    const rootGroup = this.svg.append("g");

    // Render body and get reference to bodyGroup
    const bodyGroup = this.renderBody(rootGroup, diagram.body);

    // Render forces as children of bodyGroup
    diagram.forces.forEach((force: Force) =>
      this.renderForce(bodyGroup, force, diagram.body)
    );

    // Render moments as children of bodyGroup
    diagram.moments.forEach((moment: Moment) =>
      this.renderMoment(bodyGroup, moment, diagram.body)
    );
  }

  private setupSvg(): void {
    //container for reusable definitions
    const defs = this.svg.append("defs");

    //put in an arrowhead marker
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
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
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    body: Body
  ): d3.Selection<SVGGElement, unknown, null, undefined> {
    const bodyGroup = group
      .append("g")
      .attr("class", "body")
      .attr(
        "transform",
        `translate(${this.xScale(0)}, ${this.yScale(0)}) rotate(${-body.angle})`
      );

    switch (body.shape) {
      case "rectangle":
        // * 2 so that the edge of the square is unit length from centroid

        const width = this.unitLength * 2 * 1.5; //have to convert to pixels vis scale
        const height = this.unitLength * 2;
        bodyGroup
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
        bodyGroup
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
        bodyGroup
          .append("rect")
          .attr("width", side)
          .attr("height", side)
          .attr("x", -side / 2)
          .attr("y", -side / 2)
          .attr("fill", this.theme.bodyTheme.fillColor)
          .attr("stroke", this.theme.bodyTheme.strokeColor)
          .attr("stroke-width", 2);
    }
    return bodyGroup;
  }

  private renderForce(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    force: Force,
    body: Body
  ): void {
    const forceGroup = group.append("g").attr("class", "force");

    // Calculate force position based on location
    const tailPosition = this.getForceTailPosition(force, body);

    // Create arrow with marker
    forceGroup
      .append("path")
      .attr("d", this.createArrowPath(force, body)) // Draw the path
      .attr(
        //place the path
        "transform",
        `translate(${tailPosition.x}, ${tailPosition.y})`
      )
      .attr("fill", "none")
      .attr("stroke", this.theme.arrowTheme.color)
      .attr("stroke-width", this.theme.arrowTheme.strokeWidth)
      .attr("marker-end", "url(#arrow)");

    // // Add label
    // this.addLabel(
    //   forceGroup,
    //   force.label,
    //   {
    //     x: tailPosition.x + 40 * Math.cos(force.angle),
    //     y: tailPosition.y + 40 * Math.sin(force.angle),
    //   },
    //   defaultTheme.defaultLabelConfig
    // );
  }

  private renderMoment(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    moment: Moment,
    body: Body
  ): void {
    const momentGroup = group.append("g").attr("class", "moment");

    // Calculate moment position based on location
    const position = this.getMomentPosition(moment, body);

    // Create moment arc
    momentGroup
      .append("path")
      .attr("d", this.createMomentPath(moment, position))
      .attr("fill", "none")
      .attr("stroke", this.theme.momentTheme.color)
      .attr("stroke-width", this.theme.momentTheme.strokeWidth);

    // Add label
    this.addLabel(momentGroup, moment.label, position);
  }

  private getShapePositions(shape: BodyShape): ShapePositions {
    // All positions are now local to the body (centered at 0,0)
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

  private getForceTailPosition(
    force: Force,
    body: Body
  ): { x: number; y: number } {
    // No need to rotate or translate, as all positions are now local to the body
    const positions = this.getShapePositions(body.shape);
    return positions[force.location];
  }

  private getMomentPosition(
    moment: Moment,
    body: Body
  ): { x: number; y: number } {
    // No need to rotate or translate, as all positions are now local to the body
    const positions = this.getShapePositions(body.shape);
    return positions[moment.location];
  }

  //SOMETHING IS FUCKED HERE
  // I don't like this approach. We already have global force angles
  // why is body even involved here?
  private createArrowPath(force: Force, body: Body): string {
    const length = this.unitLength + 50; // Arrow length
    // Use force.angle relative to the body (local coordinates)
    const localAngle = force.angle - body.angle; //WTF???
    const angle = (-localAngle * Math.PI) / 180; // Negate angle for SVG y-axis

    const endX = length * Math.cos(angle);
    const endY = length * Math.sin(angle);

    return `M 0 0 L ${endX} ${endY} M ${endX} ${endY}`;
  }

  private createMomentPath(
    moment: Moment,
    position: { x: number; y: number }
  ): string {
    const radius = this.theme.momentTheme.arcRadius;
    const startAngle = 0;
    const endAngle = moment.direction === "cw" ? -Math.PI : Math.PI;

    const arc = d3
      .arc()
      .innerRadius(radius)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    return (
      arc({
        innerRadius: radius,
        outerRadius: radius,
        startAngle,
        endAngle,
        padAngle: 0,
      }) || ""
    );
  }

  private addLabel(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    text: string,
    position: { x: number; y: number }
  ): void {
    group
      .append("text")
      .attr("x", position.x + this.theme.labelTheme.offset.x)
      .attr("y", position.y + this.theme.labelTheme.offset.y)
      .attr("text-anchor", "middle")
      .attr("font-family", this.theme.labelTheme.fontFamily)
      .text(text);
  }

  // Helper to rotate a point around a center by angleDeg degrees
  private rotatePoint(
    point: { x: number; y: number },
    center: { x: number; y: number },
    angleDeg: number
  ): { x: number; y: number } {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }
}
