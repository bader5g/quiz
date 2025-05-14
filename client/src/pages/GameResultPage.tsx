import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, Home, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import confetti from 'canvas-confetti';

interface GameTeam {
  name: string;
  score: number;
  color: string;
  isWinner: boolean;
}

interface GameCategory {
  id: number;
  name: string;
  icon: string;
}

interface GameQuestion {
  id: number;
  difficulty: number;
  categoryId: number;
  teamName: string;
  teamColor: string;
  question: string;
  answer: string;
  isCorrect: boolean;
  points: number;
}

interface GameResult {
  id: number;
  name: string;
  teams: GameTeam[];
  categories: GameCategory[];
  questions: GameQuestion[];
  date: string;
  winningTeam: string | null;
}

export default function GameResultPage() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب نتائج اللعبة
  useEffect(() => {
    const fetchGameResult = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', `/api/games/${gameId}/result`);
        const resultData = await response.json();
        setGameResult(resultData);
        setError(null);

        // تأثير الكونفيتي إذا كان هناك فائز
        if (resultData.winningTeam) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching game result:', err);
        setError('حدث خطأ أثناء تحميل نتائج اللعبة. يرجى المحاولة مرة أخرى.');
        toast({
          variant: 'destructive',
          title: 'خطأ في التحميل',
          description: 'تعذر تحميل نتائج اللعبة. يرجى المحاولة مرة أخرى.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGameResult();
    }
  }, [gameId, toast]);

  // إعادة اللعب
  const replayGame = () => {
    navigate(`/replay-game/${gameId}`);
  };

  // العودة للصفحة الرئيسية
  const goToHome = () => {
    navigate('/');
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
          <Button onClick={goToHome}>العودة للصفحة الرئيسية</Button>
        </div>
      </div>
    );
  }

  if (!gameResult) {
    return (
      <div dir="rtl" className="p-8">
        <Alert variant="destructive">
          <AlertDescription>لم يتم العثور على نتائج اللعبة المطلوبة.</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={goToHome}>العودة للصفحة الرئيسية</Button>
        </div>
      </div>
    );
  }

  // ترتيب الفرق حسب النقاط (تنازلياً)
  const sortedTeams = [...gameResult.teams].sort((a, b) => b.score - a.score);
  
  return (
    <div dir="rtl" className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* عنوان النتائج */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">نتائج اللعبة</h1>
          <p className="text-muted-foreground">{gameResult.name} - {formatDate(gameResult.date)}</p>
        </div>

        {/* الفريق الفائز */}
        {gameResult.winningTeam && (
          <Card className="mb-8 border-4 shadow-lg animate-pulse" style={{ borderColor: sortedTeams[0].color }}>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                الفريق الفائز: {gameResult.winningTeam}
              </h2>
              <p className="text-muted-foreground">
                بمجموع نقاط: {sortedTeams[0].score}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* جدول النقاط */}
        <Card className="mb-8 shadow">
          <CardHeader>
            <CardTitle>جدول النقاط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedTeams.map((team, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {team.isWinner && <Trophy className="h-5 w-5 text-yellow-500" />}
                    <Badge style={{ backgroundColor: team.color }}>{index + 1}</Badge>
                    <span className="font-semibold">{team.name}</span>
                  </div>
                  <Badge variant="outline" className="text-lg p-2">
                    {team.score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل الأسئلة */}
        <Card className="mb-8 shadow">
          <CardHeader>
            <CardTitle>تفاصيل الإجابات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {gameResult.categories.map((category) => (
                <div key={category.id}>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </h3>
                  
                  <div className="space-y-3 pl-6">
                    {gameResult.questions
                      .filter(q => q.categoryId === category.id)
                      .map((question, qIndex) => (
                        <div key={qIndex} className="text-sm">
                          <div className="flex gap-2 items-start mb-1">
                            <Badge 
                              variant={question.isCorrect ? "default" : "destructive"}
                              className="mt-1"
                            >
                              {question.teamName}
                            </Badge>
                            <div>
                              <p className="font-medium">{question.question}</p>
                              <p className="text-muted-foreground">الإجابة: {question.answer}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>المستوى: {
                              question.difficulty === 1 ? 'سهل' : 
                              question.difficulty === 2 ? 'متوسط' : 'صعب'
                            }</span>
                            <span>النقاط: {question.points}</span>
                          </div>
                          
                          <Separator className="my-2" />
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* أزرار التنقل */}
        <div className="flex justify-center gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={goToHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            الصفحة الرئيسية
          </Button>
          
          <Button 
            onClick={replayGame}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            لعب مباراة جديدة
          </Button>
        </div>
      </div>
    </div>
  );
}