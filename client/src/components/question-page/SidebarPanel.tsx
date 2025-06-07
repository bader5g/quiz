import React from "react";
import { Card, CardContent } from "../ui/card";
import { TimerPanel } from "./TimerPanel";
import { AnswerPanel } from "./AnswerPanel";

interface SidebarPanelProps {
  timeLeft: number;
  timerRunning: boolean;
  maxTime: number;
  onResetTimer: () => void;
  onChangeTeam: () => void;
  isDisabled: boolean;
  showAnswer: boolean;
  onShowAnswer: () => void;
  teams: {
    id: number;
    name: string;
    color: string;
  }[];
  onSubmitAnswer: (isCorrect: boolean, teamIndex?: number) => void;
  isSubmitting: boolean;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  timeLeft,
  timerRunning,
  maxTime,
  onResetTimer,
  onChangeTeam,
  isDisabled,
  showAnswer,
  onShowAnswer,
  teams,
  onSubmitAnswer,
  isSubmitting,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <TimerPanel
          timeLeft={timeLeft}
          timerRunning={timerRunning}
          maxTime={maxTime}
          onResetTimer={onResetTimer}
          onChangeTeam={onChangeTeam}
          isDisabled={isDisabled}
        />
        <AnswerPanel
          showAnswer={showAnswer}
          onShowAnswer={onShowAnswer}
          teams={teams}
          onSubmitAnswer={onSubmitAnswer}
          isSubmitting={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
