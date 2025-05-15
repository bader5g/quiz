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
  const handleEndGame = async () => {
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
  const handleSelectQuestion = (questionId: number) => {
    navigate(`/play/${gameId}/question/${questionId}`);
  };

  // العودة إلى صفحة ألعابي
  const handleBackToMyGames = () => {
    navigate('/my-games');
  };
  
  // تحديث نقاط الفريق
  const handleUpdateScore = async (teamIndex: number, change: number) => {
    if (!game) return;
    
    // لا نسمح بأن تقل النقاط عن صفر
    if (game.teams[teamIndex].score + change < 0) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يمكن أن تقل النقاط عن صفر',
      });
      return;
    }
    
    try {
      // تحديث النقاط محليا أولا للاستجابة السريعة للمستخدم
      const updatedTeams = [...game.teams];
      updatedTeams[teamIndex].score += change;
      
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

        {/* عرض النتائج */}
        <GameScoreBoard 
          teams={game.teams} 
          currentTeamIndex={game.currentTeamIndex}
          onUpdateScore={handleUpdateScore}
        />

        {/* عرض الفئات والأسئلة */}
        <GameCategories 
          categories={game.categories}
          questions={game.questions}
          teams={game.teams}
          currentTeamIndex={game.currentTeamIndex}
          onSelectQuestion={handleSelectQuestion}
        />
      </div>
    </div>
  );
}