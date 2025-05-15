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
  
  // استخدام useMemo لتنظيم الأسئلة حسب الفئة والمستوى لتحسين الأداء
  const questionsByCategory = useMemo(() => {
    const result: Record<number, Record<number, GameQuestion[]>> = {};
    
    // تهيئة الفئات
    categories.forEach(category => {
      result[category.id] = {};
      
      // تهيئة المستويات لكل فئة (مستوى الصعوبة)
      [1, 2, 3].forEach(difficultyLevel => {
        result[category.id][difficultyLevel] = [];
      });
    });
    
    // تصنيف الأسئلة
    questions.forEach(question => {
      if (result[question.categoryId] && result[question.categoryId][question.difficulty]) {
        result[question.categoryId][question.difficulty].push(question);
      }
    });
    
    return result;
  }, [categories, questions]);
  
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
              {/* عرض رأس الأعمدة: المستويات */}
              {teams.map((_, index) => (
                <div key={`team-header-${index}`} className="flex justify-center mb-2">
                  <div className="text-xs text-gray-600 font-medium">
                    {index === 0 ? 'سهل' : index === 1 ? 'متوسط' : index === 2 ? 'صعب' : ''}
                  </div>
                </div>
              ))}
              
              {/* أزرار الأسئلة مرتبة حسب المستويات */}
              {teams.map((team, teamIndex) => {
                // نعرض الأسئلة حسب مستوى الصعوبة
                const difficulty = teamIndex + 1; // المستوى يعتمد على ترتيب الفريق (1=سهل, 2=متوسط, 3=صعب)
                
                // نحصل على السؤال المناسب للفريق الحالي
                const question = questions.find(q => 
                  q.categoryId === category.id && 
                  q.teamIndex === currentTeamIndex && 
                  q.difficulty === difficulty
                );
                
                if (!question) return (
                  <div key={`empty-${difficulty}`} className="flex justify-center p-1">
                    <div className="w-10 h-10 md:w-12 md:h-12"></div>
                  </div>
                );
                
                return (
                  <div key={`q-${difficulty}`} className="flex justify-center p-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={question.isAnswered ? "outline" : "default"}
                            className={cn(
                              "w-10 h-10 md:w-12 md:h-12 rounded-full text-white shadow-md flex items-center justify-center",
                              question.isAnswered ? 'opacity-40 bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300' : 'bg-sky-500 hover:bg-sky-600',
                              !question.isAnswered ? 'ring-2 ring-yellow-400' : ''
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}