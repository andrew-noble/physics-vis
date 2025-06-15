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
        className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-cover bg-center rounded-lg hover:opacity-90 transition-opacity ${
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
