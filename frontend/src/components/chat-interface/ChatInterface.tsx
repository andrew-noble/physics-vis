import { MessageList } from "./MessageList";
import { InputBox } from "./InputBox";
import { MessageType } from "@/types/tutor/chat";

export interface ChatInterfaceProps {
  messages: MessageType[];
  pending: boolean;
  /**
   * Called when the user submits text.
   * Return an updated messages array (e.g. streamed or full reply) or undefined if you mutate elsewhere.
   */
  toolCalls: string[];
  onSendMessage: (messageText: string) => void;
}

export default function ChatInterface({
  messages,
  pending,
  toolCalls,
  onSendMessage,
}: ChatInterfaceProps) {
  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    onSendMessage(trimmed);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground p-2 border-l border-gray-400">
      <MessageList messages={messages} pending={pending} />
      <div className="flex flex-col gap-2">
        {toolCalls && (
          <div className="flex flex-col gap-2">
            {toolCalls.map((toolCall: any) => (
              <p className="text-sm text-gray-500" key={toolCall.name}>
                Tool called: {toolCall.name}
              </p>
            ))}
          </div>
        )}
        <InputBox disabled={pending} onSubmit={handleSend} />
      </div>
    </div>
  );
}
