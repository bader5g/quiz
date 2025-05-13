import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// تعريف النوع للمستخدم
interface UserProfile {
  id: number;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

// تعريف props للمكون
interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editType: 'name' | 'email' | 'phone' | 'password' | 'avatar';
  user: UserProfile | null;
  onSave: (type: string, value: string) => void;
  phonePrefix: string;
}

export function EditModal({ 
  open, 
  onOpenChange, 
  editType, 
  user, 
  onSave,
  phonePrefix 
}: EditModalProps) {
  // استخدام مراجع لمنع إعادة التحميل مع كل نقرة
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  // حالات محدودة للصورة فقط وحالة تحميل الزر
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { toast } = useToast();
  
  // تهيئة القيم عند فتح المودال
  useEffect(() => {
    if (open && user) {
      // تأخير قصير لضمان وجود المراجع
      setTimeout(() => {
        if (nameInputRef.current && editType === 'name') {
          nameInputRef.current.value = user.name || '';
        }
        if (emailInputRef.current && editType === 'email') {
          emailInputRef.current.value = user.email || '';
        }
        if (phoneInputRef.current && editType === 'phone') {
          phoneInputRef.current.value = user.phone?.replace(/^\+\d+\s/, '') || '';
        }
        if (passwordRef.current && editType === 'password') {
          passwordRef.current.value = '';
        }
        if (confirmPasswordRef.current && editType === 'password') {
          confirmPasswordRef.current.value = '';
        }
        
        // تهيئة الصورة
        if (editType === 'avatar') {
          setSelectedAvatar(user.avatarUrl || '');
        }
        
        // مسح الخطأ
        setError('');
      }, 50);
    }
  }, [open, editType, user]);
  
  // الحصول على عنوان المودال
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
  
  // التحقق من البيانات وإرسالها
  const handleSave = () => {
    setError('');
    setIsLoading(true);
    
    try {
      let value = '';
      
      switch (editType) {
        case 'name':
          value = nameInputRef.current?.value || '';
          if (!value) {
            setError('يرجى إدخال الاسم');
            setIsLoading(false);
            return;
          }
          break;
          
        case 'email':
          value = emailInputRef.current?.value || '';
          if (!value) {
            setError('يرجى إدخال البريد الإلكتروني');
            setIsLoading(false);
            return;
          }
          
          // التحقق من صحة البريد الإلكتروني
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            setError('يرجى إدخال بريد إلكتروني صحيح');
            setIsLoading(false);
            return;
          }
          break;
          
        case 'phone':
          value = phoneInputRef.current?.value || '';
          if (!value) {
            setError('يرجى إدخال رقم الهاتف');
            setIsLoading(false);
            return;
          }
          
          // التحقق من طول رقم الهاتف
          if (value.length < 8 || value.length > 12) {
            setError('رقم الهاتف يجب أن يكون بين 8 و 12 رقم');
            setIsLoading(false);
            return;
          }
          
          // إضافة رمز الدولة
          value = `${phonePrefix} ${value}`;
          break;
          
        case 'password':
          value = passwordRef.current?.value || '';
          const confirmValue = confirmPasswordRef.current?.value || '';
          
          if (!value) {
            setError('يرجى إدخال كلمة المرور');
            setIsLoading(false);
            return;
          }
          
          // التحقق من طول كلمة المرور
          if (value.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            setIsLoading(false);
            return;
          }
          
          // التحقق من تطابق كلمتي المرور
          if (value !== confirmValue) {
            setError('كلمتا المرور غير متطابقتين');
            setIsLoading(false);
            return;
          }
          break;
          
        case 'avatar':
          if (!selectedAvatar) {
            setError('يرجى اختيار صورة');
            setIsLoading(false);
            return;
          }
          
          value = selectedAvatar;
          break;
      }
      
      // إرسال البيانات
      setTimeout(() => {
        onSave(editType, value);
        setIsLoading(false);
        onOpenChange(false);
        
        // عرض رسالة نجاح
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث معلومات الملف الشخصي",
          variant: "default",
        });
      }, 500);
    } catch (error) {
      console.error("Error saving data:", error);
      setError('حدث خطأ أثناء الحفظ');
      setIsLoading(false);
    }
  };
  
  // التعامل مع تحميل الصورة
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // منع ظهور خطأ في المكون عند استدعاءه
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            تعديل بيانات الملف الشخصي
          </DialogDescription>
        </DialogHeader>
        
        {/* محتوى المودال حسب نوع التعديل */}
        <div className="py-4">
          {editType === 'name' && (
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input 
                id="name" 
                ref={nameInputRef}
                placeholder="أدخل اسمك" 
                autoComplete="off"
              />
            </div>
          )}
          
          {editType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                type="email" 
                ref={emailInputRef}
                placeholder="أدخل بريدك الإلكتروني" 
                autoComplete="off"
                onChange={() => {
                  const value = emailInputRef.current?.value || '';
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (value && !emailRegex.test(value)) {
                    setError('يرجى إدخال بريد إلكتروني صحيح');
                  } else {
                    setError('');
                  }
                }}
              />
            </div>
          )}
          
          {editType === 'phone' && (
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
                  onChange={(e) => {
                    // السماح فقط بالأرقام
                    if (phoneInputRef.current) {
                      const value = e.target.value.replace(/\D/g, '');
                      phoneInputRef.current.value = value;
                      
                      if (value && (value.length < 8 || value.length > 12)) {
                        setError('رقم الهاتف يجب أن يكون بين 8 و 12 رقم');
                      } else {
                        setError('');
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {editType === 'password' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input 
                  id="password" 
                  ref={passwordRef}
                  type="password" 
                  placeholder="أدخل كلمة المرور الجديدة"
                  onChange={() => {
                    const password = passwordRef.current?.value || '';
                    const confirm = confirmPasswordRef.current?.value || '';
                    
                    if (password && password.length < 8) {
                      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
                    } else if (confirm && password !== confirm) {
                      setError('كلمتا المرور غير متطابقتين');
                    } else {
                      setError('');
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input 
                  id="confirm-password" 
                  ref={confirmPasswordRef}
                  type="password" 
                  placeholder="أعد إدخال كلمة المرور"
                  onChange={() => {
                    const password = passwordRef.current?.value || '';
                    const confirm = confirmPasswordRef.current?.value || '';
                    
                    if (confirm && password !== confirm) {
                      setError('كلمتا المرور غير متطابقتين');
                    } else {
                      setError('');
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {editType === 'avatar' && (
            <div className="space-y-2">
              <Label>الصورة الشخصية</Label>
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  {selectedAvatar ? (
                    <div className="mb-4">
                      <img
                        src={selectedAvatar}
                        alt="صورة شخصية"
                        className="w-32 h-32 rounded-full mx-auto object-cover"
                      />
                    </div>
                  ) : (
                    <UserIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  )}
                  <Button
                    onClick={() => {
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
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    الأبعاد الموصى بها: 200×200 بكسل
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* عرض رسالة الخطأ */}
          {error && (
            <p className="text-sm text-destructive mt-3">{error}</p>
          )}
        </div>
        
        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="order-1 sm:order-1"
          >
            إلغاء
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave}
            disabled={!!error || isLoading}
            className="order-2 sm:order-2"
          >
            {isLoading ? (
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