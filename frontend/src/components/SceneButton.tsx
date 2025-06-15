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
        className={`w-18 h-18 sm:w-22 sm:h-22 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity ${
          isHighlighted
            ? "border-2 sm:border-3 md:border-4 border-blue-500"
            : ""
        }`}
        style={{ backgroundImage: `url("/${sceneName}.jpg")` }}
        onClick={onClick}
        disabled={disabled}
      />
      {isHighlighted ? (
        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
          ^ Current Scene
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
          {sceneName}
        </p>
      )}
    </div>
  );
};

export default SceneButton;
