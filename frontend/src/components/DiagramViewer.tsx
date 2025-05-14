import { Diagram } from "@/types";
import { useEffect, useRef } from "react";
import { Renderer } from "@/services/renderer";

interface DiagramViewerProps {
  width?: number;
  height?: number;
  diagramData?: Diagram;
}

export default function DiagramViewer({
  width = 800,
  height = 600,
  diagramData,
}: DiagramViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  //init effect - instantiate a renderer object
  useEffect(() => {
    const initializeRenderer = () => {
      if (!svgRef.current) return;

      try {
        rendererRef.current = new Renderer(svgRef.current);

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

  return (
    <div className="circuit-visualization" style={{ width, height }}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      />
    </div>
  );
}
