import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ClockIcon, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ModalDialogContent } from '@/components/ui/modal-dialog';
import { useSite } from '@/context/SiteContext';

interface Question {
  id: number;
  text: string;
  answer: string;
  difficulty: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
}

interface GameTeam {
  id: number;
  name: string;
  score: number;
  color: string;
}

interface QuestionDetails {
  question: Question;
  teams: GameTeam[];
  firstAnswerTime: number;
  secondAnswerTime: number;
  gameId: number;
}

export default function QuestionPage() {
  const { gameId, questionId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { getModalClass } = useSite();
  
  const [questionData, setQuestionData] = useState<QuestionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  
  // جلب تفاصيل السؤال
  useEffect(() => {
    const fetchQuestionDetails = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', `/api/games/${gameId}/questions/${questionId}`);
        const data = await response.json();
        setQuestionData(data);
        setTimeLeft(data.firstAnswerTime);
        setError(null);
      } catch (err) {
        console.error('Error fetching question details:', err);
        setError('حدث خطأ أثناء تحميل السؤال. يرجى المحاولة مرة أخرى.');
        toast({
          variant: 'destructive',
          title: 'خطأ في التحميل',
          description: 'تعذر تحميل تفاصيل السؤال. يرجى المحاولة مرة أخرى.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (gameId && questionId) {
      fetchQuestionDetails();
    }

    // تنظيف المؤقت عند إلغاء التركيب
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameId, questionId, toast]);

  // بدء المؤقت
  useEffect(() => {
    if (questionData && !timerRunning && !showAnswer && !showTeamSelection) {
      const startTimer = () => {
        setTimerRunning(true);
        const interval = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(interval);
              setTimerRunning(false);
              setShowTeamSelection(true);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
        setTimer(interval);
      };
      
      startTimer();
    }
  }, [questionData, timerRunning, showAnswer, showTeamSelection]);

  // تسجيل إجابة
  const submitAnswer = async (isCorrect: boolean) => {
    try {
      if (selectedTeam === null) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'الرجاء تحديد الفريق أولاً',
        });
        return;
      }

      const points = questionData?.question.difficulty || 0;
      
      await apiRequest('POST', `/api/games/${gameId}/answer`, {
        questionId: parseInt(questionId as string),
        teamId: questionData?.teams[selectedTeam].id,
        isCorrect,
        points: isCorrect ? points : 0
      });
      
      // إظهار رسالة نجاح
      toast({
        title: 'تم تسجيل الإجابة',
        description: isCorrect ? 'إجابة صحيحة! تم إضافة النقاط.' : 'إجابة خاطئة.',
      });
      
      // بعد ثانيتين نعود إلى صفحة اللعبة
      setTimeout(() => {
        navigate(`/play/${gameId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting answer:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الإجابة. يرجى المحاولة مرة أخرى.',
      });
    }
  };

  // إظهار الإجابة
  const toggleShowAnswer = () => {
    // إيقاف المؤقت إذا كان يعمل
    if (timer) {
      clearInterval(timer);
      setTimerRunning(false);
    }
    setShowAnswer(!showAnswer);
  };

  // العودة إلى صفحة اللعبة
  const returnToGame = () => {
    navigate(`/play/${gameId}`);
  };

  // تنسيق الوقت
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <Button onClick={() => navigate(`/play/${gameId}`)}>العودة إلى اللعبة</Button>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div dir="rtl" className="p-8">
        <Alert variant="destructive">
          <AlertDescription>لم يتم العثور على السؤال المطلوب.</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate(`/play/${gameId}`)}>العودة إلى اللعبة</Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto p-4">
      {/* المؤقت والفئة */}
      <div className="flex justify-between items-center mb-6">
        <Badge className="text-lg py-2 px-3">
          <span className="ml-2">{questionData.question.categoryIcon}</span>
          <span>{questionData.question.categoryName}</span>
        </Badge>
        
        <div className={`flex items-center gap-2 text-lg font-semibold ${timeLeft < 10 ? 'text-red-500' : ''}`}>
          <ClockIcon className="h-5 w-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* بطاقة السؤال */}
      <Card className="mb-8 shadow-lg">
        <CardContent className="p-6">
          {/* مستوى الصعوبة */}
          <div className="flex justify-end mb-4">
            <Badge variant="outline">
              المستوى: {
                questionData.question.difficulty === 1 ? 'سهل' : 
                questionData.question.difficulty === 2 ? 'متوسط' : 'صعب'
              }
            </Badge>
          </div>
          
          {/* نص السؤال */}
          <div className="text-2xl font-semibold mb-8 text-center">
            {questionData.question.text}
          </div>
          
          {/* عرض الإجابة (اختياري) */}
          {showAnswer && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">الإجابة الصحيحة:</h3>
              <p className="text-lg">{questionData.question.answer}</p>
            </div>
          )}
          
          {/* أزرار التحكم */}
          <div className="flex justify-center mt-6 gap-3">
            <Button
              variant="outline"
              onClick={toggleShowAnswer}
              className="flex items-center gap-2"
            >
              {showAnswer ? 'إخفاء الإجابة' : 'عرض الإجابة'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowTeamSelection(true)}
              className="flex items-center gap-2"
            >
              تسجيل إجابة
            </Button>
            
            <Button
              variant="outline"
              onClick={returnToGame}
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              العودة للعبة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* مربع حوار اختيار الفريق */}
      <Dialog
        open={showTeamSelection}
        onOpenChange={(open) => { 
          if (!open) setSelectedTeam(null);
          setShowTeamSelection(open);
        }}
      >
        <ModalDialogContent className={getModalClass()}>
          <DialogHeader>
            <DialogTitle>من أجاب على السؤال؟</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {questionData.teams.map((team, index) => (
                <Button
                  key={team.id}
                  variant={selectedTeam === index ? "default" : "outline"}
                  className="h-16 text-lg"
                  style={{
                    borderColor: team.color,
                    ...(selectedTeam === index ? { backgroundColor: team.color } : {})
                  }}
                  onClick={() => setSelectedTeam(index)}
                >
                  {team.name}
                </Button>
              ))}
              <Button
                variant={selectedTeam === null ? "default" : "outline"}
                className="h-16 text-lg col-span-full"
                onClick={() => setSelectedTeam(null)}
              >
                لم يُجب أحد
              </Button>
            </div>
            
            {selectedTeam !== null && (
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-center">هل الإجابة صحيحة؟</h3>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 flex items-center gap-2 h-12"
                    onClick={() => {
                      setAnswerCorrect(true);
                      submitAnswer(true);
                      setShowTeamSelection(false);
                    }}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>إجابة صحيحة</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-red-50 border-red-200 hover:bg-red-100 text-red-700 flex items-center gap-2 h-12"
                    onClick={() => {
                      setAnswerCorrect(false);
                      submitAnswer(false);
                      setShowTeamSelection(false);
                    }}
                  >
                    <XCircle className="h-5 w-5" />
                    <span>إجابة خاطئة</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {selectedTeam === null && (
              <Button 
                onClick={() => {
                  setShowTeamSelection(false);
                  navigate(`/play/${gameId}`);
                }}
              >
                العودة للعبة
              </Button>
            )}
          </DialogFooter>
        </ModalDialogContent>
      </Dialog>
    </div>
  );
}