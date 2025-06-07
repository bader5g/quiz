import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "جاري تحميل السؤال...",
  subMessage = "يرجى الانتظار قليلًا",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-center mb-2">{message}</h2>
      <p className="text-gray-500 text-center">{subMessage}</p>
    </div>
  );
};
