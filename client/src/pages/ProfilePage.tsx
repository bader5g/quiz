import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import EditModal from "@/components/profile/EditModal";
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
  Pencil
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
  const { toast } = useToast();
  const { user: contextUser, updateUser } = useUser();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'name' | 'email' | 'phone' | 'password' | 'avatar'>('name');
  const [phonePrefix, setPhonePrefix] = useState<string>('+966'); // القيمة الافتراضية لرمز الدولة

  // جلب رمز الدولة تلقائيًا من IP المستخدم
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        const countryCode = data.country_calling_code;
        // التحقق من صحة رمز الدولة باستخدام regex
        if (countryCode && /^\+\d+$/.test(countryCode)) {
          setPhonePrefix(countryCode);
        } else {
          setPhonePrefix('+966'); // استخدام +966 (السعودية) كقيمة افتراضية
        }
        console.log("Country calling code:", countryCode);
      })
      .catch(err => {
        console.error("فشل جلب معلومات الدولة:", err);
        setPhonePrefix('+966'); // استخدام +966 (السعودية) كقيمة افتراضية في حالة الخطأ
      });
  }, []);

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

  // دالة فتح نافذة التعديل
  const openEditModal = (type: 'name' | 'email' | 'phone' | 'password' | 'avatar') => {
    setEditType(type);
    setEditModalOpen(true);
  };

  // دالة معالجة حفظ التغييرات
  const handleSaveProfileChanges = (type: string, value: string) => {
    if (!user) return;
    
    // تحديث بيانات المستخدم
    const updatedUser = { ...user };
    
    switch(type) {
      case 'name':
        updatedUser.name = value;
        break;
      case 'email':
        updatedUser.email = value;
        break;
      case 'phone':
        updatedUser.phone = value;
        break;
      case 'avatar':
        updatedUser.avatarUrl = value;
        break;
      case 'password':
        // عادة ما يتم إرسال كلمة المرور إلى الخادم للتحديث
        console.log("تم تغيير كلمة المرور");
        break;
    }
    
    // تحديث بيانات المستخدم في السياق
    if (contextUser) {
      updateUser(updatedUser);
    }
    
    // تحديث حالة المستخدم المحلية
    setUser(updatedUser);
    
    // إعادة تحميل البيانات
    refetchProfile();
    
    // عرض رسالة نجاح
    toast({
      title: "✅ تم التحديث",
      description: "تم حفظ التغييرات بنجاح"
    });
  };

  // التحقق من وجود بيانات المستخدم
  if (!user) {
    return (
      <Layout>
        <div className="py-10 text-center text-muted-foreground">جارٍ تحميل الملف الشخصي...</div>
      </Layout>
    );
  }
  
  // عرض حالة التحميل المتقدمة (سكيلتون) عند الحاجة
  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 md:px-8" dir="rtl">
          <div className="grid gap-6 md:gap-8 md:grid-cols-3">
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
      <div className="container mx-auto py-8 px-4 md:px-8" dir="rtl">
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {/* بطاقة الملف الشخصي */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-primary">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0) || user.username?.charAt(0) || <UserIcon />}</AvatarFallback>
                    </Avatar>
                    <button 
                      className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full hover:bg-primary/80 transition-colors"
                      onClick={() => openEditModal('avatar')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold mt-3 flex items-center gap-2">
                    {user.name || user.username}
                    <button 
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => openEditModal('name')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </h3>
                  
                  <div className="text-sm text-muted-foreground mb-4 flex flex-col items-center">
                    <div className="flex items-center gap-1 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{user.email}</span>
                      <button 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => openEditModal('email')}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{user.phone}</span>
                      <button 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => openEditModal('phone')}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => openEditModal('password')}
                    >
                      <Lock className="h-4 w-4" />
                      <span>تغيير كلمة المرور</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* معلومات اللاعب */}
          <div className="md:col-span-2">
            <div className="grid gap-6">
              {/* بطاقة المستوى والبطاقات */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">معلومات اللاعب</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="level">
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="level">المستوى</TabsTrigger>
                      <TabsTrigger value="cards">الكروت</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="level" className="space-y-4">
                      {levelLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-6 w-1/2" />
                        </div>
                      ) : userLevel ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Medal className="h-5 w-5" style={{ color: userLevel.color }} />
                            <h3 className="text-lg font-bold" style={{ color: userLevel.color }}>
                              المستوى: {userLevel.level} {userLevel.badge}
                            </h3>
                          </div>
                          
                          {/* شريط التقدم */}
                          {userLevel.nextLevel && (
                            <div className="space-y-2">
                              <div className="w-full h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full"
                                  style={{ 
                                    width: `${progressPercentage}%`,
                                    backgroundColor: userLevel.color 
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{userLevel.level}</span>
                                <span>
                                  {userLevel.currentStars}/{userLevel.requiredStars} نجمة
                                </span>
                                <span>{userLevel.nextLevel}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <Card>
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                  <Trophy className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">المستوى التالي</p>
                                  <p className="font-bold">{userLevel.nextLevel || "أعلى مستوى"}</p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-yellow-100">
                                  <Star className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">النجوم المطلوبة</p>
                                  <p className="font-bold">
                                    {userLevel.requiredStars || "--"} نجمة
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <p>لا توجد معلومات متاحة حول المستوى</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="cards">
                      {cardsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-6 w-1/2" />
                        </div>
                      ) : userCards ? (
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-bold">كروتي</h3>
                            <Badge variant="outline" className="px-4">
                              المجموع: {userCards.totalCards}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-100">
                                  <Gift className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">كروت مجانية</p>
                                  <div className="font-bold flex items-center justify-between">
                                    {userCards.freeCards} كرت
                                    <span className="text-xs text-muted-foreground mr-2">
                                      ({userCards.usedFreeCards} مستخدمة)
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                  <CreditCard className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">كروت مدفوعة</p>
                                  <div className="font-bold flex items-center justify-between">
                                    {userCards.paidCards} كرت
                                    <span className="text-xs text-muted-foreground mr-2">
                                      ({userCards.usedPaidCards} مستخدمة)
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <p>لا توجد معلومات متاحة عن الكروت</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* إحصائيات اللعب */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">إحصائيات اللعب</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : userStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-full bg-purple-100">
                            <BarChart className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">الألعاب الكلية</p>
                            <p className="font-bold">{userStats.gamesPlayed} لعبة</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-full bg-orange-100">
                            <Clock className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">آخر لعبة</p>
                            <p className="font-bold" dir="ltr">
                              {new Date(userStats.lastPlayed).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p>لا توجد إحصائيات متاحة</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* مودال تعديل الملف الشخصي */}
        {user && (
          <EditModal 
            open={editModalOpen} 
            onOpenChange={setEditModalOpen} 
            editType={editType} 
            user={user} 
            onSave={handleSaveProfileChanges}
            phonePrefix={phonePrefix}
          />
        )}
      </div>
    </Layout>
  );
}