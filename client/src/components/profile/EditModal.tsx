import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Check, X } from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editType: 'name' | 'email' | 'phone' | 'password' | 'avatar';
  user: UserProfile | null;
  onSave: (type: string, value: string) => void;
  phonePrefix: string;
}

export default function EditModal({ 
  open, 
  onOpenChange, 
  editType, 
  user, 
  onSave,
  phonePrefix = "+966"
}: EditModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // عند فتح المودال، نجعل التركيز على حقل الإدخال
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        
        // تعبئة القيمة الحالية حسب النوع إذا كان مرجع الإدخال موجوداً
        if (user && inputRef.current) {
          switch (editType) {
            case 'name':
              inputRef.current.value = user.name || '';
              break;
            case 'email':
              inputRef.current.value = user.email || '';
              break;
            case 'phone':
              inputRef.current.value = user.phone || '';
              break;
          }
        }
      }, 100);
    } else {
      // عند إغلاق المودال، نعيد تعيين حالة الخطأ
      setError("");
    }
  }, [open, editType, user]);

  const getTitle = () => {
    switch (editType) {
      case 'name':
        return "تعديل الاسم";
      case 'email':
        return "تعديل البريد الإلكتروني";
      case 'phone':
        return "تعديل رقم الهاتف";
      case 'password':
        return "تغيير كلمة المرور";
      case 'avatar':
        return "تغيير الصورة الشخصية";
      default:
        return "تعديل";
    }
  };

  const handleSubmit = () => {
    if (!inputRef.current) return;
    
    const value = inputRef.current.value.trim();
    
    if (value === '') {
      setError("هذا الحقل مطلوب");
      return;
    }
    
    // التحقق من صحة القيمة حسب النوع
    switch (editType) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          setError("يرجى إدخال بريد إلكتروني صحيح");
          return;
        }
        break;
      case 'phone':
        const phoneRegex = /^\d{8,12}$/;
        if (!phoneRegex.test(value)) {
          setError("يجب أن يتكون رقم الهاتف من 8-12 رقم");
          return;
        }
        break;
      case 'password':
        if (value.length < 8) {
          setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
          return;
        }
        if (!confirmInputRef.current || confirmInputRef.current.value !== value) {
          setError("كلمتا المرور غير متطابقتين");
          return;
        }
        break;
    }
    
    setIsLoading(true);
    
    // محاكاة تأخير لعملية الحفظ
    setTimeout(() => {
      onSave(editType, value);
      setIsLoading(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {editType === 'password' 
              ? "أدخل كلمة المرور الجديدة ثم أكدها" 
              : "أدخل القيمة الجديدة ثم اضغط حفظ"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {editType === 'name' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                الاسم
              </Label>
              <Input
                id="name"
                ref={inputRef}
                className="col-span-3"
                placeholder="أدخل اسمك"
              />
            </div>
          )}
          
          {editType === 'email' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                البريد
              </Label>
              <Input
                id="email"
                type="email"
                ref={inputRef}
                className="col-span-3"
                placeholder="أدخل بريدك الإلكتروني"
                dir="ltr"
              />
            </div>
          )}
          
          {editType === 'phone' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                الهاتف
              </Label>
              <div className="relative col-span-3">
                <Input
                  id="phone"
                  type="tel"
                  ref={inputRef}
                  className="ltr pl-16"
                  placeholder="أدخل رقم هاتفك"
                  dir="ltr"
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none border-r">
                  <span className="text-sm text-gray-500">{phonePrefix}</span>
                </div>
              </div>
            </div>
          )}
          
          {editType === 'password' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  ref={inputRef}
                  className="col-span-3"
                  placeholder="أدخل كلمة المرور الجديدة"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  التأكيد
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  ref={confirmInputRef}
                  className="col-span-3"
                  placeholder="أكد كلمة المرور الجديدة"
                />
              </div>
            </>
          )}
          
          {error && (
            <div className="text-red-500 text-sm flex items-center gap-2 mt-1">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? "جاري الحفظ..." : (
              <>
                <Check className="h-4 w-4" />
                <span>حفظ</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
