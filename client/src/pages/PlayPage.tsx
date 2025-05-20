// النسخة الكاملة من صفحة PlayPage بعد تعديل منطق التحديث عند العودة لتحديث currentTeamIndex
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSite } from "@/context/SiteContext";
import { GameLoading } from "@/components/game/GameLoading";
import { GameError } from "@/components/game/GameError";
import { GameHeader } from "@/components/game/GameHeader";
import { GameScoreBoard } from "@/components/game/GameScoreBoard";
import { GameCategories } from "@/components/game/GameCategories";

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
  difficulty: 1 | 2 | 3;
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
  viewedQuestionIds?: number[];
}

export default function PlayPage() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { siteSettings } = useSite();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(
        "GET",
        `/api/games/${gameId}?t=${Date.now()}`,
      );
      const gameData = await response.json();
      setGame(gameData);
      setError(null);
    } catch (err) {
      console.error("Error fetching game details:", err);
      setError("حدث خطأ أثناء تحميل اللعبة.");
      toast({
        variant: "destructive",
        title: "خطأ في التحميل",
        description: "يرجى المحاولة لاحقًا.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) fetchGameDetails();
  }, [gameId]);

  useEffect(() => {
    let isUpdating = false;

    const updateGameData = async () => {
      if (isUpdating || !gameId) return;
      try {
        isUpdating = true;
        const response = await apiRequest(
          "GET",
          `/api/games/${gameId}?t=${Date.now()}`,
        );
        const gameData = await response.json();
        setGame(gameData);
        setError(null);
      } catch (err) {
        console.error("تحديث اللعبة فشل:", err);
      } finally {
        isUpdating = false;
      }
    };

    // تنفيذ تحديثات متعددة متتالية لضمان تحديث البيانات بشكل كامل
    const forceUpdateWithDelay = () => {
      console.log("⚡ تنفيذ تحديث فوري للعبة...");
      updateGameData();

      // تنفيذ سلسلة من التحديثات المتتالية للتأكد من الحصول على أحدث البيانات
      const delayTimes = [300, 800, 1500, 3000];
      delayTimes.forEach((delay) => {
        setTimeout(() => {
          console.log(`⏱️ تحديث مجدول بعد ${delay}ms...`);
          updateGameData();
        }, delay);
      });
    };

    window.addEventListener("focus", forceUpdateWithDelay);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") forceUpdateWithDelay();
    });
    window.addEventListener("popstate", forceUpdateWithDelay);

    return () => {
      window.removeEventListener("focus", forceUpdateWithDelay);
      document.removeEventListener("visibilitychange", forceUpdateWithDelay);
      window.removeEventListener("popstate", forceUpdateWithDelay);
    };
  }, [gameId]);

  useEffect(() => {
    if (game && game.questions.length > 0) {
      const viewed = game.viewedQuestionIds || [];
      const allViewed = game.questions
        .map((q) => q.id)
        .every((id) => viewed.includes(id));
      const allAnswered = game.questions.every((q) => q.isAnswered);
      if (allViewed || allAnswered) {
        toast({
          title: "انتهت اللعبة",
          description: "سيتم الانتقال إلى صفحة النتائج.",
        });
        setTimeout(() => handleEndGame(), 2000);
      }
    }
  }, [game]);

  const handleEndGame = async () => {
    try {
      await apiRequest("POST", `/api/games/${gameId}/end`);
      navigate(`/game-result/${gameId}`);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "فشل الإنهاء",
        description: "تعذر إنهاء اللعبة.",
      });
    }
  };

  const handleSaveAndExit = async () => {
    if (!window.confirm("هل تريد حفظ اللعبة والخروج؟")) return;
    try {
      await apiRequest("POST", `/api/games/${gameId}/save`);
      navigate("/my-games");
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حفظ اللعبة.",
      });
    }
  };

  const handleSelectQuestion = (questionId: number, difficulty: number) => {
    const question = game?.questions.find((q) => q.id === questionId);
    if (
      !question ||
      question.isAnswered ||
      (game?.viewedQuestionIds || []).includes(questionId)
    ) {
      toast({
        title: "تنبيه",
        description: "هذا السؤال تم عرضه أو الإجابة عليه.",
        variant: "destructive",
      });
      return;
    }
    navigate(
      `/play/${gameId}/question/${questionId}?difficulty=${difficulty}&categoryId=${question.categoryId}`,
    );
  };

  const handleBackToMyGames = () => {
    navigate("/my-games");
  };

  // وظيفة جديدة للتبديل اليدوي للدور إلى الفريق التالي
  const handleSwitchTeam = async () => {
    if (!game) return;

    // حساب مؤشر الفريق التالي بشكل دوري
    const nextTeamIndex = (game.currentTeamIndex + 1) % game.teams.length;

    try {
      // تحديث واجهة المستخدم فوراً
      setGame({ ...game, currentTeamIndex: nextTeamIndex });

      // إرسال التحديث للخادم
      await apiRequest("POST", `/api/games/${gameId}/update-team`, {
        teamIndex: nextTeamIndex,
      });

      console.log(
        `🔄 تم تبديل الدور يدوياً من الفريق ${game.currentTeamIndex} إلى الفريق ${nextTeamIndex}`,
      );

      // تنبيه المستخدم
      toast({
        title: "تم تبديل الدور",
        description: `الدور الآن للفريق: ${game.teams[nextTeamIndex].name}`,
      });
    } catch (err) {
      console.error("خطأ في تبديل الدور:", err);
      fetchGameDetails(); // استرجاع حالة اللعبة في حالة الخطأ
    }
  };

  const handleUpdateScore = async (teamIndex: number, change: number) => {
    if (!game) return;
    const newScore = Math.max(0, game.teams[teamIndex].score + change);
    const updatedTeams = [...game.teams];
    updatedTeams[teamIndex].score = newScore;
    setGame({ ...game, teams: updatedTeams });
    try {
      await apiRequest(
        "PATCH",
        `/api/games/${gameId}/teams/${teamIndex}/score`,
        { scoreChange: change },
      );
    } catch (err) {
      console.error(err);
      fetchGameDetails();
    }
  };

  if (loading) return <GameLoading />;
  if (error)
    return <GameError error={error} onBackToMyGames={handleBackToMyGames} />;
  if (!game)
    return (
      <GameError
        error="اللعبة غير موجودة."
        onBackToMyGames={handleBackToMyGames}
      />
    );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50"
    >
      <div className="container mx-auto p-4 pb-8">
        <GameHeader
          key={`header-team-${game.currentTeamIndex}-${Date.now()}`}
          logoUrl={siteSettings?.logoUrl}
          appName={siteSettings?.appName}
          gameName={game.name}
          currentTeam={game.teams[game.currentTeamIndex]}
          onSaveAndExit={handleSaveAndExit}
          onEndGame={handleEndGame}
          onSwitchTeam={handleSwitchTeam}
        />

        <GameCategories
          key={game.currentTeamIndex}
          categories={game.categories}
          questions={game.questions.map((q) => ({
            ...q,
            isAnswered:
              q.isAnswered || (game.viewedQuestionIds || []).includes(q.id),
          }))}
          teams={game.teams}
          currentTeamIndex={game.currentTeamIndex}
          onSelectQuestion={handleSelectQuestion}
        />

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
