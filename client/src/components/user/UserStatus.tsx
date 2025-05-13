import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BarLoader } from '@/components/ui/bar-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types for API responses
interface UserLevel {
  level: string;
  badge: string;
  color: string;
  progress: number;
  nextLevel: string;
  requiredStars: number;
  currentStars: number;
}

interface UserCards {
  freeCards: number;
  paidCards: number;
  totalCards: number;
  freeIcon: string;
  paidIcon: string;
}

export default function UserStatus() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userCards, setUserCards] = useState<UserCards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStatus = async () => {
      setIsLoading(true);
      try {
        // Fetch user level and cards in parallel
        const [levelResponse, cardsResponse] = await Promise.all([
          axios.get<UserLevel>('/api/user-level'),
          axios.get<UserCards>('/api/user-cards')
        ]);
        
        setUserLevel(levelResponse.data);
        setUserCards(cardsResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user status:', err);
        setError('فشل في تحميل بيانات المستخدم');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center gap-4 w-full max-w-3xl mx-auto">
        <Skeleton className="h-20 w-full max-w-xs rounded-lg" />
        <Skeleton className="h-20 w-full max-w-xs rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 text-center py-2">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 w-full max-w-3xl mx-auto mb-4">
      {/* User Level Card */}
      {userLevel && (
        <Card className="border-2 relative overflow-hidden" style={{ borderColor: userLevel.color }}>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{userLevel.badge}</span>
              <h3 className="font-bold">مستواك: {userLevel.level}</h3>
            </div>
            
            <div className="w-full max-w-xs mt-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{userLevel.currentStars} نجمة</span>
                <span>المستوى التالي: {userLevel.nextLevel} ({userLevel.requiredStars} نجمة)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${userLevel.progress}%`,
                    backgroundColor: userLevel.color 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Cards Card */}
      {userCards && (
        <Card className="border-2 border-blue-400">
          <CardContent className="p-4 flex items-center justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="text-xl">{userCards.freeIcon}</span>
                    <span className="font-bold">{userCards.freeCards}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>كروت مجانية</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-gray-400">|</span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="text-xl">{userCards.paidIcon}</span>
                    <span className="font-bold">{userCards.paidCards}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>كروت مدفوعة</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-gray-400">|</span>

            <div className="flex items-center gap-1">
              <span className="text-gray-600">الإجمالي:</span>
              <span className="font-bold">{userCards.totalCards}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}