import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/context/UserContext';
import { CategorySelectionModal } from '@/components/game/CategorySelectionModal';
import { GameSettingsModal } from '@/components/game/GameSettingsModal';
import { useToast } from '@/hooks/use-toast';
import UserTrophyStats from '@/components/user/UserTrophyStats';

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
}

interface CategoryParent {
  id: number;
  name: string;
  icon: string;
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
}

export default function Home() {
  const { user, isAuthenticated, logout } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for data
  const [categories, setCategories] = useState<CategoryParent[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for UI
  const [selectedCategories, setSelectedCategories] = useState<CategoryChild[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGameSettingsModal, setShowGameSettingsModal] = useState(false);

  // Fetch categories and game settings on load
  useEffect(() => {
    fetchCategories();
    fetchGameSettings();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.get('/api/categories-with-children');
      setCategories(res.data);
      setLoading(false);
    } catch (err) {
      console.error("فشل تحميل الفئات", err);
      setError("حدث خطأ أثناء تحميل الفئات، يرجى المحاولة مرة أخرى");
      setLoading(false);
    }
  };

  // Fetch game settings from API
  const fetchGameSettings = async () => {
    try {
      const res = await axios.get('/api/game-settings');
      setGameSettings(res.data);
    } catch (err) {
      console.error("فشل تحميل إعدادات اللعبة", err);
      // Use default settings if API fails
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
        pageDescription: "اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!"
      });
    }
  };

  // Handle category selection
  const handleCategoryClick = (category: CategoryChild) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول لاختيار الفئات وبدء اللعبة",
        variant: "default",
      });
      navigate('/login');
      return;
    }

    // Check if category is already selected
    const alreadySelected = selectedCategories.some(cat => cat.id === category.id);
    let newSelectedCategories: CategoryChild[];
    
    if (alreadySelected) {
      // Remove if already selected
      newSelectedCategories = selectedCategories.filter(cat => cat.id !== category.id);
    } else {
      // Check if max categories limit reached
      if (selectedCategories.length >= (gameSettings?.maxCategories || 8)) {
        toast({
          title: "الحد الأقصى للفئات",
          description: `لا يمكنك اختيار أكثر من ${gameSettings?.maxCategories || 8} فئات`,
          variant: "destructive",
        });
        return;
      }
      
      // Add new category
      newSelectedCategories = [...selectedCategories, category];
    }
    
    // Update selected categories
    setSelectedCategories(newSelectedCategories);
    
    // Show modal after selection/deselection
    setShowCategoryModal(true);
  };

  // Start the game setup process
  const handleStartGame = async () => {
    // If user is authenticated, check if they have enough cards
    if (isAuthenticated) {
      try {
        // Get user cards
        const response = await axios.get('/api/user-cards');
        const userCards = response.data;
        const totalAvailableCards = userCards.freeCards + userCards.paidCards;
        
        // Check if user has enough cards
        if (totalAvailableCards < selectedCategories.length) {
          toast({
            title: "كروت غير كافية",
            description: `لديك ${totalAvailableCards} كروت فقط، بينما اخترت ${selectedCategories.length} فئات. الرجاء اختيار عدد أقل من الفئات أو الحصول على المزيد من الكروت.`,
            variant: "destructive",
          });
          setShowCategoryModal(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching user cards:', error);
      }
    }
    
    // If all good, proceed to game settings
    setShowCategoryModal(false);
    setShowGameSettingsModal(true);
  };

  // Render page description dynamically
  const pageDescription = gameSettings?.pageDescription || "اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!";

  return (
    <div dir="rtl" className="min-h-screen bg-sky-50 p-6 relative">
      {/* أزرار التسجيل */}
      <div className="absolute top-4 left-6 flex gap-3">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => navigate('/profile')}
              className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-4 py-1.5 rounded-md font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>الملف الشخصي</span>
            </button>
            <button 
              onClick={() => logout()}
              className="border border-red-300 text-red-600 hover:bg-red-50 transition-colors px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>تسجيل الخروج</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => navigate('/login')} 
              className="text-blue-600 hover:bg-blue-50 border border-blue-300 transition-colors px-3 py-1.5 rounded-md font-medium"
            >
              تسجيل الدخول
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-4 py-1.5 rounded-md font-medium"
            >
              إنشاء حساب
            </button>
          </>
        )}
      </div>

      {/* User status section - only visible for authenticated users */}
      {isAuthenticated && (
        <div className="pt-8 md:pt-12 pb-2">
          <UserTrophyStats />
        </div>
      )}

      {/* الشعار والنص */}
      <div className="text-center pt-6 md:pt-8 pb-8">
        <h1 className="text-6xl md:text-7xl font-extrabold text-blue-700 mb-3 mt-4">جاوب</h1>
        <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto">{pageDescription}</p>
      </div>

      {/* عرض الفئات */}
      <div className="flex-grow">
        {loading ? (
          <div className="space-y-10 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-40" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-4">
                  <Button variant="outline" onClick={fetchCategories}>
                    إعادة المحاولة
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-12 max-w-6xl mx-auto">
            {categories.map((parent) => (
              <div key={parent.id} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center justify-center gap-2">
                  <span className="text-3xl">{parent.icon}</span>
                  <span>{parent.name}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {parent.children.map((child) => {
                    const isSelected = selectedCategories.some(cat => cat.id === child.id);
                    return (
                      <div 
                        key={child.id} 
                        className={`p-5 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 flex flex-col items-center category-item ${
                          isSelected 
                            ? 'bg-blue-100 border-2 border-blue-500' 
                            : 'bg-white hover:bg-blue-50'
                        }`}
                        onClick={() => handleCategoryClick(child)}
                      >
                        <div className="text-3xl mb-3 category-icon">{child.icon}</div>
                        <div className="text-gray-800 font-medium text-center">{child.name}</div>
                        {isSelected && (
                          <div className="mt-2 text-blue-600 text-sm font-bold">✓ تم الاختيار</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* زر بدء اللعبة */}
      <div className="text-center py-10 pb-14">
        <Button
          onClick={() => {
            if (!isAuthenticated) {
              toast({
                title: "تسجيل الدخول مطلوب",
                description: "يرجى تسجيل الدخول لاختيار الفئات وبدء اللعبة",
                variant: "default",
              });
              navigate('/login');
            } else if (selectedCategories.length > 0) {
              setShowCategoryModal(true);
            } else {
              toast({
                title: "اختيار الفئات",
                description: "يرجى اختيار الفئات التي ترغب باللعب بها أولاً",
                variant: "default",
              });
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          size="lg"
        >
          {selectedCategories.length > 0 ? 'متابعة اللعب' : 'ابدأ اللعب'}
        </Button>
      </div>

      {/* Category Selection Modal */}
      <CategorySelectionModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        selectedCategories={selectedCategories}
        onStartGame={handleStartGame}
        minCategories={gameSettings?.minCategories || 4}
        maxCategories={gameSettings?.maxCategories || 8}
      />

      {/* Game Settings Modal */}
      <GameSettingsModal
        open={showGameSettingsModal}
        onOpenChange={setShowGameSettingsModal}
        selectedCategories={selectedCategories}
      />
    </div>
  );
}
