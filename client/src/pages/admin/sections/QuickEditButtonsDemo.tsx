import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

// الفئات الوهمية للعرض
const demoCategories = [
  { id: 1, name: "رياضة", children: [
    { id: 11, name: "كرة قدم" },
    { id: 12, name: "كرة سلة" }
  ]},
  { id: 2, name: "علوم", children: [
    { id: 21, name: "فيزياء" },
    { id: 22, name: "كيمياء" }
  ]},
  { id: 3, name: "تاريخ", children: [] }
];

// سؤال وهمي للعرض
const demoQuestion = {
  id: 1, 
  text: "من فاز بكأس العالم 2022؟", 
  answer: "الأرجنتين",
  categoryId: 1,
  subcategoryId: 11,
  difficulty: 2
};

export default function QuickEditButtonsDemo() {
  const { toast } = useToast();
  const [question, setQuestion] = useState(demoQuestion);

  // حالة النوافذ المنبثقة
  const [textEditOpen, setTextEditOpen] = useState(false);
  const [answerEditOpen, setAnswerEditOpen] = useState(false);
  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [difficultyEditOpen, setDifficultyEditOpen] = useState(false);

  // قيم التعديل
  const [editText, setEditText] = useState(question.text);
  const [editAnswer, setEditAnswer] = useState(question.answer);
  const [editCategoryId, setEditCategoryId] = useState(question.categoryId.toString());
  const [editSubcategoryId, setEditSubcategoryId] = useState(
    question.subcategoryId ? question.subcategoryId.toString() : ""
  );
  const [editDifficulty, setEditDifficulty] = useState(question.difficulty.toString());

  // الفئات الفرعية للفئة المحددة
  const subcategories = demoCategories.find(c => c.id.toString() === editCategoryId)?.children || [];

  // حفظ التعديلات
  const saveTextEdit = () => {
    if (!editText.trim()) return;
    
    // محاكاة لطلب التعديل
    console.log("Updating question text:", editText);
    
    // تحديث البيانات محلياً
    setQuestion({ ...question, text: editText });
    setTextEditOpen(false);
    
    toast({
      title: "تم التعديل",
      description: "تم تعديل نص السؤال بنجاح",
    });
  };

  const saveAnswerEdit = () => {
    if (!editAnswer.trim()) return;
    
    // محاكاة لطلب التعديل
    console.log("Updating answer:", editAnswer);
    
    // تحديث البيانات محلياً
    setQuestion({ ...question, answer: editAnswer });
    setAnswerEditOpen(false);
    
    toast({
      title: "تم التعديل",
      description: "تم تعديل الإجابة بنجاح",
    });
  };

  const saveCategoryEdit = () => {
    const categoryId = parseInt(editCategoryId);
    const subcategoryId = editSubcategoryId ? parseInt(editSubcategoryId) : null;
    
    // محاكاة لطلب التعديل
    console.log("Updating category:", { categoryId, subcategoryId });
    
    // تحديث البيانات محلياً
    setQuestion({ ...question, categoryId, subcategoryId });
    setCategoryEditOpen(false);
    
    toast({
      title: "تم التعديل",
      description: "تم تعديل الفئة بنجاح",
    });
  };

  const saveDifficultyEdit = () => {
    const difficulty = parseInt(editDifficulty);
    
    // محاكاة لطلب التعديل
    console.log("Updating difficulty:", difficulty);
    
    // تحديث البيانات محلياً
    setQuestion({ ...question, difficulty });
    setDifficultyEditOpen(false);
    
    toast({
      title: "تم التعديل",
      description: "تم تعديل مستوى الصعوبة بنجاح",
    });
  };

  return (
    <div className="p-6 container">
      <h2 className="text-2xl font-bold mb-6">نموذج أيقونات التعديل السريع</h2>
      
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-xl font-semibold mb-4">تفاصيل السؤال</h3>
        
        <div className="space-y-4">
          {/* السؤال */}
          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">السؤال:</div>
              <div className="font-medium">{question.text}</div>
            </div>
            <button 
              className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
              onClick={() => {
                setEditText(question.text);
                setTextEditOpen(true);
              }}
              title="تعديل السؤال"
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* الإجابة */}
          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">الإجابة:</div>
              <div className="font-medium">{question.answer}</div>
            </div>
            <button 
              className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
              onClick={() => {
                setEditAnswer(question.answer);
                setAnswerEditOpen(true);
              }}
              title="تعديل الإجابة"
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* الفئة */}
          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">الفئة:</div>
              <div className="font-medium">
                {demoCategories.find(c => c.id === question.categoryId)?.name}
                {question.subcategoryId && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-2">
                    {demoCategories
                      .find(c => c.id === question.categoryId)
                      ?.children.find(s => s.id === question.subcategoryId)?.name}
                  </span>
                )}
              </div>
            </div>
            <button 
              className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
              onClick={() => {
                setEditCategoryId(question.categoryId.toString());
                setEditSubcategoryId(question.subcategoryId ? question.subcategoryId.toString() : "");
                setCategoryEditOpen(true);
              }}
              title="تغيير الفئة"
            >
              <FolderEdit className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* مستوى الصعوبة */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">مستوى الصعوبة:</div>
              <div className="font-medium">
                {question.difficulty === 1 ? "سهل" : 
                 question.difficulty === 2 ? "متوسط" : "صعب"}
              </div>
            </div>
            <button 
              className="hover:bg-muted p-1 rounded opacity-70 hover:opacity-100" 
              onClick={() => {
                setEditDifficulty(question.difficulty.toString());
                setDifficultyEditOpen(true);
              }}
              title="تغيير مستوى الصعوبة"
            >
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      
      {/* نافذة تعديل السؤال */}
      <Dialog open={textEditOpen} onOpenChange={setTextEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل السؤال</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveTextEdit}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* نافذة تعديل الإجابة */}
      <Dialog open={answerEditOpen} onOpenChange={setAnswerEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الإجابة</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              className="w-full"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnswerEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveAnswerEdit}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* نافذة تعديل الفئة */}
      <Dialog open={categoryEditOpen} onOpenChange={setCategoryEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الفئة</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <label className="block mb-2 text-sm">الفئة الرئيسية</label>
              <Select 
                value={editCategoryId} 
                onValueChange={(value) => {
                  setEditCategoryId(value);
                  setEditSubcategoryId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الفئة الرئيسية" />
                </SelectTrigger>
                <SelectContent>
                  {demoCategories.map((category) => (
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
                  value={editSubcategoryId} 
                  onValueChange={setEditSubcategoryId}
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
            <Button variant="outline" onClick={() => setCategoryEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveCategoryEdit}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* نافذة تعديل مستوى الصعوبة */}
      <Dialog open={difficultyEditOpen} onOpenChange={setDifficultyEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل مستوى الصعوبة</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              value={editDifficulty} 
              onValueChange={setEditDifficulty}
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
            <Button variant="outline" onClick={() => setDifficultyEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveDifficultyEdit}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}