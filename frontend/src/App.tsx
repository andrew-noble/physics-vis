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

  const handleSendMessage = async (newMessageText: string) => {
    // store user's message
    setMessages((existingMessages) => [
      ...existingMessages,
      { id: crypto.randomUUID(), role: "user", content: newMessageText },
    ]);
    setPending(true);

    try {
      const payload = {
        messages: [
          ...messages,
          { id: crypto.randomUUID(), role: "user", content: newMessageText },
        ],
        diagramData: diagramData,
      };

      // prepare new assistant message husk
      const assistantMessageId = crypto.randomUUID();
      setMessages((existingMessages) => [
        ...existingMessages,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      // request event streaming session
      const response = await fetch(`${API_URL}/stream-sessions`, {
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

      const sessionId = (await response.json()).sessionId;

      // streaming response
      const eventSource = new EventSource(
        `${API_URL}/stream-sessions/${sessionId}/events`,
        {
          withCredentials: true,
        }
      );

      // handle ai message shards
      eventSource.addEventListener("ai_message_shard", (event) => {
        const shard = JSON.parse(event.data);

        setMessages((existingMessages) => {
          const content = existingMessages.find(
            (message) => message.id === assistantMessageId
          )?.content;

          const newContent = content + shard;

          return existingMessages.map((m) => {
            if (m.id === assistantMessageId) {
              return {
                ...m,
                content: newContent,
              };
            } else {
              return m;
            }
          });
        });
      });

      // handle tool calls
      eventSource.addEventListener("tool_call", (event) => {
        console.log("tool call", event.data);
      });

      // handle tool results
      // TODO: this will likely need to change if/when we have tool results that arent diagramData
      eventSource.addEventListener("tool_result", (event) => {
        const result = JSON.parse(event.data);
        setDiagramData(result);
      });

      eventSource.addEventListener("complete", () => {
        eventSource.close();
      });

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
      };

      // return smth?? Naw i don't think so?
    } catch (error) {
      console.error("Failed to send message:", error);
      return messages;
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
