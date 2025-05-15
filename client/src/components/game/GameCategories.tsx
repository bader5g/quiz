import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
  onSelectQuestion: (questionId: number) => void;
}

export function GameCategories({ 
  categories, 
  questions, 
  teams, 
  currentTeamIndex, 
  onSelectQuestion 
}: GameCategoriesProps) {
  
  // استخدام useMemo لتنظيم الأسئلة حسب الفئة والفريق لتحسين الأداء
  const questionsByCategory = useMemo(() => {
    const result: Record<number, Record<number, GameQuestion[]>> = {};
    
    // تهيئة الفئات
    categories.forEach(category => {
      result[category.id] = {};
      
      // تهيئة الفرق لكل فئة
      teams.forEach((_, teamIndex) => {
        result[category.id][teamIndex] = [];
      });
    });
    
    // تصنيف الأسئلة
    questions.forEach(question => {
      if (result[question.categoryId] && result[question.categoryId][question.teamIndex]) {
        result[question.categoryId][question.teamIndex].push(question);
      }
    });
    
    return result;
  }, [categories, teams, questions]);
  
  // التحقق ما إذا كانت جميع الأسئلة في فئة محددة قد تمت الإجابة عليها
  const allQuestionsAnsweredInCategory = useMemo(() => {
    const result: Record<number, boolean> = {};
    
    categories.forEach(category => {
      const categoryQuestions = questions.filter(q => q.categoryId === category.id);
      result[category.id] = categoryQuestions.length > 0 && 
                            categoryQuestions.every(q => q.isAnswered);
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
            
            <div className="grid" style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
              {/* عرض رأس الأعمدة: نقاط فريق */}
              {teams.map((team, index) => (
                <div key={`team-header-${index}`} className="flex justify-center mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: team.color }}
                  ></div>
                </div>
              ))}
              
              {/* صفوف الأسئلة حسب مستوى الصعوبة */}
              {[1, 2, 3].map((difficulty) => (
                <React.Fragment key={`row-${difficulty}`}>
                  {teams.map((team, teamIndex) => {
                    const question = questionsByCategory[category.id]?.[teamIndex]?.find(
                      q => q.difficulty === difficulty
                    );
                    
                    if (!question) return (
                      <div key={`empty-${teamIndex}-${difficulty}`} className="flex justify-center p-1">
                        <div className="w-10 h-10 md:w-12 md:h-12"></div>
                      </div>
                    );
                    
                    const isCurrentTeam = teamIndex === currentTeamIndex;
                    
                    return (
                      <div key={`q-${teamIndex}-${difficulty}`} className="flex justify-center p-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={question.isAnswered ? "outline" : "default"}
                                className={cn(
                                  "w-10 h-10 md:w-12 md:h-12 rounded-full text-white shadow-md flex items-center justify-center",
                                  question.isAnswered ? 'opacity-40 bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300' : 'bg-sky-500 hover:bg-sky-600',
                                  isCurrentTeam && !question.isAnswered ? 'ring-2 ring-yellow-400' : ''
                                )}
                                disabled={question.isAnswered}
                                onClick={() => !question.isAnswered && onSelectQuestion(question.id)}
                              >
                                {difficulty}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {!question.isAnswered ? (
                                <>سؤال {difficulty === 1 ? 'سهل' : difficulty === 2 ? 'متوسط' : 'صعب'} ({difficulty} {difficulty === 1 ? 'نقطة' : 'نقاط'})</>
                              ) : (
                                <>تمت الإجابة على هذا السؤال</>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}