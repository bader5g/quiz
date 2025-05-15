import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, DoorOpen, Flag, Trophy, User, Minus, 
  Repeat, UserX, Gamepad2, Star, Award
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSite } from '@/context/SiteContext';

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
  difficulty: 1 | 2 | 3; // 1=سهل, 2=متوسط, 3=صعب
  teamIndex: number;
  categoryId: number;
  isAnswered: boolean;
  questionId: number;
}

interface GameDetails {
  id: number;
  name: string;
  teams: GameTeam[];
  categories: GameCategory[];
  questions: GameQuestion[];
  currentTeamIndex: number;
}

export default function PlayPage() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { siteSettings } = useSite();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب تفاصيل اللعبة
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', `/api/games/${gameId}`);
        const gameData = await response.json();
        setGame(gameData);
        setError(null);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('حدث خطأ أثناء تحميل اللعبة. يرجى المحاولة مرة أخرى.');
        toast({
          variant: 'destructive',
          title: 'خطأ في التحميل',
          description: 'تعذر تحميل تفاصيل اللعبة. يرجى المحاولة مرة أخرى.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId, toast]);

  // إنهاء اللعبة
  const endGame = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إنهاء اللعبة؟ سيتم احتساب النقاط الحالية واختيار الفائز.')) {
      return;
    }

    try {
      await apiRequest('POST', `/api/games/${gameId}/end`);
      navigate(`/game-result/${gameId}`);
    } catch (err) {
      console.error('Error ending game:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء محاولة إنهاء اللعبة. يرجى المحاولة مرة أخرى.',
      });
    }
  };

  // حفظ حالة اللعبة والخروج
  const saveAndExit = async () => {
    if (!window.confirm('هل ترغب في حفظ حالة اللعبة والخروج؟ يمكنك استكمال اللعبة لاحقاً.')) {
      return;
    }

    try {
      await apiRequest('POST', `/api/games/${gameId}/save`);
      navigate('/my-games');
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ حالة اللعبة بنجاح. يمكنك استكمالها لاحقاً من صفحة "ألعابي".',
      });
    } catch (err) {
      console.error('Error saving game state:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء محاولة حفظ حالة اللعبة. يرجى المحاولة مرة أخرى.',
      });
    }
  };

  // اختيار سؤال
  const selectQuestion = (questionId: number) => {
    navigate(`/play/${gameId}/question/${questionId}`);
  };

  // محتوى الصفحة الرئيسي
  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/my-games')}>العودة إلى ألعابي</Button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div dir="rtl" className="p-8">
        <Alert variant="destructive">
          <AlertDescription>لم يتم العثور على اللعبة المطلوبة.</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/my-games')}>العودة إلى ألعابي</Button>
        </div>
      </div>
    );
  }

  // تحديد الفريق الحالي
  const currentTeam = game.teams[game.currentTeamIndex];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 pb-8">
      
      {/* الهيدر العلوي مع الشعار */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-md">
        {/* الجزء الأيمن: الشعار والدور الحالي */}
        <div className="flex items-center gap-4">
          {siteSettings && (
            <div className="relative h-16 flex items-center">
              <img 
                src={siteSettings.logoUrl} 
                alt={siteSettings.appName} 
                className="h-full object-contain"
              />
            </div>
          )}
          
          {/* الدور الحالي */}
          <Badge 
            className="text-lg py-2 px-4 rounded-md shadow-md flex items-center gap-2 transition-all text-black border-2 border-gray-800" 
            style={{ backgroundColor: 'white' }}
          >
            <Trophy className="h-5 w-5 text-gray-800" />
            <span className="text-sm">الدور الحالي: {currentTeam.name}</span>
          </Badge>
        </div>

        {/* الجزء الأوسط: اسم اللعبة */}
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-pulse">
            <Card className="border-2 border-indigo-200 max-w-xs shadow-md bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardContent className="py-2 px-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-indigo-500" />
                <span className="text-lg font-bold text-indigo-700">{game.name}</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الجزء الأيسر: أزرار التحكم */}
        <div className="flex gap-3 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={saveAndExit} 
                  className="flex items-center gap-2 rounded-lg border-2 border-indigo-200 shadow-md hover:bg-indigo-50 transition-colors"
                >
                  <DoorOpen className="h-4 w-4 text-indigo-600" />
                  <span className="hidden sm:inline">حفظ والخروج</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>حفظ حالة اللعبة والخروج</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  onClick={endGame} 
                  className="flex items-center gap-2 rounded-lg shadow-md bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  <Flag className="h-4 w-4" />
                  <span className="hidden sm:inline">إنهاء اللعبة</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إنهاء اللعبة واحتساب النتائج</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* عرض الفرق والنقاط */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800">
        <Award className="h-6 w-6 text-indigo-600" />
        <span>النتائج الحالية</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {game.teams.map((team, index) => {
          const isCurrentTeam = index === game.currentTeamIndex;
          
          return (
            <Card 
              key={index} 
              className={cn(
                "shadow-md transition-all duration-200 bg-white rounded-xl",
                isCurrentTeam ? "ring-2 ring-offset-2 ring-indigo-300" : ""
              )}
              style={{ 
                borderColor: team.color, 
                borderWidth: '2px'
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2" style={{ borderColor: team.color }}>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base truncate flex-1">{team.name}</span>
                  <Badge 
                    className="ml-1 px-3 py-1 text-lg" 
                    style={{ backgroundColor: team.color }}
                  >
                    {team.score}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              {game.teams.length === 2 && (
                <CardFooter className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-2 justify-center w-full">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 rounded-full flex items-center gap-1 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Minus className="h-3 w-3 text-indigo-600" />
                            <span className="hidden sm:inline">خصم</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>خصم نقاط من الفريق</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 rounded-full flex items-center gap-1 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Repeat className="h-3 w-3 text-indigo-600" />
                            <span className="hidden sm:inline">عكس</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>عكس الدور إلى الفريق الآخر</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 rounded-full flex items-center gap-1 border-indigo-200 hover:bg-indigo-50"
                          >
                            <UserX className="h-3 w-3 text-indigo-600" />
                            <span className="hidden sm:inline">تخطي</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>تخطي دور هذا الفريق</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      {/* عرض الفئات والأسئلة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {game.categories.map((category) => {
          // تصفية الأسئلة حسب الفئة الحالية
          const categoryQuestions = game.questions.filter(q => q.categoryId === category.id);

          // تنظيم الأسئلة حسب الفريق
          const questionsByTeam: { [teamIndex: number]: GameQuestion[] } = {};
          game.teams.forEach((_, index) => {
            questionsByTeam[index] = categoryQuestions.filter(q => q.teamIndex === index);
          });

          return (
            <Card 
              key={category.id} 
              className="shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white rounded-xl"
            >
              <CardHeader className="pb-2 bg-indigo-50 border-b border-indigo-100">
                <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-indigo-800">
                  <span className="text-2xl">{category.icon}</span>
                  <span>{category.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${game.teams.length}, 1fr)` }}>
                  {/* عرض رأس الأعمدة: نقاط فريق */}
                  {game.teams.map((team, index) => (
                    <div key={`team-header-${index}`} className="flex justify-center mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: team.color }}
                      ></div>
                    </div>
                  ))}
                  
                  {/* صف السؤال الأول (سهل) */}
                  {[1, 2, 3].map((difficulty) => (
                    <React.Fragment key={`row-${difficulty}`}>
                      {game.teams.map((team, teamIndex) => {
                        const question = questionsByTeam[teamIndex]?.find(q => q.difficulty === difficulty);
                        
                        if (!question) return (
                          <div key={`empty-${teamIndex}-${difficulty}`} className="flex justify-center p-1">
                            <div className="w-12 h-12"></div>
                          </div>
                        );
                        
                        const isCurrentTeam = teamIndex === game.currentTeamIndex;
                        
                        return (
                          <div key={`q-${teamIndex}-${difficulty}`} className="flex justify-center p-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={question.isAnswered ? "outline" : "default"}
                                    className={cn(
                                      "w-12 h-12 rounded-full text-white shadow-md flex items-center justify-center",
                                      question.isAnswered ? 'opacity-40 bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300' : 'bg-sky-500 hover:bg-sky-600',
                                      isCurrentTeam && !question.isAnswered ? 'ring-2 ring-yellow-400' : ''
                                    )}
                                    disabled={question.isAnswered}
                                    onClick={() => !question.isAnswered && selectQuestion(question.id)}
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
          );
        })}
      </div>
    </div>
    </div>
  );
}