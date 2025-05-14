import "./index.css";
import DiagramViewer from "./components/DiagramViewer";
import { sampleDiagram } from "./data/sampleDiagram";

export default function App() {
  return <DiagramViewer diagramData={sampleDiagram} />;
}
