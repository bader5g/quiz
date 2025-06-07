import React, { useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Alert, AlertDescription } from "../ui/alert";
import { cn } from "../../lib/utils";

interface GameTeam {
  name: string;
  score: number;
  color: string;
}

interface GameCategory {
  id: number;
  name: string;
  icon: string;
  imageUrl?: string;
  isActive?: boolean;
  availableQuestions?: number;
}

interface GameQuestion {
  id: number;
  difficulty: 1 | 2 | 3;
  teamIndex: number;
  categoryId: number;
  isAnswered: boolean;
  questionId: number;
  realQuestion?: {
    id: number;
    text: string;
    answer: string;
    imageUrl?: string;
    videoUrl?: string;
    tags?: string;
  } | null;
}

interface GameCategoriesProps {
  categories: GameCategory[];
  questions: GameQuestion[];
  teams: GameTeam[];
  currentTeamIndex: number;
  onSelectQuestion: (questionId: number, indexInCategory: number) => void;
  viewedQuestionIds?: number[]; // معرفات الأسئلة التي تم عرضها
}

export function GameCategories({
  categories,
  questions,
  teams,
  currentTeamIndex,
  onSelectQuestion,
  viewedQuestionIds = [],
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
      {categories.map((category) => {
        const isInactive = category.isActive === false;
        const isEmpty =
          !category.availableQuestions || category.availableQuestions === 0;
        const grayCard = isInactive || isEmpty;
        return (
          <Card
            key={category.id}
            className={cn(
              "shadow-md rounded-xl overflow-hidden transition-all",
              grayCard
                ? "bg-gray-200 text-gray-400 opacity-70 cursor-not-allowed border border-gray-300"
                : "bg-white"
            )}
          >
            <CardHeader
              className={cn(
                "pb-2 bg-gradient-to-r border-b",
                grayCard
                  ? "from-gray-100 to-gray-200 border-gray-200"
                  : "from-sky-50 to-indigo-50 border-indigo-100"
              )}
            >
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-indigo-800">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <span className="text-2xl">{category.icon}</span>
                )}
                <span>{category.name}</span>
                {isInactive && (
                  <span className="ml-2 text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                    غير نشطة
                  </span>
                )}
                {isEmpty && !isInactive && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    لا يوجد أسئلة
                  </span>
                )}
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
                                disabled={
                                  question.isAnswered ||
                                  !question.realQuestion ||
                                  grayCard
                                }
                                onClick={() =>
                                  !question.isAnswered &&
                                  question.realQuestion &&
                                  !grayCard &&
                                  onSelectQuestion(question.id, difficulty)
                                }
                                className={cn(
                                  "w-10 h-10 md:w-12 md:h-12 rounded-full text-sm font-bold flex items-center justify-center shadow-md transition",
                                  question.isAnswered
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400 opacity-60"
                                    : !question.realQuestion
                                    ? "bg-yellow-300 text-gray-700 cursor-not-allowed border border-yellow-400 opacity-70"
                                    : grayCard
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-70"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                )}
                              >
                                {difficulty}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {!question.isAnswered ? (
                                question.realQuestion ? (
                                  <>
                                    سؤال {category.name} رقم {difficulty}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                      {question.realQuestion.text.substring(0, 50)}...
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-yellow-600">
                                    لا يوجد سؤال متوفر لهذا المستوى
                                  </span>
                                )
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
        );
      })}
    </div>
  );
}
