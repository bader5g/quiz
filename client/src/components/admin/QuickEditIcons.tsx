import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCategorySelector } from "../../hooks/use-category-selector";
import { useCategoryStore } from "../../hooks/use-category-store";

// األنواع
interface QuickEditProps {
  id: number;
  text: string;
  field: string;
  onUpdate: (id: number, field: string, value: any) => void;
}

interface QuickDifficultyProps {
  id: number;
  difficulty: number;
  onUpdate: (id: number, value: number) => void;
}

interface QuickCategoryProps {
  id: number;
  categoryId: string; // Changed to string to work with category codes
  subcategoryId: number | null;
  categories: any[];
  onUpdate: (id: number, categoryId: string, subcategoryId: number | null) => void;
}

// مكونات التعديل السريع
interface QuickEditTextProps extends QuickEditProps {
  isEditing: boolean;
  setEditing: (v: boolean) => void;
}

export function QuickEditText({ id, text, field, onUpdate, isEditing, setEditing }: QuickEditTextProps) {
  const [value, setValue] = useState(text);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // تحديث القيمة عند تغيير النص الأصلي
  useEffect(() => { setValue(text); }, [text]);

  const handleSave = async () => {
    if (!value.trim()) return;
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { [field]: value });
      onUpdate(id, field, value);
      setEditing(false);
      toast({
        title: "تم التعديل",
        description: "تم تعديل البيانات بنجاح",
      });
    } catch (error) {
      console.error("Error updating:", error);
      toast({
        title: "خطأ في التعديل",
        description: "حدث خطأ أثناء تعديل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <span className="flex items-center gap-1">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-32 h-7 px-2 text-xs"
          autoFocus
        />
        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={handleSave} disabled={isSaving}>
          حفظ
        </Button>
        <Button size="sm" variant="ghost" className="px-2 py-1 text-xs" onClick={() => { setEditing(false); setValue(text); }}>
          إلغاء
        </Button>
      </span>
    );
  }

  return (
    <button className="p-1 rounded hover:bg-muted opacity-80" onClick={() => setEditing(true)} title={`تعديل ${field === 'text' ? 'السؤال' : 'الإجابة'}`}>
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.65 3.35a2.121 2.121 0 0 1 3 3L6.5 15.5H3v-3.5l9.65-8.65Z"/></svg>
    </button>
  );
}

export function QuickEditDifficulty({ id, difficulty, onUpdate }: QuickDifficultyProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    typeof difficulty === "number" && difficulty !== null && difficulty !== undefined 
      ? difficulty.toString() 
      : "1"
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty)) return;
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { difficulty: newDifficulty });
      onUpdate(id, newDifficulty);
      setEditing(false);
      toast({
        title: "تم التعديل",
        description: "تم تعديل مستوى الصعوبة بنجاح",
      });
    } catch (error) {
      console.error("Error updating difficulty:", error);
      toast({
        title: "خطأ في التعديل",
        description: "حدث خطأ أثناء تعديل مستوى الصعوبة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-24 h-7 text-xs">
            <SelectValue placeholder="اختر مستوى الصعوبة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">سهل</SelectItem>
            <SelectItem value="2">متوسط</SelectItem>
            <SelectItem value="3">صعب</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={handleSave} disabled={isSaving}>
          حفظ
        </Button>
        <Button size="sm" variant="ghost" className="px-2 py-1 text-xs" onClick={() => { setEditing(false); setValue(difficulty?.toString() || "1"); }}>
          إلغاء
        </Button>
      </span>
    );
  }

  return (
    <button className="text-xs text-blue-600 underline hover:text-blue-800 px-1" onClick={() => setEditing(true)} title="تعديل الصعوبة">
      تعديل
    </button>
  );
}

export function QuickEditCategory({ id, categoryId, subcategoryId, categories: _categories, onUpdate }: QuickCategoryProps) {
  const { categories } = useCategoryStore();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // استخدم hook موحد لإدارة اختيار الفئة والفئة الفرعية
  const {
    categoryId: selectedCategory,
    setCategoryId: setSelectedCategory,
    subcategoryId: selectedSubcategory,
    setSubcategoryId: setSelectedSubcategory,
    availableSubcategories: subcategories,
  } = useCategorySelector({
    categories,
    initialCategoryId: categoryId,
    initialSubcategoryId: subcategoryId,
  });

  const handleSave = async () => {
    if (!selectedCategory) return;
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, {
        main_category_code: selectedCategory, // Use category code
        subcategory_id: selectedSubcategory || null,
      });
      onUpdate(id, selectedCategory, selectedSubcategory || null);
      setEditing(false);
      toast({
        title: "تم التعديل",
        description: "تم تعديل الفئة بنجاح",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "خطأ في التعديل",
        description: "حدث خطأ أثناء تعديل الفئة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Select
          value={selectedCategory || ""}
          onValueChange={(value) => {
            setSelectedCategory(value);
            setSelectedSubcategory(null);
          }}
        >
          <SelectTrigger className="w-28 h-7 text-xs">
            <SelectValue placeholder="اختر الفئة الرئيسية" />
          </SelectTrigger>
          <SelectContent>
            {categories.filter((category: any) => category && category.code && category.name).map((category: any) => (
              <SelectItem key={category.code} value={category.code}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {subcategories.length > 0 && (          <Select
            value={typeof selectedSubcategory === "number" && selectedSubcategory !== null && selectedSubcategory !== undefined ? selectedSubcategory.toString() : "none"}
            onValueChange={(value) => setSelectedSubcategory(value && value !== "none" ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue placeholder="اختر الفئة الفرعية" />
            </SelectTrigger>            <SelectContent>
              <SelectItem value="none">بدون فئة فرعية</SelectItem>
              {subcategories.filter((subcategory) => subcategory && typeof subcategory.id === "number").map((subcategory) => (
                <SelectItem key={subcategory.id.toString()} value={subcategory.id.toString()}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={handleSave} disabled={isSaving}>
          حفظ
        </Button>
        <Button size="sm" variant="ghost" className="px-2 py-1 text-xs" onClick={() => setEditing(false)}>
          إلغاء
        </Button>
      </span>
    );
  }

  return (
    <button className="text-xs text-blue-600 underline hover:text-blue-800 px-1" onClick={() => setEditing(true)} title="تعديل الفئة">
      تعديل
    </button>
  );
}
