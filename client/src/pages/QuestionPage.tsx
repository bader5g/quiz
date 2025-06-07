import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useTimer } from "../hooks/use-timer";
import {
  GameHeader,
  QuestionCard,
  SidebarPanel,
  LoadingScreen,
  ErrorDisplay,
} from "../components/question-page";
import type { GameSettings } from "@shared/schema";

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
  mediaType?: "image" | "video" | null;
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
  gameName?: string;
  logoUrl?: string;
}

export default function QuestionPage() {
  const { gameId, questionId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: gameSettings } = useQuery<GameSettings>({
    queryKey: ["/api/game-settings"],
    staleTime: 60000,
  });

  const searchParams = new URLSearchParams(window.location.search);
  const requestedDifficulty = parseInt(searchParams.get("difficulty") || "1");
  const requestedMainCategory = searchParams.get("category");
  const requestedSubcategory = searchParams.get("subcategory");

  // --- state
  const [questionData, setQuestionData] = useState<QuestionDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⬇️ نظام الدور والدور الحالي (مهم)
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [questionTurn, setQuestionTurn] = useState(0);

  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // دالة وقت الدور حسب إعدادات اللعبة (يدور تلقائيا مع تكرار الأدوار)
  function getTimeForThisTurn(turn: number): number {
    if (!gameSettings) return 30;
    const mod = turn % 4;
    
    // التأكد من أن القيم هي أرقام
    const firstTime = typeof gameSettings.defaultFirstAnswerTime === 'number' ? gameSettings.defaultFirstAnswerTime : 30;
    const secondTime = typeof gameSettings.defaultSecondAnswerTime === 'number' ? gameSettings.defaultSecondAnswerTime : 15;
    
    if (mod === 0) return firstTime;
    if (mod === 1) return secondTime;
    if (mod === 2) {
      // التحقق من وجود الخاصية والتأكد من نوعها
      const thirdTime = 'defaultThirdAnswerTime' in gameSettings && typeof gameSettings.defaultThirdAnswerTime === 'number' 
        ? gameSettings.defaultThirdAnswerTime 
        : secondTime;
      return thirdTime;
    }
    if (mod === 3) {
      // التحقق من وجود الخاصية والتأكد من نوعها
      const fourthTime = 'defaultFourthAnswerTime' in gameSettings && typeof gameSettings.defaultFourthAnswerTime === 'number'
        ? gameSettings.defaultFourthAnswerTime 
        : secondTime;
      return fourthTime;
    }
    return secondTime;
  }

  // --- نظام انتقال الدور (يفعّل المؤقت للفريق التالي وupdate turn)
  const moveToNextTeam = useCallback(async () => {
    if (!questionData || isChangingTeam) return;
    setIsChangingTeam(true);

    // تحديث عداد الدور sessionStorage و state
    const key = `question_${questionId}_turn`;
    let turn = Number(sessionStorage.getItem(key) || 0);
    turn += 1;
    sessionStorage.setItem(key, turn.toString());
    setQuestionTurn(turn);

    // دوّر على الفريق التالي وحدث الواجهة فورًا
    const nextTeamIndex = (currentTeamIndex + 1) % questionData.teams.length;
    setCurrentTeamIndex(nextTeamIndex);

    try {
      await apiRequest("POST", `/api/games/${gameId}/update-team`, {
        teamIndex: nextTeamIndex,
      });
      toast({
        title: "تم تبديل الدور",
        description: `الدور الآن للفريق: ${questionData.teams[nextTeamIndex].name}`,
      });
    } catch {
      toast({
        title: "خطأ في تبديل الدور",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
    setIsChangingTeam(false);
  }, [
    questionData,
    currentTeamIndex,
    gameId,
    toast,
    questionId,
    isChangingTeam,
  ]);

  // --- عند فتح السؤال: reset عداد الدور
  useEffect(() => {
    if (!questionId) return;
    const turnKey = `question_${questionId}_turn`;
    sessionStorage.setItem(turnKey, "0");
    setQuestionTurn(0);
  }, [questionId]);

  // --- جلب بيانات السؤال وتحديد الفريق الحالي من الباك
  const fetchFreshQuestion = useCallback(async () => {
    setLoading(true);
    let categoryParam = requestedMainCategory ? `&category=${requestedMainCategory}` : "";
    let subcategoryParam = requestedSubcategory ? `&subcategory=${requestedSubcategory}` : "";
    const response = await apiRequest(
      "GET",
      `/api/games/${gameId}/questions/${questionId}?difficulty=${requestedDifficulty}${categoryParam}${subcategoryParam}`,
    );
    if (response.status === 404) {
      setNotFoundError(true);
      setError("السؤال المطلوب غير موجود.");
      setLoading(false);
      return;
    }
    const qData = await response.json();
    const gameResponse = await apiRequest("GET", `/api/games/${gameId}`);
    const gameData = await gameResponse.json();
    setCurrentTeamIndex(gameData.currentTeamIndex); // ⬅️ تحديث الفريق الحالي بالدور
    await apiRequest("POST", `/api/games/${gameId}/mark-question-viewed`, {
      questionId: parseInt(questionId as string),
      main_category_code: qData.question.main_category_code,
      subcategory_id: qData.question.subcategory_id,
      difficulty: requestedDifficulty,
    });
    setQuestionData({
      ...qData,
      gameName: gameData?.name,
      logoUrl: gameData?.logoUrl,
    });
    setShowAnswer(false);
    setError(null);
    setLoading(false);
  }, [
    gameId,
    questionId,
    requestedDifficulty,
    requestedMainCategory,
    requestedSubcategory,
  ]);

  // --- المؤقت حسب الدور الحالي والدور التراكمي
  const { timeLeft, timerRunning, startTimer, resetTimer, stopTimer } = useTimer({
    initialTime: questionData ? getTimeForThisTurn(questionTurn) : 30,
    onTimeExpired: moveToNextTeam,
    teamName: questionData?.teams[currentTeamIndex]?.name,
  });

  // تحديث المؤقت عند تغيير الفريق أو الدور
  useEffect(() => {
    if (!questionData || loading) return;
    startTimer();
    // eslint-disable-next-line
  }, [questionData, currentTeamIndex, questionTurn, loading]);

  useEffect(() => {
    if (gameId && questionId) fetchFreshQuestion();
  }, [gameId, questionId, fetchFreshQuestion]);

  // --- Reset timer = يبقى نفس الدور الحالي
  const handleResetTimer = useCallback(
    (showToast = false) => {
      resetTimer(showToast);
    },
    [resetTimer]
  );

  const submitAnswer = async (isCorrect: boolean, teamIndex?: number) => {
    if (isSubmitting || !questionData) return;
    setIsSubmitting(true);
    stopTimer();
    
    const idx = typeof teamIndex === "number" ? teamIndex : currentTeamIndex;
    const team = questionData.teams[idx];
    try {
      await apiRequest("POST", `/api/games/${gameId}/answer`, {
        questionId: parseInt(questionId as string),
        difficulty: requestedDifficulty,
        teamIndex: idx,
        isCorrect,
      });
      toast({
        title: isCorrect ? "إجابة صحيحة!" : "إجابة خاطئة",
        description: isCorrect
          ? `تم إضافة ${requestedDifficulty} نقطة لفريق ${team?.name}`
          : `لم يحصل فريق ${team?.name} على نقاط.`,
      });
      await moveToNextTeam();
      setTimeout(() => {
        navigate(`/play/${gameId}`);
      }, 1000);
    } catch {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإجابة. أعد المحاولة.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAndBack = async () => {
    stopTimer();
    setShowAnswer(false);
    await moveToNextTeam();
    setTimeout(() => {
      navigate(`/play/${gameId}`);
    }, 400);
  };

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        isNotFound={notFoundError} 
        gameId={gameId} 
        onBackClick={(isNotFound) => navigate(isNotFound ? "/" : `/play/${gameId}`)} 
      />
    );
  }
  
  if (loading || !questionData) {
    return <LoadingScreen />;
  }
  
  const currentTeam = questionData.teams[currentTeamIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-gray-50 to-amber-50">
      <GameHeader 
        gameName={questionData.gameName}
        logoUrl={questionData.logoUrl}
        currentTeam={{
          name: currentTeam.name,
          color: currentTeam.color
        }}
        onBackClick={closeAndBack}
      />
      
      <div className="container mx-auto py-4 px-4 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-9">
            <QuestionCard 
              question={questionData.question}
              showAnswer={showAnswer}
              difficulty={requestedDifficulty}
              teamColor={currentTeam.color}
            />
          </div>
          <div className="md:col-span-3">
            <SidebarPanel 
              timeLeft={timeLeft}
              timerRunning={timerRunning}
              maxTime={getTimeForThisTurn(questionTurn)}
              onResetTimer={() => handleResetTimer(true)}
              onChangeTeam={moveToNextTeam}
              isDisabled={isSubmitting || isChangingTeam}
              showAnswer={showAnswer}
              onShowAnswer={() => setShowAnswer(true)}
              teams={questionData.teams}
              onSubmitAnswer={submitAnswer}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
