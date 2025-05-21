import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/context/UserContext";
import { GameSettingsModal } from "@/components/game/GameSettingsModal";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
  imageUrl?: string;
  availableQuestions: number;
}

interface CategoryParent {
  id: number;
  name: string;
  icon?: string;
  imageUrl?: string;
  children: CategoryChild[];
}

interface GameSettings {
  minCategories: number;
  maxCategories: number;
  minTeams: number;
  maxTeams: number;
  maxGameNameLength: number;
  maxTeamNameLength: number;
  defaultFirstAnswerTime: number;
  defaultSecondAnswerTime: number;
  modalTitle: string;
  pageDescription: string;
  minQuestionsPerCategory: number;
}

export default function Home() {
  const { isAuthenticated } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [categories, setCategories] = useState<CategoryParent[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategoryChild[]>(
    [],
  );
  const [showGameSettingsModal, setShowGameSettingsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchGameSettings();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/categories-with-children");
      setCategories(res.data);
    } catch {
      setError("حدث خطأ أثناء تحميل الفئات");
    } finally {
      setLoading(false);
    }
  };

  const fetchGameSettings = async () => {
    try {
      const res = await axios.get("/api/game-settings");
      setGameSettings(res.data);
    } catch {
      setGameSettings({
        minCategories: 4,
        maxCategories: 8,
        minTeams: 2,
        maxTeams: 4,
        maxGameNameLength: 30,
        maxTeamNameLength: 20,
        defaultFirstAnswerTime: 30,
        defaultSecondAnswerTime: 15,
        modalTitle: "إعدادات اللعبة",
        pageDescription: "اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!",
        minQuestionsPerCategory: 6,
      });
    }
  };

  const handleCategoryClick = (category: CategoryChild) => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول لاختيار الفئات",
      });
      navigate("/auth");
      return;
    }

    const alreadySelected = selectedCategories.some(
      (cat) => cat.id === category.id,
    );
    if (alreadySelected) {
      setSelectedCategories((prev) =>
        prev.filter((cat) => cat.id !== category.id),
      );
    } else {
      if (selectedCategories.length >= (gameSettings?.maxCategories || 8)) {
        toast({ title: "الحد الأقصى للفئات" });
        return;
      }
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const handleStartGame = async () => {
    try {
      const res = await axios.get("/api/user-cards");
      const { freeCards, paidCards } = res.data;
      const total = freeCards + paidCards;
      if (total < selectedCategories.length) {
        toast({ title: "كروت غير كافية" });
        return;
      }
      setShowGameSettingsModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="p-6 relative">
        <div className="text-center pt-6 md:pt-8 pb-8">
          <h1 className="text-6xl md:text-7xl font-extrabold text-blue-700 mb-3 mt-4">
            جاوب
          </h1>
          <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {gameSettings?.pageDescription}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن فئة..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {selectedCategories.length > 0 && (
          <div className="sticky top-4 z-20 w-full md:w-1/5 md:ml-auto md:mr-0 bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-4 mb-8 transition-all duration-300 animate-fade-in">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h3 className="text-md font-bold text-blue-700">
                الفئات المختارة
              </h3>
              <button
                onClick={() => setSelectedCategories([])}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✖
              </button>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {selectedCategories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded px-2 py-1"
                >
                  <span className="text-sm flex items-center gap-1 truncate max-w-[80%]">
                    <span className="text-xl">{cat.icon}</span> {cat.name}
                  </span>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleStartGame}
              disabled={
                selectedCategories.length < (gameSettings?.minCategories || 4)
              }
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-full transition-all transform hover:scale-105 hover:shadow-lg"
            >
              ابدأ اللعب 🚀
            </Button>
          </div>
        )}

        <div className="flex-grow">
          {loading ? (
            <Skeleton className="h-28" />
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : (
            <div className="space-y-12 max-w-6xl mx-auto">
              {categories.map((parent) => {
                const filteredChildren = parent.children.filter((child) =>
                  child.name.toLowerCase().includes(searchTerm.toLowerCase()),
                );

                if (filteredChildren.length === 0) return null;

                return (
                  <div key={parent.id} className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center justify-center gap-2">
                      {parent.imageUrl ? (
                        <img 
                          src={parent.imageUrl} 
                          alt={parent.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ";
                          }}
                        />
                      ) : (
                        <span className="text-3xl">{parent.icon || "📚"}</span>
                      )}
                      <span>{parent.name}</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                      {filteredChildren.map((child) => {
                        const isSelected = selectedCategories.some(
                          (cat) => cat.id === child.id,
                        );
                        const isDisabled =
                          child.availableQuestions <
                          (gameSettings?.minQuestionsPerCategory || 6);

                        return (
                          <div
                            key={child.id}
                            className={`p-5 rounded-xl shadow-md flex flex-col items-center transition-all duration-200 ${
                              isDisabled
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : isSelected
                                  ? "bg-blue-100 border-2 border-blue-500"
                                  : "bg-white hover:bg-blue-50 cursor-pointer"
                            }`}
                            onClick={() =>
                              !isDisabled && handleCategoryClick(child)
                            }
                          >
                            <div className="mb-3">
                              {child.imageUrl ? (
                                <img 
                                  src={child.imageUrl} 
                                  alt={child.name}
                                  className="w-12 h-12 rounded-full object-cover mx-auto"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ";
                                  }}
                                />
                              ) : (
                                <span className="text-3xl">{child.icon}</span>
                              )}
                            </div>
                            <div className="text-center font-medium">
                              {child.name}
                            </div>
                            {isDisabled && (
                              <div className="mt-1 text-xs text-gray-500">
                                غير متوفرة حاليًا
                              </div>
                            )}
                            {isSelected && !isDisabled && (
                              <div className="mt-1 text-sm text-blue-600 font-bold">
                                ✓ تم الاختيار
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* زر بدء اللعبة الرئيسي */}
        <div className="text-center py-10 pb-14">
          <Button
            onClick={() => {
              if (!isAuthenticated) {
                toast({
                  title: "تسجيل الدخول مطلوب",
                  description: "يرجى تسجيل الدخول لاختيار الفئات وبدء اللعبة",
                });
                navigate('/auth');
              } else if (selectedCategories.length >= (gameSettings?.minCategories || 4)) {
                handleStartGame();
              } else if (selectedCategories.length > 0) {
                toast({
                  title: "عدد الفئات غير كافٍ",
                  description: `يجب اختيار ${gameSettings?.minCategories || 4} فئات على الأقل`,
                });
              } else {
                toast({
                  title: "اختيار الفئات",
                  description: "يرجى اختيار الفئات التي ترغب باللعب بها أولاً",
                });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            size="lg"
          >
            {selectedCategories.length >= (gameSettings?.minCategories || 4) 
              ? 'ابدأ اللعب الآن 🚀' 
              : selectedCategories.length > 0 
                ? `اختر ${(gameSettings?.minCategories || 4) - selectedCategories.length} فئات أخرى`
                : 'ابدأ اللعب'}
          </Button>
        </div>

        <GameSettingsModal
          open={showGameSettingsModal}
          onOpenChange={setShowGameSettingsModal}
          selectedCategories={selectedCategories}
          onGameCreated={(gameId) => {
            console.log("Game created with ID:", gameId);
            // تنقل المستخدم إلى صفحة اللعب
            navigate(`/play/${gameId}`);
          }}
        />
      </div>
    </Layout>
  );
}
