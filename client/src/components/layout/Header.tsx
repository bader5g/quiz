import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Zap, 
  GamepadIcon, 
  Ticket, 
  User, 
  LogOut, 
  Star
} from 'lucide-react';
import LeaderboardModal from '@/components/user/LeaderboardModal';
import UserStatus from '@/components/user/UserStatus'; 

interface SiteSettings {
  logoUrl: string;
  appName: string;
  faviconUrl: string;
}

interface UserLevel {
  level: string;
  badge: string;
  color: string;
  progress?: number;
  nextLevel?: string;
  requiredStars?: number;
  currentStars?: number;
}

interface UserCards {
  freeCards: number;
  paidCards: number;
  freeIcon: string;
  paidIcon: string;
}

export default function Header() {
  const { user, isAuthenticated, logout } = useUser();
  const [, navigate] = useLocation();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userCards, setUserCards] = useState<UserCards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeaderData = async () => {
      setIsLoading(true);
      try {
        // Fetch site settings
        const siteResponse = await axios.get<SiteSettings>('/api/site-settings');
        setSiteSettings(siteResponse.data);
        setSiteLogoUrl(siteResponse.data.logoUrl);

        // If user is authenticated, fetch user level and cards
        if (isAuthenticated) {
          const [levelResponse, cardsResponse] = await Promise.all([
            axios.get<UserLevel>('/api/user-level'),
            axios.get<UserCards>('/api/user-cards')
          ]);
          setUserLevel(levelResponse.data);
          setUserCards(cardsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching header data:', error);
        setSiteLogoUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeaderData();
  }, [isAuthenticated]);

  return (
    <header className="bg-white shadow-sm py-3">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-6 pt-1">
        {/* يمين (RTL): الشعار */}
        <div>
          {isLoading ? (
            <Skeleton className="h-12 w-24" />
          ) : (
            <a href="/" className="block">
              <img
                src={siteLogoUrl || "/assets/jaweb-logo.png"}
                alt="Jaweb Logo"
                className="h-10 md:h-12 object-contain"
              />
            </a>
          )}
        </div>

        {/* وسط: المستوى + الكروت + المتصدرين */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center text-sm text-gray-700">
            {/* User Level */}
            {isLoading ? (
              <Skeleton className="h-10 w-40" />
            ) : userLevel && (
              <div 
                className="bg-yellow-100 px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:bg-yellow-200 transition-colors"
                onClick={() => navigate('/profile')}
              >
                <span className="text-yellow-700 font-bold flex items-center gap-1">
                  {userLevel.badge} {userLevel.level}
                </span>
                <span className="bg-yellow-50 px-2 py-0.5 rounded-full text-amber-800 text-sm flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" /> 
                  <span>{userLevel?.currentStars ? userLevel.currentStars : 0}</span>
                </span>
              </div>
            )}

            {/* User Cards */}
            {isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : userCards && (
              <Popover>
                <PopoverTrigger asChild>
                  <div 
                    className="bg-blue-100 px-3 py-1.5 rounded-full flex items-center cursor-pointer hover:bg-blue-200 transition-colors"
                  >
                    <span className="text-blue-700 font-bold whitespace-nowrap flex items-center gap-1.5">
                      <Ticket className="h-4 w-4" /> الكروت: {userCards.freeCards + userCards.paidCards}
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-3" dir="rtl">
                  <div className="space-y-2">
                    <h4 className="font-bold text-center mb-3 text-gray-700">تفاصيل الكروت</h4>
                    <div className="flex justify-between items-center py-1 px-2 bg-blue-50 rounded">
                      <span className="text-blue-700">🔹 الكروت المجانية:</span>
                      <span className="font-bold">{userCards.freeCards}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 px-2 bg-amber-50 rounded">
                      <span className="text-amber-700">🔸 الكروت المدفوعة:</span>
                      <span className="font-bold">{userCards.paidCards}</span>
                    </div>
                    
                    <button
                      onClick={() => navigate('/cards')}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 rounded-full transition-colors"
                    >
                      شراء الكروت
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Leaderboard */}
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="flex gap-2">
                <LeaderboardModal />
                
                {/* زر ألعابي */}
                <div 
                  className="bg-green-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => navigate('/my-games')}
                >
                  <span className="text-green-800 font-bold whitespace-nowrap flex items-center gap-1.5">
                    <GamepadIcon className="h-4 w-4" />
                    ألعابي
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-lg font-bold text-blue-700 hidden md:block">
            {siteSettings?.appName || "جاوب"}
          </div>
        )}

        {/* يسار (RTL): أزرار المستخدم */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-gray-100"
                      onClick={() => navigate('/profile')}
                    >
                      <User size={20} className="text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent dir="rtl">
                    <p>الملف الشخصي</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-gray-100"
                      onClick={() => logout()}
                    >
                      <LogOut size={20} className="text-red-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent dir="rtl">
                    <p>تسجيل الخروج</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')} 
                className="text-blue-600 hover:underline transition-colors px-3 py-1.5 font-medium"
              >
                تسجيل الدخول
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-4 py-1.5 rounded-full font-medium"
              >
                إنشاء حساب
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}