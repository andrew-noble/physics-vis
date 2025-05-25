import { MessageType } from "@/types/chatUiTypes";
import { useEffect, useRef } from "react";
import { Message } from "./Message";

/**
 * MessageList – just maps an array -> Message components and auto‑scrolls to bottom.
 */
export function MessageList({ messages }: { messages: MessageType[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  // scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m) => (
        <Message key={m.id} role={m.role} content={m.content} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
