import React from "react";
import { Button } from "../ui/button";
import { HelpCircle, CheckCircle, UserX } from "lucide-react";

interface Team {
  id: number;
  name: string;
  color: string;
}

interface AnswerPanelProps {
  showAnswer: boolean;
  onShowAnswer: () => void;
  teams: Team[];
  onSubmitAnswer: (isCorrect: boolean, teamIndex?: number) => void;
  isSubmitting: boolean;
}

export const AnswerPanel: React.FC<AnswerPanelProps> = ({
  showAnswer,
  onShowAnswer,
  teams,
  onSubmitAnswer,
  isSubmitting,
}) => {
  return (
    <div className="space-y-2">
      <Button
        onClick={onShowAnswer}
        className="w-full h-12 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
        disabled={showAnswer}
      >
        <HelpCircle className="h-5 w-5" />
        <span>عرض الإجابة</span>
      </Button>
      {showAnswer && (
        <div className="mt-4 space-y-2">
          {teams.map((team, idx) => (
            <Button
              key={team.id}
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-2 border-2"
              style={{
                borderColor: team.color,
                backgroundColor: `${team.color}11`,
              }}
              onClick={() => onSubmitAnswer(true, idx)}
              disabled={isSubmitting}
            >
              <CheckCircle
                className="h-5 w-5"
                style={{ color: team.color }}
              />
              <span style={{ color: team.color }}>
                الفريق: {team.name}
              </span>
            </Button>
          ))}
          <Button
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-2 border-2 border-gray-300 mt-3"
            onClick={() => onSubmitAnswer(false)}
            disabled={isSubmitting}
          >
            <UserX className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600 font-medium">
              لا أحد أجاب
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
