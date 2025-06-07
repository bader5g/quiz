import React from "react";
import { Card, CardContent } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { CheckCircle } from "lucide-react";

interface QuestionCardProps {
  question: {
    text: string;
    answer: string;
    categoryName: string;
    categoryIcon: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  showAnswer: boolean;
  difficulty: number;
  teamColor?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  showAnswer,
  difficulty,
  teamColor = "#ddd",
}) => {
  return (
    <Card className="overflow-hidden">
      <div
        className="h-12 flex items-center justify-between px-4"
        style={{ backgroundColor: `${teamColor}22` }}
      >
        <Badge variant="outline" className="gap-1">
          <span className={question.categoryIcon}></span>
          <span>{question.categoryName}</span>
        </Badge>
        <Badge
          variant="outline"
          className="px-3 py-1"
          style={{
            backgroundColor:
              difficulty === 1
                ? "#4caf5022"
                : difficulty === 2
                  ? "#ff980022"
                  : "#f4433622",
          }}
        >
          {difficulty} نقاط
        </Badge>
      </div>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-center mb-4">
          {question.text}
        </h2>
        {question.imageUrl && (
          <div className="my-4 flex justify-center">
            <img
              src={question.imageUrl}
              alt="صورة السؤال"
              className="max-w-full max-h-96 rounded-lg shadow-md"
            />
          </div>
        )}
        {question.videoUrl && (
          <div className="my-4 flex justify-center">
            <video
              src={question.videoUrl}
              controls
              className="max-w-full max-h-96 rounded-lg shadow-md"
            />
          </div>
        )}
        {showAnswer && (
          <Alert className="mt-6 bg-green-50 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="font-bold text-green-600">
              الإجابة الصحيحة: {question.answer}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
