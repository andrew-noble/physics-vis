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
import InfoModal from "./components/InfoModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [diagramData, setDiagramData] = useState<any>(sampleDiagram);
  const [messages, setMessages] = useState<MessageType[]>([defaultMessage]);
  const [pending, setPending] = useState(false);
  const [diagramPending, setDiagramPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<string>("block");
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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
    <div className="fixed inset-0 flex flex-col">
      {/* Mobile Warning Banner */}
      <div className="md:hidden bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center">
        <p className="text-sm font-medium">
          ⚠️ This app is not ready for mobile, sorry!
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
        <div className="flex flex-col justify-center items-center gap-4 p-4">
          <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold text-center">
              Study a different scene
            </h2>
            <p className="text-sm text-gray-500 mb-5 text-center">
              (Clears chat and diagram)
            </p>
            <div className="flex gap-3 justify-center items-center flex-wrap">
              {sceneList.map((sceneName) => (
                <SceneButton
                  key={sceneName}
                  sceneName={sceneName}
                  onClick={() => handleSceneChange(sceneName)}
                  disabled={currentScene === sceneName}
                  isHighlighted={currentScene === sceneName}
                />
              ))}
            </div>
          </div>

          <div className="w-full max-w-2xl aspect-square">
            {diagramPending ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : (
              <DiagramViewer diagramData={diagramData} />
            )}
          </div>
          {error && <p className="text-red-500">Uh oh: {error}</p>}
          {/* Info button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors flex items-center justify-center"
            title="About this app"
          >
            i
          </button>
        </div>
        <div className="overflow-y-auto border-t border-gray-400">
          <ChatInterface
            messages={messages}
            pending={pending}
            toolCalls={toolCalls}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}
