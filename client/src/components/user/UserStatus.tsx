import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

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
  const [openLevelModal, setOpenLevelModal] = useState(false);
  const [openCardsModal, setOpenCardsModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const [levelResponse, cardsResponse] = await Promise.all([
          axios.get<UserLevel>('/api/user-level'),
          axios.get<UserCards>('/api/user-cards')
        ]);
        
        setUserLevel(levelResponse.data);
        setUserCards(cardsResponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="flex items-center gap-8 flex-wrap justify-center">
      {/* User Level */}
      {isLoading ? (
        <Skeleton className="h-9 w-24" />
      ) : userLevel && (
        <Dialog open={openLevelModal} onOpenChange={setOpenLevelModal}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="gap-1.5">
              <span className="text-xl">{userLevel.badge}</span>
              <span className="font-medium" style={{ color: userLevel.color }}>
                {userLevel.level}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center mb-4">مستواك الحالي</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{userLevel.badge}</span>
                  <span className="text-xl font-semibold" style={{ color: userLevel.color }}>
                    {userLevel.level}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  المستوى التالي: {userLevel.nextLevel}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{userLevel.currentStars} ⭐</span>
                  <span>{userLevel.requiredStars} ⭐</span>
                </div>
                <Progress value={userLevel.progress} className="h-2" />
              </div>

              <p className="text-sm text-gray-600 mt-3">
                لقد جمعت {userLevel.currentStars} نجوم من أصل {userLevel.requiredStars} مطلوبة للترقية للمستوى التالي
              </p>
              
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                <p className="font-medium mb-1">كيف تجمع المزيد من النجوم؟</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>فوز في المسابقات (+3 نجوم)</li>
                  <li>إجابة صحيحة (+1 نجمة)</li>
                  <li>حل بطاقات يومية (+2 نجوم)</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* User Cards */}
      {isLoading ? (
        <Skeleton className="h-9 w-28" />
      ) : userCards && (
        <Dialog open={openCardsModal} onOpenChange={setOpenCardsModal}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="gap-1.5">
              <span className="text-xl">{userCards.freeIcon}</span>
              <span className="font-medium">{userCards.freeCards}</span>
              <span className="text-gray-400">/</span>
              <span className="text-lg">{userCards.paidIcon}</span>
              <span className="font-medium">{userCards.paidCards}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center mb-4">كروت اللعب</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl mb-2">{userCards.freeIcon}</div>
                  <div className="text-2xl font-bold text-green-600">
                    {userCards.freeCards}
                  </div>
                  <div className="text-sm text-green-700 mt-1">كروت مجانية</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl mb-2">{userCards.paidIcon}</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {userCards.paidCards}
                  </div>
                  <div className="text-sm text-purple-700 mt-1">كروت مدفوعة</div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  إجمالي الكروت المتاحة: <span className="font-semibold">{userCards.totalCards}</span>
                </p>
                
                <Button className="w-full">احصل على المزيد من الكروت</Button>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                <p className="font-medium mb-1">معلومات عن الكروت:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تحصل على كرت مجاني يومياً</li>
                  <li>كل كرت يتيح لك اللعب بفئة واحدة</li>
                  <li>الكروت المجانية تنتهي خلال 7 أيام</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}