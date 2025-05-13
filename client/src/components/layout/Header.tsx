import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    <header className="bg-white shadow-sm py-3 px-5">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Right side - placeholder for RTL alignment */}
        <div className="order-3"></div>

        {/* Center content - User stats */}
        <div className="order-2 flex-grow flex justify-center">
          {isAuthenticated ? (
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {/* User Level */}
              {isLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : userLevel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center bg-yellow-50 px-3 py-1.5 rounded-xl text-center shadow-sm border border-yellow-100 hover:bg-yellow-100 transition-colors cursor-pointer">
                        <div className="text-yellow-700 font-bold text-sm flex items-center gap-1">
                          <span>{userLevel.badge}</span>
                          <span>المستوى: </span>
                          <span style={{ color: userLevel.color }}>{userLevel.level}</span>
                        </div>
                        <div className="text-gray-800 text-xs mt-1">
                          ⭐ {userLevel?.currentStars ? userLevel.currentStars : 0} نجمة
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>مستواك الحالي</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Divider */}
              <span className="text-gray-300">|</span>

              {/* User Cards */}
              {isLoading ? (
                <Skeleton className="h-12 w-28" />
              ) : userCards && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center bg-blue-50 px-3 py-1.5 rounded-xl text-center shadow-sm border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer">
                        <div className="text-blue-700 font-bold text-sm">
                          كروت اللعب
                        </div>
                        <div className="text-gray-800 text-xs mt-1 flex items-center">
                          <span className="text-sm mr-1">{userCards.freeIcon}</span>
                          <span>{userCards.freeCards}</span>
                          <span className="mx-1 text-gray-400">/</span>
                          <span className="text-sm mr-1">{userCards.paidIcon}</span>
                          <span>{userCards.paidCards}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>كروت مجانية / مدفوعة</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Divider */}
              <span className="text-gray-300">|</span>

              {/* Leaderboard */}
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <LeaderboardModal />
              )}
            </div>
          ) : (
            <div className="text-center text-lg font-bold text-blue-700">
              {siteSettings?.appName || "جاوب"}
            </div>
          )}
        </div>

        {/* Left side in RTL (far left) - Auth buttons and Logo (moved to far left) */}
        <div className="order-1 flex gap-3 items-center">
          {/* Logo at the far left */}
          <div className="flex items-center mr-4">
            {isLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <a href="/" className="block">
                <img
                  src={siteLogoUrl || "/assets/logo-jaweb.png"}
                  alt="Jaweb Logo"
                  className="h-10 object-contain"
                />
              </a>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex gap-3">
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
        </div>
      </div>
    </header>
  );
}