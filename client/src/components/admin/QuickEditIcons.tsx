import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  categoryId: number;
  subcategoryId: number | null;
  categories: any[];
  onUpdate: (id: number, categoryId: number, subcategoryId: number | null) => void;
}

// مكونات التعديل السريع
export function QuickEditText({ id, text, field, onUpdate }: QuickEditProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(text);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!value.trim()) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { [field]: value });
      onUpdate(id, field, value);
      setOpen(false);
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

  return (
    <>
      <button 
        className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
        onClick={() => setOpen(true)}
        title={`تعديل ${field === 'text' ? 'السؤال' : 'الإجابة'}`}
      >
        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {field === 'text' ? 'تعديل السؤال' : 'تعديل الإجابة'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full"
            />
          </div>
          
          <AlertDialogFooter>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function QuickEditDifficulty({ id, difficulty, onUpdate }: QuickDifficultyProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(difficulty.toString());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty)) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/questions/${id}`, { difficulty: newDifficulty });
      onUpdate(id, newDifficulty);
      setOpen(false);
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

  return (
    <>
      <button 
        className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
        onClick={() => setOpen(true)}
        title="تغيير مستوى الصعوبة"
      >
        <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              تعديل مستوى الصعوبة
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Select 
              value={value} 
              onValueChange={setValue}
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
          
          <AlertDialogFooter>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function QuickEditCategory({ id, categoryId, subcategoryId, categories, onUpdate }: QuickCategoryProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryId.toString());
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryId?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const subcategories = categories.find(c => c.id.toString() === selectedCategory)?.children || [];

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
      
      onUpdate(id, catId, subcatId);
      setOpen(false);
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

  return (
    <>
      <button 
        className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
        onClick={() => setOpen(true)}
        title="تغيير الفئة"
      >
        <FolderEdit className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              تعديل الفئة
            </AlertDialogTitle>
          </AlertDialogHeader>
          
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
                  {categories.map((category) => (
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
                    <SelectItem value="">بدون فئة فرعية</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}