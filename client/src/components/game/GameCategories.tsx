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
  const questionsByCategory = useMemo(() => {
    const result: Record<number, Record<number, GameQuestion[]>> = {};

    categories.forEach((category) => {
      result[category.id] = {};
      [1, 2, 3].forEach((difficultyLevel) => {
        result[category.id][difficultyLevel] = [];
      });
    });

    questions.forEach((question) => {
      if (
        result[question.categoryId] &&
        result[question.categoryId][question.difficulty]
      ) {
        result[question.categoryId][question.difficulty].push(question);
      }
    });

    return result;
  }, [categories, questions]);

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
          className="shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white rounded-xl"
        >
          <CardHeader className="pb-2 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-indigo-100">
            <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-indigo-800">
              <span className="text-2xl">{category.icon}</span>
              <span>{category.name}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4">
            {allQuestionsAnsweredInCategory[category.id] && (
              <Alert className="mb-3 bg-indigo-50 text-indigo-800 border-indigo-200">
                <AlertDescription className="text-center text-sm">
                  تمت الإجابة على جميع أسئلة هذه الفئة
                </AlertDescription>
              </Alert>
            )}

            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}
            >
              {teams.map((_, teamIndex) => (
                <div
                  key={`team-${teamIndex}`}
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
                          key={`empty-${teamIndex}-${difficulty}`}
                          className="w-10 h-10 md:w-12 md:h-12"
                        />
                      );

                    const isCurrentTeam = teamIndex === currentTeamIndex;

                    return (
                      <TooltipProvider key={`q-${teamIndex}-${difficulty}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                question.isAnswered ? "outline" : "default"
                              }
                              className={cn(
                                "w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md flex items-center justify-center relative",
                                question.isAnswered
                                  ? "opacity-50 bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300 border-2 border-gray-400"
                                  : "bg-sky-500 hover:bg-sky-600 text-white",
                                isCurrentTeam && !question.isAnswered
                                  ? "ring-2 ring-yellow-400"
                                  : "",
                              )}
                              disabled={question.isAnswered}
                              aria-disabled={question.isAnswered}
                              onClick={() => {
                                if (!question.isAnswered) {
                                  onSelectQuestion(question.id, difficulty);
                                }
                              }}
                            >
                              <span className="relative">
                                {difficulty}
                                <span className="absolute -top-1 -right-2 text-[8px] font-bold bg-yellow-300 text-black rounded-full w-3 h-3 flex items-center justify-center">
                                  {difficulty}
                                </span>
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {!question.isAnswered ? (
                              <>سؤال {category.name} رقم {difficulty}</>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-600 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                تمت الإجابة على هذا السؤال
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
