import React from "react";

interface SceneButtonProps {
  sceneName: string;
  onClick: () => void;
  disabled: boolean;
  isHighlighted: boolean;
}

const SceneButton: React.FC<SceneButtonProps> = ({
  sceneName,
  onClick,
  disabled,
  isHighlighted,
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <button
        className={`w-28 h-28 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity ${
          isHighlighted ? "border-4 border-blue-500" : ""
        }`}
        style={{ backgroundImage: `url("/${sceneName}.jpg")` }}
        onClick={onClick}
        disabled={disabled}
      />
      {isHighlighted ? (
        <p className="text-sm text-gray-500 mt-2">^ Current Scene</p>
      ) : (
        <p className="text-sm text-gray-500 mt-2">{sceneName}</p>
      )}
    </div>
  );
};

export default SceneButton;
