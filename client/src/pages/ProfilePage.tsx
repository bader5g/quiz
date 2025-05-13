import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X,
  Pencil,
  CheckCircle2,
  CreditCard as CreditCardIcon
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
  
  // الانتظار حتى تصل البيانات (المستخدم موجود)
  if (!user || profileLoading) {
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
  
  // مكون مودال تحرير البيانات الشخصية
  const EditProfileModal = () => {
    // متغيرات النموذج
    const [formValue, setFormValue] = useState('');
    const [confirmValue, setConfirmValue] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // تعبئة قيم النموذج تلقائيًا عند فتح المودال
    useEffect(() => {
      if (editModalOpen && user) {
        switch (editType) {
          case 'name':
            setFormValue(user.name || '');
            break;
          case 'email':
            setFormValue(user.email || '');
            break;
          case 'phone':
            setFormValue(user.phone || '');
            break;
          case 'password':
            setFormValue('');
            setConfirmValue('');
            break;
          case 'avatar':
            setSelectedAvatar(user.avatarUrl || defaultAvatars[0]);
            break;
        }
      }
    }, [editModalOpen, editType, user]);
    
    // إرسال التحديثات إلى الخادم
    const handleSubmit = async () => {
      setFormError('');
      setIsSubmitting(true);
      
      try {
        if (editType === 'password' && formValue !== confirmValue) {
          setFormError('كلمة المرور وتأكيدها غير متطابقين');
          setIsSubmitting(false);
          return;
        }
        
        // رفع الصورة الشخصية
        if (editType === 'avatar') {
          // إذا اختار المستخدم صورة من المكتبة
          if (selectedAvatar) {
            // تحديث الصورة المختارة
            console.log(`Updating avatar with library image: ${selectedAvatar}`);
            
            // تحديث الواجهة
            if (user) {
              setUser({
                ...user,
                avatarUrl: selectedAvatar
              });
            }
          } 
          // إذا رفع المستخدم صورة من جهازه
          else if (uploadedAvatar) {
            // إنشاء نموذج بيانات لرفع الملف
            const formData = new FormData();
            formData.append('avatar', uploadedAvatar);
            
            // رفع الصورة
            console.log(`Uploading custom avatar: ${uploadedAvatar.name}`);
            
            // محاكاة رفع الصورة للتطوير
            if (user) {
              const mockAvatarUrl = `/uploads/avatars/${user.id}.png`;
              setUser({
                ...user,
                avatarUrl: mockAvatarUrl
              });
            }
          }
        } 
        // معالجة بقية أنواع النماذج (الاسم، البريد، رقم الهاتف، كلمة المرور)
        else {
          if (!formValue.trim()) {
            setFormError('الرجاء إدخال قيمة صحيحة');
            return;
          }
          
          // تجهيز البيانات للإرسال
          const updateData: Record<string, string> = {};
          
          switch (editType) {
            case 'name':
              updateData.name = formValue;
              break;
            case 'email':
              // التحقق من صحة البريد الإلكتروني
              if (!/\S+@\S+\.\S+/.test(formValue)) {
                setFormError('الرجاء إدخال بريد إلكتروني صحيح');
                return;
              }
              updateData.email = formValue;
              break;
            case 'phone':
              // التحقق من صحة رقم الهاتف
              if (!/^\d{10,15}$/.test(formValue.replace(/\D/g, ''))) {
                setFormError('الرجاء إدخال رقم هاتف صحيح');
                return;
              }
              updateData.phone = formValue;
              break;
            case 'password':
              updateData.password = formValue;
              break;
          }
          
          // تسجيل البيانات المحدثة
          console.log(`Updating ${editType} with value: ${formValue}`);
          
          // تحديث حالة المستخدم في الواجهة
          if (user && editType !== 'password') {
            setUser({
              ...user,
              ...updateData
            });
          }
        }
        
        // إغلاق المودال بعد التحديث
        setEditModalOpen(false);
        
        // إعادة ضبط قيم النموذج
        setFormValue('');
        setConfirmValue('');
        setSelectedAvatar('');
        setUploadedAvatar(null);
        
        // إعادة تحميل بيانات المستخدم
        refetchProfile();
        
      } catch (error) {
        console.error('Error updating profile:', error);
        setFormError('حدث خطأ أثناء تحديث البيانات. الرجاء المحاولة مرة أخرى');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    // تحميل صورة محلية
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
          setFormError('الرجاء اختيار ملف صورة صالح');
          return;
        }
        
        // التحقق من حجم الملف (5 ميجابايت كحد أقصى)
        if (file.size > 5 * 1024 * 1024) {
          setFormError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
          return;
        }
        
        setUploadedAvatar(file);
        setSelectedAvatar('');
        setFormError('');
      }
    };
    
    // اختيار صورة من المكتبة
    const handleAvatarSelect = (avatar: string) => {
      setSelectedAvatar(avatar);
      setUploadedAvatar(null);
      setFormError('');
    };
    
    // عنوان المودال بناءً على نوع التعديل
    const getModalTitle = () => {
      switch (editType) {
        case 'name': 
          return 'تعديل الاسم';
        case 'email': 
          return 'البريد الإلكتروني';
        case 'phone': 
          return 'تعديل رقم الهاتف';
        case 'password': 
          return 'تعديل كلمة المرور';
        case 'avatar': 
          return 'الصورة الشخصية';
        default: 
          return 'تعديل الملف الشخصي';
      }
    };
    
    // محتوى المودال بناءً على نوع التعديل
    const renderModalContent = () => {
      switch (editType) {
        case 'name':
          return (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input 
                  id="name" 
                  placeholder="أدخل اسمك" 
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
            </div>
          );
          
        case 'email':
          return (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="أدخل بريدك الإلكتروني" 
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
            </div>
          );
          
        case 'phone':
          return (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input 
                  id="phone" 
                  placeholder="أدخل رقم هاتفك" 
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
            </div>
          );
          
        case 'password':
          return (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="أدخل كلمة المرور الجديدة" 
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="أعد إدخال كلمة المرور" 
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                />
              </div>
            </div>
          );
          
        case 'avatar':
          return (
            <div className="space-y-4 py-2">
              <Tabs defaultValue="gallery" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="gallery">من المكتبة</TabsTrigger>
                  <TabsTrigger value="upload">رفع صورة</TabsTrigger>
                </TabsList>
                
                <TabsContent value="gallery" className="mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    {defaultAvatars.map((avatar, index) => (
                      <div 
                        key={index} 
                        className={`p-1.5 cursor-pointer rounded-md border ${selectedAvatar === avatar ? 'border-blue-500' : 'border-gray-200'} relative`}
                        onClick={() => handleAvatarSelect(avatar)}
                      >
                        <Avatar className="h-12 w-12 mx-auto">
                          <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                          <AvatarFallback>{index + 1}</AvatarFallback>
                        </Avatar>
                        {selectedAvatar === avatar && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="upload" className="mt-4">
                  <div className="space-y-4">
                    <Label htmlFor="avatarUpload">اختر صورة من جهازك</Label>
                    <Input 
                      id="avatarUpload" 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    
                    {uploadedAvatar && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 mb-2">معاينة الصورة</p>
                        <Avatar className="h-24 w-24 mx-auto">
                          <AvatarImage src={uploadedAvatar ? URL.createObjectURL(uploadedAvatar) : ''} alt="صورة مختارة" />
                          <AvatarFallback>
                            <UserIcon className="h-12 w-12" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          );
          
        default:
          return null;
      }
    };
    
    return (
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          
          {renderModalContent()}
          
          {formError && (
            <div className="text-sm text-red-500 mt-2">{formError}</div>
          )}
          
          <DialogFooter className="flex flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></span>
                  جارٍ التحديث...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 md:px-8" dir="rtl">
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {/* بطاقة الملف الشخصي */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative group mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={user?.avatarUrl || defaultAvatars[0]} 
                        alt={user?.name || user?.username || 'المستخدم'} 
                      />
                      <AvatarFallback>
                        <UserIcon className="h-12 w-12 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    {isOwner && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => {
                          setEditType('avatar');
                          setEditModalOpen(true);
                        }}
                      >
                        <div className="text-white flex flex-col items-center">
                          <Pencil className="h-5 w-5" />
                          <span className="text-xs mt-1">تغيير</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0">
                      <Badge className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center p-0" variant="secondary">
                        <Check className="h-3 w-3 text-white" />
                      </Badge>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold">{user?.name || user?.username}</h2>
                  
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
                  <div className="w-full space-y-1.5 mt-4">
                    {isOwner && (
                      <>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('avatar');
                            setEditModalOpen(true);
                          }}
                        >
                          <Pencil className="ml-1.5 h-3 w-3" />
                          الصورة الشخصية
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('name');
                            setEditModalOpen(true);
                          }}
                        >
                          <UserIcon className="ml-1.5 h-3 w-3" />
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
                          <Mail className="ml-1.5 h-3 w-3" />
                          البريد الإلكتروني
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setEditType('phone');
                            setEditModalOpen(true);
                          }}
                        >
                          <Phone className="ml-1.5 h-3 w-3" />
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
                          <Lock className="ml-1.5 h-3 w-3" />
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
                          <CreditCardIcon className="ml-1.5 h-3 w-3" />
                          شراء كروت
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
                      <div className="text-sm text-blue-600">عدد الألعاب</div>
                    </div>
                    
                    {/* آخر نشاط */}
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <div className="text-lg font-bold text-gray-800 h-12 flex items-center justify-center">
                        {userStats?.lastPlayed 
                          ? new Date(userStats.lastPlayed).toLocaleDateString('ar-EG') 
                          : 'لا يوجد'}
                      </div>
                      <div className="text-sm text-gray-600">آخر نشاط</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* قسم إضافي يمكن إضافته في المستقبل */}
            </div>
          </div>
        </div>
        
        {/* مودال تعديل الملف الشخصي */}
        <EditProfileModal />
      </div>
    </Layout>
  );
}