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
  DialogTitle,
  DialogDescription 
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
              // إزالة الفتح التلقائي لشاشة من أجاب على السؤال عند انتهاء الوقت
              // setShowTeamSelection(true);
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

  // تسجيل إجابة - فتح نافذة الاختيار
  const handleRecordAnswer = () => {
    // إيقاف المؤقت إذا كان يعمل
    if (timer) {
      clearInterval(timer);
      setTimerRunning(false);
    }
    setShowTeamSelection(true);
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
      <div dir="rtl" className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="p-8 bg-gradient-to-b from-sky-50 to-indigo-50 min-h-screen">
        <Alert variant="destructive" className="max-w-xl mx-auto shadow-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate(`/play/${gameId}`)} className="shadow-md">
            العودة إلى اللعبة
          </Button>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div dir="rtl" className="p-8 bg-gradient-to-b from-sky-50 to-indigo-50 min-h-screen">
        <Alert variant="destructive" className="max-w-xl mx-auto shadow-md">
          <AlertDescription>لم يتم العثور على السؤال المطلوب.</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate(`/play/${gameId}`)} className="shadow-md">
            العودة إلى اللعبة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* هيدر الصفحة: المؤقت والفئة */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-md">
          <Badge className="text-lg py-2 px-4 bg-indigo-100 text-indigo-800 border-0 shadow-sm">
            <span className="ml-2">{questionData.question.categoryIcon}</span>
            <span>{questionData.question.categoryName}</span>
          </Badge>
          
          <div className={`flex items-center gap-2 text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 10 ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>
            <ClockIcon className="h-6 w-6" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* بطاقة السؤال */}
        <Card className="mb-8 shadow-xl border border-indigo-100 overflow-hidden">
          {/* شريط مستوى الصعوبة */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 py-3 px-4 text-white flex justify-between items-center">
            <span className="font-semibold text-xl">السؤال</span>
            <Badge variant="outline" className="bg-white/20 text-white border-white/50">
              المستوى: {
                questionData.question.difficulty === 1 ? 'سهل' : 
                questionData.question.difficulty === 2 ? 'متوسط' : 'صعب'
              }
            </Badge>
          </div>
          
          <CardContent className="p-6">
            {/* نص السؤال */}
            <div className="text-2xl font-semibold mb-8 text-center p-6 bg-white rounded-lg shadow-inner border border-indigo-50">
              {questionData.question.text}
            </div>
            
            {/* عرض الإجابة (اختياري) */}
            {showAnswer && (
              <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg shadow-inner">
                <h3 className="font-semibold mb-2 text-lg text-green-800">الإجابة الصحيحة:</h3>
                <p className="text-xl text-green-700">{questionData.question.answer}</p>
              </div>
            )}
            
            {/* أزرار التحكم */}
            <div className="flex justify-center mt-8 gap-4">
              <Button
                variant="outline"
                onClick={toggleShowAnswer}
                className="px-5 py-6 h-auto text-lg flex items-center gap-2 border-indigo-200 hover:bg-indigo-50 shadow-sm"
              >
                {showAnswer ? 'إخفاء الإجابة' : 'عرض الإجابة'}
              </Button>
              
              <Button
                onClick={handleRecordAnswer}
                className="px-5 py-6 h-auto text-lg flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md"
              >
                تسجيل إجابة
              </Button>
              
              <Button
                variant="outline"
                onClick={returnToGame}
                className="px-5 py-6 h-auto text-lg flex items-center gap-2 border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
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
              <DialogTitle className="text-xl">من أجاب على السؤال؟</DialogTitle>
              <DialogDescription>
                حدد الفريق الذي قام بالإجابة على السؤال
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {questionData.teams.map((team, index) => (
                  <Button
                    key={team.id}
                    variant={selectedTeam === index ? "default" : "outline"}
                    className="h-16 text-lg shadow-md transition-all"
                    style={{
                      borderColor: team.color,
                      ...(selectedTeam === index 
                        ? { backgroundColor: team.color, color: '#ffffff' } 
                        : {})
                    }}
                    onClick={() => setSelectedTeam(index)}
                  >
                    {team.name}
                  </Button>
                ))}
                <Button
                  variant={selectedTeam === null ? "default" : "outline"}
                  className="h-16 text-lg col-span-full shadow-md"
                  onClick={() => setSelectedTeam(null)}
                >
                  لم يُجب أحد
                </Button>
              </div>
              
              {selectedTeam !== null && (
                <div className="flex flex-col gap-4 mt-8">
                  <h3 className="font-semibold text-center text-lg">هل الإجابة صحيحة؟</h3>
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="outline" 
                      className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 flex items-center gap-2 h-14 text-lg shadow-md"
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
                      className="bg-red-50 border-red-200 hover:bg-red-100 text-red-700 flex items-center gap-2 h-14 text-lg shadow-md"
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
                  }}
                  className="px-5 shadow-md"
                >
                  إلغاء
                </Button>
              )}
            </DialogFooter>
          </ModalDialogContent>
        </Dialog>
      </div>
    </div>
  );
}