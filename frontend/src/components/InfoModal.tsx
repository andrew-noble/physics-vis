import React from "react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              About Physics Visualizer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 text-gray-700">
            <p>
              This is a prototype physics tutor. It uses AI to generate diagrams
              and explain physics concepts.
            </p>

            <p>
              I have been enjoying learning and brushing up on physics concepts
              using LLMs for years now. Physics and many topics are visual
              though, and image generation is slow and non-interactive.{" "}
            </p>

            <p>
              I thought it would be a huge value add if they could make diagrams
              for you, too.
            </p>

            <div>
              <h3 className="font-semibold mb-2">How to use:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Select a scene type using the buttons above</li>
                <li>Ask the AI tutor questions about the physics</li>
                <li>Watch as diagrams are generated to illustrate concepts</li>
                <li>Explore different scenarios and forces</li>
              </ol>
            </div>

            <p className="border-t pt-4">
              Made by Andrew. Let me know if you have ideas/feedback!{" "}
              <a
                href="https://andrewnoble.me"
                className="text-blue-500 hover:text-blue-600"
              >
                Website
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
