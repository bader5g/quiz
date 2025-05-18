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
  UserX,
  Trophy,
  Flag,
  Save
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
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
import { useQuery } from '@tanstack/react-query';
import type { GameSettings } from '@shared/schema';

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
  const { toast } = useToast();

  // استخراج معلومات مستوى الصعوبة والفئة من query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const questionNumber = searchParams.get("number") || "؟";
  // نحصل على مستوى الصعوبة، وفي حالة عدم وجوده نستخدم القيمة 1 (سهل) كإفتراضي
  const requestedDifficulty = parseInt(searchParams.get("difficulty") || "1");
  // نحصل على معرف الفئة إذا كان موجوداً
  const requestedCategoryId = searchParams.get("categoryId");

  // جلب إعدادات اللعبة من API لاستخدام الوقت الافتراضي منها
  const { data: gameSettings, isLoading: isLoadingSettings } = useQuery<GameSettings>({
    queryKey: ["/api/game-settings"],
    staleTime: 60000, // تحديث كل دقيقة
  });

  const [questionData, setQuestionData] = useState<QuestionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // استخدام إعدادات وسائل المساعدة
  const helpSettings = {
    helpToolsEnabled: true,
    onlyEnabledForTwoTeams: true,
    skipQuestionEnabled: true,
    pointDeductionEnabled: true,
    turnReverseEnabled: true,
  };

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
  
  // التحقق من إتاحة وسائل المساعدة (بناءً على عدد الفرق والإعدادات)
  const isHelpEnabled = helpSettings.helpToolsEnabled && 
    (!helpSettings.onlyEnabledForTwoTeams || (questionData?.teams.length === 2));

  // جلب تفاصيل السؤال
  useEffect(() => {
    const fetchQuestionDetails = async () => {
      try {
        setLoading(true);
        // إضافة مستوى الصعوبة إلى طلب الحصول على السؤال
        // إضافة معرف الفئة إلى طلب الحصول على السؤال إذا كان متوفراً
        const categoryParam = requestedCategoryId ? `&categoryId=${requestedCategoryId}` : '';
        const response = await apiRequest('GET', `/api/games/${gameId}/questions/${questionId}?difficulty=${requestedDifficulty}${categoryParam}`);

        // التحقق من الاستجابة إذا كانت 404 (غير موجود)
        if (response.status === 404) {
          setNotFoundError(true);
          setError('السؤال المطلوب غير موجود.');
          return;
        }

        const data = await response.json();

        // التحقق من أن السؤال المُسترجع يطابق مستوى الصعوبة المطلوب
        if (data.question.difficulty !== requestedDifficulty) {
          console.warn(`تم طلب سؤال بمستوى صعوبة ${requestedDifficulty} ولكن تم جلب سؤال بمستوى ${data.question.difficulty}`);
        }

        // استخدام إعدادات اللعبة من API إذا كانت متوفرة، أو استخدام القيم من الخادم
        let firstTime = data.firstAnswerTime;
        let secondTime = data.secondAnswerTime;
        
        // تحديث الأوقات فقط إذا كانت إعدادات اللعبة متوفرة من لوحة التحكم
        if (gameSettings) {
          console.log('استخدام أوقات الإجابة من إعدادات لوحة التحكم:', 
            gameSettings.defaultFirstAnswerTime, 
            gameSettings.defaultSecondAnswerTime
          );
          firstTime = gameSettings.defaultFirstAnswerTime;
          secondTime = gameSettings.defaultSecondAnswerTime;
        }
        
        // تحديث بيانات السؤال مع الأوقات المحدثة
        const updatedData = {
          ...data,
          firstAnswerTime: firstTime,
          secondAnswerTime: secondTime
        };
        
        setQuestionData(updatedData);

        // تعيين الفريق الحالي - تأكد من استخدام currentTeamIndex من قاعدة البيانات
        try {
          const gameResponse = await apiRequest('GET', `/api/games/${gameId}`);

          // التحقق إذا كانت اللعبة غير موجودة
          if (gameResponse.status === 404) {
            setNotFoundError(true);
            setError('اللعبة المطلوبة غير موجودة.');
            return;
          }
          
          // استخراج الفريق الحالي من بيانات اللعبة
          const gameData = await gameResponse.json();
          setCurrentTeamIndex(gameData.currentTeamIndex || 0);
          console.log(`تعيين الفريق الحالي: ${gameData.currentTeamIndex} (${gameData.teams[gameData.currentTeamIndex].name})`);
          
          // تحديث حالة السؤال ليكون "تم فتحه" بمجرد عرضه
          // هذا سيجعل السؤال غير قابل للاختيار مرة أخرى
          await apiRequest('POST', `/api/games/${gameId}/mark-question-viewed`, {
            questionId: parseInt(questionId as string),
            categoryId: data.question.categoryId,
            difficulty: requestedDifficulty
          });
          
          // تعيين الوقت بناءً على الفريق الحالي
          const currentTime = gameData.currentTeamIndex === 0 ? firstTime : secondTime;
          setTimeLeft(currentTime);
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

  // وظيفة بدء المؤقت - مع تبديل الدور تلقائياً عند انتهاء الوقت
  const startTimer = () => {
    // تحقق إن كان المؤقت يعمل مسبقًا أو الوقت صفر أو عدم وجود بيانات السؤال
    if (timerRunning || timeLeft <= 0 || !questionData) return;
    
    console.log(`⏱️ بدء المؤقت للفريق: ${questionData.teams[currentTeamIndex]?.name} بوقت ${timeLeft} ثانية`);
    
    setTimerRunning(true);
    if (timer) clearInterval(timer);

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          console.log("⏱️ انتهى الوقت للفريق!", questionData.teams[currentTeamIndex]?.name);
          
          // تبديل الدور تلقائياً للفريق التالي عند انتهاء الوقت
          setTimeout(() => {
            moveToNextTeam();
          }, 1000);
          
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setTimer(interval);
  };

  // تحويل الدور للفريق التالي
  const moveToNextTeam = async () => {
    try {
      // تحقق من وجود بيانات السؤال
      if (!questionData) {
        console.error('لا يمكن تبديل الدور: بيانات السؤال غير متوفرة');
        return;
      }

      // إيقاف المؤقت الحالي أولًا
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      setTimerRunning(false);
      
      // حساب الفريق التالي (الفريق الحالي + 1)
      const nextTeamIndex = currentTeamIndex + 1;

      // إذا وصلنا للفريق الأخير، نعود للفريق الأول (دورة كاملة)
      if (nextTeamIndex >= questionData.teams.length) {
        const resetTeamIndex = 0; // نعود للفريق الأول
        console.log(`🔄 تم الوصول لآخر فريق. العودة للفريق الأول.`);
        
        // تحديث الفريق الحالي في قاعدة البيانات
        await apiRequest('POST', `/api/games/${gameId}/update-team`, {
          teamIndex: resetTeamIndex
        });
        
        // تحديث الفريق في الواجهة
        setCurrentTeamIndex(resetTeamIndex);
        
        // إظهار رسالة توضيحية
        toast({
          title: "تمت دورة كاملة",
          description: `تم الانتقال للفريق: ${questionData.teams[resetTeamIndex].name}`,
        });
        
        return;
      }

      console.log(`🔄 تبديل الدور من الفريق ${currentTeamIndex} إلى الفريق ${nextTeamIndex}`);
      
      // تحديث الفريق الحالي في قاعدة البيانات
      await apiRequest('POST', `/api/games/${gameId}/update-team`, {
        teamIndex: nextTeamIndex
      });

      // تحديث الفريق الحالي في الواجهة
      setCurrentTeamIndex(nextTeamIndex);
      
      // تعيين الوقت المناسب للفريق الجديد
      // الفريق الذي تم اختياره للإجابة الأولى يحصل على الوقت الأول
      // وباقي الفرق تحصل على الوقت الثاني
      const isFirstTeam = questionData.currentTeamIndex === nextTeamIndex;
      const newTime = isFirstTeam
        ? questionData.firstAnswerTime
        : questionData.secondAnswerTime;
      
      console.log(`⏱️ تعيين وقت جديد: ${newTime} ثانية للفريق ${questionData.teams[nextTeamIndex].name}`);
      
      // ضبط الوقت الجديد
      setTimeLeft(newTime);
      
      // عرض رسالة تأكيد
      toast({
        title: "تم تبديل الدور",
        description: `الدور الآن للفريق: ${questionData.teams[nextTeamIndex].name}`
      });
      
      // تأخير قصير ثم بدء المؤقت للفريق الجديد تلقائياً
      setTimeout(() => {
        // بدء المؤقت للفريق الجديد
        startTimer();
      }, 500);
    } catch (error) {
      console.error("خطأ في تبديل الدور:", error);
      toast({
        title: "خطأ في تبديل الدور",
        description: "حدث خطأ أثناء تبديل الدور، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // تجديد المؤقت
  const resetTimer = () => {
    if (questionData) {
      // ضبط الوقت حسب الفريق الحالي
      const timeToSet = currentTeamIndex === 0 
        ? questionData.firstAnswerTime 
        : questionData.secondAnswerTime;

      console.log(`⏱️ تجديد الوقت: ${timeToSet} ثانية للفريق ${questionData.teams[currentTeamIndex].name}`);
      
      // إيقاف المؤقت الحالي إن وجد
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      setTimerRunning(false);
      
      // ضبط الوقت الجديد
      setTimeLeft(timeToSet);
      
      // بدء المؤقت من جديد
      startTimer();
      
      // عرض رسالة تأكيد
      toast({
        title: "تم تجديد الوقت",
        description: `تم إعادة ضبط المؤقت للفريق: ${questionData.teams[currentTeamIndex].name}`
      });
    }
  };

  // تشغيل المؤقت تلقائياً عند تحميل السؤال
  useEffect(() => {
    // فقط إذا تم تحميل البيانات
    if (questionData && !loading) {
      // الفريق الذي تم اختياره للسؤال يحصل على وقت الإجابة الأول
      // والفرق الأخرى تحصل على وقت الإجابة الثاني
      
      // نستخدم قيم افتراضية إذا كانت القيم غير موجودة
      const firstTeamTime = questionData.firstAnswerTime || 30;
      const secondTeamTime = questionData.secondAnswerTime || 15;
      
      // دائماً الفريق الأول الذي يظهر له السؤال يحصل على وقت الإجابة الأولى
      // بغض النظر عن رقم الفريق (سواء كان الأول أو الثاني أو الثالث أو الرابع)
      
      // نتحقق إذا كان هذا أول تحميل للسؤال
      const isFirstTimeLoading = !sessionStorage.getItem(`question_${questionId}_loaded`);
      
      // إذا كان أول تحميل للسؤال، نستخدم وقت الإجابة الأولى ونضع علامة أن السؤال تم تحميله
      if (isFirstTimeLoading) {
        console.log("هذا أول ظهور للسؤال - استخدام وقت الإجابة الأولى");
        sessionStorage.setItem(`question_${questionId}_loaded`, "true");
        sessionStorage.setItem(`question_${questionId}_first_team`, currentTeamIndex.toString());
      }
      
      // نتحقق من الفريق الذي حصل على السؤال أولاً
      const firstTeamForQuestion = sessionStorage.getItem(`question_${questionId}_first_team`);
      const isFirstTeamForQuestion = firstTeamForQuestion !== null && 
                                     parseInt(firstTeamForQuestion) === currentTeamIndex;
      
      // اختيار الوقت المناسب
      const currentTime = isFirstTimeLoading || isFirstTeamForQuestion
        ? firstTeamTime 
        : secondTeamTime;
        
      console.log(`⚡ تشغيل تلقائي للمؤقت - الفريق: ${questionData.teams[currentTeamIndex]?.name}، الوقت: ${currentTime}`);
      
      // إيقاف أي مؤقت سابق
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      
      // إعادة ضبط حالة المؤقت
      setTimerRunning(false);
      
      // ضبط الوقت للفريق الحالي
      setTimeLeft(currentTime);
      
      // تشغيل المؤقت تلقائياً بعد تأخير قصير
      const timerId = setTimeout(() => {
        startTimer();
      }, 500);
      
      // تنظيف المؤقت عند إلغاء التركيب
      return () => clearTimeout(timerId);
    }
  }, [questionData, loading, currentTeamIndex]);

  // تسجيل إجابة
  const submitAnswer = async (isCorrect: boolean, teamIndex?: number) => {
    try {
      // منع النقر المكرر
      if (isSubmitting) {
        return;
      }

      // تمكين حالة الإرسال
      setIsSubmitting(true);

      // استخدام مستوى الصعوبة المطلوب للنقاط (1 أو 2 أو 3)
      const points = requestedDifficulty;

      // استخدام مؤشر الفريق المحدد، أو الفريق الحالي إذا لم يتم تمرير أي مؤشر
      const selectedTeamIndex = typeof teamIndex === 'number' ? teamIndex : currentTeamIndex;
      const selectedTeam = questionData?.teams[selectedTeamIndex];

      // تحديث النتيجة في قاعدة البيانات
      await apiRequest('POST', `/api/games/${gameId}/answer`, {
        questionId: parseInt(questionId as string),
        difficulty: requestedDifficulty,
        teamIndex: selectedTeamIndex,
        isCorrect: isCorrect
      });

      // إيقاف المؤقت بعد تقديم الإجابة
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      setTimerRunning(false);

      // بعد الإجابة بواسطة الفريق الحالي، ننتقل إلى صفحة اللعب
      toast({
        title: isCorrect ? "إجابة صحيحة!" : "إجابة خاطئة",
        description: isCorrect 
          ? `تم إضافة ${points} نقطة لفريق ${selectedTeam?.name}. سيتم العودة إلى صفحة اللعب.` 
          : `لم يحصل فريق ${selectedTeam?.name} على نقاط. سيتم العودة إلى صفحة اللعب.`
      });

      // تبديل الدور تلقائياً للفريق التالي قبل العودة لصفحة اللعب
      const currentGameIndex = currentTeamIndex;
      const nextTeamIndex = (currentGameIndex + 1) % questionData.teams.length;
      
      // تحديث الفريق الحالي في قاعدة البيانات
      await apiRequest('POST', `/api/games/${gameId}/update-team`, {
        teamIndex: nextTeamIndex
      });
      
      console.log(`🔄 تم تبديل الدور تلقائياً من الفريق ${currentGameIndex} إلى الفريق ${nextTeamIndex} بعد الإجابة`);
      
      // العودة إلى صفحة اللعب بعد تأخير قصير
      setTimeout(() => {
        navigate(`/play/${gameId}`);
      }, 1500);
    } catch (err) {
      console.error('Error submitting answer:', err);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإجابة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      // إلغاء تفعيل حالة الإرسال
      setIsSubmitting(false);
    }
  };

  // إغلاق السؤال والعودة للخلف مع تبديل الدور للفريق التالي
  const closeQuestion = async () => {
    // إيقاف المؤقت إذا كان قيد التشغيل
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setTimerRunning(false);
    
    // التأكد من عدم عرض حوار اختيار الفريق عند العودة
    setShowTeamSelection(false);
    
    // تبديل الدور للفريق التالي
    if (questionData) {
      const nextTeamIndex = (currentTeamIndex + 1) % questionData.teams.length;
      
      try {
        // تحديث الفريق الحالي في قاعدة البيانات
        await apiRequest('POST', `/api/games/${gameId}/update-team`, {
          teamIndex: nextTeamIndex
        });
        
        console.log(`🔄 تم تبديل الدور تلقائياً من الفريق ${currentTeamIndex} إلى الفريق ${nextTeamIndex} عند الخروج من السؤال`);
        
        // عرض إشعار للمستخدم
        toast({
          title: "تم تبديل الدور",
          description: `الدور الآن للفريق: ${questionData.teams[nextTeamIndex].name}`
        });
      } catch (error) {
        console.error("خطأ في تبديل الدور:", error);
      }
    }
    
    // تأخير قصير ثم العودة إلى صفحة اللعب
    setTimeout(() => {
      navigate(`/play/${gameId}`);
    }, 500);
  };

  // معالجة تقديم النتيجة الإيجابية (إجابة صحيحة)
  const handleCorrectAnswer = () => {
    submitAnswer(true);
  };

  // معالجة تقديم النتيجة السلبية (إجابة خاطئة)
  const handleWrongAnswer = () => {
    submitAnswer(false);
  };

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">جاري تحميل السؤال...</h2>
        <p className="text-gray-500 text-center">يرجى الانتظار قليلًا</p>
      </div>
    );
  }

  // عرض رسالة الخطأ إذا حدث خطأ
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">حدث خطأ</h2>
        <p className="text-gray-500 text-center">{error}</p>
        <Button 
          className="mt-4" 
          onClick={() => navigate(notFoundError ? "/" : `/play/${gameId}`)}
        >
          {notFoundError ? "العودة للرئيسية" : "العودة للعبة"}
        </Button>
      </div>
    );
  }

  // التأكد من أن بيانات السؤال متوفرة
  if (!questionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">البيانات غير متوفرة</h2>
        <p className="text-gray-500 text-center">لم يتم العثور على بيانات السؤال. يرجى المحاولة مرة أخرى.</p>
        <Button 
          className="mt-4" 
          onClick={() => navigate(`/play/${gameId}`)}
        >
          العودة للعبة
        </Button>
      </div>
    );
  }

  // احصل على الفريق الحالي من البيانات
  const currentTeam = questionData.teams[currentTeamIndex];

  // الرجوع للواجهة الرئيسية
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-gray-50 to-amber-50">
      {/* رأس الصفحة */}
      <header className="bg-white shadow-sm py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* الجزء الأيمن - زر الرجوع */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeQuestion}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* الجزء الأوسط - اسم اللعبة */}
          <div className="text-center font-semibold text-lg">
            {questionData?.gameName || questionData?.question?.gameName || 'جاوب'}
          </div>
          
          {/* الجزء الأيسر - شعار الموقع */}
          <div>
            {questionData?.logoUrl && (
              <img 
                src={questionData.logoUrl} 
                alt="شعار الموقع" 
                className="h-8 object-contain"
              />
            )}
          </div>
        </div>
        
        {/* مؤشر الفريق الحالي أسفل شريط العنوان */}
        <div className="container mx-auto mt-2 flex justify-center">
          <Badge 
            variant="outline" 
            className="bg-white flex items-center gap-1 py-2 px-4 border-2"
            style={{ borderColor: currentTeam?.color || '#ccc' }}
          >
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: currentTeam?.color || '#ccc' }}
            />
            <span>الدور: {currentTeam?.name || 'غير محدد'}</span>
          </Badge>
        </div>
      </header>
      
      {/* محتوى السؤال */}
      <div className="container mx-auto py-4 px-4 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* معلومات السؤال */}
          <div className="md:col-span-9">
            <Card className="overflow-hidden">
              <div 
                className="h-12 flex items-center justify-between px-4" 
                style={{ backgroundColor: `${currentTeam?.color || '#ddd'}22` }}
              >
                <Badge variant="outline" className="gap-1">
                  <span className={questionData.question.categoryIcon}></span>
                  <span>{questionData.question.categoryName}</span>
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className="px-3 py-1"
                  style={{ 
                    backgroundColor: 
                      requestedDifficulty === 1 ? '#4caf5022' : 
                      requestedDifficulty === 2 ? '#ff980022' : '#f4433622' 
                  }}
                >
                  {requestedDifficulty} نقاط
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-center mb-4">{questionData.question.text}</h2>
                
                {/* إذا كان هناك صورة، اعرضها */}
                {questionData.question.imageUrl && (
                  <div className="my-4 flex justify-center">
                    <img 
                      src={questionData.question.imageUrl} 
                      alt="صورة السؤال" 
                      className="max-w-full max-h-96 rounded-lg shadow-md"
                    />
                  </div>
                )}
                
                {/* إذا كان هناك فيديو، اعرضه */}
                {questionData.question.videoUrl && (
                  <div className="my-4 flex justify-center">
                    <video 
                      src={questionData.question.videoUrl} 
                      controls 
                      className="max-w-full max-h-96 rounded-lg shadow-md"
                    />
                  </div>
                )}
                
                {/* عرض الإجابة عند الضغط على زر "عرض الإجابة" */}
                {showAnswer && (
                  <Alert className="mt-6 bg-green-50 border-green-500">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="font-bold text-green-600">
                      الإجابة الصحيحة: {questionData.question.answer}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* لوحة التحكم بالمؤقت والإجابة */}
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-4">
                {/* المؤقت */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-2">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span 
                        className={`text-3xl font-semibold ${
                          timeLeft <= 5 && timerRunning ? 'text-red-600 animate-pulse' : ''
                        }`}
                      >
                        {timeLeft}
                      </span>
                    </div>
                    <svg 
                      className="transform -rotate-90 w-28 h-28"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        className="text-gray-100"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="50"
                        cx="60"
                        cy="60"
                      />
                      <circle
                        className="text-blue-500"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - timeLeft / (currentTeamIndex === 0 ? questionData.firstAnswerTime : questionData.secondAnswerTime))}`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="50"
                        cx="60"
                        cy="60"
                      />
                    </svg>
                  </div>
                  
                  {/* أزرار التحكم بالمؤقت والدور */}
                  <div className="flex gap-2 mt-2">
                    {!timerRunning ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={moveToNextTeam} 
                        disabled={isSubmitting}
                      >
                        <RotateCw className="h-4 w-4" />
                        <span>تبديل الدور</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          if (timer) clearInterval(timer);
                          setTimerRunning(false);
                        }}
                      >
                        <Minus className="h-4 w-4" />
                        <span>إيقاف</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={resetTimer}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      <span>تجديد</span>
                    </Button>
                  </div>
                </div>
                
                {/* زر عرض الإجابة فقط */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowAnswer(true)}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
                    disabled={showAnswer}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>عرض الإجابة</span>
                  </Button>
                  
                  {/* إظهار أزرار الفرق فقط بعد عرض الإجابة */}
                  {showAnswer && (
                    <div className="mt-4 space-y-2">
                      {/* عرض أزرار الفرق الذين أجابوا بشكل صحيح */}
                      {questionData.teams.map((team, idx) => (
                        <Button
                          key={team.id}
                          variant="outline"
                          className="w-full h-12 flex items-center justify-center gap-2 border-2"
                          style={{ 
                            borderColor: team.color,
                            backgroundColor: `${team.color}11`
                          }}
                          onClick={() => {
                            submitAnswer(true, idx);
                            toast({
                              title: `إجابة صحيحة من ${team.name}!`,
                              description: `تم إضافة ${requestedDifficulty} نقاط للفريق.`,
                            });
                          }}
                          disabled={isSubmitting}
                        >
                          <CheckCircle className="h-5 w-5" style={{ color: team.color }} />
                          <span style={{ color: team.color }}>
                            الفريق: {team.name}
                          </span>
                        </Button>
                      ))}
                      
                      {/* زر لا أحد أجاب */}
                      <Button
                        variant="outline"
                        className="w-full h-12 flex items-center justify-center gap-2 border-2 border-gray-300 mt-3"
                        onClick={() => {
                          submitAnswer(false);
                          toast({
                            title: "لم يجب أي فريق",
                            description: "تم تسجيل عدم الإجابة والانتقال للفريق التالي.",
                          });
                        }}
                        disabled={isSubmitting}
                      >
                        <UserX className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">لا أحد أجاب</span>
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* تبديل الدور للفريق التالي */}
                {/* تم إزالة زر تبديل الدور من هنا لأنه موجود بالفعل في أزرار المؤقت */}
                
                {/* وسائل المساعدة */}
                {isHelpEnabled && (
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <h3 className="text-sm text-gray-500 mb-2">وسائل المساعدة:</h3>
                    <div className="flex justify-around">
                      {helpSettings.skipQuestionEnabled && (
                        <HelpButton
                          icon={<UserX size={16} />}
                          label="تخطي السؤال"
                          tooltip="تخطي هذا السؤال والعودة لصفحة اللعب"
                          onClick={() => {
                            setHelpUsed(prev => ({ ...prev, skip: true }));
                            toast({
                              title: "تم استخدام المساعدة",
                              description: "تم تخطي السؤال، سيتم العودة إلى صفحة اللعب."
                            });
                            setTimeout(() => navigate(`/play/${gameId}`), 1000);
                          }}
                          disabled={helpUsed.skip}
                        />
                      )}
                      
                      {helpSettings.pointDeductionEnabled && (
                        <HelpButton
                          icon={<Minus size={16} />}
                          label="خصم نقطة"
                          tooltip="خصم نقطة للحصول على مساعدة"
                          onClick={() => {
                            setHelpUsed(prev => ({ ...prev, discount: true }));
                            toast({
                              title: "تلميح",
                              description: "تحت التطوير - سيتم إضافة تلميح هنا"
                            });
                          }}
                          disabled={helpUsed.discount}
                        />
                      )}
                      
                      {helpSettings.turnReverseEnabled && (
                        <HelpButton
                          icon={<RotateCw size={16} />}
                          label="تغيير الدور"
                          tooltip="تبديل الدور مع الفريق الآخر"
                          onClick={() => {
                            setHelpUsed(prev => ({ ...prev, swap: true }));
                            moveToNextTeam();
                          }}
                          disabled={helpUsed.swap || currentTeamIndex >= questionData.teams.length - 1}
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}