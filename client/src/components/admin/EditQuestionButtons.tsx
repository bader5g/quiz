import React, { useState } from "react";
import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { useCategorySelector } from "../../hooks/use-category-selector";
import { useCategoryStore } from "../../hooks/use-category-store";

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
  DialogFooter, 
  DialogDescription 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
      await apiRequest("PATCH", `/api/questions/${id}`, { [field]: editValue });
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
  categoryId: string; // تغيير من number إلى string لتمثيل main_category_code
  subcategoryId: number | null;
  categories: Category[];
  onUpdate: (id: number, categoryId: string, subcategoryId: number | null, categoryName: string, categoryIcon: string, subcategoryName: string | null) => void;
}

export function EditCategoryButton({
  id,
  categoryId,
  subcategoryId,
  categories: propCategories,
  onUpdate
}: EditCategoryButtonProps) {
  const store = useCategoryStore();
  const categories = (propCategories && propCategories.length > 0) ? propCategories : store.categories;
  const loading = store.loading;
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // تحويل كود الفئة إلى ID للعمل مع useCategorySelector - الآن نستخدم الكود مباشرة
  const {
    categoryId: selectedCategory,
    setCategoryId: setSelectedCategory,
    subcategoryId: selectedSubcategory,
    setSubcategoryId: setSelectedSubcategory,
    availableSubcategories: subcategories,
  } = useCategorySelector({
    categories,
    initialCategoryId: categoryId, // استخدم الكود مباشرة
    initialSubcategoryId: subcategoryId,
  });

  const handleSave = async () => {
    if (!selectedCategory) return;
    setIsSaving(true);
    try {
      // الحصول على كود الفئة - selectedCategory الآن هو الكود مباشرة
      const category = categories.find((c: any) => c.code === selectedCategory);
      const main_category_code = selectedCategory; // الكود مباشرة
      const subcategory_id = selectedSubcategory || null;
      await apiRequest("PATCH", `/api/questions/${id}`, {
        main_category_code,
        subcategory_id,
      });
      const subcategory = category?.children.find((s: any) => s.id === selectedSubcategory);
      onUpdate(
        id,
        main_category_code,
        subcategory_id,
        category?.name || '',
        category?.icon || '',
        subcategory?.name || null
      );
      setOpen(false);
      toast({
        title: "تم التعديل بنجاح",
        description: `تم تعديل الفئة إلى "${category?.name || ''}"${subcategory ? ` - "${subcategory?.name || ''}"` : ''}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating category:", error);
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
        className={`hover:bg-muted p-1 rounded opacity-70 hover:opacity-100 ${loading || !categories || categories.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (loading) {
            toast({ title: "جاري تحميل الفئات...", description: "يرجى الانتظار حتى يتم تحميل الفئات.", variant: "default" });
            return;
          }
          if (!categories || categories.length === 0) {
            toast({ title: "لا توجد فئات متاحة", description: "يرجى إضافة فئات أولاً.", variant: "destructive" });
            return;
          }
          setOpen(true);
        }}
        title="تغيير الفئة"
        disabled={loading || !categories || categories.length === 0}
      >
        <FolderEdit className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              تعديل الفئة
            </DialogTitle>
            <DialogDescription>
              اختر الفئة الرئيسية والفرعية للسؤال ثم اضغط حفظ. إذا لم تظهر الفئات، استخدم زر debug أدناه.
            </DialogDescription>
            <div className="text-sm text-muted-foreground mt-2">
              اختر الفئة الرئيسية والفرعية للسؤال
            </div>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground text-xs mt-2">جاري تحميل الفئات...</div>
            ) : (
              <>
                <div>
                  <label className="block mb-2 text-sm font-bold text-primary">الفئة الرئيسية</label>
                  <Select
                    value={selectedCategory || "no-categories"}
                    onValueChange={(value) => {
                      if (value === "no-categories") return;
                      setSelectedCategory(value);
                      setSelectedSubcategory(null);
                    }}
                    disabled={!categories || categories.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر الفئة الرئيسية" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.filter((category: any) => category && category.code && category.name).map((category: any) => (
                          <SelectItem key={category.code} value={category.code}>
                            <span className="flex items-center gap-2">
                              {category.icon && <span className="text-lg">{category.icon}</span>}
                              <span>{category.name}</span>
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          لا توجد فئات متاحة
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {subcategories && subcategories.length > 0 && (
                  <div>
                    <label className="block mb-2 text-sm">الفئة الفرعية</label>
                    <Select
                      value={
                        typeof selectedSubcategory === "number" && selectedSubcategory !== null && selectedSubcategory !== undefined
                          ? selectedSubcategory.toString()
                          : "none"
                      }
                      onValueChange={(value) => setSelectedSubcategory(value && value !== "none" ? parseInt(value) : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الفئة الفرعية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون فئة فرعية</SelectItem>
                        {subcategories
                          .filter((subcategory: any) => subcategory && typeof subcategory.id === 'number' && !isNaN(subcategory.id))
                          .map((subcategory: any) => (
                            <SelectItem key={subcategory.id.toString()} value={subcategory.id.toString()}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* زر debug لعرض معلومات الحالة */}
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // eslint-disable-next-line no-alert
                      alert(
                        `categories: ${JSON.stringify(categories, null, 2)}\n` +
                        `selectedCategory: ${selectedCategory}\n` +
                        `subcategories: ${JSON.stringify(subcategories, null, 2)}\n` +
                        `selectedSubcategory: ${selectedSubcategory}`
                      );
                    }}
                  >
                    عرض الأخطاء (debug)
                  </Button>
                </div>
                {/* معالجة حالة عدم وجود فئات */}
                {(!categories || categories.length === 0) && (
                  <div className="text-center text-muted-foreground text-xs mt-2">لا توجد فئات متاحة حاليًا. يرجى إضافة فئات أولاً.</div>
                )}
              </>
            )}
            
            {/* زر debug لمعلومات الحالة */}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">
                🐛 معلومات Debug
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <textarea
                  readOnly
                  className="w-full h-32 text-xs font-mono bg-background border rounded p-2 resize-none"
                  value={JSON.stringify({
                    questionId: id,
                    currentCategoryId: categoryId,
                    currentSubcategoryId: subcategoryId,
                    selectedCategory,
                    selectedSubcategory,
                    categoriesCount: categories?.length || 0,
                    categoriesLoading: loading,
                    storeCategories: store.categories?.length || 0,
                    propCategories: propCategories?.length || 0,
                    availableSubcategories: subcategories?.length || 0,
                    categories: categories?.map(c => ({ id: c.id, code: c.code, name: c.name })) || []
                  }, null, 2)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  يمكنك نسخ هذه المعلومات لمساعدة المطور في حل المشاكل
                </div>
              </div>
            </details>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => handleSave()} disabled={isSaving || !categories || categories.length === 0 || loading}>
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
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    typeof difficulty === "number" && difficulty !== null && difficulty !== undefined 
      ? difficulty.toString() 
      : "1"
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const difficultyLevel = parseInt(selectedDifficulty);
    if (isNaN(difficultyLevel)) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/questions/${id}`, { difficulty: difficultyLevel });
      onUpdate(id, difficultyLevel);
      setOpen(false);
      const difficultyLabels = {
        "1": "سهل",
        "2": "متوسط",
        "3": "صعب"
      };
      
      toast({
        title: "تم التعديل بنجاح",
        description: `تم تعديل مستوى الصعوبة إلى "${difficultyLabels[difficultyLevel.toString() as keyof typeof difficultyLabels] || difficultyLevel}"`,
        variant: "default",
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
            <DialogDescription>
              اختر مستوى صعوبة السؤال المناسب ثم اضغط حفظ.
            </DialogDescription>
            <div className="text-sm text-muted-foreground mt-2">
              اختر مستوى صعوبة السؤال المناسب
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col gap-2">
              <label className="block mb-1 font-medium">مستوى الصعوبة</label>
              <Select 
                value={selectedDifficulty} 
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر مستوى الصعوبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <span className="font-bold text-green-700">سهل</span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="font-bold text-yellow-700">متوسط</span>
                  </SelectItem>
                  <SelectItem value="3">
                    <span className="font-bold text-red-700">صعب</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
