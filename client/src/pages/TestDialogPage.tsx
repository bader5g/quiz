import { useState } from "react";
// import Layout from "./components/layout/Layout";
import { Button } from "../components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogPortal  
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// تم تعطيل الاستيراد المفقود مؤقتًا لحل مشكلة البناء

export default function TestDialogPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">اختبار النافذة المنبثقة</h1>
        
        <Button onClick={() => setOpen(true)}>
          فتح النافذة المنبثقة
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogPortal container={document?.getElementById('modal-root') ?? undefined}>
            <DialogContent className="sm:max-w-md z-[100] bg-white" dir="rtl">
              <DialogHeader>
                <DialogTitle>تعديل المعلومات</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="test">حقل تجريبي</Label>
                  <Input 
                    id="test" 
                    placeholder="أدخل نصًا تجريبيًا" 
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <DialogFooter className="flex flex-row justify-between sm:justify-between">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={() => setOpen(false)}>
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
    </>
  );
}
