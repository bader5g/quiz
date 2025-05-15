import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
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

// مكون زر الإجابة لزر الفريق
const AnswerTeamButton = ({
  team,
  index,
  onClick,
  disabled = false
}: {
  team: GameTeam;
  index: number;
  onClick: (index: number) => void;
  disabled?: boolean;
}) => (
  <Button
    key={team.id}
    variant="outline"
    className="h-16 text-lg shadow-md flex items-center gap-2 justify-center"
    style={{ 
      backgroundColor: `${team.color}11`, // لون شفاف جدًا 
      borderColor: team.color,
      color: disabled ? 'gray' : team.color
    }}
    onClick={() => onClick(index)}
    disabled={disabled}
  >
    ✅ {team.name}
  </Button>
);

export default function QuestionPage() {
  const { gameId, questionId } = useParams();
  const [, navigate] = useLocation();
  const { getModalClass } = useSite();
  
  // استخراج رقم السؤال من query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const questionNumber = searchParams.get("number") || "؟";
  
  const [questionData, setQuestionData] = useState<QuestionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  // تم إزالة selectedTeam لأنها غير ضرورية الآن
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
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
  }, [gameId, questionId]);

  // تحويل الدور للفريق التالي وضبط الوقت المخصص له
  const moveToNextTeam = async (showNotAnsweredMessage = false) => {
    try {
      // إذا كان مطلوب إظهار رسالة "لم يجب"
      if (showNotAnsweredMessage) {
        const currentTeam = questionData!.teams[currentTeamIndex];
        
        // إنشاء عنصر تنبيه في React بدلاً من استخدام DOM مباشرة
        const alertDiv = document.createElement('div');
        alertDiv.className = 'fixed top-0 left-0 right-0 bg-amber-100 text-amber-800 p-2 text-center z-50 transition-all';
        alertDiv.textContent = `انتهى الوقت! الفريق "${currentTeam.name}" لم يجب.`;
        document.body.appendChild(alertDiv);
        
        // إزالة التنبيه بعد 3 ثواني
        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
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
      
      // ضبط الوقت المناسب حسب الفريق باستخدام الطريقة الموحدة
      const newTime = (nextTeamIndex === 0) 
        ? questionData!.firstAnswerTime 
        : questionData!.secondAnswerTime;
      
      // ضبط المؤقت بالوقت المناسب
      setTimeLeft(newTime);
      
      // بدء المؤقت من جديد للفريق الجديد
      startTimer();
      
    } catch (err) {
      console.error('Error changing team turn:', err);
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
      
      // إذا كان المؤقت متوقفاً، نعيد تشغيله
      if (!timerRunning) {
        startTimer();
      }
    }
  };
  
  // وظيفة بدء المؤقت (تم نقلها لوظيفة منفصلة)
  const startTimer = () => {
    // تحقق إن كان المؤقت يعمل مسبقًا قبل أن تعيد تشغيله
    if (timerRunning) return;
    
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
  
  // بدء المؤقت - فقط عندما تظهر الإجابة ونكون في وضع الإجابة
  useEffect(() => {
    if (questionData && !timerRunning && !showTeamSelection && showAnswer) {
      startTimer();
    }
  }, [questionData, timerRunning, showTeamSelection, showAnswer]);

  // تسجيل إجابة
  const submitAnswer = async (isCorrect: boolean, teamIndex?: number) => {
    try {
      // منع النقر المكرر
      if (isSubmitting) {
        return;
      }

      // تمكين حالة الإرسال
      setIsSubmitting(true);
      
      const points = questionData?.question.difficulty || 0;
      
      await apiRequest('POST', `/api/games/${gameId}/answer`, {
        questionId: parseInt(questionId as string),
        teamId: teamIndex !== undefined ? questionData?.teams[teamIndex].id : null,
        isCorrect,
        points: isCorrect ? points : 0
      });
      
      // بعد ثانيتين نعود إلى صفحة اللعبة
      setTimeout(() => {
        navigate(`/play/${gameId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting answer:', err);
      
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
      // على الرغم من الخطأ نعود للعبة
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
            timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            <ClockIcon className="h-5 w-5" />
            <span className="min-w-[60px] text-center">{formatTime(timeLeft)}</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={resetTimer}
            className="h-12 w-12 rounded-full"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto p-4">
        {/* بطاقة السؤال */}
        <div className="max-w-4xl mx-auto shadow-lg overflow-hidden rounded-xl">
          {/* معلومات السؤال */}
          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  questionData.question.difficulty === 1 ? 'bg-green-100 text-green-600' 
                  : questionData.question.difficulty === 2 ? 'bg-yellow-100 text-yellow-600' 
                  : 'bg-red-100 text-red-600'
                }`}>
                  {questionData.question.difficulty}
                </span>
                <h2 className="text-lg font-semibold">
                  {questionData.question.categoryName}
                </h2>
                <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 px-2">
                  سؤال رقم {questionNumber}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                {questionData.question.difficulty === 1 ? 'سهل' 
                : questionData.question.difficulty === 2 ? 'متوسط' 
                : 'صعب'}
              </Badge>
            </div>
            
            <div className="bg-sky-50 p-4 rounded-lg mb-4">
              <h3 className="text-xl font-bold mb-4 text-sky-900">
                السؤال:
              </h3>
              <p className="text-lg text-gray-800">
                {questionData.question.text}
              </p>
            </div>
            
            {/* وسائط السؤال - في حالة وجودها */}
            {questionData.question.mediaType && (
              <div className="my-4 rounded-lg overflow-hidden flex justify-center">
                {questionData.question.mediaType === 'image' && questionData.question.imageUrl && (
                  <img 
                    src={questionData.question.imageUrl} 
                    alt="صورة للسؤال" 
                    className="max-h-[300px] w-auto object-contain rounded-md"
                  />
                )}
                
                {questionData.question.mediaType === 'video' && questionData.question.videoUrl && (
                  <video 
                    src={questionData.question.videoUrl} 
                    controls 
                    className="max-h-[300px] w-auto rounded-md"
                  />
                )}
              </div>
            )}
            
            {/* الإجابة - تظهر فقط بعد الضغط على زر عرض الإجابة */}
            {showAnswer && (
              <Card className="mt-6 bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h3 className="text-xl font-bold mb-2 text-green-900 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" /> 
                    الإجابة الصحيحة:
                  </h3>
                  <p className="text-lg text-gray-800">
                    {questionData.question.answer}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* أزرار وسائل المساعدة - تظهر فقط إذا كان هناك فريقين بالضبط */}
            {questionData.teams.length === 2 && (
              <div className="mt-6 flex justify-center gap-3 bg-gray-50 p-3 rounded-lg">
                <HelpButton 
                  icon={<Minus className="h-4 w-4" />}
                  label="خصم"
                  tooltip="خصم الإجابة الخاطئة"
                  onClick={() => {
                    setHelpUsed(prev => ({ ...prev, discount: true }));
                  }}
                  disabled={helpUsed.discount}
                />
                
                <HelpButton 
                  icon={<Phone className="h-4 w-4" />}
                  label="عكس"
                  tooltip="تبديل الدور"
                  onClick={() => {
                    setHelpUsed(prev => ({ ...prev, swap: true }));
                    moveToNextTeam();
                  }}
                  disabled={helpUsed.swap}
                />
                
                <HelpButton 
                  icon={<UserX className="h-4 w-4" />}
                  label="تخطي"
                  tooltip="تخطي السؤال"
                  onClick={() => {
                    setHelpUsed(prev => ({ ...prev, skip: true }));
                    navigate(`/play/${gameId}`);
                  }}
                  disabled={helpUsed.skip}
                />
              </div>
            )}
            
            {/* أزرار التحكم */}
            <div className="mt-6 flex justify-center gap-4">
              {!showAnswer ? (
                // عرض زر "عرض الإجابة" فقط إذا لم تُعرض الإجابة بعد
                <Button
                  onClick={() => {
                    setShowAnswer(true);
                    // بعد إظهار الإجابة، نبدأ المؤقت
                    setTimeout(() => {
                      if (!timerRunning) {
                        startTimer();
                      }
                    }, 100);
                  }}
                  className="px-8 py-6 h-auto text-xl bg-green-600 hover:bg-green-700 shadow-md rounded-full"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  عرض الإجابة
                </Button>
              ) : (
                // عرض زر "منو جاوب؟" فقط بعد عرض الإجابة
                <Button
                  onClick={handleRecordAnswer}
                  className="px-8 py-6 h-auto text-xl bg-sky-600 hover:bg-sky-700 shadow-md rounded-full"
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  منو جاوب؟
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* مربع حوار اختيار الفريق */}
      <Dialog
        open={showTeamSelection}
        onOpenChange={(open) => setShowTeamSelection(open)}
      >
        <ModalDialogContent className={getModalClass()}>
          <DialogHeader>
            <DialogTitle className="text-xl">من أجاب على السؤال؟</DialogTitle>
            <DialogDescription>اختر الفريق الذي أجاب أو اختر "لم يُجب أحد"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {questionData.teams.map((team, index) => (
                <AnswerTeamButton
                  key={team.id}
                  team={team}
                  index={index}
                  onClick={(teamIndex) => {
                    submitAnswer(true, teamIndex); // تسجيل إجابة صحيحة مع تمرير رقم الفريق
                    setShowTeamSelection(false);
                  }}
                  disabled={isSubmitting}
                />
              ))}
              <Button
                variant="outline"
                className="h-16 text-lg col-span-full shadow-md flex items-center gap-2 justify-center"
                onClick={() => {
                  submitAnswer(false); // تسجيل لم يُجب أحد
                  setShowTeamSelection(false);
                }}
                disabled={isSubmitting}
              >
                👁‍🗨 لم يُجب أحد
              </Button>
            </div>
          </div>
        </ModalDialogContent>
      </Dialog>
    </div>
  );
}