import "./index.css";
import DiagramViewer from "./components/DiagramViewer";
import { useState } from "react";
import { sampleDiagram } from "./data/sampleDiagram";
import ChatInterface from "./components/chat-interface/ChatInterface";
import { MessageType } from "@/types/tutor/chat";
import { defaultMessage } from "./data/defaultMessage";
import SceneButton from "./components/SceneButton";
import { sceneDescriptions } from "./data/sceneDescriptions";
import Spinner from "./components/Spinner";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [diagramData, setDiagramData] = useState<any>(sampleDiagram);
  const [messages, setMessages] = useState<MessageType[]>([defaultMessage]);
  const [pending, setPending] = useState(false);
  const [diagramPending, setDiagramPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<string>("block");
  const [toolCalls, setToolCalls] = useState<string[]>([]);

  const handleSendMessage = async (
    newMessageText: string,
    currentMessages: MessageType[] = messages,
    currentDiagramData: any = diagramData,
    currentSceneName: string = currentScene
  ) => {
    // store user's message
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
        diagramData: currentDiagramData,
        sceneDescription:
          sceneDescriptions[currentSceneName as keyof typeof sceneDescriptions],
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
        console.error("HTTP error!", response);
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
        console.log("shard", shard);

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
        setToolCalls((existingToolCalls) => [
          ...existingToolCalls,
          JSON.parse(event.data),
        ]);
        setDiagramPending(true);
      });

      // handle tool results
      // TODO: this will need to change if/when we have tool results that arent diagramData
      eventSource.addEventListener("tool_result", (event) => {
        const result = JSON.parse(event.data);
        setDiagramData(result);
        setDiagramPending(false);
      });

      eventSource.addEventListener("complete", () => {
        eventSource.close();
        setPending(false);
        setToolCalls([]);
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

  const handleSceneChange = async (sceneName: string) => {
    setCurrentScene(sceneName as "block" | "car" | "ladder" | "pendulum");
    setDiagramData(null);
    setMessages([defaultMessage]);

    handleSendMessage(
      `Let's look at a different scene. Clear the current diagram and make a new one for the ${sceneName}.`,
      [defaultMessage],
      null,
      sceneName
    );
  };

  const sceneList = ["block", "car", "pendulum"];

  return (
    <div className="fixed inset-0 grid grid-cols-2">
      <div className="flex flex-col justify-center items-center gap-4">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-center">
            Study a different scene
          </h2>
          <p className="text-sm text-gray-500 mb-5 text-center">
            (Clears chat and diagram)
          </p>
          <div className="flex gap-3 justify-center items-center">
            {sceneList.map((sceneName) => (
              <SceneButton
                sceneName={sceneName}
                onClick={() => handleSceneChange(sceneName)}
                disabled={currentScene === sceneName}
                isHighlighted={currentScene === sceneName}
              />
            ))}
          </div>
        </div>

        <div className="w-[700px] h-[700px]">
          {diagramPending ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            <DiagramViewer diagramData={diagramData} />
          )}
        </div>
        {error && <p className="text-red-500">Uh oh: {error}</p>}
      </div>
      <div className="overflow-y-auto">
        <ChatInterface
          messages={messages}
          pending={pending}
          toolCalls={toolCalls}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
