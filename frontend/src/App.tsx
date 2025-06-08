import "./index.css";
import DiagramViewer from "./components/DiagramViewer";
import { useState } from "react";
import { sampleDiagram } from "./data/sampleDiagram";
import ChatInterface from "./components/chat-interface/ChatInterface";
import { MessageType } from "@/types/tutor/chat";
import { defaultMessage } from "./data/defaultMessage";

const API_URL = "http://localhost:8000";

export default function App() {
  const [diagramData, setDiagramData] = useState<any>(sampleDiagram);
  const [messages, setMessages] = useState<MessageType[]>([defaultMessage]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<string>("block");

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

      // create new assistant message id
      const assistantMessageId = crypto.randomUUID();
      // Create the empty message husk
      setMessages((existingMessages) => [
        ...existingMessages,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      // handle ai message shards
      eventSource.addEventListener("ai_message_shard", (event) => {
        const shard = JSON.parse(event.data);
        setPending(false);

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
      // TODO: this will need to change if/when we have tool results that arent diagramData
      eventSource.addEventListener("tool_result", (event) => {
        const result = JSON.parse(event.data);
        setDiagramData(result);
      });

      eventSource.addEventListener("complete", () => {
        eventSource.close();
        setPending(false);
      });

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setPending(false);
      };
    } catch (error) {
      console.error("Failed to send message:", error);
      setPending(false);
      return messages;
    }
  };

  return (
    <div className="fixed inset-0 grid grid-cols-2">
      <div className="flex flex-col justify-center items-center gap-4">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3 text-center">
            Study a different scene
          </h2>
          <div className="flex gap-3">
            <button
              className="w-28 h-28 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundImage: 'url("/block.jpg")' }}
              onClick={() => setCurrentScene("block")}
            />
            <button
              className="w-28 h-28 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundImage: 'url("/car.jpg")' }}
              onClick={() => setCurrentScene("car")}
            />
            <button
              className="w-28 h-28 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundImage: 'url("/ladder.jpg")' }}
              onClick={() => setCurrentScene("ladder")}
            />
            <button
              className="w-28 h-28 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundImage: 'url("/pendulum.jpg")' }}
              onClick={() => setCurrentScene("pendulum")}
            />
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3 text-center">
            Current Scene
          </h2>
          <div
            className="w-32 h-32 bg-cover bg-center rounded-lg"
            style={{ backgroundImage: `url("/${currentScene}.jpg")` }}
          />
        </div>

        <div className="w-[700px] h-[700px]">
          <DiagramViewer diagramData={diagramData} />
        </div>
      </div>
      <div className="overflow-y-auto">
        <ChatInterface
          messages={messages}
          pending={pending}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
