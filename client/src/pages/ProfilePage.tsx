import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import EditModal from "@/components/profile/EditModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserIcon, 
  Calendar, 
  BarChart, 
  Clock,
  Mail,
  Phone,
  Lock,
  Image,
  Pencil,
  Trophy,
  Users,
  UserPlus,
  XCircle,
  Star
} from "lucide-react";

interface LinkedUser {
  id: number;
  username: string;
  name?: string;
  avatarUrl?: string;
  relationshipType: string; // 'sub-user' = مستخدم فرعي
  lastGameDate?: string;
  email?: string;
  phone?: string;
  gamesPlayed: number;
  activityPercentage: number;
  contributionStars: number;
  freeCards: number;
  paidCards: number;
  status: 'active' | 'disabled';
  isOnline?: boolean;
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
  const { user: currentUser, updateUser: setUser } = useUser();
  
  // الحد الأقصى لعدد المستخدمين الفرعيين
  const maxSubUsers = 5; // القيمة الافتراضية، يمكن استبدالها بقيمة من إعدادات اللعبة
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'name' | 'email' | 'phone' | 'password' | 'avatar'>('name');
  const [phonePrefix, setPhonePrefix] = useState<string>('+966');
  
  // حالات نوافذ المستخدمين الفرعيين
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedSubUser, setSelectedSubUser] = useState<LinkedUser | null>(null);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  
  // حالة بيانات المستخدم الفرعي الجديد
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // حالة بيانات تعديل المستخدم الفرعي
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  
  // حالة إضافة الكروت
  const [freeCardsToAdd, setFreeCardsToAdd] = useState<number>(0);
  const [paidCardsToAdd, setPaidCardsToAdd] = useState<number>(0);

  // تحديد رمز الدولة عند تحميل الصفحة
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
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

  // استعلام للمستخدمين المرتبطين
  const { 
    data: linkedUsers, 
    isLoading: linkedUsersLoading,
    refetch: refetchLinkedUsers
  } = useQuery<LinkedUser[], Error>({
    queryKey: ['/api/linked-users'],
    queryFn: getQueryFn({ on401: "throw" }),
    placeholderData: [], // استخدم مصفوفة فارغة كقيمة افتراضية في حال عدم وجود بيانات
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
  }, [userProfile, setUser]);
  
  // تعبئة بيانات المستخدم الفرعي المحدد عند فتح نافذة التعديل
  useEffect(() => {
    if (selectedSubUser && editUserModalOpen) {
      setEditUserName(selectedSubUser.name || '');
      setEditUserEmail(selectedSubUser.email || '');
      setEditUserPhone(selectedSubUser.phone ? selectedSubUser.phone.replace(/^(\+\d+)/, '') : '');
      setEditUserPassword('');
    }
  }, [selectedSubUser, editUserModalOpen]);

  // دالة فتح نافذة التعديل
  const openEditModal = (type: 'name' | 'email' | 'phone' | 'password' | 'avatar') => {
    setEditType(type);
    setEditModalOpen(true);
  };

  // دالة معالجة حفظ التغييرات
  const handleSaveProfileChanges = (type: string, value: string) => {
    if (!currentUser) return;
    
    // تحديث بيانات المستخدم
    const updatedUser = { ...currentUser };
    
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
      case 'password':
        // لن نقوم بتخزين كلمة المرور في حالة المستخدم الحالية
        toast({
          title: "تم تغيير كلمة المرور",
          description: "تم تحديث كلمة المرور الخاصة بك بنجاح",
        });
        break;
      case 'avatar':
        updatedUser.avatarUrl = value;
        break;
    }
    
    // تحديث البيانات في الواجهة وفي الخادم
    setUser(updatedUser);
    setEditModalOpen(false);
    
    // إظهار رسالة نجاح
    if (type !== 'password') {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث معلومات ملفك الشخصي",
      });
    }
    
    // إعادة تحميل بيانات الملف الشخصي
    refetchProfile();
  };
  
  // إضافة مستخدم فرعي جديد
  const handleAddSubUser = async () => {
    // التحقق من الحد الأقصى للمستخدمين الفرعيين
    if (linkedUsers && linkedUsers.length >= maxSubUsers) {
      toast({
        title: "الحد الأقصى",
        description: "لقد وصلت إلى الحد الأقصى لعدد المستخدمين المسموح به.",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من صحة البيانات المدخلة
    if (!newUserName.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المستخدم",
        variant: "destructive"
      });
      return;
    }
    
    if (newUserPassword !== newUserConfirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور وتأكيدها غير متطابقين",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من صحة البريد الإلكتروني
    if (newUserEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail)) {
      toast({
        title: "خطأ في البريد الإلكتروني",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من صحة رقم الهاتف
    if (newUserPhone && !/^\d{8,12}$/.test(newUserPhone)) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "يرجى إدخال رقم هاتف صحيح (8-12 رقم)",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ⚠️ هام: يجب ربط هذه العمليات بـ API حقيقية على الخادم
      // والتأكد من تنفيذ التحقق الأمني من جهة الخادم أيضًا لمنع التلاعب
      // await apiRequest("POST", "/api/linked-users", {
      //   name: newUserName,
      //   email: newUserEmail || undefined,
      //   phone: newUserPhone ? `${phonePrefix}${newUserPhone}` : undefined,
      //   password: newUserPassword,
      //   relationshipType: "sub-user"
      // });
      
      // محاكاة الاستجابة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة ${newUserName} كمستخدم فرعي`
      });
      
      // إعادة تحميل قائمة المستخدمين المرتبطين
      refetchLinkedUsers();
      
      // مسح النموذج وإغلاق النافذة
      resetAddUserForm();
      setAddUserModalOpen(false);
    } catch (error) {
      toast({
        title: "فشل في إضافة المستخدم",
        description: "حدث خطأ أثناء إضافة المستخدم، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // مسح نموذج إضافة المستخدم
  const resetAddUserForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
  };
  
  // تحديث بيانات المستخدم الفرعي
  const handleUpdateSubUser = async () => {
    if (!selectedSubUser) return;
    
    // التحقق من صحة البريد الإلكتروني
    if (editUserEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserEmail)) {
      toast({
        title: "خطأ في البريد الإلكتروني",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من صحة رقم الهاتف
    if (editUserPhone && !/^\d{8,12}$/.test(editUserPhone)) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "يرجى إدخال رقم هاتف صحيح (8-12 رقم)",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ⚠️ هام: يجب ربط هذه العمليات بـ API حقيقية على الخادم
      // والتأكد من تنفيذ التحقق الأمني من جهة الخادم أيضًا للتحقق من ملكية المستخدم الفرعي
      // await apiRequest("PATCH", `/api/linked-users/${selectedSubUser.id}`, {
      //   name: editUserName || undefined,
      //   email: editUserEmail || undefined,
      //   phone: editUserPhone ? `${phonePrefix}${editUserPhone}` : undefined,
      //   password: editUserPassword || undefined
      // });
      
      // محاكاة الاستجابة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث بيانات المستخدم ${editUserName || selectedSubUser.name}`
      });
      
      // إعادة تحميل قائمة المستخدمين المرتبطين
      refetchLinkedUsers();
      
      // إغلاق النافذة
      setEditUserModalOpen(false);
    } catch (error) {
      toast({
        title: "فشل في تحديث البيانات",
        description: "حدث خطأ أثناء تحديث البيانات، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // إضافة كروت للمستخدم الفرعي
  const handleAddCards = async () => {
    if (!selectedSubUser) return;
    
    if (freeCardsToAdd < 0 || paidCardsToAdd < 0) {
      toast({
        title: "قيمة غير صالحة",
        description: "يجب أن تكون الكروت المضافة أكبر من أو تساوي صفر",
        variant: "destructive"
      });
      return;
    }
    
    if (freeCardsToAdd === 0 && paidCardsToAdd === 0) {
      toast({
        title: "لم يتم إضافة كروت",
        description: "يرجى تحديد عدد الكروت المراد إضافتها",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ⚠️ هام: يجب ربط هذه العمليات بـ API حقيقية على الخادم
      // والتأكد من تنفيذ التحقق الأمني من جهة الخادم أيضًا للتحقق من الصلاحيات
      // await apiRequest("POST", `/api/linked-users/${selectedSubUser.id}/add-cards`, {
      //   freeCards: freeCardsToAdd,
      //   paidCards: paidCardsToAdd
      // });
      
      // محاكاة الاستجابة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة ${freeCardsToAdd} كروت مجانية و ${paidCardsToAdd} كروت مدفوعة`
      });
      
      // إعادة تحميل قائمة المستخدمين المرتبطين
      refetchLinkedUsers();
      
      // مسح النموذج وإغلاق النافذة
      setFreeCardsToAdd(0);
      setPaidCardsToAdd(0);
      setAddCardModalOpen(false);
    } catch (error) {
      toast({
        title: "فشل في إضافة الكروت",
        description: "حدث خطأ أثناء إضافة الكروت، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // تبديل حالة المستخدم (تفعيل/تعطيل)
  const toggleUserStatus = async (user: LinkedUser) => {
    try {
      // في تطبيق حقيقي، سنرسل هذه البيانات إلى الخادم عبر طلب API
      // await apiRequest("PATCH", `/api/linked-users/${user.id}/toggle-status`, {
      //   status: user.status === 'active' ? 'disabled' : 'active'
      // });
      
      // محاكاة الاستجابة
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: user.status === 'active' ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم",
        description: `تم ${user.status === 'active' ? 'تعطيل' : 'تفعيل'} المستخدم ${user.name || user.username}`
      });
      
      // إعادة تحميل قائمة المستخدمين المرتبطين
      refetchLinkedUsers();
      
    } catch (error) {
      toast({
        title: "فشل في تغيير الحالة",
        description: "حدث خطأ أثناء محاولة تغيير حالة المستخدم",
        variant: "destructive"
      });
    }
  };
  
  // حذف المستخدم الفرعي
  const handleDeleteSubUser = async (user: LinkedUser) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المستخدم ${user.name || user.username}؟`)) {
      return;
    }
    
    try {
      // في تطبيق حقيقي، سنرسل هذه البيانات إلى الخادم عبر طلب API
      // await apiRequest("DELETE", `/api/linked-users/${user.id}`);
      
      // محاكاة الاستجابة
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف المستخدم ${user.name || user.username}`
      });
      
      // إعادة تحميل قائمة المستخدمين المرتبطين
      refetchLinkedUsers();
      
    } catch (error) {
      toast({
        title: "فشل في حذف المستخدم",
        description: "حدث خطأ أثناء محاولة حذف المستخدم",
        variant: "destructive"
      });
    }
  };

  // التحقق من وجود المستخدم الحالي
  if (!currentUser) {
    return <div>يرجى تسجيل الدخول لعرض ملفك الشخصي</div>;
  }

  // عرض حالة التحميل
  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 md:px-6" dir="rtl">
          <div className="grid gap-6 md:gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <Skeleton className="h-[300px] w-full rounded-xl" />
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

  const user = currentUser;

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
                  
                  <h3 className="text-xl font-bold mt-4 mb-1 flex items-center gap-1">
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
                  
                  <div className="w-full mt-2">
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
              {/* إحصائيات اللعب */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">إحصائيات اللعب</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : userStats ? (
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-full bg-purple-100">
                            <BarChart className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">إجمالي الألعاب</p>
                            <p className="font-bold">{userStats.gamesPlayed + (linkedUsers?.reduce((acc, user) => acc + user.gamesPlayed, 0) || 0)} لعبة</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-full bg-indigo-100">
                            <UserIcon className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ألعاب حسابي</p>
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
              
              {/* بطاقة المستخدمين المرتبطين */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl font-bold">المستخدمون المرتبطون</CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">يمكنك إضافة حتى {maxSubUsers} مستخدم فرعي (يحدد المدير هذا الحد)</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => setAddUserModalOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>إضافة مستخدم</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  {linkedUsersLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : linkedUsers && linkedUsers.length > 0 ? (
                    <div className="space-y-5">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3 text-sm text-center">
                          <div>
                            <p className="text-muted-foreground">إجمالي المستخدمين الفرعيين</p>
                            <p className="font-bold text-lg mt-1">{linkedUsers.length} / 5</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">المستخدمين النشطين</p>
                            <p className="font-bold text-lg mt-1">{linkedUsers.filter(u => u.status === 'active').length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-4">
                        {linkedUsers.map((linkedUser) => (
                          <div 
                            key={linkedUser.id} 
                            className={`border rounded-lg overflow-hidden transition-all ${
                              linkedUser.status === 'active' ? 'border-muted' : 'border-muted/50 opacity-60'
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-11 w-11 border border-muted">
                                    <AvatarImage src={linkedUser.avatarUrl} alt={linkedUser.name} />
                                    <AvatarFallback>
                                      {linkedUser.name?.charAt(0) || linkedUser.username?.charAt(0) || <UserIcon />}
                                    </AvatarFallback>
                                  </Avatar>
                                  {linkedUser.isOnline && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-base">{linkedUser.name || linkedUser.username}</h4>
                                    <Badge variant={linkedUser.status === 'active' ? 'outline' : 'secondary'} className="h-5 text-xs">
                                      {linkedUser.status === 'active' ? 'نشط' : 'معطل'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    {linkedUser.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {linkedUser.email}
                                      </span>
                                    )}
                                    {linkedUser.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {linkedUser.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={() => {
                                    setSelectedSubUser(linkedUser);
                                    setEditUserModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => handleDeleteSubUser(linkedUser)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                
                                {linkedUser.status === 'active' ? (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground"
                                    onClick={() => toggleUserStatus(linkedUser)}
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-green-500"
                                    onClick={() => toggleUserStatus(linkedUser)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                      <line x1="12" y1="19" x2="12" y2="23"></line>
                                      <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="grid grid-cols-3 divide-x text-center py-3">
                              <div className="px-2">
                                <p className="text-xs text-muted-foreground">عدد الألعاب</p>
                                <p className="font-bold mt-1">{linkedUser.gamesPlayed}</p>
                              </div>
                              <div className="px-2">
                                <p className="text-xs text-muted-foreground">نسبة النشاط</p>
                                <p className="font-bold mt-1">%{linkedUser.activityPercentage}</p>
                              </div>
                              <div className="px-2">
                                <p className="text-xs text-muted-foreground">النجوم المكتسبة</p>
                                <p className="font-bold mt-1 flex items-center justify-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 mr-0.5" /> {linkedUser.contributionStars}
                                </p>
                              </div>
                            </div>
                            
                            {/* Cards */}
                            <div className="bg-muted/20 py-2 px-3 flex justify-between items-center">
                              <div className="flex items-center gap-5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-sm">{linkedUser.freeCards + linkedUser.paidCards} كروت</span>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span>{linkedUser.freeCards} مجاني</span>
                                  <span>{linkedUser.paidCards} مدفوع</span>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2.5 text-xs gap-1"
                                onClick={() => {
                                  setSelectedSubUser(linkedUser);
                                  setAddCardModalOpen(true);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="16"></line>
                                  <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                <span>إضافة كروت</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3">
                      <div className="bg-muted/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">لا يوجد مستخدمين مرتبطين</h3>
                      <p className="text-muted-foreground max-w-md mx-auto text-sm">
                        يمكنك إضافة حتى {maxSubUsers} مستخدمين فرعيين للعب باستخدام حسابك. كل مستخدم يملك رصيد كروت مستقل ويساهم في رفع مستوى حسابك الرئيسي.
                      </p>
                      <Button 
                        className="mt-3"
                        onClick={() => setAddUserModalOpen(true)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        إضافة مستخدم فرعي
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
      
      {/* نافذة تعديل معلومات الملف الشخصي */}
      <EditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        editType={editType}
        user={user}
        onSave={handleSaveProfileChanges}
        phonePrefix={phonePrefix}
      />

      {/* نافذة إضافة مستخدم فرعي جديد */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة مستخدم فرعي جديد</DialogTitle>
            <DialogDescription className="text-center">
              يمكن للمستخدم الفرعي استخدام الحساب للعب مع رصيد كروت خاص به.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input 
                id="name" 
                placeholder="اسم المستخدم الفرعي" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@example.com" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="flex">
                  <div className="bg-muted flex items-center px-2 border border-r-0 rounded-s-md text-sm border-input">
                    {phonePrefix}
                  </div>
                  <Input 
                    id="phone" 
                    type="tel" 
                    className="rounded-s-none"
                    placeholder="5xxxxxxxx" 
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="كلمة مرور آمنة" 
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder="تأكيد كلمة المرور" 
                value={newUserConfirmPassword}
                onChange={(e) => setNewUserConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetAddUserForm();
                setAddUserModalOpen(false);
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="button"
              onClick={handleAddSubUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإضافة...
                </span>
              ) : (
                <span>إضافة المستخدم</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل مستخدم فرعي */}
      <Dialog open={editUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">تعديل المستخدم الفرعي</DialogTitle>
            <DialogDescription className="text-center">
              {selectedSubUser?.name || selectedSubUser?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">الاسم</Label>
              <Input 
                id="edit-name" 
                placeholder="اسم المستخدم الفرعي" 
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  placeholder="example@example.com" 
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <div className="flex">
                  <div className="bg-muted flex items-center px-2 border border-r-0 rounded-s-md text-sm border-input">
                    {phonePrefix}
                  </div>
                  <Input 
                    id="edit-phone" 
                    type="tel" 
                    className="rounded-s-none"
                    placeholder="5xxxxxxxx" 
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-password">كلمة المرور الجديدة (اختياري)</Label>
              <Input 
                id="edit-password" 
                type="password" 
                placeholder="اترك فارغًا للإبقاء على كلمة المرور الحالية" 
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setEditUserModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="button" 
              className="gap-1"
              onClick={handleUpdateSubUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الحفظ...
                </span>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة كروت */}
      <Dialog open={addCardModalOpen} onOpenChange={setAddCardModalOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة كروت</DialogTitle>
            <DialogDescription className="text-center">
              {selectedSubUser?.name || selectedSubUser?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between border-y py-4 my-2">
            <div>
              <p className="font-medium">الكروت الحالية</p>
              <p className="text-sm text-muted-foreground">المجموع: {selectedSubUser ? selectedSubUser.freeCards + selectedSubUser.paidCards : 0}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">مجاني:</span>
                <span className="font-medium">{selectedSubUser?.freeCards || 0}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">مدفوع:</span>
                <span className="font-medium">{selectedSubUser?.paidCards || 0}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="free-cards">كروت مجانية</Label>
                <Input 
                  id="free-cards" 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  value={freeCardsToAdd}
                  onChange={(e) => setFreeCardsToAdd(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid-cards">كروت مدفوعة</Label>
                <Input 
                  id="paid-cards" 
                  type="number" 
                  min="0"
                  placeholder="0"
                  value={paidCardsToAdd}
                  onChange={(e) => setPaidCardsToAdd(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setFreeCardsToAdd(0);
                setPaidCardsToAdd(0);
                setAddCardModalOpen(false);
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="button"
              onClick={handleAddCards}
              disabled={isSubmitting || (freeCardsToAdd === 0 && paidCardsToAdd === 0)}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإضافة...
                </span>
              ) : 'إضافة الكروت'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}