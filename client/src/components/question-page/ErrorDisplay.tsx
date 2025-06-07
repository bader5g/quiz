import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorDisplayProps {
  error: string;
  isNotFound: boolean;
  gameId?: string;
  onBackClick: (isNotFound: boolean) => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  isNotFound,
  gameId,
  onBackClick,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
      <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-center mb-2">حدث خطأ</h2>
      <p className="text-gray-500 text-center">{error}</p>
      <Button
        className="mt-4"
        onClick={() => onBackClick(isNotFound)}
      >
        {isNotFound ? "العودة للرئيسية" : "العودة للعبة"}
      </Button>
    </div>
  );
};
