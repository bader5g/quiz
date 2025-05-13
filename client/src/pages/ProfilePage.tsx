import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogPortal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserIcon, Medal, Star, CreditCard, Calendar, Clock, Check, Pencil, UploadCloud } from "lucide-react";

// تعريف أنواع البيانات
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
  const [isOwner, setIsOwner] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<string>('');
  const [formValue, setFormValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploadedAvatar, setUploadedAvatar] = useState<File | null>(null);
  const [phonePrefix, setPhonePrefix] = useState('+966');
  const [isPhoneReady, setIsPhoneReady] = useState(false);
  
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

  // جلب معلومات مستوى المستخدم
  const { 
    data: userLevel, 
    isLoading: levelLoading 
  } = useQuery<UserLevel, Error>({
    queryKey: ['/api/user-level'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // جلب معلومات بطاقات المستخدم
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

  // جلب رمز الدولة تلقائيًا
  useEffect(() => {
    const getCountryCode = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.country_calling_code) {
          console.log("Country calling code:", data.country_calling_code);
          setPhonePrefix(data.country_calling_code);
        }
      } catch (error) {
        console.error('Error fetching country code:', error);
      } finally {
        setIsPhoneReady(true);
      }
    };
    
    getCountryCode();
  }, []);

  // وظيفة للتحقق من تغير البيانات
  const hasChanged = () => {
    switch (editType) {
      case 'name':
        return formValue !== (user?.name || '');
      case 'email':
        return formValue !== (user?.email || '');
      case 'phone':
        // التحقق إذا تغير الهاتف بدون رمز الدولة
        return formValue !== (user?.phone?.replace(/^\+\d+/, '') || '');
      case 'password':
        // كلمة المرور دائمًا تعتبر تغييرًا لأنها لا تُعرض
        return formValue !== '';
      case 'avatar':
        return selectedAvatar !== '' || uploadedAvatar !== null;
      default:
        return false;
    }
  };

  // الحصول على عنوان المودال
  const getModalTitle = () => {
    switch (editType) {
      case 'name': 
        return 'تعديل الاسم';
      case 'email': 
        return 'البريد الإلكتروني';
      case 'phone': 
        return 'تعديل رقم الهاتف';
      case 'password': 
        return 'تغيير كلمة المرور';
      case 'avatar': 
        return 'تغيير الصورة الشخصية';
      default: 
        return 'تعديل البيانات';
    }
  };

  // عرض محتوى المودال حسب النوع
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
                autoComplete="off"
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
                onChange={(e) => {
                  setFormValue(e.target.value);
                  // التحقق من البريد الإلكتروني أثناء الكتابة
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (e.target.value && !emailRegex.test(e.target.value.trim())) {
                    setFormError('الرجاء إدخال بريد إلكتروني صحيح');
                  } else {
                    setFormError('');
                  }
                }}
              />
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}
            </div>
          </div>
        );
        
      case 'phone':
        return !isPhoneReady ? (
          <div className="py-6 text-center">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-e-transparent mx-auto mb-2"></span>
            <p>جاري جلب رمز الدولة...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="flex space-x-1 items-center">
                <div className="bg-muted text-muted-foreground text-sm px-3 py-2 rounded-l-md border border-r-0 border-input h-10 flex items-center">
                  {phonePrefix}
                </div>
                <Input 
                  id="phone" 
                  className="rounded-l-none" 
                  placeholder="رقم الهاتف بدون رمز الدولة" 
                  value={formValue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormValue(value);
                    
                    // التحقق من طول رقم الهاتف (8-12 رقم)
                    if (value && (value.length < 8 || value.length > 12)) {
                      setFormError('يجب أن يكون طول رقم الهاتف بين 8 و 12 رقم');
                    } else {
                      setFormError('');
                    }
                  }}
                />
              </div>
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}
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
                autoComplete="new-password"
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
                autoComplete="new-password"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
              />
            </div>
            
            {formValue && confirmValue && formValue !== confirmValue && (
              <p className="text-sm text-red-500">كلمتا المرور غير متطابقتين</p>
            )}
            
            {formValue && formValue.length < 8 && (
              <p className="text-sm text-red-500">يجب أن تتكون كلمة المرور من 8 أحرف على الأقل</p>
            )}
          </div>
        );
        
      case 'avatar':
        // إضافة خيارات تحميل الصورة
        return (
          <div className="space-y-4 py-2">
            <div className="mb-4">
              <Label className="block mb-2">اختر صورة من المكتبة</Label>
              <div className="grid grid-cols-3 gap-2">
                {['/assets/avatars/avatar1.png', '/assets/avatars/avatar2.png', '/assets/avatars/avatar3.png'].map((avatar, index) => (
                  <div 
                    key={index}
                    className={`p-2 border rounded-md cursor-pointer hover:bg-muted transition-colors ${selectedAvatar === avatar ? 'border-primary bg-primary/10' : 'border-border'}`}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setUploadedAvatar(null);
                    }}
                  >
                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full aspect-square object-cover rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="block mb-2">أو قم بتحميل صورة خاصة</Label>
              <div className="border border-dashed border-border rounded-md p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setUploadedAvatar(files[0]);
                      setSelectedAvatar('');
                    }
                  }}
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <UploadCloud className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium mb-1">اضغط أو اسحب ملفًا هنا</span>
                    <span className="text-xs text-muted-foreground">يدعم JPG، PNG بحد أقصى 5 ميجابايت</span>
                  </div>
                </label>
              </div>
              
              {uploadedAvatar && (
                <div className="mt-2 flex items-center">
                  <div className="h-10 w-10 mr-2 overflow-hidden rounded-full">
                    <img 
                      src={URL.createObjectURL(uploadedAvatar)} 
                      alt="Preview" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <span className="text-sm">{uploadedAvatar.name}</span>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // معالجة إرسال النموذج
  const handleSubmit = async () => {
    // التحقق من صحة البيانات
    if (editType === 'password' && formValue !== confirmValue) {
      setFormError('كلمتا المرور غير متطابقتين');
      return;
    }
    
    if (editType === 'password' && formValue.length < 8) {
      setFormError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل');
      return;
    }
    
    if (editType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValue.trim())) {
        setFormError('الرجاء إدخال بريد إلكتروني صحيح');
        return;
      }
    }
    
    if (editType === 'phone') {
      if (formValue.length < 8 || formValue.length > 12) {
        setFormError('يجب أن يكون طول رقم الهاتف بين 8 و 12 رقم');
        return;
      }
    }
    
    setFormError('');
    setIsSubmitting(true);
    
    try {
      // معالجة البيانات حسب نوع التعديل
      if (editType === 'avatar') {
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
          
          // إظهار رسالة نجاح
          toast({
            title: "تم تحديث الصورة",
            description: "تم تغيير صورتك الشخصية بنجاح",
          });
        } 
        else if (uploadedAvatar) {
          // تحضير البيانات للرفع
          const formData = new FormData();
          formData.append('avatar', uploadedAvatar);
          
          // محاكاة رفع الصورة
          console.log(`Uploading custom avatar: ${uploadedAvatar.name}`);
          
          // محاكاة رفع الصورة للتطوير
          if (user) {
            const mockAvatarUrl = `/uploads/avatars/${user.id}.png`;
            setUser({
              ...user,
              avatarUrl: mockAvatarUrl
            });
          }
          
          // إظهار رسالة نجاح
          toast({
            title: "تم رفع الصورة",
            description: "تم رفع وتعيين صورتك الشخصية الجديدة",
          });
        }
      }
      else {
        // معالجة تحديثات البيانات الأخرى
        const updateData: Record<string, string> = {};
        
        switch(editType) {
          case 'name':
            updateData.name = formValue;
            break;
          case 'email':
            updateData.email = formValue;
            break;
          case 'phone':
            // تحديث رقم الهاتف مع رمز الدولة
            updateData.phone = phonePrefix + formValue;
            break;
          case 'password':
            // لا نعرض كلمة المرور في الواجهة
            break;
        }
        
        // محاكاة إرسال البيانات للخادم
        console.log(`Updating ${editType} with value: ${formValue}`);
        
        // تحديث واجهة المستخدم
        if (user && editType !== 'password') {
          setUser({
            ...user,
            ...updateData
          });
        }
        
        // إظهار رسالة نجاح
        toast({
          title: "تم التحديث بنجاح",
          description: "تم حفظ بياناتك الجديدة",
          variant: "default",
        });
      }

      // إغلاق المودال
      setEditModalOpen(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError('حدث خطأ أثناء تحديث البيانات. الرجاء المحاولة مرة أخرى');
    }
    
    // إعادة تعيين حالة الإرسال
    setIsSubmitting(false);
  };
  
  // مكون النافذة المنبثقة للتعديل
  const EditModal = () => {
    // تعيين القيمة الأصلية عند فتح المودال
    useEffect(() => {
      if (editModalOpen && user) {
        switch (editType) {
          case 'name':
            setFormValue(user.name || '');
            setOriginalValue(user.name || '');
            break;
          case 'email':
            setFormValue(user.email || '');
            setOriginalValue(user.email || '');
            break;
          case 'phone':
            // إزالة رمز الدولة من رقم الهاتف
            const phoneWithoutPrefix = user.phone ? user.phone.replace(/^\+\d+/, '') : '';
            setFormValue(phoneWithoutPrefix);
            setOriginalValue(phoneWithoutPrefix);
            break;
          case 'password':
            setFormValue('');
            setConfirmValue('');
            setOriginalValue('');
            break;
          case 'avatar':
            setSelectedAvatar('');
            setUploadedAvatar(null);
            setOriginalValue('');
            break;
        }
        
        setFormError('');
      }
    }, [editModalOpen, editType, user]);
    
    // شرط التعطيل للزر
    const formHasError = !!formError || 
      (editType === 'password' && formValue !== confirmValue) || 
      (editType === 'password' && formValue.length < 8);
    
    return (
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogPortal container={document?.getElementById('modal-root') ?? undefined}>
          <DialogContent className="sm:max-w-md z-[100] bg-white" dir="rtl">
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
                disabled={isSubmitting || formValue === originalValue}
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
        </DialogPortal>
      </Dialog>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-4 md:py-8 px-4">
        <EditModal />
        
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <UserIcon className="mr-2 h-6 w-6" />
          الملف الشخصي
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* بطاقة المستخدم الرئيسية */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 ml-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-6" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center">
                    {/* الصورة الشخصية */}
                    <div className="relative mb-4 md:mb-0 group">
                      <div className="relative rounded-full overflow-hidden h-20 w-20">
                        <Avatar className="h-20 w-20">
                          <AvatarImage 
                            src={user?.avatarUrl || ''}
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
                              setSelectedAvatar('');
                              setUploadedAvatar(null);
                              setFormError('');
                              setEditModalOpen(true);
                            }}
                          >
                            <div className="text-white flex flex-col items-center">
                              <Pencil className="h-4 w-4" />
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
                    </div>
                    
                    <div className="flex items-center">
                      <div className="md:mr-6">
                        <div className="flex items-center">
                          <h2 className="text-2xl font-bold">{user?.name || user?.username}</h2>
                          {isOwner && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 mr-2"
                              onClick={() => {
                                setEditType('name');
                                setEditModalOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-gray-500">@{user?.username}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center py-4 border-b">
                      <div className="md:w-1/3 text-gray-500 mb-2 md:mb-0">البريد الإلكتروني</div>
                      <div className="md:w-2/3 flex items-center">
                        <span>{user?.email || 'لم يتم تعيين بريد إلكتروني'}</span>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 mr-2"
                            onClick={() => {
                              setEditType('email');
                              setEditModalOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center py-4 border-b">
                      <div className="md:w-1/3 text-gray-500 mb-2 md:mb-0">رقم الهاتف</div>
                      <div className="md:w-2/3 flex items-center">
                        <span>{user?.phone || 'لم يتم تعيين رقم هاتف'}</span>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 mr-2"
                            onClick={() => {
                              setEditType('phone');
                              setEditModalOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {isOwner && (
                      <div className="flex flex-col md:flex-row md:items-center py-4">
                        <div className="md:w-1/3 text-gray-500 mb-2 md:mb-0">كلمة المرور</div>
                        <div className="md:w-2/3 flex items-center">
                          <span>********</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 mr-2"
                            onClick={() => {
                              setEditType('password');
                              setEditModalOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* بطاقة مستوى المستخدم والبطاقات */}
          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="level">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="level" className="flex-1">المستوى</TabsTrigger>
                  <TabsTrigger value="cards" className="flex-1">البطاقات</TabsTrigger>
                  <TabsTrigger value="stats" className="flex-1">النشاط</TabsTrigger>
                </TabsList>
                
                <TabsContent value="level">
                  {levelLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-6 w-32 mx-auto mt-4" />
                    </div>
                  ) : userLevel && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <Medal className="h-8 w-8 mr-2" style={{color: userLevel.color}} />
                        <h3 className="text-2xl font-bold">{userLevel.level} {userLevel.badge}</h3>
                      </div>
                      
                      {userLevel.progress !== undefined && (
                        <div className="mt-4">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{
                                width: `${userLevel.progress}%`,
                                backgroundColor: userLevel.color
                              }} 
                            />
                          </div>
                          
                          <div className="flex justify-between text-sm mt-2">
                            <span>{userLevel.currentStars} نجمة</span>
                            <span>{userLevel.requiredStars} نجمة</span>
                          </div>
                          
                          <div className="mt-3 text-sm text-gray-500">
                            تحتاج إلى {(userLevel.requiredStars || 0) - (userLevel.currentStars || 0)} نجمة إضافية للوصول إلى المستوى {userLevel.nextLevel}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="cards">
                  {cardsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : userCards && (
                    <div className="space-y-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                            <span className="font-medium">البطاقات المجانية</span>
                          </div>
                          <div className="font-bold">{userCards.freeCards}</div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{
                              width: `${(userCards.usedFreeCards / (userCards.usedFreeCards + userCards.freeCards)) * 100}%`
                            }}
                          />
                        </div>
                        <div className="text-xs text-right mt-1 text-gray-500">
                          استخدمت {userCards.usedFreeCards} من أصل {userCards.usedFreeCards + userCards.freeCards}
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <Star className="h-5 w-5 mr-2 text-yellow-500" />
                            <span className="font-medium">البطاقات المدفوعة</span>
                          </div>
                          <div className="font-bold">{userCards.paidCards}</div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-yellow-500 rounded-full" 
                            style={{
                              width: `${(userCards.usedPaidCards / (userCards.usedPaidCards + userCards.paidCards)) * 100}%`
                            }}
                          />
                        </div>
                        <div className="text-xs text-right mt-1 text-gray-500">
                          استخدمت {userCards.usedPaidCards} من أصل {userCards.usedPaidCards + userCards.paidCards}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="stats">
                  {statsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : userStats && (
                    <div className="space-y-6">
                      <div className="flex items-center">
                        <Calendar className="h-6 w-6 mr-3 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">آخر لعبة</div>
                          <div className="font-medium">
                            {new Date(userStats.lastPlayed).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-6 w-6 mr-3 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">عدد الألعاب</div>
                          <div className="font-medium">{userStats.gamesPlayed} لعبة</div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}