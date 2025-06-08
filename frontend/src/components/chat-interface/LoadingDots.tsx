import { useEffect, useState } from "react";

export function LoadingDots() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start mb-4">
      <div className="rounded-2xl p-3 max-w-[80%] bg-gray-200 text-gray-800">
        <span>Thinking{dots}</span>
      </div>
    </div>
  );
}
