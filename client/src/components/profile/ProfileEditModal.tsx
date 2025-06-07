import { useRef, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { UserIcon } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface UserProfile {
  id: number;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editType: 'name' | 'email' | 'phone' | 'password' | 'avatar';
  user: UserProfile | null;
  onUpdate: (updatedUser: UserProfile) => void;
}

export function ProfileEditModal({
  open,
  onOpenChange,
  editType,
  user,
  onUpdate
}: ProfileEditModalProps) {
  // استخدام المراجع بدلاً من الحالات لتجنب إعادة فتح المودال مع كل حرف
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // افتراضياً +966 لدول الخليج
  const phonePrefix = "+966";
  const { toast } = useToast();

  const getModalTitle = () => {
    switch (editType) {
      case 'name': return 'تعديل الاسم';
      case 'email': return 'تعديل البريد الإلكتروني';
      case 'phone': return 'تعديل رقم الهاتف';
      case 'password': return 'تغيير كلمة المرور';
      case 'avatar': return 'تغيير الصورة الشخصية';
      default: return 'تعديل';
    }
  };

  const handleNameChange = () => {
    setErrorMessage("");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح");
    } else {
      setErrorMessage("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // السماح فقط بالأرقام
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value;
    
    if (value && (value.length < 8 || value.length > 12)) {
      setErrorMessage("رقم الهاتف يجب أن يكون بين 8 و 12 رقم");
    } else {
      setErrorMessage("");
    }
  };

  const handlePasswordChange = () => {
    const password = passwordInputRef.current?.value || "";
    
    if (password && password.length < 8) {
      setErrorMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    } else {
      setErrorMessage("");
    }
    
    // التحقق من تطابق كلمات المرور
    if (confirmPasswordInputRef.current && confirmPasswordInputRef.current.value) {
      if (password !== confirmPasswordInputRef.current.value) {
        setErrorMessage("كلمتا المرور غير متطابقتين");
      }
    }
  };
  
  const handleConfirmPasswordChange = () => {
    const password = passwordInputRef.current?.value || "";
    const confirmPassword = confirmPasswordInputRef.current?.value || "";
    
    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage("كلمتا المرور غير متطابقتين");
    } else {
      setErrorMessage("");
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    
    try {
      let newValue = "";
      
      switch (editType) {
        case 'name':
          newValue = nameInputRef.current?.value || "";
          break;
        case 'email':
          newValue = emailInputRef.current?.value || "";
          // التحقق من صحة البريد
          if (newValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
            setErrorMessage("يرجى إدخال بريد إلكتروني صحيح");
            setIsSubmitting(false);
            return;
          }
          break;
        case 'phone':
          newValue = phoneInputRef.current?.value || "";
          // التحقق من صحة رقم الهاتف
          if (newValue && (newValue.length < 8 || newValue.length > 12)) {
            setErrorMessage("رقم الهاتف يجب أن يكون بين 8 و 12 رقم");
            setIsSubmitting(false);
            return;
          }
          newValue = `${phonePrefix} ${newValue}`;
          break;
        case 'password':
          newValue = passwordInputRef.current?.value || "";
          const confirmValue = confirmPasswordInputRef.current?.value || "";
          
          // التحقق من صحة كلمة المرور
          if (newValue.length < 8) {
            setErrorMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
            setIsSubmitting(false);
            return;
          }
          
          // التحقق من تطابق كلمات المرور
          if (newValue !== confirmValue) {
            setErrorMessage("كلمتا المرور غير متطابقتين");
            setIsSubmitting(false);
            return;
          }
          break;
        case 'avatar':
          // سيتم التعامل مع الصورة بشكل مختلف
          break;
      }
      
      // تحديث البيانات
      if (user) {
        // عمل نسخة من المستخدم
        const updatedUser = { ...user };
        
        // تحديث الحقل المناسب
        switch (editType) {
          case 'name':
            updatedUser.name = newValue;
            break;
          case 'email':
            updatedUser.email = newValue;
            break;
          case 'phone':
            updatedUser.phone = newValue;
            break;
          case 'avatar':
            if (avatarPreview) {
              updatedUser.avatarUrl = avatarPreview;
            }
            break;
        }
        
        // استدعاء callback للتحديث
        onUpdate(updatedUser);
        
        // رسالة نجاح
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث معلومات الملف الشخصي",
          variant: "default",
        });
        
        // إغلاق المودال
        onOpenChange(false);
        
        // إعادة تعيين الحالة
        setErrorMessage("");
        setAvatarPreview("");
        setAvatarFile(null);
      }
    } catch (err) {
      console.error("فشل تحديث الملف الشخصي:", err);
      toast({
        title: "خطأ في التحديث",
        description: "فشل تحديث معلومات الملف الشخصي، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // تحديد محتوى المودال بناءً على نوع التعديل
  const renderModalContent = () => {
    switch (editType) {
      case 'name':
        return (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input 
                id="name" 
                ref={nameInputRef}
                placeholder="أدخل اسمك" 
                autoComplete="off"
                defaultValue={user?.name || ""}
                onChange={handleNameChange}
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
                ref={emailInputRef}
                type="email" 
                placeholder="أدخل بريدك الإلكتروني" 
                autoComplete="off"
                defaultValue={user?.email || ""}
                onChange={handleEmailChange}
              />
              {errorMessage && (
                <p className="text-sm text-destructive mt-1">{errorMessage}</p>
              )}
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="flex">
                <div className="flex items-center justify-center h-10 px-3 rounded-r-md border border-r-0 border-input bg-muted">
                  {phonePrefix}
                </div>
                <Input 
                  id="phone" 
                  ref={phoneInputRef}
                  placeholder="5XXXXXXXX" 
                  autoComplete="off"
                  className="rounded-r-none"
                  defaultValue={user?.phone?.replace(/^\+\d+\s/, '') || ""}
                  onChange={handlePhoneChange}
                />
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive mt-1">{errorMessage}</p>
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
                ref={passwordInputRef}
                type="password" 
                placeholder="أدخل كلمة المرور الجديدة"
                onChange={handlePasswordChange}
              />
              {errorMessage && (
                <p className="text-sm text-destructive mt-1">{errorMessage}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input 
                id="confirm-password" 
                ref={confirmPasswordInputRef}
                type="password" 
                placeholder="أعد إدخال كلمة المرور"
                onChange={handleConfirmPasswordChange}
              />
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الصورة الشخصية</Label>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  {avatarPreview || user?.avatarUrl ? (
                    <div className="mb-4">
                      <img
                        src={avatarPreview || user?.avatarUrl}
                        alt="صورة شخصية محددة"
                        className="w-32 h-32 rounded-full mx-auto object-cover"
                      />
                    </div>
                  ) : (
                    <UserIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  )}
                  <Button
                    onClick={() => {
                      // محاكاة نقرة على حقل الملف المخفي
                      document.getElementById('avatar-upload')?.click();
                    }}
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                  >
                    اختر صورة
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    الأبعاد الموصى بها: 200×200 بكسل
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription className="sr-only">
            {`نافذة تحرير ${editType === 'name' ? 'الاسم' : 
              editType === 'email' ? 'البريد الإلكتروني' : 
              editType === 'phone' ? 'رقم الهاتف' : 
              editType === 'password' ? 'كلمة المرور' : 'الصورة الشخصية'}`}
          </DialogDescription>
        </DialogHeader>

        {renderModalContent()}

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setErrorMessage("");
              setAvatarPreview("");
              setAvatarFile(null);
            }}
            className="order-1 sm:order-1"
          >
            إلغاء
          </Button>
          <Button 
            type="submit" 
            onClick={handleSaveChanges}
            disabled={
              (editType === 'email' && !!errorMessage) ||
              (editType === 'phone' && !!errorMessage) ||
              (editType === 'password' && !!errorMessage) ||
              isSubmitting
            }
            className="order-2 sm:order-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحفظ...
              </>
            ) : (
              'حفظ'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
