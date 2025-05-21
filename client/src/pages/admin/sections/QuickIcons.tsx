import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// مكون أيقونة تعديل النص (للسؤال أو الإجابة)
export function QuickEditIcon({ id, field, initialValue, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {field === 'text' ? 'تعديل السؤال' : 'تعديل الإجابة'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
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

// مكون أيقونة تعديل الفئة
export function QuickCategoryIcon({ id, categoryId, subcategoryId, categories, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryId.toString());
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryId ? subcategoryId.toString() : "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const subcategories = categories.find(c => c.id.toString() === selectedCategory)?.children || [];

  const handleSave = async () => {
    const catId = parseInt(selectedCategory);
    const subcatId = selectedSubcategory ? parseInt(selectedSubcategory) : null;
    
    if (isNaN(catId)) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/questions/${id}`, { 
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              تعديل الفئة
            </DialogTitle>
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

// مكون أيقونة تعديل مستوى الصعوبة
export function QuickDifficultyIcon({ id, difficulty, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(difficulty.toString());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty)) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/questions/${id}`, { difficulty: newDifficulty });
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              تعديل مستوى الصعوبة
            </DialogTitle>
          </DialogHeader>
          
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