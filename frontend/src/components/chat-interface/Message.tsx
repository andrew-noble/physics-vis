import { Role } from "@/types/chatUiTypes";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MessageProps {
  role: Role;
  content: string;
}

// NOTE: this is model-specific, might need to be dynamic to model!
const convertLatexDelimiters = (text: string): string => {
  if (!text) return "";

  // Convert block math delimiters from \[\] to $$ that our parsing libs expect
  let converted = text.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, match) => `$$${match}$$`
  );

  // Convert inline math delimiters (like for $E = mc^2$)
  converted = converted.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, match) => `$${match}$`
  );

  return converted;
};

export function Message({ role, content }: MessageProps) {
  const isUser = role === "user";
  const processedContent = convertLatexDelimiters(content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl prose prose-sm p-3
    ${
      isUser
        ? "bg-blue-600 text-white prose-invert"
        : "bg-gray-200 text-gray-800"
    }
  `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
