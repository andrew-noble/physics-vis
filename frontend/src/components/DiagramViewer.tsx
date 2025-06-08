import { Diagram } from "@/types/diagrams/fbdSchema";
import { useEffect, useRef } from "react";
import { Renderer } from "@/services/renderer";
import { defaultThemeConfig } from "@/services/defaultThemeConfig";
import { DiagramTheme } from "@/types/diagrams/fbdTheme";

interface DiagramViewerProps {
  diagramData?: Diagram;
  themeConfig?: DiagramTheme;
}

export default function DiagramViewer({
  diagramData,
  themeConfig = defaultThemeConfig,
}: DiagramViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  //init effect - instantiate a renderer object
  useEffect(() => {
    const initializeRenderer = () => {
      if (!svgRef.current) return;

      try {
        // Get the actual size from the SVG element
        const { width, height } = svgRef.current.getBoundingClientRect();

        rendererRef.current = new Renderer(
          svgRef.current,
          themeConfig,
          width,
          height
        );

        // Render initial data if available
        if (diagramData && rendererRef.current) {
          rendererRef.current.render(diagramData);
        }
      } catch (error) {
        console.error("Failed to initialize renderer:", error);
      }
    };

    initializeRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current = null;
      }
    };
  }, []);

  //rendering effect - rerender the circuit if the data changes
  useEffect(() => {
    if (diagramData && rendererRef.current) {
      rendererRef.current.render(diagramData);
    }
  }, [diagramData]);

  //I use viewbox to give the svg "padding"
  const viewBox = `-40 -40 680 680`;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
