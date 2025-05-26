import { Role } from "@/types/chatUiTypes";

interface MessageProps {
  role: Role;
  content: string;
}

export function Message({ role, content }: MessageProps) {
  const isUser = role === "user";
  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} p-2`}
    >
      <div
        className={`max-w-prose whitespace-pre-wrap break-words rounded-2xl p-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
