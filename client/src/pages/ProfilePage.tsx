import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserIcon, 
  Medal, 
  Star, 
  CreditCard, 
  Calendar, 
  Award, 
  Gift, 
  MessageSquare, 
  Clock,
  Trophy,
  BarChart 
} from "lucide-react";

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
  totalCards: number;
  freeIcon: string;
  paidIcon: string;
}

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  lastPlayed: string;
  averageScore: number;
  streak: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: number; username: string; name?: string; } | null>(null);
  
  // تحديد ما إذا كان المستخدم مالك الملف الشخصي
  const isOwner = true; // في تطبيق حقيقي، ستقارن بين معرف المستخدم الحالي والملف الشخصي المعروض
  
  // جلب معلومات مستوى اللاعب
  const { 
    data: userLevel, 
    isLoading: levelLoading
  } = useQuery<UserLevel, Error>({
    queryKey: ['/api/user-level'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // جلب معلومات البطاقات
  const { 
    data: userCards, 
    isLoading: cardsLoading
  } = useQuery<UserCards, Error>({
    queryKey: ['/api/user-cards'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // جلب إحصائيات المستخدم
  const { 
    data: userStats, 
    isLoading: statsLoading
  } = useQuery<UserStats, Error>({
    queryKey: ['/api/user-stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    // إذا لم يتوفر هذا الـ API، سيتم اعتبار الحالة لا تزال في وضع التحميل
    // ويمكنك استبداله ببيانات افتراضية للتطوير
  });
  
  // محاكاة جلب معلومات المستخدم
  useEffect(() => {
    // في التطبيق الحقيقي، ستستخدم useQuery لجلب معلومات المستخدم من الخادم
    setUser({
      id: 1,
      username: "user",
      name: "أحمد محمد"
    });
  }, []);
  
  // حالة التحميل
  if (!user || levelLoading || cardsLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8" dir="rtl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-8 w-32 mb-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="w-full space-y-2 mt-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // حساب النسبة المئوية للتقدم نحو المستوى التالي
  const progressPercentage = userLevel?.progress ?? 
    (userLevel?.currentStars && userLevel?.requiredStars 
      ? Math.min(100, Math.round((userLevel.currentStars / userLevel.requiredStars) * 100)) 
      : 0);
  
  return (
    <Layout>
      <div className="container mx-auto py-8" dir="rtl">
        <div className="grid gap-8 md:grid-cols-3">
          {/* بطاقة الملف الشخصي */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="/assets/default_avatar.png" alt={user.name || user.username} />
                    <AvatarFallback>
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-bold">{user.name || user.username}</h2>
                  
                  <div className="flex items-center mt-2 mb-4">
                    <Badge style={{ backgroundColor: userLevel?.color || '#FFD700' }} className="text-white">
                      <span className="ml-1">{userLevel?.badge}</span>
                      {userLevel?.level}
                    </Badge>
                  </div>
                  
                  {/* شريط التقدم نحو المستوى التالي */}
                  {userLevel?.nextLevel && (
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>المستوى الحالي: {userLevel?.level}</span>
                        <span>المستوى التالي: {userLevel?.nextLevel}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      {userLevel?.currentStars !== undefined && userLevel?.requiredStars !== undefined && (
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          <Star className="h-3 w-3 inline ml-1 text-yellow-500" />
                          {userLevel?.currentStars} / {userLevel?.requiredStars}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* أزرار الإجراءات */}
                  <div className="w-full space-y-2 mt-6">
                    {isOwner && (
                      <Button variant="outline" className="w-full justify-start">
                        <CreditCard className="ml-2 h-4 w-4" />
                        شراء بطاقات إضافية
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="ml-2 h-4 w-4" />
                      مراسلة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* محتوى رئيسي */}
          <div className="md:col-span-2">
            <div className="grid gap-6">
              {/* إحصائيات المستخدم */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 ml-2" />
                    إحصائيات اللاعب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* عدد الألعاب */}
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-800">
                        {userStats ? userStats.gamesPlayed : 0}
                      </div>
                      <div className="text-sm text-blue-600">ألعاب ملعوبة</div>
                    </div>
                    
                    {/* الألعاب المربوحة */}
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-800">
                        {userStats ? userStats.gamesWon : 0}
                      </div>
                      <div className="text-sm text-green-600">ألعاب مربوحة</div>
                    </div>
                    
                    {/* مجموع النقاط */}
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-800">
                        {userStats ? userStats.totalScore : 0}
                      </div>
                      <div className="text-sm text-purple-600">مجموع النقاط</div>
                    </div>
                    
                    {/* متوسط النقاط */}
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <div className="text-2xl font-bold text-yellow-800">
                        {userStats ? userStats.averageScore : 0}
                      </div>
                      <div className="text-sm text-yellow-600">متوسط النقاط</div>
                    </div>
                    
                    {/* سلسلة الانتصارات */}
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <Gift className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold text-red-800">
                        {userStats ? userStats.streak : 0}
                      </div>
                      <div className="text-sm text-red-600">سلسلة انتصارات</div>
                    </div>
                    
                    {/* آخر لعبة */}
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-bold text-gray-800 h-12 flex items-center justify-center">
                        {userStats ? new Date(userStats.lastPlayed).toLocaleDateString('ar-EG') : 'لا يوجد'}
                      </div>
                      <div className="text-sm text-gray-600">آخر لعبة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* بطاقات اللعب */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 ml-2" />
                    بطاقات اللعب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <div className="text-center mx-4">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {userCards?.freeCards || 0}
                      </div>
                      <div className="text-sm text-blue-700">بطاقات مجانية</div>
                    </div>
                    
                    <div className="text-center border-r border-l border-gray-300 px-8 mx-4">
                      <div className="text-5xl font-bold text-purple-600 mb-2">
                        {userCards?.totalCards || 0}
                      </div>
                      <div className="text-sm text-purple-700">إجمالي البطاقات</div>
                    </div>
                    
                    <div className="text-center mx-4">
                      <div className="text-4xl font-bold text-indigo-600 mb-2">
                        {userCards?.paidCards || 0}
                      </div>
                      <div className="text-sm text-indigo-700">بطاقات مدفوعة</div>
                    </div>
                  </div>
                  
                  {isOwner && userCards?.freeCards !== undefined && userCards.freeCards < 5 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">يمكنك الحصول على بطاقات مجانية إضافية عبر دعوة أصدقائك أو المشاركة في التحديات اليومية</p>
                      <Button variant="outline" size="sm">
                        <Gift className="h-4 w-4 ml-2" />
                        الحصول على بطاقات مجانية
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}