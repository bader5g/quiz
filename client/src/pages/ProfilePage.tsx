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
  Clock,
  Trophy,
  BarChart,
  Mail,
  Phone,
  Lock,
  Image,
  Upload,
  Check,
  X
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
  usedFreeCards: number;
  usedPaidCards: number;
}

interface UserStats {
  gamesPlayed: number;
  lastPlayed: string;
}

interface UserProfile {
  id: number;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'name' | 'email' | 'phone' | 'password' | 'avatar'>('name');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [uploadedAvatar, setUploadedAvatar] = useState<File | null>(null);
  
  // تحديد ما إذا كان المستخدم مالك الملف الشخصي
  const isOwner = true; // في تطبيق حقيقي، ستقارن بين معرف المستخدم الحالي والملف الشخصي المعروض
  
  // مجموعة الصور الشخصية الافتراضية
  const defaultAvatars = [
    '/assets/avatars/avatar1.png',
    '/assets/avatars/avatar2.png',
    '/assets/avatars/avatar3.png',
    '/assets/avatars/avatar4.png',
    '/assets/avatars/avatar5.png',
  ];
  
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
  
  // جلب معلومات المستخدم
  const { 
    data: userProfile, 
    isLoading: profileLoading,
    refetch: refetchProfile
  } = useQuery<UserProfile, Error>({
    queryKey: ['/api/user-profile'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // تحديث حالة المستخدم عند جلب البيانات
  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
    }
  }, [userProfile]);
  
  // حالة التحميل
  if (!user || levelLoading || cardsLoading || profileLoading) {
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
                      <>
                        <Button variant="outline" className="w-full justify-start">
                          <CreditCard className="ml-2 h-4 w-4" />
                          شراء بطاقات إضافية
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('name');
                            setEditModalOpen(true);
                          }}
                        >
                          <UserIcon className="ml-2 h-4 w-4" />
                          تعديل الاسم
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('email');
                            setEditModalOpen(true);
                          }}
                        >
                          <Mail className="ml-2 h-4 w-4" />
                          تعديل البريد الإلكتروني
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('phone');
                            setEditModalOpen(true);
                          }}
                        >
                          <Phone className="ml-2 h-4 w-4" />
                          تعديل رقم الهاتف
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('password');
                            setEditModalOpen(true);
                          }}
                        >
                          <Lock className="ml-2 h-4 w-4" />
                          تعديل كلمة المرور
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('avatar');
                            setEditModalOpen(true);
                          }}
                        >
                          <Image className="ml-2 h-4 w-4" />
                          تغيير الصورة الشخصية
                        </Button>
                      </>
                    )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* عدد الألعاب */}
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-800">
                        {userStats ? userStats.gamesPlayed : 0}
                      </div>
                      <div className="text-sm text-blue-600">ألعاب ملعوبة</div>
                    </div>
                    
                    {/* آخر لعبة */}
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <div className="text-lg font-bold text-gray-800 h-12 flex items-center justify-center">
                        {userStats?.lastPlayed 
                          ? new Date(userStats.lastPlayed).toLocaleDateString('ar-EG') 
                          : 'لا يوجد'}
                      </div>
                      <div className="text-sm text-gray-600">آخر لعبة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* الكروت */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 ml-2" />
                    الكروت
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-sm font-semibold mb-3 text-gray-600">الكروت المتاحة:</h3>
                  <div className="flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 mb-6">
                    <div className="text-center mx-4">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {userCards?.freeCards || 0}
                      </div>
                      <div className="text-sm text-blue-700">كروت مجانية</div>
                    </div>
                    
                    <div className="text-center border-r border-l border-gray-300 px-8 mx-4">
                      <div className="text-5xl font-bold text-purple-600 mb-2">
                        {userCards?.totalCards || 0}
                      </div>
                      <div className="text-sm text-purple-700">إجمالي الكروت</div>
                    </div>
                    
                    <div className="text-center mx-4">
                      <div className="text-4xl font-bold text-indigo-600 mb-2">
                        {userCards?.paidCards || 0}
                      </div>
                      <div className="text-sm text-indigo-700">كروت مدفوعة</div>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-semibold mb-3 text-gray-600">الكروت المستخدمة:</h3>
                  <div className="flex items-center justify-center bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-5">
                    <div className="text-center mx-8">
                      <div className="text-3xl font-bold text-blue-500 mb-2">
                        {userCards?.usedFreeCards || 0}
                      </div>
                      <div className="text-sm text-blue-600">كروت مجانية</div>
                    </div>
                    
                    <div className="text-center mx-8">
                      <div className="text-3xl font-bold text-indigo-500 mb-2">
                        {userCards?.usedPaidCards || 0}
                      </div>
                      <div className="text-sm text-indigo-600">كروت مدفوعة</div>
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