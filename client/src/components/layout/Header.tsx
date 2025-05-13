import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, GamepadIcon } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-6 pt-1">
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
          <div className="flex items-center gap-3 flex-wrap justify-center text-sm text-gray-700">
            {/* User Level */}
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : userLevel && (
              <div 
                className="bg-yellow-100 px-3 py-1 rounded-full flex flex-col items-center cursor-pointer hover:bg-yellow-200 transition-colors"
                onClick={() => navigate('/profile')}
              >
                <span className="text-yellow-700 font-bold flex items-center gap-1">
                  {userLevel.badge} المستوى: {userLevel.level}
                </span>
                <span className="text-gray-800 text-xs">
                  ⭐ {userLevel?.currentStars ? userLevel.currentStars : 0} نجمة
                </span>
              </div>
            )}

            {/* User Cards */}
            {isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : userCards && (
              <div 
                className="bg-blue-100 px-3 py-1 rounded-full flex items-center cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => navigate('/cards')}
              >
                <span className="text-blue-700 font-bold whitespace-nowrap">
                  {userCards.freeIcon} كروت اللعب: {userCards.paidCards} / {userCards.freeCards}
                </span>
              </div>
            )}

            {/* Leaderboard */}
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="flex gap-2">
                <LeaderboardModal />
                
                {/* زر ألعابي */}
                <div 
                  className="bg-green-100 px-3 py-1 rounded-full cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => navigate('/my-games')}
                >
                  <span className="text-green-800 font-bold whitespace-nowrap flex items-center">
                    <GamepadIcon className="h-4 w-4 ml-1.5" />
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
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-4 py-1.5 rounded-full font-medium"
              >
                الملف الشخصي
              </button>
              <button 
                onClick={() => logout()}
                className="bg-red-500 hover:bg-red-600 transition-colors text-white px-4 py-1.5 rounded-full font-medium"
              >
                تسجيل الخروج
              </button>
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