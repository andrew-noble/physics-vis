import { MessageList } from "./MessageList";
import { InputBox } from "./InputBox";
import { MessageType } from "@/types/chatUiTypes";

export interface ChatInterfaceProps {
  messages: MessageType[];
  pending: boolean;
  /**
   * Called when the user submits text.
   * Return an updated messages array (e.g. streamed or full reply) or undefined if you mutate elsewhere.
   */
  onSendMessage: (messageText: string) => void;
}

export default function ChatInterface({
  messages,
  pending,
  onSendMessage,
}: ChatInterfaceProps) {
  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    onSendMessage(trimmed);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground p-2 border-l border-gray-400">
      <MessageList messages={messages} />
      <InputBox disabled={pending} onSubmit={handleSend} />
    </div>
  );
}
