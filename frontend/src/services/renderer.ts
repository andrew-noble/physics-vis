import * as d3 from "d3";
import { Diagram, Force, Moment, Body } from "@/types/dataTypes";
import { defaultTheme } from "@/types";

export class Renderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private dimensions: { width: number; height: number };
  private padding: { top: number; right: number; bottom: number; left: number };
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  constructor(svgElement: SVGSVGElement) {
    this.svg = d3.select(svgElement);
    this.dimensions = { width: 800, height: 600 };
    this.padding = { top: 40, right: 40, bottom: 40, left: 40 };
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
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

    // Render axes
    this.renderAxes();

    // Create main group
    const mainGroup = this.svg.append("g");

    // Render body
    this.renderBody(mainGroup, diagram.body);

    // // Render forces
    // diagram.forces.forEach((force: Force) =>
    //   this.renderForce(mainGroup, force)
    // );

    // // Render moments
    // diagram.moments.forEach((moment: Moment) =>
    //   this.renderMoment(mainGroup, moment)
    // );
  }

  private renderBody(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    body: Body
  ): void {
    const bodyGroup = group
      .append("g")
      .attr("class", "body")
      .attr("transform", `translate(${this.xScale(0)}, ${this.yScale(0)})`);

    switch (body.shape) {
      case "rectangle":
        const width = this.xScale(1.5) - this.xScale(0); //have to convert to pixels vis scale
        const height = this.yScale(0) - this.yScale(1);
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
        const radius = this.xScale(1) - this.xScale(0);
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
        const side = this.xScale(1) - this.xScale(0);
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
  }

  private renderForce(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    force: Force
  ): void {
    const forceGroup = group.append("g").attr("class", "force");

    // Calculate force position based on location
    const position = this.getForcePosition(force);

    // Create arrow with marker
    forceGroup
      .append("path")
      .attr("d", this.createArrowPath(force, position))
      .attr("fill", "none")
      .attr("stroke", defaultTheme.defaultArrowConfig.color)
      .attr("stroke-width", defaultTheme.defaultArrowConfig.strokeWidth);

    // Add label
    this.addLabel(
      forceGroup,
      force.label,
      position,
      defaultTheme.defaultLabelConfig
    );
  }

  private renderMoment(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    moment: Moment
  ): void {
    const momentGroup = group.append("g").attr("class", "moment");

    // Calculate moment position based on location
    const position = this.getMomentPosition(moment);

    // Create moment arc
    momentGroup
      .append("path")
      .attr("d", this.createMomentPath(moment))
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

  private getForcePosition(force: Force): { x: number; y: number } {
    // Convert force location to coordinates
    switch (force.location) {
      case "top":
        return { x: this.xScale(0), y: this.yScale(2) };
      case "bottom":
        return { x: this.xScale(0), y: this.yScale(-2) };
      case "left":
        return { x: this.xScale(-2), y: this.yScale(0) };
      case "right":
        return { x: this.xScale(2), y: this.yScale(0) };
      case "centroid":
        return { x: this.xScale(0), y: this.yScale(0) };
      default:
        return { x: this.xScale(0), y: this.yScale(0) };
    }
  }

  private getMomentPosition(moment: Moment): { x: number; y: number } {
    // Similar to getForcePosition but for moments
    switch (moment.location) {
      case "top":
        return { x: this.xScale(0), y: this.yScale(2) };
      case "bottom":
        return { x: this.xScale(0), y: this.yScale(-2) };
      case "left":
        return { x: this.xScale(-2), y: this.yScale(0) };
      case "right":
        return { x: this.xScale(2), y: this.yScale(0) };
      case "centroid":
        return { x: this.xScale(0), y: this.yScale(0) };
      default:
        return { x: this.xScale(0), y: this.yScale(0) };
    }
  }

  private createArrowPath(
    force: Force,
    position: { x: number; y: number }
  ): string {
    const length = 50; // Arrow length
    const angle = (force.angle * Math.PI) / 180;

    const endX = position.x + length * Math.cos(angle);
    const endY = position.y + length * Math.sin(angle);

    return `M ${position.x} ${position.y} L ${endX} ${endY}`;
  }

  private createMomentPath(moment: Moment): string {
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
}
