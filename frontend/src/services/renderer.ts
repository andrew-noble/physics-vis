import * as d3 from "d3";
import { Diagram, Force, Moment, Body, BodyShape } from "@/types/dataTypes";
import { defaultTheme } from "@/types";

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
  private padding: { top: number; right: number; bottom: number; left: number };
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private unitLength: number;
  private origin: { x: number; y: number };

  constructor(svgElement: SVGSVGElement) {
    this.svg = d3.select(svgElement);
    this.dimensions = { width: 800, height: 600 };
    this.padding = { top: 40, right: 40, bottom: 40, left: 40 };
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.unitLength = 1;
    this.origin = { x: 0, y: 0 };
    this.initializeScales();
  }

  private initializeScales(): void {
    const domain = [-3, 3];
    const right = this.dimensions.width - this.padding.right;
    const bottom = this.dimensions.height - this.padding.bottom;

    this.xScale = d3
      .scaleLinear()
      .domain(domain)
      .range([this.padding.left, right]);
    this.yScale = d3
      .scaleLinear()
      .domain(domain)
      .range([bottom, this.padding.top]); //inverted bc y+ is down

    this.unitLength = this.xScale(1) - this.xScale(0);
    this.origin = { x: this.xScale(0), y: this.yScale(0) };
  }

  public updateDimensions(width: number, height: number): void {
    this.dimensions = { width, height };
    this.initializeScales();
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

  public render(diagram: Diagram): void {
    // Clear previous render
    this.svg.selectAll("*").remove();

    // // Render axes
    // this.renderAxes();

    // Create main group
    const mainGroup = this.svg.append("g");

    // Render body and get reference to bodyGroup
    const bodyGroup = this.renderBody(mainGroup, diagram.body);

    // Render forces as children of bodyGroup
    diagram.forces.forEach((force: Force) =>
      this.renderForce(bodyGroup, force, diagram.body)
    );

    // Render moments as children of bodyGroup
    diagram.moments.forEach((moment: Moment) =>
      this.renderMoment(bodyGroup, moment, diagram.body)
    );
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
          .attr("fill", defaultTheme.backgroundColor)
          .attr("stroke", defaultTheme.gridColor)
          .attr("stroke-width", 2);
        break;
      case "circle":
        const radius = this.unitLength;
        bodyGroup
          .append("circle")
          .attr("r", radius)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", defaultTheme.backgroundColor)
          .attr("stroke", defaultTheme.gridColor)
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
          .attr("fill", defaultTheme.backgroundColor)
          .attr("stroke", defaultTheme.gridColor)
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
      ) // Move to tail and rotate with body
      .attr("fill", "none")
      .attr("stroke", defaultTheme.defaultArrowConfig.color)
      .attr("stroke-width", defaultTheme.defaultArrowConfig.strokeWidth);

    // // Add label
    // this.addLabel(
    //   forceGroup,
    //   force.label,
    //   tailPosition,
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
      .attr("stroke", defaultTheme.defaultMomentConfig.color)
      .attr("stroke-width", defaultTheme.defaultMomentConfig.strokeWidth);

    // Add label
    this.addLabel(
      momentGroup,
      moment.label,
      position,
      defaultTheme.defaultLabelConfig
    );
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

  // this creates an arrow pointing in the right direction, located at the origin
  // just creates the path, doesn't place it
  private createArrowPath(force: Force, body: Body): string {
    const length = this.unitLength; // Arrow length
    // Use force.angle relative to the body (local coordinates)
    const localAngle = force.angle - body.angle;
    const angle = (-localAngle * Math.PI) / 180; // Negate angle for SVG y-axis

    const endX = length * Math.cos(angle);
    const endY = length * Math.sin(angle);

    return `M 0 0 L ${endX} ${endY}`;
  }

  private createMomentPath(
    moment: Moment,
    position: { x: number; y: number }
  ): string {
    const radius = defaultTheme.defaultMomentConfig.arcRadius;
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
    position: { x: number; y: number },
    config: typeof defaultTheme.defaultLabelConfig
  ): void {
    group
      .append("text")
      .attr("x", position.x + config.offset.x)
      .attr("y", position.y + config.offset.y)
      .attr("font-family", config.fontFamily)
      .attr("font-size", config.fontSize)
      .attr("fill", config.color)
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
