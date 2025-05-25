import "./index.css";
import DiagramViewer from "./components/DiagramViewer";
import { useState } from "react";
import { sampleDiagram } from "./data/sampleDiagram";
import ChatInterface from "./components/chat-interface/ChatInterface";
import { MessageType } from "./types/chatUiTypes";

const API_URL = "http://localhost:8000";

export default function App() {
  const [diagramData, setDiagramData] = useState<any>(sampleDiagram);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (
    newMessageText: string,
    currentMessages: MessageType[]
  ) => {
    setMessages((existingMessages) => [
      ...existingMessages,
      { id: crypto.randomUUID(), role: "user", content: newMessageText },
    ]);
    setPending(true);

    try {
      const payload = {
        messages: [
          ...currentMessages,
          { id: crypto.randomUUID(), role: "user", content: newMessageText },
        ],
        diagramData: diagramData,
      };

      // (eventually) preflight post (do streaming)
      const response = await fetch(`${API_URL}/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(`HTTP error! status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const res = await response.json();

      setMessages((existingMessages) => [
        ...existingMessages,
        { id: crypto.randomUUID(), role: "assistant", content: res.message },
      ]);

      console.log(res.diagramData);

      setDiagramData(res.diagramData);

      // return?? Naw i don't think so?
    } catch (error) {
      console.error("Failed to send message:", error);
      return currentMessages;
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <ChatInterface
        messages={messages}
        pending={pending}
        onSendMessage={handleSendMessage}
      />
      <DiagramViewer diagramData={diagramData} />
      <p>{error}</p>
    </>
  );
}
