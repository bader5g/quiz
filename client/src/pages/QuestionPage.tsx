import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  Loader2,
  CheckCircle,
  UserX,
  RefreshCcw,
  RotateCw,
  HelpCircle,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
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
  const requestedCategoryId = searchParams.get("categoryId");

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

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // دالة وقت الدور حسب إعدادات اللعبة (يدور تلقائيا مع تكرار الأدوار)
  function getTimeForThisTurn(turn: number) {
    if (!gameSettings) return 30;
    const mod = turn % 4;
    if (mod === 0) return gameSettings.defaultFirstAnswerTime ?? 30;
    if (mod === 1) return gameSettings.defaultSecondAnswerTime ?? 15;
    if (mod === 2 && "defaultThirdAnswerTime" in gameSettings)
      return (
        gameSettings.defaultThirdAnswerTime ??
        gameSettings.defaultSecondAnswerTime ??
        15
      );
    if (mod === 3 && "defaultFourthAnswerTime" in gameSettings)
      return (
        gameSettings.defaultFourthAnswerTime ??
        gameSettings.defaultSecondAnswerTime ??
        15
      );
    return gameSettings.defaultSecondAnswerTime ?? 15;
  }

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
    let categoryParam = requestedCategoryId
      ? `&categoryId=${requestedCategoryId}`
      : "";
    const response = await apiRequest(
      "GET",
      `/api/games/${gameId}/questions/${questionId}?difficulty=${requestedDifficulty}${categoryParam}`,
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
      categoryId: qData.question.categoryId,
      difficulty: requestedDifficulty,
    });
    setQuestionData({
      ...qData,
      gameName: gameData?.name,
      logoUrl: gameData?.logoUrl,
    });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowAnswer(false);
    setError(null);
    setLoading(false);
  }, [
    gameId,
    questionId,
    requestedDifficulty,
    requestedCategoryId,
    gameSettings,
  ]);

  // --- المؤقت حسب الدور الحالي والدور التراكمي
  useEffect(() => {
    if (!questionData || loading) return;
    const time = getTimeForThisTurn(questionTurn);
    setTimeLeft(time);
    setTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerRunning(false);
          moveToNextTeam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // eslint-disable-next-line
  }, [questionData, currentTeamIndex, questionTurn, loading]);

  useEffect(() => {
    if (gameId && questionId) fetchFreshQuestion();
  }, [gameId, questionId, fetchFreshQuestion]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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

  // --- Reset timer = يبقى نفس الدور الحالي
  const resetTimer = useCallback(
    (showToast = false) => {
      const time = getTimeForThisTurn(questionTurn);
      setTimeLeft(time);
      if (showToast) {
        toast({
          title: "تم تجديد الوقت",
          description: questionData
            ? `تم إعادة ضبط المؤقت للفريق: ${questionData.teams[currentTeamIndex].name}`
            : "تم تجديد المؤقت",
        });
      }
      setTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setTimerRunning(false);
            moveToNextTeam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [
      gameSettings,
      questionTurn,
      toast,
      questionData,
      currentTeamIndex,
      moveToNextTeam,
    ],
  );

  const submitAnswer = async (isCorrect: boolean, teamIndex?: number) => {
    if (isSubmitting || !questionData) return;
    setIsSubmitting(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
    setShowAnswer(false);
    await moveToNextTeam();
    setTimeout(() => {
      navigate(`/play/${gameId}`);
    }, 400);
  };

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
  if (loading || !questionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">
          جاري تحميل السؤال...
        </h2>
        <p className="text-gray-500 text-center">يرجى الانتظار قليلًا</p>
      </div>
    );
  }
  const currentTeam = questionData.teams[currentTeamIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-gray-50 to-amber-50">
      <header className="bg-white shadow-sm py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeAndBack}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center font-semibold text-lg">
            {questionData?.gameName || "جاوب"}
          </div>
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
        <div className="container mx-auto mt-2 flex justify-center">
          <Badge
            variant="outline"
            className="bg-white flex items-center gap-1 py-2 px-4 border-2"
            style={{ borderColor: currentTeam?.color || "#ccc" }}
          >
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: currentTeam?.color || "#ccc" }}
            />
            <span>الدور: {currentTeam?.name || "غير محدد"}</span>
          </Badge>
        </div>
      </header>
      <div className="container mx-auto py-4 px-4 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-9">
            <Card className="overflow-hidden">
              <div
                className="h-12 flex items-center justify-between px-4"
                style={{ backgroundColor: `${currentTeam?.color || "#ddd"}22` }}
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
                      requestedDifficulty === 1
                        ? "#4caf5022"
                        : requestedDifficulty === 2
                          ? "#ff980022"
                          : "#f4433622",
                  }}
                >
                  {requestedDifficulty} نقاط
                </Badge>
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-center mb-4">
                  {questionData.question.text}
                </h2>
                {questionData.question.imageUrl && (
                  <div className="my-4 flex justify-center">
                    <img
                      src={questionData.question.imageUrl}
                      alt="صورة السؤال"
                      className="max-w-full max-h-96 rounded-lg shadow-md"
                    />
                  </div>
                )}
                {questionData.question.videoUrl && (
                  <div className="my-4 flex justify-center">
                    <video
                      src={questionData.question.videoUrl}
                      controls
                      className="max-w-full max-h-96 rounded-lg shadow-md"
                    />
                  </div>
                )}
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
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-2">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`text-3xl font-semibold ${timeLeft <= 5 && timerRunning ? "text-red-600 animate-pulse" : ""}`}
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
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - timeLeft / getTimeForThisTurn(questionTurn))}`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="50"
                        cx="60"
                        cy="60"
                      />
                    </svg>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={moveToNextTeam}
                      disabled={isSubmitting || isChangingTeam}
                    >
                      <RotateCw className="h-4 w-4" />
                      <span>تبديل الدور</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => resetTimer(true)}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      <span>تجديد</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowAnswer(true)}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
                    disabled={showAnswer}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>عرض الإجابة</span>
                  </Button>
                  {showAnswer && (
                    <div className="mt-4 space-y-2">
                      {questionData.teams.map((team, idx) => (
                        <Button
                          key={team.id}
                          variant="outline"
                          className="w-full h-12 flex items-center justify-center gap-2 border-2"
                          style={{
                            borderColor: team.color,
                            backgroundColor: `${team.color}11`,
                          }}
                          onClick={() => submitAnswer(true, idx)}
                          disabled={isSubmitting}
                        >
                          <CheckCircle
                            className="h-5 w-5"
                            style={{ color: team.color }}
                          />
                          <span style={{ color: team.color }}>
                            الفريق: {team.name}
                          </span>
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full h-12 flex items-center justify-center gap-2 border-2 border-gray-300 mt-3"
                        onClick={() => submitAnswer(false)}
                        disabled={isSubmitting}
                      >
                        <UserX className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          لا أحد أجاب
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
