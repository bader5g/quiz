import React, { useState } from "react";
import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// تعريف أنواع البيانات
interface CategoryChild {
  id: number;
  name: string;
  icon?: string;
  parentId: number;
  imageUrl?: string;
  isActive?: boolean;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
  children: CategoryChild[];
}
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// زر تعديل النص (سؤال أو إجابة)
export function EditTextButton({ 
  id, 
  field, 
  value, 
  onUpdate 
}: { 
  id: number; 
  field: 'text' | 'answer'; 
  value: string; 
  onUpdate: (id: number, field: string, value: string) => void; 
}) {
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!editValue.trim()) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { [field]: editValue });
      onUpdate(id, field, editValue);
      setOpen(false);
      toast({
        title: "تم التعديل بنجاح",
        description: `تم تعديل ${field === 'text' ? 'السؤال' : 'الإجابة'} بنجاح: "${editValue.substring(0, 30)}${editValue.length > 30 ? '...' : ''}"`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating:", error);
      
      // تحسين رسائل الخطأ لتكون أكثر تحديدًا
      let errorMessage = "حدث خطأ أثناء تعديل البيانات";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.";
        } else if (error.message.includes("network")) {
          errorMessage = "يوجد مشكلة في الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.";
        } else if (error.message.includes("403")) {
          errorMessage = "ليس لديك صلاحية لتعديل هذا العنصر.";
        } else if (error.message.includes("404")) {
          errorMessage = "لم يتم العثور على السؤال. قد يكون قد تم حذفه.";
        }
      }
      
      toast({
        title: "خطأ في التعديل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
        onClick={() => setOpen(true)}
        title={`تعديل ${field === 'text' ? 'السؤال' : 'الإجابة'}`}
      >
        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {field === 'text' ? 'تعديل السؤال' : 'تعديل الإجابة'}
            </DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              قم بتعديل {field === 'text' ? 'نص السؤال' : 'الإجابة'} في الحقل أدناه
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// زر تعديل الفئة
interface EditCategoryButtonProps {
  id: number;
  categoryId: number;
  subcategoryId: number | null;
  categories: Category[];
  onUpdate: (id: number, categoryId: number, subcategoryId: number | null, categoryName: string, categoryIcon: string, subcategoryName: string | null) => void;
}

export function EditCategoryButton({
  id,
  categoryId,
  subcategoryId,
  categories,
  onUpdate
}: EditCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryId.toString());
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    subcategoryId ? subcategoryId.toString() : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const subcategories: CategoryChild[] = categories.find((c: Category) => c.id.toString() === selectedCategory)?.children || [];

  const handleSave = async () => {
    const catId = parseInt(selectedCategory);
    const subcatId = selectedSubcategory ? parseInt(selectedSubcategory) : null;
    
    if (isNaN(catId)) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { 
        categoryId: catId,
        subcategoryId: subcatId
      });
      
      const category = categories.find((c: Category) => c.id === catId);
      const subcategory = category?.children.find((s: CategoryChild) => s.id === subcatId);
      
      onUpdate(
        id, 
        catId, 
        subcatId, 
        category?.name || '', 
        category?.icon || '', 
        subcategory?.name || null
      );
      
      setOpen(false);
      toast({
        title: "تم التعديل",
        description: "تم تعديل الفئة بنجاح",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      
      // تحسين رسائل الخطأ لتكون أكثر تحديدًا
      let errorMessage = "حدث خطأ أثناء تعديل الفئة";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.";
        } else if (error.message.includes("network")) {
          errorMessage = "يوجد مشكلة في الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.";
        } else if (error.message.includes("403")) {
          errorMessage = "ليس لديك صلاحية لتعديل فئة هذا السؤال.";
        } else if (error.message.includes("404")) {
          errorMessage = "لم يتم العثور على السؤال أو الفئة. قد يكون أحدهما قد تم حذفه.";
        } else if (error.message.includes("category not found")) {
          errorMessage = "الفئة المحددة غير موجودة.";
        }
      }
      
      toast({
        title: "خطأ في تعديل الفئة",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
        onClick={() => setOpen(true)}
        title="تغيير الفئة"
      >
        <FolderEdit className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              تعديل الفئة
            </DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              اختر الفئة الرئيسية والفرعية للسؤال
            </div>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <label className="block mb-2 text-sm">الفئة الرئيسية</label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setSelectedSubcategory("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الفئة الرئيسية" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {subcategories.length > 0 && (
              <div>
                <label className="block mb-2 text-sm">الفئة الفرعية</label>
                <Select 
                  value={selectedSubcategory} 
                  onValueChange={setSelectedSubcategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الفئة الفرعية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">بدون فئة فرعية</SelectItem>
                    {subcategories.map((subcategory: CategoryChild) => (
                      <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// زر تعديل مستوى الصعوبة
interface EditDifficultyButtonProps {
  id: number;
  difficulty: number;
  onUpdate: (id: number, difficulty: number) => void;
}

export function EditDifficultyButton({
  id,
  difficulty,
  onUpdate
}: EditDifficultyButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty.toString());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const difficultyLevel = parseInt(selectedDifficulty);
    if (isNaN(difficultyLevel)) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { difficulty: difficultyLevel });
      onUpdate(id, difficultyLevel);
      setOpen(false);
      toast({
        title: "تم التعديل",
        description: "تم تعديل مستوى الصعوبة بنجاح",
      });
    } catch (error) {
      console.error("Error updating difficulty:", error);
      
      // تحسين رسائل الخطأ لتكون أكثر تحديدًا
      let errorMessage = "حدث خطأ أثناء تعديل مستوى الصعوبة";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.";
        } else if (error.message.includes("network")) {
          errorMessage = "يوجد مشكلة في الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.";
        } else if (error.message.includes("403")) {
          errorMessage = "ليس لديك صلاحية لتعديل مستوى صعوبة هذا السؤال.";
        } else if (error.message.includes("404")) {
          errorMessage = "لم يتم العثور على السؤال. قد يكون قد تم حذفه.";
        } else if (error.message.includes("invalid difficulty")) {
          errorMessage = "مستوى الصعوبة المحدد غير صالح.";
        }
      }
      
      toast({
        title: "خطأ في تعديل مستوى الصعوبة",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
        onClick={() => setOpen(true)}
        title="تغيير مستوى الصعوبة"
      >
        <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              تعديل مستوى الصعوبة
            </DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              اختر مستوى صعوبة السؤال المناسب
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              value={selectedDifficulty} 
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر مستوى الصعوبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">سهل</SelectItem>
                <SelectItem value="2">متوسط</SelectItem>
                <SelectItem value="3">صعب</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}