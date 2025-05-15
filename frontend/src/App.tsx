import "./index.css";
import DiagramViewer from "./components/DiagramViewer";
import { useState } from "react";

const API_URL = "http://localhost:8080";

export default function App() {
  const [diagramData, setDiagramData] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/fbd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDiagramData(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch circuit:", error);
    }
  };

  return (
    <>
      <div className="circuit-form-container">
        <form onSubmit={handleSubmit} className="circuit-form">
          <div className="form-group">
            <label htmlFor="circuit-prompt">Generate a FBD</label>
            <textarea
              id="circuit-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a FBD"
              rows={3}
              disabled={isLoading}
              className="form-control"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="form-button"
          >
            {isLoading ? <p>Generating...</p> : "Generate Circuit"}
          </button>
        </form>
      </div>
      <DiagramViewer diagramData={diagramData} />
    </>
  );
}
