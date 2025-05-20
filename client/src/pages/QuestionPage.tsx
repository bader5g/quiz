import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  Loader2,
  CheckCircle,
  UserX,
  RefreshCcw,
  RotateCw,
  HelpCircle,
  AlertTriangle,
  LogOut,
  Flag,
  Filter,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: number;
  text: string;
  answer: string;
  difficulty: number;
  categoryId: number;
  categoryName: string;
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
  answerTimes: number[];
  gameId: number;
  gameName?: string;
  logoUrl?: string;
}

export default function QuestionPage() {
  const { gameId, questionId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const requestedDifficulty = parseInt(searchParams.get("difficulty") || "1");
  const requestedCategoryId = searchParams.get("categoryId");
  const requestedSubcategoryId = searchParams.get("subcategoryId");
  
  // حالة الفئات والفئات الفرعية والمستويات
  interface Category {
    id: number;
    name: string;
    icon?: string;
    imageUrl?: string;
    children?: Subcategory[];
  }
  
  interface Subcategory {
    id: number;
    name: string;
    icon?: string;
    imageUrl?: string;
    categoryId: number;
  }
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(requestedCategoryId ? parseInt(requestedCategoryId) : null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(requestedSubcategoryId ? parseInt(requestedSubcategoryId) : null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(requestedDifficulty);

  const [questionData, setQuestionData] = useState<QuestionDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // منطق الدور المحلي
  const [startTeamIndex, setStartTeamIndex] = useState(0);
  const [questionTurn, setQuestionTurn] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // الفريق الحالي في السؤال
  const localTeamIndex = questionData
    ? (startTeamIndex + questionTurn) % questionData.teams.length
    : 0;
  const currentTeam =
    questionData && questionData.teams
      ? questionData.teams[localTeamIndex]
      : null;

  function getTimeForThisTurn() {
    if (!questionData || !questionData.answerTimes) return 30;
    // استخدم رقم الدور (questionTurn) بدلاً من localTeamIndex
    return (
      questionData.answerTimes[
        questionTurn % questionData.answerTimes.length
      ] ?? 30
    );
  }

  // جلب الفئات
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/categories-with-children");
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error("خطأ في جلب الفئات:", err);
    }
  }, []);
  
  // جلب الفئات الفرعية بناءً على الفئة المختارة
  const fetchSubcategories = useCallback(async (categoryId: number) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    
    try {
      const response = await apiRequest("GET", `/api/subcategories?categoryId=${categoryId}`);
      const data = await response.json();
      setSubcategories(data || []);
    } catch (err) {
      console.error("خطأ في جلب الفئات الفرعية:", err);
    }
  }, []);
  
  // عند تغيير الفئة المختارة
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchSubcategories]);
  
  // جلب الفئات عند تحميل الصفحة
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // جلب بيانات السؤال
  const fetchFreshQuestion = useCallback(async () => {
    setLoading(true);
    let categoryParam = requestedCategoryId
      ? `&categoryId=${requestedCategoryId}`
      : "";
    let subcategoryParam = requestedSubcategoryId
      ? `&subcategoryId=${requestedSubcategoryId}`
      : "";
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

    setStartTeamIndex(gameData.currentTeamIndex || 0);
    setQuestionTurn(0);

    await apiRequest("POST", `/api/games/${gameId}/mark-question-viewed`, {
      questionId: parseInt(questionId as string),
      categoryId: qData.question.categoryId,
      difficulty: requestedDifficulty,
    });
    setQuestionData({
      ...qData,
      gameName: gameData?.name,
      logoUrl: gameData?.logoUrl,
      answerTimes: qData.answerTimes || gameData.answerTimes,
    });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowAnswer(false);
    setError(null);
    setLoading(false);
  }, [gameId, questionId, requestedDifficulty, requestedCategoryId]);

  // المؤقت
  useEffect(() => {
    if (!questionData || loading) return;
    const time = getTimeForThisTurn();
    setTimeLeft(time);
    setTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerRunning(false);
          // إذا لم نصل لآخر فريق، انتقل للدور التالي
          if (questionTurn + 1 < questionData.teams.length) {
            setQuestionTurn((prev) => prev + 1);
          }
          // إذا وصلنا لآخر فريق، توقف المؤقت فقط
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // eslint-disable-next-line
  }, [questionData, localTeamIndex, questionTurn, loading]);

  useEffect(() => {
    if (gameId && questionId) fetchFreshQuestion();
    // eslint-disable-next-line
  }, [gameId, questionId, fetchFreshQuestion]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // تبديل الدور اليدوي (زر)
  const handleManualSwitch = () => {
    if (!questionData) return;
    if (questionTurn + 1 < questionData.teams.length) {
      setQuestionTurn((prev) => prev + 1);
      setTimeLeft(getTimeForThisTurn());
      setTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setTimerRunning(false);
            if (questionTurn + 2 < questionData.teams.length) {
              setQuestionTurn((prev) => prev + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // إعادة ضبط المؤقت
  const resetTimer = useCallback(
    (showToast = false) => {
      const time = getTimeForThisTurn();
      setTimeLeft(time);
      if (showToast) {
        toast({
          title: "تم تجديد الوقت",
          description: questionData
            ? `تم إعادة ضبط المؤقت للفريق: ${currentTeam?.name}`
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
            if (questionTurn + 1 < questionData!.teams.length) {
              setQuestionTurn((prev) => prev + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [toast, questionData, currentTeam, questionTurn],
  );

  // عند تغيير الفئة أو الفئة الفرعية أو المستوى، نعيد توجيه المستخدم
  const handleFilterChange = () => {
    let url = `/play/${gameId}/question/${questionId}?difficulty=${selectedDifficulty}`;
    
    if (selectedCategoryId) {
      url += `&categoryId=${selectedCategoryId}`;
    }
    
    if (selectedSubcategoryId) {
      url += `&subcategoryId=${selectedSubcategoryId}`;
    }
    
    navigate(url);
  };
  
  // مكون اختيار الفئة والفئة الفرعية والمستوى
  const FilterDialog = () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full gap-1">
            <Filter className="h-4 w-4" />
            <span>فلترة</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center mb-4">اختيار فئة وصعوبة السؤال</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* اختيار الفئة */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الفئة الرئيسية</label>
              <Select
                value={selectedCategoryId?.toString() || ""}
                onValueChange={(value) => setSelectedCategoryId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة الرئيسية" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* اختيار الفئة الفرعية */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الفئة الفرعية</label>
              <Select
                value={selectedSubcategoryId?.toString() || ""}
                onValueChange={(value) => setSelectedSubcategoryId(parseInt(value))}
                disabled={!selectedCategoryId || subcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcat: Subcategory) => (
                    <SelectItem key={subcat.id} value={subcat.id.toString()}>
                      {subcat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* اختيار المستوى */}
            <div className="space-y-2">
              <label className="text-sm font-medium">مستوى الصعوبة</label>
              <Select
                value={selectedDifficulty.toString()}
                onValueChange={(value) => setSelectedDifficulty(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستوى الصعوبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">سهل (1 نقطة)</SelectItem>
                  <SelectItem value="2">متوسط (2 نقطة)</SelectItem>
                  <SelectItem value="3">صعب (3 نقاط)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button onClick={handleFilterChange} className="w-full">
              تطبيق الفلتر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // عند الإجابة
  const submitAnswer = async (isCorrect: boolean, teamIndex?: number) => {
    if (isSubmitting || !questionData) return;
    setIsSubmitting(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const idx = typeof teamIndex === "number" ? teamIndex : localTeamIndex;
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

      // الدور الأساسي الذي دخلت به الصفحة
      const nextTeamIndex = (startTeamIndex + 1) % questionData.teams.length;
      await apiRequest("POST", `/api/games/${gameId}/update-team`, {
        teamIndex: nextTeamIndex,
      });

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

  // ScoreBoard UI
  const ScoreBoard = () => (
    <div className="flex flex-wrap justify-center gap-2 my-4 bg-white rounded-lg border border-gray-200 p-2 shadow-sm max-w-xs mx-auto">
      {questionData?.teams.map((team, idx) => (
        <div
          key={team.id}
          className={`flex flex-col items-center px-2 py-1 rounded-md border transition-all duration-300 text-xs font-bold ${
            idx === localTeamIndex
              ? "border-blue-500 bg-blue-50"
              : "border-gray-100 bg-gray-50"
          }`}
          style={{ minWidth: 70 }}
        >
          <span style={{ color: team.color }}>{team.name}</span>
          <span style={{ color: team.color }}>{team.score}</span>
        </div>
      ))}
    </div>
  );

  // أزرار الفرق بشكل صفوف متناسقة
  const TeamsAnswerButtons = () => {
    const teams = questionData.teams;
    const rows = [];
    for (let i = 0; i < teams.length; i += 2) {
      rows.push(
        <div key={i} className="flex gap-2 mb-2 w-full">
          <Button
            key={teams[i].id}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center gap-2 border-2"
            style={{
              borderColor: teams[i].color,
              backgroundColor: `${teams[i].color}11`,
              color: teams[i].color,
              minWidth: 90,
            }}
            onClick={() => submitAnswer(true, i)}
            disabled={isSubmitting}
          >
            <CheckCircle
              className="h-4 w-4"
              style={{ color: teams[i].color }}
            />
            <span>{teams[i].name}</span>
          </Button>
          {teams[i + 1] && (
            <Button
              key={teams[i + 1].id}
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-2 border-2"
              style={{
                borderColor: teams[i + 1].color,
                backgroundColor: `${teams[i + 1].color}11`,
                color: teams[i + 1].color,
                minWidth: 90,
              }}
              onClick={() => submitAnswer(true, i + 1)}
              disabled={isSubmitting}
            >
              <CheckCircle
                className="h-4 w-4"
                style={{ color: teams[i + 1].color }}
              />
              <span>{teams[i + 1].name}</span>
            </Button>
          )}
        </div>,
      );
    }
    // زر "ولا أحد جاوب"
    rows.push(
      <div key="noone" className="flex w-full justify-center mt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center justify-center gap-2 border-2 border-gray-300 bg-gray-50 font-bold w-1/2"
          onClick={() => submitAnswer(false)}
          disabled={isSubmitting}
        >
          <UserX className="h-4 w-4 text-gray-600" />
          <span className="text-gray-600">ولا أحد جاوب</span>
        </Button>
      </div>,
    );
    return <div className="w-full max-w-md mx-auto">{rows}</div>;
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-gray-50 to-amber-50">
      {/* الهيدر */}
      <header className="bg-white shadow-sm py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            {questionData?.logoUrl && (
              <img
                src={questionData.logoUrl}
                alt="شعار الموقع"
                className="h-10 object-contain"
              />
            )}
          </div>
          <div className="text-center font-bold text-xl flex-1">
            {questionData?.gameName || "جاوب"}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (window.confirm("هل تريد حفظ اللعبة والخروج؟")) {
                  apiRequest("POST", `/api/games/${gameId}/save`).then(() =>
                    navigate("/my-games"),
                  );
                }
              }}
              className="rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (window.confirm("هل تريد إنهاء اللعبة نهائيًا؟")) {
                  apiRequest("POST", `/api/games/${gameId}/end`).then(() =>
                    navigate(`/game-result/${gameId}`),
                  );
                }
              }}
              className="rounded-full"
            >
              <Flag className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* المؤقت وأزرار التحكم بالدور */}
      <div className="container mx-auto flex flex-col items-center mt-6 mb-2">
        <div className="flex items-center gap-4 mb-2">
          {/* زر تبديل الدور اليدوي */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={handleManualSwitch}
            disabled={questionTurn + 1 >= questionData.teams.length}
          >
            <RotateCw className="h-5 w-5" />
          </Button>
          {/* المؤقت */}
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 120 120">
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
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - timeLeft / getTimeForThisTurn())}`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
              />
            </svg>
            <span
              className={`text-2xl font-bold mt-1 ${timeLeft <= 5 && timerRunning ? "text-red-600 animate-pulse" : ""}`}
              style={{ minWidth: 40, textAlign: "center" }}
            >
              {timeLeft}
            </span>
          </div>
          {/* زر تجديد الوقت */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => resetTimer(true)}
            disabled={isSubmitting}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>
        {/* الدور الحالي */}
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

      {/* ScoreBoard */}
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <FilterDialog />
        </div>
        <ScoreBoard />
        <div></div> {/* عنصر فارغ للمحافظة على توازن التصميم */}
      </div>

      <div className="container mx-auto py-4 px-4 flex-grow">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden mb-6">
            <div
              className="h-12 flex items-center justify-between px-4"
              style={{ backgroundColor: `${currentTeam?.color || "#ddd"}22` }}
            >
              <Badge variant="outline" className="gap-1">
                <span>{questionData?.question?.categoryName || "الفئة"}</span>
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
                {questionData?.question?.difficulty || requestedDifficulty} نقاط
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

              {/* زر عرض الإجابة */}
              {!showAnswer && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setShowAnswer(true)}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow"
                    disabled={showAnswer}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>عرض الإجابة</span>
                  </Button>
                </div>
              )}

              {/* عند عرض الإجابة */}
              {showAnswer && (
                <>
                  <hr className="my-6 border-t-2 border-green-200" />
                  <Alert className="mt-6 bg-green-50 border-green-500 animate-fade-in">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="font-bold text-green-600">
                      الإجابة الصحيحة: {questionData.question.answer}
                    </AlertDescription>
                  </Alert>
                  {/* أزرار الفرق وزر لا أحد جاوب */}
                  <TeamsAnswerButtons />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
