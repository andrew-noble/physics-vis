export interface BodyTheme {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  dashPattern?: number[];
}

export interface ArrowTheme {
  // Visual properties
  color: string;
  strokeWidth: number;
  dashPattern?: number[]; // For dashed lines
}

export interface MomentTheme {
  // Visual properties
  color: string;
  strokeWidth: number;
  arcRadius: number;
  dashPattern?: number[];
}

export interface LabelTheme {
  fontSize: number;
  fontFamily: string;
  color: string;
  offset: {
    //uhhh this will need more dynamic than just a basic offset
    x: number;
    y: number;
  };
}

// Root Diagram Theme configuration
export interface DiagramTheme {
  bodyTheme: BodyTheme;
  arrowTheme: ArrowTheme;
  momentTheme: MomentTheme;
  labelTheme: LabelTheme;
  backgroundColor: string;
  gridColor: string;
  // ... other theme properties
}
