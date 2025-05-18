import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useSite } from '@/context/SiteContext';

// استيراد المكونات الفرعية
import { GameLoading } from '@/components/game/GameLoading';
import { GameError } from '@/components/game/GameError';
import { GameHeader } from '@/components/game/GameHeader';
import { GameScoreBoard } from '@/components/game/GameScoreBoard';
import { GameCategories } from '@/components/game/GameCategories';

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
  viewedQuestionIds?: number[]; // قائمة معرفات الأسئلة التي تم عرضها
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

  // استدعاء وظيفة جلب البيانات عند تحميل الصفحة وتغيير معرف اللعبة
  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);
  
  // آلية محسنة للتحديث عند العودة للصفحة
  useEffect(() => {
    // متغير للتعقب حالة التحديث
    let isUpdating = false;
    
    // دالة جلب البيانات المحدثة مباشرة من الخادم
    const updateGameData = async () => {
      if (isUpdating || !gameId) return; // منع التحديثات المتزامنة
      
      try {
        isUpdating = true;
        console.log("تحديث بيانات اللعبة من الخادم...");
        
        // استخدام apiRequest بدلاً من fetch للاستفادة من التعامل مع الأخطاء
        const response = await apiRequest('GET', `/api/games/${gameId}`);
        const gameData = await response.json();
        
        // تحديث حالة اللعبة في واجهة المستخدم
        setGame(gameData);
        
        console.log(`🎮 تم تحديث الدور الحالي: الفريق ${gameData.teams[gameData.currentTeamIndex].name}`);
        console.log(`📊 مؤشر الفريق الحالي: ${gameData.currentTeamIndex}`);
        
        setError(null);
      } catch (err) {
        console.error('خطأ في تحديث بيانات اللعبة:', err);
        toast({
          title: "خطأ في تحديث البيانات",
          description: "حدثت مشكلة أثناء تحديث بيانات اللعبة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        isUpdating = false;
      }
    };
    
    // استدعاء عند تحميل الصفحة لأول مرة
    updateGameData();
    
    // تحديث البيانات عند العودة للصفحة - مع محاولات متكررة لضمان تحديث الواجهة
    const handleFocus = () => {
      if (document.hasFocus() && gameId) {
        // تحديث فوري
        updateGameData();
        
        // تحديث مرة أخرى بعد تأخير قصير للتأكد من تحديث البيانات
        setTimeout(() => {
          updateGameData();
        }, 500);
      }
    };
    
    // تحديث البيانات عند عودة النافذة للمقدمة
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gameId) {
        // تحديث فوري
        updateGameData();
        
        // تحديث إضافي بعد تأخير قصير
        setTimeout(() => {
          updateGameData();
        }, 500);
      }
    };
    
    // تحديث البيانات عند العودة من صفحة أخرى (popstate)
    const handleRouteChange = () => {
      if (gameId) {
        // تحديث فوري ثم مرة أخرى بعد تأخير
        updateGameData();
        
        // تحديث مؤجل للتأكد من تحديث الواجهة بعد تغييرات الخادم
        setTimeout(() => {
          updateGameData();
        }, 800);
      }
    };
    
    // إضافة مستمعات الأحداث
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleRouteChange);
    
    // إزالة مستمعات الأحداث عند إزالة المكون
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [gameId]);
  
  // التحقق إذا كانت جميع الأسئلة قد تمت مشاهدتها أو الإجابة عليها
  useEffect(() => {
    if (game && game.questions.length > 0) {
      // التحقق من الأسئلة التي تم عرضها باستخدام خاصية viewedQuestionIds
      const viewedQuestionIds = game.viewedQuestionIds || [];
      const totalQuestions = game.questions.length;
      const questionIds = game.questions.map(q => q.id);
      
      // هل جميع أسئلة اللعبة موجودة في قائمة الأسئلة التي تم عرضها
      const allQuestionsViewed = questionIds.every(id => viewedQuestionIds.includes(id));
      
      if (allQuestionsViewed || game.questions.every(q => q.isAnswered)) {
        // عرض رسالة تنبيه ثم الانتقال إلى صفحة النتائج
        toast({
          title: "انتهت جميع الأسئلة",
          description: "انتهت اللعبة! سيتم الانتقال إلى صفحة النتائج النهائية.",
        });
        
        // ننتظر قليلاً قبل الانتقال للسماح للمستخدم برؤية الرسالة
        setTimeout(() => {
          handleEndGame();
        }, 2000);
      }
    }
  }, [game]);

  // إنهاء اللعبة
  const handleEndGame = async () => {
    // إذا تم استدعاء الدالة من التحقق التلقائي للأسئلة المنتهية، لا نعرض التأكيد
    const isCalledFromAutoCheck = new Error().stack?.includes('setTimeout');
    
    if (!isCalledFromAutoCheck && !window.confirm('هل أنت متأكد من رغبتك في إنهاء اللعبة؟ سيتم احتساب النقاط الحالية واختيار الفائز.')) {
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
  const handleSaveAndExit = async () => {
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
  const handleSelectQuestion = (questionId: number, difficulty: number) => {
    // العثور على السؤال في قائمة الأسئلة للحصول على معرف الفئة
    const question = game?.questions.find(q => q.id === questionId);
    
    // إذا كان السؤال موجودًا وتمت الإجابة عليه بالفعل، نمنع الانتقال
    if (question && question.isAnswered) {
      toast({
        title: "تنبيه",
        description: "تمت الإجابة على هذا السؤال بالفعل",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من قائمة الأسئلة التي تم عرضها
    const viewedQuestionIds = game?.viewedQuestionIds || [];
    if (viewedQuestionIds.includes(questionId) || (question && question.questionId === -1)) {
      toast({
        title: "تنبيه",
        description: "تم عرض هذا السؤال بالفعل، اختر سؤالًا آخر",
        variant: "destructive"
      });
      return;
    }
    
    if (question) {
      navigate(`/play/${gameId}/question/${questionId}?difficulty=${difficulty}&categoryId=${question.categoryId}`);
    } else {
      navigate(`/play/${gameId}/question/${questionId}?difficulty=${difficulty}`);
    }
  };

  // العودة إلى صفحة ألعابي
  const handleBackToMyGames = () => {
    navigate('/my-games');
  };
  
  // تحديث نقاط الفريق
  const handleUpdateScore = async (teamIndex: number, change: number) => {
    if (!game) return;
    
    // لا نسمح بأن تقل النقاط عن صفر - عدلنا للتحقق بطريقة مباشرة
    const newScore = Math.max(0, game.teams[teamIndex].score + change);
    
    // إذا كان التغيير سيؤدي إلى نقاط سالبة، نوقف العملية ونعرض رسالة
    if (newScore === 0 && change < 0) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'لا يمكن أن تقل النقاط عن صفر',
      });
      // نستمر بالتنفيذ ولكن مع تعيين القيمة إلى صفر بدلاً من إلغاء العملية
    }
    
    try {
      // تحديث النقاط محليا أولا للاستجابة السريعة للمستخدم باستخدام Math.max
      const updatedTeams = [...game.teams];
      updatedTeams[teamIndex].score = newScore;
      
      setGame({
        ...game,
        teams: updatedTeams
      });
      
      // إرسال التحديث إلى الخادم
      await apiRequest('PATCH', `/api/games/${gameId}/teams/${teamIndex}/score`, {
        scoreChange: change
      });
      
    } catch (err) {
      console.error('Error updating team score:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث النقاط. يرجى المحاولة مرة أخرى.',
      });
      
      // استعادة حالة اللعبة من الخادم في حالة حدوث خطأ
      const response = await apiRequest('GET', `/api/games/${gameId}`);
      const gameData = await response.json();
      setGame(gameData);
    }
  };

  // استخدام "return early" لتقليل التعشيش
  if (loading) {
    return <GameLoading />;
  }

  if (error) {
    return <GameError error={error} onBackToMyGames={handleBackToMyGames} />;
  }

  if (!game) {
    return <GameError error="لم يتم العثور على اللعبة المطلوبة." onBackToMyGames={handleBackToMyGames} />;
  }

  // تحديد الفريق الحالي
  const currentTeam = game.teams[game.currentTeamIndex];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <div className="container mx-auto p-4 pb-8">
        {/* هيدر اللعبة */}
        <GameHeader
          logoUrl={siteSettings?.logoUrl}
          appName={siteSettings?.appName}
          gameName={game.name}
          currentTeam={currentTeam}
          onSaveAndExit={handleSaveAndExit}
          onEndGame={handleEndGame}
        />

        {/* عرض الفئات والأسئلة */}
        <GameCategories 
          categories={game.categories}
          questions={game.questions.map(q => ({
            ...q,
            // تحديد إذا كان هذا السؤال قد تمت مشاهدته بالفعل
            isAnswered: q.isAnswered || (game.viewedQuestionIds || []).includes(q.id)
          }))}
          teams={game.teams}
          currentTeamIndex={game.currentTeamIndex}
          onSelectQuestion={handleSelectQuestion}
        />
        
        {/* عرض النتائج في نهاية الصفحة */}
        <div className="mt-10">
          <GameScoreBoard 
            teams={game.teams} 
            currentTeamIndex={game.currentTeamIndex}
            onUpdateScore={handleUpdateScore}
          />
        </div>
      </div>
    </div>
  );
}