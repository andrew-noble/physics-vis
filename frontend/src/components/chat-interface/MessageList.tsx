import { MessageType } from "@/types/tutor/chat";
import { useEffect, useRef } from "react";
import { Message } from "./Message";
import { LoadingDots } from "./LoadingDots";

/**
 * MessageList – just maps an array -> Message components and auto‑scrolls to bottom.
 */
export function MessageList({
  messages,
  pending,
}: {
  messages: MessageType[];
  pending: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  // scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m) => {
        if (m.role === "assistant" && m.content === "") {
          return null;
        } else {
          return <Message key={m.id} role={m.role} content={m.content} />;
        }
      })}
      {pending && <Message role="assistant" content={<LoadingDots />} />}
      <div ref={endRef} />
    </div>
  );
}
