import { Role } from "@/types/chatUiTypes";

interface MessageProps {
  role: Role;
  content: string;
}

export function Message({ role, content }: MessageProps) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-prose whitespace-pre-wrap break-words rounded-2xl px-4 py-2 shadow-sm ${
          isUser ? "bg-blue-600 text-white" : "bg-muted"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
