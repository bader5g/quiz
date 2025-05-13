import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'wouter';
import { formatDistance } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, ClipboardIcon, RefreshCwIcon, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// @ts-ignore - تجاهل مشكلة استيراد المكون
import ReplayGameModal from '@/components/game/ReplayGameModal';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/context/UserContext';

// تعريف نوع Category لتحويل البيانات من API
interface GameCategory {
  id: number; 
  name: string;
  icon: string;
}

// تعريف نوع Team
interface GameTeam {
  name: string;
  score: number;
}

// تعريف نوع GameSession كما تعود من API
interface GameSessionResponse {
  id: number;
  userId: number;
  gameName: string;
  teams: GameTeam[];
  answerTimeFirst: number;
  answerTimeSecond: number;
  selectedCategories: number[];
  createdAt: string;
}

// تعريف نوع GameSummary كما نستخدمه في واجهة المستخدم
interface GameSummary {
  id: string;
  name: string;
  categories: GameCategory[];
  createdAt: string;
  playCount: number;
  teamsCount: number;
  answerTimeFirst: number;
  answerTimeSecond: number;
}

// حساب عدد الصفحات
function getPaginationRange(totalItems: number, itemsPerPage: number, currentPage: number = 1) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  
  return {
    totalPages,
    startIndex,
    endIndex,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}

export default function MyGamesPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [maxGamesPerPage, setMaxGamesPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedGame, setSelectedGame] = useState<GameSummary | null>(null);
  const [replayModalOpen, setReplayModalOpen] = useState<boolean>(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();

  // تحويل معرفات الفئات إلى كائنات الفئات
  const getCategoryInfo = (categoryId: number): GameCategory => {
    // قائمة بجميع الفئات المتاحة
    const allCategories: GameCategory[] = [
      { id: 11, name: "كيمياء", icon: "⚗️" },
      { id: 12, name: "فيزياء", icon: "🔬" },
      { id: 13, name: "أحياء", icon: "🧬" },
      { id: 14, name: "فلك", icon: "🔭" },
      { id: 21, name: "جبر", icon: "➗" },
      { id: 22, name: "هندسة", icon: "📐" },
      { id: 23, name: "إحصاء", icon: "📊" },
      { id: 24, name: "حساب", icon: "🔢" },
      { id: 31, name: "تاريخ", icon: "🏛️" },
      { id: 32, name: "جغرافيا", icon: "🌍" },
      { id: 33, name: "فن", icon: "🎨" },
      { id: 34, name: "أدب", icon: "📖" },
      { id: 35, name: "موسيقى", icon: "🎵" },
      { id: 36, name: "رياضة", icon: "⚽" },
      { id: 41, name: "برمجة", icon: "👨‍💻" },
      { id: 42, name: "شبكات", icon: "🌐" },
      { id: 43, name: "ذكاء صناعي", icon: "🤖" },
      { id: 44, name: "تطبيقات", icon: "📱" }
    ];
    
    return allCategories.find(cat => cat.id === categoryId) || 
           { id: categoryId, name: "فئة غير معروفة", icon: "❓" };
  };
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        // استخدام معرف المستخدم من السياق، أو الافتراضي للاختبار
        const userId = user?.id || 1;
        const [gamesResponse, settingsResponse] = await Promise.all([
          axios.get<GameSessionResponse[]>(`/api/users/${userId}/game-sessions`),
          axios.get('/api/admin-settings')
        ]);
        
        // تحويل البيانات من بنية GameSessionResponse إلى GameSummary
        const formattedGames: GameSummary[] = gamesResponse.data.map(session => ({
          id: session.id.toString(),
          name: session.gameName,
          categories: session.selectedCategories.map(catId => getCategoryInfo(catId)),
          createdAt: session.createdAt,
          playCount: 1, // في التطبيق الحقيقي يمكن أن يكون لديك حقل playCount
          teamsCount: session.teams.length,
          answerTimeFirst: session.answerTimeFirst,
          answerTimeSecond: session.answerTimeSecond
        }));
        
        // تحميل الألعاب
        setGames(formattedGames);
        
        // تحديث الحد الأقصى للألعاب في الصفحة إذا كان متاحًا
        if (settingsResponse.data && settingsResponse.data.max_games_per_page) {
          setMaxGamesPerPage(settingsResponse.data.max_games_per_page);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('حدث خطأ أثناء تحميل الألعاب');
        toast({
          title: "خطأ في التحميل",
          description: "تعذر تحميل قائمة الألعاب الخاصة بك",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [toast, user]);

  const handleViewGameLog = (gameId: string) => {
    navigate(`/game-log/${gameId}`);
  };

  const handleReplayGame = (game: GameSummary) => {
    setSelectedGame(game);
    setReplayModalOpen(true);
  };

  const formatCreatedAt = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), {
        addSuffix: true,
        locale: arSA
      });
    } catch (error) {
      return 'تاريخ غير صالح';
    }
  };
  
  // التنقل بين الصفحات
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // إذا كان جاري التحميل، نعرض هيكل تحميل
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8" dir="rtl">
          <h1 className="text-3xl font-bold mb-8 text-right">ألعابي</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // إذا كان هناك خطأ، نعرض رسالة الخطأ
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center" dir="rtl">
          <h1 className="text-3xl font-bold mb-4">ألعابي</h1>
          <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // إذا لم تكن هناك ألعاب، نعرض رسالة فارغة
  if (games.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center" dir="rtl">
          <h1 className="text-3xl font-bold mb-4">ألعابي</h1>
          <div className="bg-blue-50 text-blue-700 p-8 rounded-lg shadow max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-2">لا توجد ألعاب حتى الآن</h2>
            <p className="mb-4">لم تقم بإنشاء أي لعبة بعد. ابدأ بإنشاء لعبة جديدة للاستمتاع مع أصدقائك!</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              إنشاء لعبة جديدة
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // حساب معلومات التصفح
  const pagination = getPaginationRange(games.length, maxGamesPerPage, currentPage);
  const paginatedGames = games.slice(pagination.startIndex, pagination.endIndex + 1);

  // عرض الألعاب
  return (
    <Layout>
      <div className="container mx-auto py-8" dir="rtl">
        <h1 className="text-3xl font-bold mb-8 text-right">ألعابي</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {paginatedGames.map((game) => (
            <Card key={game.id} className="shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{game.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <span className="flex items-center text-blue-700">
                    <RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
                    {game.playCount} مرة لعب
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center text-gray-500 text-xs">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          {formatCreatedAt(game.createdAt)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent dir="rtl">
                        <p>تاريخ الإنشاء: {new Date(game.createdAt).toLocaleDateString('ar-SA')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap gap-1 mb-3 mt-1">
                  {game.categories.map((category) => (
                    <Badge key={category.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full border-0">
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </Badge>
                  ))}
                </div>
                
                {/* معلومات إضافية عن اللعبة */}
                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {game.teamsCount} فرق
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {game.answerTimeFirst}/{game.answerTimeSecond} ث
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between p-4 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-700 border-gray-200 hover:bg-gray-100"
                  onClick={() => handleViewGameLog(game.id)}
                >
                  <ClipboardIcon className="h-4 w-4 mr-1" />
                  سجل اللعبة
                </Button>
                
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleReplayGame(game)}
                >
                  <RefreshCwIcon className="h-4 w-4 mr-1" />
                  إعادة اللعب
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* التصفح عبر الصفحات */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                السابق
              </Button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
        
        {/* مودال إعادة اللعب */}
        {selectedGame && (
          <ReplayGameModal
            open={replayModalOpen}
            onOpenChange={setReplayModalOpen}
            game={selectedGame}
          />
        )}
      </div>
    </Layout>
  );
}