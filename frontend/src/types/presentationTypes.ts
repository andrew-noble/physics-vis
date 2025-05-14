export interface ArrowConfig {
  // Visual properties
  color: string;
  strokeWidth: number;
  dashPattern?: number[]; // For dashed lines
}

export interface MomentConfig {
  // Visual properties
  color: string;
  strokeWidth: number;
  arcRadius: number;
  dashPattern?: number[];
}

export interface LabelConfig {
  fontSize: number;
  fontFamily: string;
  color: string;
  offset: {
    //uhhh this will need more thought than just a basic offset
    x: number;
    y: number;
  };
}

// Theme configuration
export interface DiagramTheme {
  defaultArrowConfig: ArrowConfig;
  defaultMomentConfig: MomentConfig;
  defaultLabelConfig: LabelConfig;
  backgroundColor: string;
  gridColor: string;
  // ... other theme properties
}

export const defaultArrowConfig: ArrowConfig = {
  color: "#1f77b4", // D3 default blue
  strokeWidth: 2,
  dashPattern: undefined,
};

export const defaultMomentConfig: MomentConfig = {
  color: "#2ca02c", // D3 default green
  strokeWidth: 2,
  arcRadius: 20,
  dashPattern: undefined,
};

export const defaultLabelConfig: LabelConfig = {
  fontSize: 14,
  fontFamily: "Arial, sans-serif",
  color: "#000000",
  offset: { x: 10, y: 10 },
};

export const defaultTheme: DiagramTheme = {
  defaultArrowConfig,
  defaultMomentConfig,
  defaultLabelConfig,
  backgroundColor: "#ffffff",
  gridColor: "#e0e0e0",
};
