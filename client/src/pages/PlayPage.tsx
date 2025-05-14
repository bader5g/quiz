import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div dir="rtl" className="container mx-auto p-4">
      {/* الهيدر العلوي */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Badge className="text-lg py-2" style={{ backgroundColor: currentTeam.color }}>
            دور فريق: {currentTeam.name}
          </Badge>
        </div>
        <div className="space-x-2 space-x-reverse">
          <Button variant="outline" onClick={saveAndExit} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
          <Button variant="destructive" onClick={endGame} className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            إنهاء اللعبة
          </Button>
        </div>
      </div>

      {/* عرض الفئات والأسئلة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {game.categories.map((category) => {
          // تصفية الأسئلة حسب الفئة الحالية
          const categoryQuestions = game.questions.filter(q => q.categoryId === category.id);

          // تنظيم الأسئلة حسب الفريق
          const questionsByTeam: { [teamIndex: number]: GameQuestion[] } = {};
          game.teams.forEach((_, index) => {
            questionsByTeam[index] = categoryQuestions.filter(q => q.teamIndex === index);
          });

          return (
            <Card key={category.id} className="shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid" style={{ 
                  gridTemplateColumns: `repeat(${game.teams.length}, 1fr)`,
                  gap: '0.5rem'
                }}>
                  {game.teams.map((_, teamIndex) => (
                    <div key={teamIndex} className="flex flex-col items-center gap-2">
                      {/* عرض أرقام الأسئلة 1-3 لكل فريق */}
                      {[1, 2, 3].map((difficulty) => {
                        const question = questionsByTeam[teamIndex]?.find(q => q.difficulty === difficulty);
                        
                        if (!question) return null;
                        
                        return (
                          <Button
                            key={`${teamIndex}-${difficulty}`}
                            variant={question.isAnswered ? "outline" : "default"}
                            className={`w-12 h-12 ${question.isAnswered ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={question.isAnswered}
                            onClick={() => !question.isAnswered && selectQuestion(question.id)}
                          >
                            {difficulty}
                          </Button>
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

      {/* عرض الفرق والنقاط */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {game.teams.map((team, index) => (
          <Card key={index} className="shadow-md" style={{ borderColor: team.color, borderWidth: '2px' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{team.name}</span>
                <Badge variant="outline" className="ml-2">{team.score}</Badge>
              </CardTitle>
            </CardHeader>
            {game.teams.length === 2 && (
              <CardContent className="pt-0">
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    خصم نقاط
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    عكس السؤال
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    طرد لاعب
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}