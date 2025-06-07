import React from "react";
import { Button } from "../ui/button";
import { RefreshCcw, RotateCw } from "lucide-react";

interface TimerPanelProps {
  timeLeft: number;
  timerRunning: boolean;
  maxTime: number;
  onResetTimer: () => void;
  onChangeTeam: () => void;
  isDisabled: boolean;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  timeLeft,
  timerRunning,
  maxTime,
  onResetTimer,
  onChangeTeam,
  isDisabled,
}) => {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative mb-2">
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-3xl font-semibold ${
              timeLeft <= 5 && timerRunning ? "text-red-600 animate-pulse" : ""
            }`}
          >
            {timeLeft}
          </span>
        </div>
        <svg className="transform -rotate-90 w-28 h-28" viewBox="0 0 120 120">
          <circle
            className="text-gray-100"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="60"
            cy="60"
          />
          <circle
            className="text-blue-500"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - timeLeft / maxTime)}`}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="60"
            cy="60"
          />
        </svg>
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={onChangeTeam}
          disabled={isDisabled}
        >
          <RotateCw className="h-4 w-4" />
          <span>تبديل الدور</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={onResetTimer}
        >
          <RefreshCcw className="h-4 w-4" />
          <span>تجديد</span>
        </Button>
      </div>
    </div>
  );
};
