import {
  ArrowTheme,
  BodyTheme,
  DiagramTheme,
  LabelTheme,
  MomentTheme,
} from "@/types/diagrams/fbdTheme";

export const defaultBodyConfig: BodyTheme = {
  fillColor: "#ffffff",
  strokeColor: "#e0e0e0",
  strokeWidth: 6,
  dashPattern: undefined,
};

export const defaultArrowConfig: ArrowTheme = {
  color: "#000000", // D3 default blue
  strokeWidth: 4,
  dashPattern: undefined,
};

export const defaultMomentConfig: MomentTheme = {
  color: "#000000", // D3 default green
  strokeWidth: 4,
  arcRadius: 20,
  dashPattern: undefined,
};

export const defaultLabelConfig: LabelTheme = {
  fontSize: 30,
  fontFamily: "Arial, sans-serif",
  color: "#000000",
  offset: { x: 25, y: 25 },
};

export const defaultThemeConfig: DiagramTheme = {
  bodyTheme: defaultBodyConfig,
  arrowTheme: defaultArrowConfig,
  momentTheme: defaultMomentConfig,
  labelTheme: defaultLabelConfig,
  backgroundColor: "#ffffff",
  gridColor: "#e0e0e0",
};
