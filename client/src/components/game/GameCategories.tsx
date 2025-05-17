import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface GameTeam {
  name: string;
  score: number;
  color: string;
}

interface GameCategory {
  id: number;
  name: string;
  icon: string;
}

interface GameQuestion {
  id: number;
  difficulty: 1 | 2 | 3;
  teamIndex: number;
  categoryId: number;
  isAnswered: boolean;
  questionId: number;
}

interface GameCategoriesProps {
  categories: GameCategory[];
  questions: GameQuestion[];
  teams: GameTeam[];
  currentTeamIndex: number;
  onSelectQuestion: (questionId: number, indexInCategory: number) => void;
}

export function GameCategories({
  categories,
  questions,
  teams,
  currentTeamIndex,
  onSelectQuestion,
}: GameCategoriesProps) {
  const allQuestionsAnsweredInCategory = useMemo(() => {
    const result: Record<number, boolean> = {};
    categories.forEach((category) => {
      const categoryQuestions = questions.filter(
        (q) => q.categoryId === category.id,
      );
      result[category.id] =
        categoryQuestions.length > 0 &&
        categoryQuestions.every((q) => q.isAnswered);
    });
    return result;
  }, [categories, questions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => (
        <Card
          key={category.id}
          className="shadow-md bg-white rounded-xl overflow-hidden"
        >
          <CardHeader className="pb-2 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-indigo-100">
            <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-indigo-800">
              <span className="text-2xl">{category.icon}</span>
              <span>{category.name}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4">
            {/* تنبيه حالة الفئة */}
            {allQuestionsAnsweredInCategory[category.id] ? (
              <Alert className="mb-3 bg-indigo-50 text-indigo-800 border-indigo-200">
                <AlertDescription className="text-center text-sm">
                  تمت الإجابة على جميع أسئلة هذه الفئة
                </AlertDescription>
              </Alert>
            ) : null}

            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}
            >
              {teams.map((_, teamIndex) => (
                <div
                  key={teamIndex}
                  className="flex flex-col items-center gap-2"
                >
                  {[1, 2, 3].map((difficulty) => {
                    const question = questions.find(
                      (q) =>
                        q.categoryId === category.id &&
                        q.teamIndex === teamIndex &&
                        q.difficulty === difficulty,
                    );
                    if (!question)
                      return (
                        <div
                          key={difficulty}
                          className="w-10 h-10 md:w-12 md:h-12"
                        />
                      );

                    const isCurrentTeam = teamIndex === currentTeamIndex;

                    return (
                      <TooltipProvider key={question.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              disabled={question.isAnswered}
                              onClick={() =>
                                !question.isAnswered &&
                                onSelectQuestion(question.id, difficulty)
                              }
                              className={cn(
                                "w-10 h-10 md:w-12 md:h-12 rounded-full text-sm font-bold flex items-center justify-center shadow-md transition",
                                question.isAnswered
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                                  : "bg-blue-600 text-white hover:bg-blue-700",
                                isCurrentTeam && !question.isAnswered
                                  ? "ring-2 ring-yellow-400"
                                  : "",
                              )}
                            >
                              {difficulty}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {!question.isAnswered ? (
                              <>
                                سؤال {category.name} رقم {difficulty}
                              </>
                            ) : (
                              <span className="text-red-600 font-medium">
                                تمت الإجابة
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
