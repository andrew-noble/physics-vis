import { ChangeEvent, FormEvent, useState } from "react";

interface InputBoxProps {
  onSubmit?: (text: string) => void;
  disabled?: boolean;
}

export function InputBox({ onSubmit, disabled = false }: InputBoxProps) {
  const [text, setText] = useState("");

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setText(e.target.value);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit?.(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background p-4">
      <textarea
        className="w-full resize-none rounded-xl border p-3 focus:outline-none focus:ring disabled:opacity-50"
        rows={1}
        placeholder="Type your message…"
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit(e)} //submit on enter, not shift enter
        disabled={disabled}
      />
    </form>
  );
}
