import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ClockIcon, 
  CheckCircle, 
  XCircle, 
  LogOut,
  ChevronRight,
  XCircleIcon,
  Hand,
  Phone,
  RefreshCcw,
  HelpCircle,
  AlertTriangle,
  RotateCw,
  Minus,
  UserX
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
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface Question {
  id: number;
  text: string;
  answer: string;
  difficulty: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video' | null;
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

// مكون زر المساعدة مع إضافة الدالة onClick
const HelpButton = ({ 
  icon, 
  label, 
  tooltip,
  onClick,
  disabled = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-8 w-8 rounded-full ${
            disabled 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-white/90 hover:bg-white'
          }`}
          onClick={onClick}
          disabled={disabled}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{disabled ? 'تم استخدام هذه المساعدة' : tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  
  // حالة استخدام وسائل المساعدة
  const [helpUsed, setHelpUsed] = useState<{
    discount: boolean; // خصم
    swap: boolean;     // عكس
    skip: boolean;     // تخطي
  }>({
    discount: false,
    swap: false,
    skip: false
  });
  

  
  // جلب تفاصيل السؤال
  useEffect(() => {
    const fetchQuestionDetails = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', `/api/games/${gameId}/questions/${questionId}`);
        
        // التحقق من الاستجابة إذا كانت 404 (غير موجود)
        if (response.status === 404) {
          setNotFoundError(true);
          setError('السؤال المطلوب غير موجود.');
          return;
        }
        
        const data = await response.json();
        setQuestionData(data);
        setTimeLeft(data.firstAnswerTime);
        
        // تعيين الفريق الحالي
        try {
          const gameResponse = await apiRequest('GET', `/api/games/${gameId}`);
          
          // التحقق إذا كانت اللعبة غير موجودة
          if (gameResponse.status === 404) {
            setNotFoundError(true);
            setError('اللعبة المطلوبة غير موجودة.');
            return;
          }
          
          const gameData = await gameResponse.json();
          setCurrentTeamIndex(gameData.currentTeamIndex || 0);
        } catch (gameErr) {
          console.error('Error fetching game details:', gameErr);
          setError('تعذر تحميل بيانات اللعبة. يرجى المحاولة مرة أخرى.');
        }
        
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

  // تحويل الدور للفريق التالي وضبط الوقت المخصص له
  const moveToNextTeam = async (showNotAnsweredMessage = false) => {
    try {
      // إذا كان مطلوب إظهار رسالة "لم يجب"
      if (showNotAnsweredMessage) {
        const currentTeam = questionData!.teams[currentTeamIndex];
        // عرض تنبيه أن الفريق الحالي لم يجب
        const alertElement = document.createElement('div');
        alertElement.className = 'fixed top-0 left-0 right-0 bg-amber-100 text-amber-800 p-2 text-center z-50 transition-all';
        alertElement.textContent = `انتهى الوقت! الفريق "${currentTeam.name}" لم يجب.`;
        document.body.appendChild(alertElement);
        
        // إزالة التنبيه بعد 3 ثواني
        setTimeout(() => {
          if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
          }
        }, 3000);
      }
      
      // حساب الفريق التالي (الفريق الحالي + 1 وإذا وصلنا للنهاية نعود للبداية)
      const nextTeamIndex = (currentTeamIndex + 1) % questionData!.teams.length;
      
      // تحديث الفريق الحالي في قاعدة البيانات
      await apiRequest('POST', `/api/games/${gameId}/update-team`, {
        teamIndex: nextTeamIndex
      });
      
      // تحديث الفريق الحالي في الواجهة
      setCurrentTeamIndex(nextTeamIndex);
      
      // ضبط الوقت المناسب حسب الفريق
      // إذا كان هذا هو الفريق الثاني الذي يحاول الإجابة على السؤال (كل فريق له فرصة)
      if (nextTeamIndex !== 0) {
        // استخدام زمن الإجابة الثانية للفريق الثاني
        setTimeLeft(questionData!.secondAnswerTime);
      } else {
        // استخدام زمن الإجابة الأولى للفريق الأول
        setTimeLeft(questionData!.firstAnswerTime);
      }
      
      // بدء المؤقت من جديد للفريق الجديد
      startTimer();
      
      // لا نعرض الـ toast الآن، لأن المستخدم طلب إلغاء تلك الرسالة
      
    } catch (err) {
      console.error('Error changing team turn:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تغيير الدور. يرجى المحاولة مرة أخرى.',
      });
    }
  };
  
  // تجديد المؤقت
  const resetTimer = () => {
    if (questionData) {
      // ضبط الوقت حسب الفريق الحالي
      // إذا كان هذا هو الفريق الأول (index = 0)، نستخدم الوقت الأول
      // وإلا نستخدم الوقت الثاني للفرق اللاحقة
      const timeToSet = currentTeamIndex === 0 
        ? questionData.firstAnswerTime 
        : questionData.secondAnswerTime;
        
      setTimeLeft(timeToSet);
      
      // إظهار إشعار بتجديد الوقت
      toast({
        title: "تم تجديد الوقت",
        description: `تم ضبط المؤقت على ${formatTime(timeToSet)}`
      });
      
      // إذا كان المؤقت متوقفاً، نعيد تشغيله
      if (!timerRunning) {
        startTimer();
      }
    }
  };
  
  // وظيفة بدء المؤقت (تم نقلها لوظيفة منفصلة)
  const startTimer = () => {
    setTimerRunning(true);
    if (timer) clearInterval(timer);
    
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          
          // تحويل الدور تلقائيًا عند انتهاء الوقت
          moveToNextTeam(true); // مع رسالة "لم يجب الفريق"
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    setTimer(interval);
  };
  
  // بدء المؤقت
  useEffect(() => {
    if (questionData && !timerRunning && !showTeamSelection) {
      startTimer();
    }
  }, [questionData, timerRunning, showTeamSelection]);

  // تسجيل إجابة
  const submitAnswer = async (isCorrect: boolean) => {
    try {
      // منع النقر المكرر
      if (isSubmitting) {
        return;
      }
      
      if (selectedTeam === null) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'الرجاء تحديد الفريق أولاً',
        });
        return;
      }

      // تمكين حالة الإرسال
      setIsSubmitting(true);
      
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
      
      // إعادة تعيين حالة الإرسال في حالة الخطأ
      setIsSubmitting(false);
    }
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

  // إنهاء اللعبة
  const endGame = async () => {
    try {
      await apiRequest('POST', `/api/games/${gameId}/end`);
      navigate('/my-games');
    } catch (err) {
      console.error('Error ending game:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنهاء اللعبة. يرجى المحاولة مرة أخرى.',
      });
    }
  };
  


  // العودة إلى صفحة اللعبة مع حفظ حالة اللعبة أولاً
  const returnToGame = async () => {
    try {
      // حفظ حالة اللعبة قبل العودة (لضمان عدم فقدان التقدم)
      await apiRequest('POST', `/api/games/${gameId}/save-state`);
      
      // العودة إلى صفحة اللعبة
      navigate(`/play/${gameId}`);
    } catch (err) {
      console.error('Error saving game state:', err);
      // على الرغم من الخطأ نعود للعبة مع رسالة تحذير
      toast({
        variant: 'destructive',
        title: 'تحذير',
        description: 'لم يتم حفظ حالة اللعبة، لكن يمكنك المتابعة.',
      });
      navigate(`/play/${gameId}`);
    }
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
      <div dir="rtl" className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-white">
        <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen">
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

  if (!questionData || notFoundError) {
    return (
      <div dir="rtl" className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen font-[Cairo]">
        <Alert variant={notFoundError ? "destructive" : "default"} className="max-w-xl mx-auto shadow-md">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <AlertDescription className="text-lg">
            {notFoundError 
              ? `${error || 'السؤال المطلوب غير موجود.'}`
              : 'لم يتم العثور على بيانات السؤال.'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate(`/play/${gameId}`)} className="shadow-md px-6 py-2 h-auto">
            العودة إلى اللعبة
          </Button>
        </div>
      </div>
    );
  }

  const currentTeam = questionData.teams[currentTeamIndex];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* شريط الهيدر */}
      <header className="bg-white shadow-md py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* شعار الموقع (يمين) */}
          <div className="flex items-center">
            <img src="/assets/jaweb-logo.png" alt="جاوب" className="h-10" />
          </div>
          
          {/* اسم الفريق الذي عليه الدور (وسط) */}
          <div className="text-lg font-bold px-4 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            دور: {currentTeam?.name || 'الفريق الأول'}
          </div>
          
          {/* أزرار التحكم (يسار) */}
          <div className="flex gap-2">

            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={returnToGame} 
                    className="border-sky-200 hover:bg-sky-50">
                    <ChevronRight className="h-4 w-4 text-sky-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>الرجوع للعبة</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={endGame}
                    className="border-rose-200 hover:bg-rose-50">
                    <XCircleIcon className="h-4 w-4 text-rose-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>إنهاء اللعبة</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => navigate('/')}
                    className="border-slate-200 hover:bg-slate-50">
                    <LogOut className="h-4 w-4 text-slate-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>الخروج من اللعبة</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>
      
      {/* مؤقت العد التنازلي - منعزل في المنتصف */}
      <div className="flex justify-center mt-4 mb-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 text-xl font-bold px-6 py-3 rounded-full ${
            timeLeft < 10 ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-sky-700 bg-sky-50 border border-sky-200'
          } shadow-lg`}>
            <ClockIcon className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          
          {/* زر تجديد الوقت */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetTimer}
                  className="rounded-full h-12 w-12 border-sky-200 hover:bg-sky-50 shadow-md"
                >
                  <RotateCw className="h-5 w-5 text-sky-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>تجديد الوقت</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* محتوى رئيسي */}
      <main className="container mx-auto px-4 pb-10 flex flex-col md:flex-row gap-4">
        {/* فرق وأدوات المساعدة (يمين) */}
        <div className="w-full md:w-1/5 order-2 md:order-1">
          <div className="space-y-3">
            {questionData.teams.map((team, index) => (
              <Card key={team.id} className={`overflow-hidden shadow-md ${
                currentTeamIndex === index ? 'ring-2 ring-sky-400 ring-offset-2' : ''
              }`}>
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 py-2 px-3 text-white">
                  <div className="font-bold truncate">{team.name}</div>
                </div>
                <CardContent className="p-3 flex flex-col items-center">
                  <div className="text-2xl font-bold text-sky-700 mb-2">{team.score}</div>
                  
                  {/* وسائل المساعدة - تظهر فقط إذا كان عدد الفرق = 2 */}
                  {questionData.teams.length === 2 && (
                    <div className="flex gap-1 justify-center">
                      <HelpButton 
                        icon={<Minus className="h-3 w-3 text-sky-600" />}
                        label="خصم"
                        tooltip="خصم نقاط من الفريق"
                        disabled={helpUsed.discount || index !== currentTeamIndex}
                        onClick={() => {
                          // تأكيد استخدام مساعدة "خصم"
                          if (window.confirm('هل تريد خصم نقطة واحدة من الفريق الآخر؟')) {
                            const oppositeTeamIndex = currentTeamIndex === 0 ? 1 : 0;
                            const oppositeTeam = questionData.teams[oppositeTeamIndex];
                            
                            // تسجيل استخدام المساعدة
                            apiRequest('POST', `/api/games/${gameId}/use-help`, {
                              type: 'discount',
                              teamId: oppositeTeam.id
                            }).then(() => {
                              setHelpUsed(prev => ({ ...prev, discount: true }));
                              toast({
                                title: 'تم استخدام المساعدة',
                                description: `تم خصم نقطة واحدة من ${oppositeTeam.name}`
                              });
                            }).catch(err => {
                              console.error('Error using help:', err);
                              toast({
                                variant: 'destructive',
                                title: 'خطأ',
                                description: 'حدث خطأ أثناء استخدام المساعدة'
                              });
                            });
                          }
                        }}
                      />
                      
                      <HelpButton 
                        icon={<RefreshCcw className="h-3 w-3 text-sky-600" />}
                        label="عكس"
                        tooltip="عكس الدور إلى الفريق الآخر"
                        disabled={helpUsed.swap || index !== currentTeamIndex}
                        onClick={() => {
                          // تأكيد استخدام مساعدة "عكس"
                          if (window.confirm('هل تريد عكس الدور إلى الفريق الآخر؟')) {
                            // تسجيل استخدام المساعدة
                            apiRequest('POST', `/api/games/${gameId}/use-help`, {
                              type: 'swap'
                            }).then(() => {
                              setHelpUsed(prev => ({ ...prev, swap: true }));
                              moveToNextTeam(); // تغيير الدور للفريق التالي
                              toast({
                                title: 'تم استخدام المساعدة',
                                description: 'تم عكس الدور إلى الفريق الآخر'
                              });
                            }).catch(err => {
                              console.error('Error using help:', err);
                              toast({
                                variant: 'destructive',
                                title: 'خطأ',
                                description: 'حدث خطأ أثناء استخدام المساعدة'
                              });
                            });
                          }
                        }}
                      />
                      
                      <HelpButton 
                        icon={<UserX className="h-3 w-3 text-sky-600" />}
                        label="تخطي"
                        tooltip="تخطي دور هذا الفريق"
                        disabled={helpUsed.skip || index !== currentTeamIndex}
                        onClick={() => {
                          // تأكيد استخدام مساعدة "تخطي"
                          if (window.confirm('هل تريد تخطي دور الفريق الحالي؟')) {
                            // تسجيل استخدام المساعدة
                            apiRequest('POST', `/api/games/${gameId}/use-help`, {
                              type: 'skip'
                            }).then(() => {
                              setHelpUsed(prev => ({ ...prev, skip: true }));
                              
                              // العودة إلى صفحة اللعبة
                              toast({
                                title: 'تم استخدام المساعدة',
                                description: 'تم تخطي السؤال الحالي'
                              });
                              
                              // العودة للعبة بعد ثانية
                              setTimeout(() => {
                                returnToGame();
                              }, 1000);
                              
                            }).catch(err => {
                              console.error('Error using help:', err);
                              toast({
                                variant: 'destructive',
                                title: 'خطأ',
                                description: 'حدث خطأ أثناء استخدام المساعدة'
                              });
                            });
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* صندوق السؤال (وسط) */}
        <div className="w-full md:w-4/5 order-1 md:order-2">
          <Card className="shadow-xl border border-sky-100 overflow-hidden min-h-[350px] flex flex-col">
            {/* شريط الفئة */}
            <div className="bg-gradient-to-r from-sky-500 to-sky-600 py-3 px-4 text-white flex justify-between items-center">
              <Badge variant="outline" className="bg-white/20 text-white border-white/50">
                <span className="ml-2">{questionData.question.categoryIcon}</span>
                <span>{questionData.question.categoryName}</span>
              </Badge>
              
              <Badge variant="outline" className="bg-white/20 text-white border-white/50 flex items-center gap-1">
                <span>النقاط:</span>
                <span className="flex items-center justify-center bg-white/30 text-white w-6 h-6 rounded-full font-bold">
                  {questionData.question.difficulty}
                </span>
              </Badge>
            </div>
            
            {/* نص السؤال */}
            <CardContent className="flex-grow p-6 flex flex-col justify-center">
              <div className="text-2xl font-semibold text-center p-6 bg-white rounded-lg shadow-inner border border-sky-50 mb-4">
                {questionData.question.text}
              </div>
              

              
              {/* وسائط السؤال (صورة أو فيديو) */}
              {questionData.question.mediaType === 'image' && questionData.question.imageUrl && (
                <div className="mt-4 flex justify-center">
                  <img 
                    src={questionData.question.imageUrl} 
                    alt="صورة السؤال" 
                    className="max-h-64 rounded-lg shadow-md"
                  />
                </div>
              )}
              
              {questionData.question.mediaType === 'video' && questionData.question.videoUrl && (
                <div className="mt-4 flex justify-center">
                  <video 
                    controls 
                    src={questionData.question.videoUrl} 
                    className="max-h-64 rounded-lg shadow-md"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* زر من أجاب على السؤال */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleRecordAnswer}
              className="px-8 py-6 h-auto text-xl bg-sky-600 hover:bg-sky-700 shadow-md rounded-full"
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              منو جاوب؟
            </Button>
          </div>
        </div>
      </main>

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
                  onClick={() => {
                    setSelectedTeam(index);
                    setAnswerCorrect(true);
                    submitAnswer(true);
                    setShowTeamSelection(false);
                  }}
                >
                  {team.name}
                </Button>
              ))}
              <Button
                variant={selectedTeam === null ? "default" : "outline"}
                className="h-16 text-lg col-span-full shadow-md"
                onClick={() => {
                  setSelectedTeam(null);
                  setAnswerCorrect(false);
                  submitAnswer(false);
                  setShowTeamSelection(false);
                }}
              >
                لم يُجب أحد
              </Button>
            </div>
            

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
  );
}

