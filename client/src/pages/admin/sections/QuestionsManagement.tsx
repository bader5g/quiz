import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, BarChart2, FolderEdit } from "lucide-react";
import { EditTextButton, EditCategoryButton, EditDifficultyButton } from "@/components/admin/EditQuestionButtons";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// نموذج السؤال
const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(5, "نص السؤال مطلوب ويجب أن يكون على الأقل 5 أحرف"),
  answer: z.string().min(1, "الإجابة مطلوبة"),
  categoryId: z.number().min(1, "يرجى اختيار فئة"),
  subcategoryId: z.number(),
  difficulty: z.number().min(1).max(3),
  imageUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  mediaType: z.enum(["image", "video", "none"]).default("none"),
  keywords: z.string().optional(),
  isActive: z.boolean().default(true),
});

type Question = z.infer<typeof questionSchema>;

interface Category {
  id: number;
  name: string;
  icon: string;
  children: {
    id: number;
    name: string;
    icon: string;
    availableQuestions: number;
  }[];
}

interface QuestionDisplay extends Omit<Question, 'subcategoryId'> {
  categoryName: string;
  subcategoryName: string | null;
  categoryIcon: string;
  usageCount: number;
  createdAt: string;
  subcategoryId: number | null;
}

export default function QuestionsManagement() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionDisplay[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // حالة النوافذ الحوارية
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // خيارات عرض الجدول
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // فلاتر البحث
  const [filterText, setFilterText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<number | null>(null);
  const [filterUsageMin, setFilterUsageMin] = useState<number | null>(null);
  const [filterUsageMax, setFilterUsageMax] = useState<number | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // خيارات التحديد الجماعي
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // خيارات تغيير الفئة الجماعي
  const [showChangeCategoryDialog, setShowChangeCategoryDialog] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<number>(0);
  const [bulkSubcategoryId, setBulkSubcategoryId] = useState<number>(0);
  
  // خيارات تغيير مستوى الصعوبة الجماعي
  const [showChangeDifficultyDialog, setShowChangeDifficultyDialog] = useState(false);
  const [bulkDifficulty, setBulkDifficulty] = useState<number>(0);
  
  // بيانات استيراد الأسئلة
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  
  // متغيرات تحميل الوسائط
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  // تهيئة نموذج السؤال
  const form = useForm<Question>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      answer: "",
      categoryId: 0,
      subcategoryId: 0,
      difficulty: 1,
      imageUrl: "",
      videoUrl: "",
      mediaType: "none",
      keywords: "",
      isActive: true,
    },
  });

  // جلب الأسئلة من API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/questions");
      if (response.ok) {
        const data = await response.json();
        
        // معالجة الأسئلة وإضافة أسماء الفئات إليها
        const processedQuestions = data.map((question: any) => {
          const categoryObj = categories.find(c => c.id === question.categoryId);
          let subcategoryObj = null;
          if (question.subcategoryId && categoryObj) {
            subcategoryObj = categoryObj.children.find(s => s.id === question.subcategoryId);
          }
          
          return {
            ...question,
            categoryName: categoryObj ? categoryObj.name : "بدون فئة",
            categoryIcon: categoryObj ? categoryObj.icon : "❓",
            subcategoryName: subcategoryObj ? subcategoryObj.name : null
          };
        });
        
        console.log("الأسئلة بعد إضافة أسماء الفئات:", processedQuestions[0]);
        setQuestions(processedQuestions || []);
        setFilteredQuestions(processedQuestions || []);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast({
        title: "خطأ في جلب الأسئلة",
        description: "حدث خطأ أثناء محاولة جلب الأسئلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب الفئات من API
  const fetchCategories = async () => {
    try {
      console.log("جاري جلب الفئات...");
      const response = await apiRequest("GET", "/api/categories-with-children");
      console.log("استجابة الخادم:", response.status);
      
      // تسجيل محتوى الرد للتشخيص
      const responseText = await response.text();
      console.log("محتوى الرد:", responseText);
      
      // تحويل النص إلى JSON (اختياري إذا كان النص صالح JSON)
      let data = [];
      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (e) {
        console.error("خطأ في تحليل JSON:", e);
        data = [];
      }
      
      console.log("بيانات الفئات:", data);
      setCategories(data || []);
    } catch (err) {
      console.error("خطأ في جلب الفئات:", err);
      setCategories([]); // تعيين مصفوفة فارغة في حالة الخطأ
    }
  };

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    fetchCategories().then(() => fetchQuestions());
  }, []);
  
  // وظائف دعم التعديل السريع
  const handleTextUpdate = (id: number, field: string, value: string) => {
    // تحديث البيانات محلياً
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    );
    
    setFilteredQuestions(prevFilteredQuestions => 
      prevFilteredQuestions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };
  
  const handleCategoryUpdate = (id: number, categoryId: number, subcategoryId: number | null, categoryName: string, categoryIcon: string, subcategoryName: string | null) => {
    // تحديث البيانات محلياً
    setQuestions(prevQuestions => 
      prevQuestions.map(q => {
        if (q.id === id) {
          return {
            ...q, 
            categoryId, 
            subcategoryId, 
            categoryName, 
            categoryIcon, 
            subcategoryName
          };
        }
        return q;
      })
    );
    
    setFilteredQuestions(prevFilteredQuestions => 
      prevFilteredQuestions.map(q => {
        if (q.id === id) {
          return {
            ...q, 
            categoryId, 
            subcategoryId, 
            categoryName, 
            categoryIcon, 
            subcategoryName
          };
        }
        return q;
      })
    );
  };
  
  const handleDifficultyUpdate = (id: number, difficulty: number) => {
    // تحديث البيانات محلياً
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === id ? { ...q, difficulty } : q
      )
    );
    
    setFilteredQuestions(prevFilteredQuestions => 
      prevFilteredQuestions.map(q => 
        q.id === id ? { ...q, difficulty } : q
      )
    );
  };
  
  // تغيير الفئة لمجموعة من الأسئلة
  const handleBulkChangeCategory = async () => {
    if (selectedQuestions.size === 0 || !bulkCategoryId) return;
    
    const categoryObj = categories.find(c => c.id === bulkCategoryId);
    if (!categoryObj) {
      toast({
        title: "خطأ في تغيير الفئة",
        description: "الرجاء اختيار فئة صالحة.",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm(`هل أنت متأكد من نقل ${selectedQuestions.size} سؤال إلى فئة "${categoryObj.name}"؟`)) {
      return;
    }
    
    setBulkActionLoading(true);
    
    try {
      // تغيير الفئة للأسئلة المحددة باستخدام طلبات متوازية
      const updatePromises = Array.from(selectedQuestions).map(id => 
        apiRequest("PUT", `/api/questions/${id}`, { 
          categoryId: bulkCategoryId, 
          subcategoryId: bulkSubcategoryId || null 
        })
      );
      
      await Promise.all(updatePromises);
      
      // الحصول على اسم الفئة الفرعية إن وجدت
      const subcategoryName = bulkSubcategoryId 
        ? categoryObj.children.find(sc => sc.id === bulkSubcategoryId)?.name || null
        : null;
      
      // تحديث قائمة الأسئلة محلياً
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          selectedQuestions.has(q.id) 
            ? { 
                ...q, 
                categoryId: bulkCategoryId, 
                subcategoryId: bulkSubcategoryId || null,
                categoryName: categoryObj.name,
                subcategoryName: subcategoryName
              } 
            : q
        )
      );
      
      // تحديث قائمة الأسئلة المفلترة محلياً
      setFilteredQuestions(prevQuestions => 
        prevQuestions.map(q => 
          selectedQuestions.has(q.id) 
            ? { 
                ...q, 
                categoryId: bulkCategoryId, 
                subcategoryId: bulkSubcategoryId || null,
                categoryName: categoryObj.name,
                subcategoryName: subcategoryName
              } 
            : q
        )
      );
      
      // إعادة تعيين التحديد والفئات
      setSelectedQuestions(new Set<number>());
      setBulkCategoryId(0);
      setBulkSubcategoryId(0);
      setShowChangeCategoryDialog(false);
      setShowBulkActions(false);
      
      toast({
        title: "تم تغيير الفئة",
        description: `تم نقل ${selectedQuestions.size} سؤال إلى فئة "${categoryObj.name}" بنجاح.`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تغيير الفئة",
        description: error.message || "حدث خطأ أثناء محاولة تغيير فئة الأسئلة.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // تغيير مستوى الصعوبة لمجموعة من الأسئلة
  const handleBulkChangeDifficulty = async () => {
    if (selectedQuestions.size === 0 || !bulkDifficulty) return;
    
    const difficultyLabels = {
      1: "سهل",
      2: "متوسط",
      3: "صعب"
    };
    
    if (!confirm(`هل أنت متأكد من تغيير مستوى صعوبة ${selectedQuestions.size} سؤال إلى "${difficultyLabels[bulkDifficulty as keyof typeof difficultyLabels]}"؟`)) {
      return;
    }
    
    setBulkActionLoading(true);
    
    try {
      // تغيير مستوى الصعوبة للأسئلة المحددة باستخدام طلبات متوازية
      const updatePromises = Array.from(selectedQuestions).map(id => 
        apiRequest("PUT", `/api/questions/${id}`, { difficulty: bulkDifficulty })
      );
      
      await Promise.all(updatePromises);
      
      // تحديث قائمة الأسئلة محلياً
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          selectedQuestions.has(q.id) ? { ...q, difficulty: bulkDifficulty } : q
        )
      );
      
      // تحديث قائمة الأسئلة المفلترة محلياً
      setFilteredQuestions(prevQuestions => 
        prevQuestions.map(q => 
          selectedQuestions.has(q.id) ? { ...q, difficulty: bulkDifficulty } : q
        )
      );
      
      // إعادة تعيين التحديد ومستوى الصعوبة
      setSelectedQuestions(new Set<number>());
      setBulkDifficulty(0);
      setShowChangeDifficultyDialog(false);
      setShowBulkActions(false);
      
      toast({
        title: "تم تغيير مستوى الصعوبة",
        description: `تم تغيير مستوى صعوبة ${selectedQuestions.size} سؤال بنجاح.`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تغيير مستوى الصعوبة",
        description: error.message || "حدث خطأ أثناء محاولة تغيير مستوى صعوبة الأسئلة.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };
  
  // دوال التحديد الجماعي
  const handleSelectQuestion = (id: number, isSelected: boolean) => {
    setSelectedQuestions(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      
      // إظهار قائمة الإجراءات الجماعية إذا كان هناك عناصر محددة
      setShowBulkActions(newSelected.size > 0);
      
      return newSelected;
    });
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      // تحديد جميع الأسئلة في الصفحة الحالية
      const currentPageIds = getCurrentPageQuestions()
        .filter(q => q.id !== undefined)
        .map(q => q.id as number);
      
      // إضافة الأسئلة المحددة حاليًا إلى المجموعة الجديدة
      const newSelectedIds = new Set<number>(selectedQuestions);
      currentPageIds.forEach(id => newSelectedIds.add(id));
      
      setSelectedQuestions(newSelectedIds);
      setShowBulkActions(newSelectedIds.size > 0);
    } else {
      // إلغاء تحديد الأسئلة في الصفحة الحالية فقط
      const currentPageIds = getCurrentPageQuestions()
        .filter(q => q.id !== undefined)
        .map(q => q.id as number);
      
      const newSelectedIds = new Set<number>(selectedQuestions);
      currentPageIds.forEach(id => newSelectedIds.delete(id));
      
      setSelectedQuestions(newSelectedIds);
      setShowBulkActions(newSelectedIds.size > 0);
    }
  };
  
  // تنفيذ العمليات الجماعية
  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;
    
    if (!confirm(`هل أنت متأكد من رغبتك في حذف ${selectedQuestions.size} سؤال؟`)) {
      return;
    }
    
    setBulkActionLoading(true);
    try {
      // حذف الأسئلة المحددة
      const deletePromises = Array.from(selectedQuestions).map(id => 
        apiRequest("DELETE", `/api/questions/${id}`)
      );
      
      await Promise.all(deletePromises);
      
      // تحديث قائمة الأسئلة بعد الحذف
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => !selectedQuestions.has(q.id))
      );
      
      setFilteredQuestions(prevFilteredQuestions => 
        prevFilteredQuestions.filter(q => !selectedQuestions.has(q.id))
      );
      
      // إعادة تعيين التحديد
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
      
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف ${selectedQuestions.size} سؤال بنجاح`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting questions:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الأسئلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };
  
  const handleBulkActivate = async (activate: boolean) => {
    if (selectedQuestions.size === 0) return;
    
    if (!confirm(`هل أنت متأكد من ${activate ? 'تفعيل' : 'إلغاء تفعيل'} ${selectedQuestions.size} سؤال؟`)) {
      return;
    }
    
    setBulkActionLoading(true);
    try {
      // تغيير حالة التفعيل للأسئلة المحددة
      const updatePromises = Array.from(selectedQuestions).map(id => 
        apiRequest("PUT", `/api/questions/${id}`, { isActive: activate })
      );
      
      await Promise.all(updatePromises);
      
      // تحديث قائمة الأسئلة محلياً
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          selectedQuestions.has(q.id) ? { ...q, isActive: activate } : q
        )
      );
      
      setFilteredQuestions(prevFilteredQuestions => 
        prevFilteredQuestions.map(q => 
          selectedQuestions.has(q.id) ? { ...q, isActive: activate } : q
        )
      );
      
      toast({
        title: activate ? "تم التفعيل بنجاح" : "تم إلغاء التفعيل بنجاح",
        description: `تم ${activate ? 'تفعيل' : 'إلغاء تفعيل'} ${selectedQuestions.size} سؤال بنجاح`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating questions:", error);
      toast({
        title: "خطأ في التحديث",
        description: `حدث خطأ أثناء محاولة ${activate ? 'تفعيل' : 'إلغاء تفعيل'} الأسئلة.`,
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };
  
  // تطبيق الفلاتر على الأسئلة
  // الحصول على الأسئلة في الصفحة الحالية
  const getCurrentPageQuestions = (): QuestionDisplay[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredQuestions.slice(startIndex, endIndex);
  };

  useEffect(() => {
    if (!questions.length) {
      setFilteredQuestions([]);
      return;
    }
    
    let result = [...questions];
    
    // فلتر النص
    if (filterText) {
      const searchText = filterText.toLowerCase();
      result = result.filter(q => 
        q.text.toLowerCase().includes(searchText) || 
        q.answer.toLowerCase().includes(searchText) ||
        (q.keywords && q.keywords.toLowerCase().includes(searchText))
      );
    }
    
    // فلتر الفئة الرئيسية
    if (filterCategoryId) {
      result = result.filter(q => q.categoryId === filterCategoryId);
    }
    
    // فلتر الفئة الفرعية
    if (filterSubcategoryId) {
      result = result.filter(q => q.subcategoryId === filterSubcategoryId);
    }
    
    // فلتر عدد مرات الاستخدام (الحد الأدنى)
    if (filterUsageMin !== null) {
      result = result.filter(q => q.usageCount >= filterUsageMin);
    }
    
    // فلتر عدد مرات الاستخدام (الحد الأقصى)
    if (filterUsageMax !== null) {
      result = result.filter(q => q.usageCount <= filterUsageMax);
    }
    
    // فلتر التاريخ (من)
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      result = result.filter(q => new Date(q.createdAt) >= fromDate);
    }
    
    // فلتر التاريخ (إلى)
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // نهاية اليوم
      result = result.filter(q => new Date(q.createdAt) <= toDate);
    }
    
    setFilteredQuestions(result);
    setCurrentPage(1); // إعادة تعيين الصفحة الحالية عند تغيير الفلاتر
  }, [questions, filterText, filterCategoryId, filterSubcategoryId, filterUsageMin, filterUsageMax, filterDateFrom, filterDateTo]);

  // عرض نموذج إضافة سؤال جديد
  const showAddQuestionForm = () => {
    form.reset({
      text: "",
      answer: "",
      categoryId: 0,
      subcategoryId: 0,
      difficulty: 1,
      imageUrl: "",
      videoUrl: "",
      mediaType: "none",
      keywords: "",
      isActive: true,
    });
    setIsEditMode(false);
    setDialogOpen(true);
  };

  // البحث عن اسم الفئة بواسطة معرفها
  const findCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "غير معروف";
  };

  // البحث عن أيقونة الفئة بواسطة معرفها
  const findCategoryIcon = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.icon : "❓";
  };

  // معالجة تغيير الفئة
  const handleCategoryChange = (categoryId: string) => {
    console.log("تم اختيار الفئة:", categoryId);
    const catId = categoryId === "none" ? 0 : parseInt(categoryId);
    form.setValue("categoryId", catId);
    form.setValue("subcategoryId", 0);
    
    if (catId > 0) {
      const selectedCategory = categories.find(c => c.id === catId);
      console.log("الفئة المحددة:", selectedCategory);
      if (selectedCategory && selectedCategory.children) {
        console.log("الفئات الفرعية المتاحة:", selectedCategory.children);
      }
    }
  };

  // عرض نموذج تعديل سؤال
  const showEditQuestionForm = (question: QuestionDisplay) => {
    form.reset({
      id: question.id,
      text: question.text,
      answer: question.answer,
      categoryId: question.categoryId,
      subcategoryId: question.subcategoryId || 0,
      difficulty: question.difficulty,
      imageUrl: question.imageUrl || "",
      videoUrl: question.videoUrl || "",
      mediaType: question.imageUrl ? "image" : question.videoUrl ? "video" : "none",
      keywords: question.keywords || "",
      isActive: question.isActive,
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };

  // إرسال نموذج السؤال (إضافة أو تعديل)
  const onSubmitQuestion = async (values: Question) => {
    try {
      setSaving(true);
      
      // التأكد من قيم الوسائط قبل الإرسال
      if (values.mediaType === "none") {
        // عند اختيار بدون وسائط، تأكد من إزالة أي روابط للصور أو الفيديو
        values.imageUrl = "";
        values.videoUrl = "";
      } else if (values.mediaType === "image") {
        // عند اختيار صورة، تأكد من إزالة أي روابط للفيديو
        values.videoUrl = "";
      } else if (values.mediaType === "video") {
        // عند اختيار فيديو، تأكد من إزالة أي روابط للصور
        values.imageUrl = "";
      }
      
      // حفظ البيانات عبر API
      const url = isEditMode ? `/api/questions/${values.id}` : "/api/questions";
      const method = isEditMode ? "PUT" : "POST";

      // طباعة البيانات قبل الإرسال للتأكد من صحتها
      console.log("بيانات السؤال المراد حفظها:", values);

      const response = await apiRequest(method, url, values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشلت عملية الحفظ");
      }

      const savedQuestion = await response.json();
      
      if (isEditMode) {
        // تحديث السؤال في القائمة المحلية
        setQuestions(
          questions.map((q) =>
            q.id === values.id
              ? {
                  ...q,
                  ...values,
                  categoryName: findCategoryName(values.categoryId),
                  categoryIcon: findCategoryIcon(values.categoryId),
                  subcategoryName: values.subcategoryId
                    ? categories
                        .find((c) => c.id === values.categoryId)
                        ?.children.find((s) => s.id === values.subcategoryId)
                        ?.name || ""
                    : "",
                }
              : q
          )
        );
      } else {
        // إضافة السؤال الجديد للقائمة المحلية
        setQuestions([
          ...questions,
          {
            ...savedQuestion,
            categoryName: findCategoryName(savedQuestion.categoryId),
            categoryIcon: findCategoryIcon(savedQuestion.categoryId),
            subcategoryName: savedQuestion.subcategoryId
              ? categories
                  .find((c) => c.id === savedQuestion.categoryId)
                  ?.children.find((s) => s.id === savedQuestion.subcategoryId)
                  ?.name || ""
              : "",
            usageCount: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      toast({
        title: isEditMode ? "تم تحديث السؤال" : "تمت إضافة السؤال",
        description: isEditMode
          ? "تم تحديث بيانات السؤال بنجاح."
          : "تمت إضافة السؤال الجديد بنجاح.",
      });

      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء محاولة حفظ السؤال.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // حذف سؤال
  const deleteQuestion = async (questionId: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
      return;
    }

    try {
      const response = await apiRequest("DELETE", `/api/questions/${questionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشلت عملية الحذف");
      }

      // حذف السؤال من القائمة المحلية
      setQuestions(questions.filter((q) => q.id !== questionId));
      setFilteredQuestions(filteredQuestions.filter((q) => q.id !== questionId));

      toast({
        title: "تم حذف السؤال",
        description: "تم حذف السؤال بنجاح.",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء محاولة حذف السؤال.",
        variant: "destructive",
      });
    }
  };
  
  // وظيفة استيراد الأسئلة
  const handleImportQuestions = async () => {
    if (!importFile) {
      toast({
        title: "خطأ في الاستيراد",
        description: "الرجاء اختيار ملف Excel (.xlsx) للاستيراد",
        variant: "destructive",
      });
      return;
    }
    
    setImportLoading(true);
    
    try {
      // إنشاء نموذج FormData لإرسال الملف
      const formData = new FormData();
      formData.append('file', importFile);
      
      // إرسال الملف للخادم
      const response = await fetch('/api/import-questions', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشلت عملية الاستيراد");
      }
      
      const result = await response.json();
      
      setImportDialogOpen(false);
      setImportFile(null);
      
      // إعادة تحميل الأسئلة بعد الاستيراد
      await fetchQuestions();
      
      toast({
        title: "تم الاستيراد بنجاح",
        description: `تم استيراد ${result.imported} سؤال بنجاح. ${result.failed || 0} فشل في الاستيراد.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ أثناء محاولة استيراد الأسئلة.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة الأسئلة</h2>
        <div className="flex items-center gap-2">
          {/* الأزرار العادية */}
          <Button 
            onClick={showAddQuestionForm}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة سؤال</span>
          </Button>
          
          {/* زر استيراد الأسئلة */}
          <Button 
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setImportDialogOpen(true)}
          >
            <span>استيراد</span>
          </Button>
        </div>
      </div>
      
      {/* قسم العمليات الجماعية - يظهر فقط عند تحديد عناصر */}
      {showBulkActions && (
        <div className="flex flex-wrap items-center gap-2 p-3 my-2 bg-primary/10 rounded-lg border">
          <span className="text-sm font-semibold ml-2">
            تم تحديد {selectedQuestions.size} سؤال
          </span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkActionLoading}
          >
            {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 ml-1" />}
            حذف المحدد
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkActivate(true)}
            disabled={bulkActionLoading}
          >
            تفعيل
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleBulkActivate(false)}
            disabled={bulkActionLoading}
          >
            إلغاء التفعيل
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setShowChangeCategoryDialog(true);
              setShowBulkActions(true);
            }}
            disabled={bulkActionLoading}
          >
            <FolderEdit className="h-4 w-4 ml-1" />
            تغيير الفئة
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setShowChangeDifficultyDialog(true);
              setShowBulkActions(true);
            }}
            disabled={bulkActionLoading}
          >
            <BarChart2 className="h-4 w-4 ml-1" />
            تغيير الصعوبة
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedQuestions(new Set<number>())}
            disabled={bulkActionLoading}
          >
            إلغاء التحديد
          </Button>
        </div>
      )}

      {/* قسم فلاتر البحث */}
      <div className="mb-6 border rounded-lg p-4 bg-muted/10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">فلاتر البحث والتصفية</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? (
              <>
                <ChevronUp className="h-4 w-4 ml-1" />
                إخفاء الفلاتر
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 ml-1" />
                إظهار الفلاتر
              </>
            )}
          </Button>
        </div>
        
        {showFilters && (
          <div className="p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* فلتر البحث النصي */}
              <div>
                <span className="mb-1 block">بحث في النص</span>
                <Input
                  placeholder="اكتب نص للبحث..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* فلتر الفئة الرئيسية */}
              <div>
                <span className="mb-1 block">الفئة الرئيسية</span>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={filterCategoryId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterCategoryId(value ? parseInt(value) : null);
                    setFilterSubcategoryId(null); // إعادة تعيين الفئة الفرعية
                  }}
                >
                  <option value="">كل الفئات</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* فلتر الفئة الفرعية */}
              <div>
                <span className="mb-1 block">الفئة الفرعية</span>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={filterSubcategoryId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterSubcategoryId(value ? parseInt(value) : null);
                  }}
                  disabled={!filterCategoryId}
                >
                  <option value="">كل الفئات الفرعية</option>
                  {filterCategoryId &&
                    categories
                      .find((c) => c.id === filterCategoryId)
                      ?.children.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* فلتر التاريخ (من) */}
              <div>
                <span className="mb-1 block">من تاريخ</span>
                <Input
                  type="date"
                  value={filterDateFrom || ""}
                  onChange={(e) => setFilterDateFrom(e.target.value || null)}
                  className="w-full"
                />
              </div>
              
              {/* فلتر التاريخ (إلى) */}
              <div>
                <span className="mb-1 block">إلى تاريخ</span>
                <Input
                  type="date"
                  value={filterDateTo || ""}
                  onChange={(e) => setFilterDateTo(e.target.value || null)}
                  className="w-full"
                />
              </div>
              
              {/* فلتر عدد مرات الاستخدام (الحد الأدنى) */}
              <div>
                <span className="mb-1 block">الاستخدام (الحد الأدنى)</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="أدنى استخدام"
                  value={filterUsageMin !== null ? filterUsageMin : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterUsageMin(value ? parseInt(value) : null);
                  }}
                  className="w-full"
                />
              </div>
              
              {/* فلتر عدد مرات الاستخدام (الحد الأقصى) */}
              <div>
                <span className="mb-1 block">الاستخدام (الحد الأقصى)</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="أقصى استخدام"
                  value={filterUsageMax !== null ? filterUsageMax : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterUsageMax(value ? parseInt(value) : null);
                  }}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterText("");
                  setFilterCategoryId(null);
                  setFilterSubcategoryId(null);
                  setFilterUsageMin(null);
                  setFilterUsageMax(null);
                  setFilterDateFrom(null);
                  setFilterDateTo(null);
                }}
              >
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </div>
        )}
        
        {/* عرض نتائج الفلترة */}
        {questions.length > 0 && (
          <div className="mt-2 text-sm">
            تم العثور على <span className="font-bold">{filteredQuestions.length}</span> سؤال من إجمالي <span className="font-bold">{questions.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-lg">لا توجد أسئلة مطابقة للفلاتر المحددة.</p>
        </div>
      ) : (
        <div>
          {/* خيارات عرض الجدول */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">عدد الأسئلة في الصفحة:</span>
              <select
                className="w-24 p-1 border rounded-md"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm">
              عرض {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, filteredQuestions.length)} من إجمالي {filteredQuestions.length} سؤال
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-center w-10">
                      <Checkbox 
                        checked={
                          getCurrentPageQuestions().length > 0 && 
                          getCurrentPageQuestions().every(q => 
                            selectedQuestions.has(q.id || 0)
                          )
                        }
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </th>
                    <th className="p-3 text-center">#</th>
                    <th className="p-3 text-right">السؤال</th>
                    <th className="p-3 text-right">الإجابة</th>
                    <th className="p-3 text-right">الفئة</th>
                    <th className="p-3 text-right">الصعوبة</th>
                    <th className="p-3 text-right">الاستخدام</th>
                    <th className="p-3 text-right">التاريخ</th>
                    <th className="p-3 text-right">الحالة</th>
                    <th className="p-3 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageQuestions().map((question, index) => (
                  <tr key={question.id} className={`border-b hover:bg-muted/20 ${selectedQuestions.has(question.id || 0) ? 'bg-primary/5' : ''}`}>
                    <td className="p-3 text-center">
                      <Checkbox 
                        checked={selectedQuestions.has(question.id || 0)}
                        onCheckedChange={(checked) => {
                          if (question.id) {
                            handleSelectQuestion(question.id, !!checked);
                          }
                        }}
                      />
                    </td>
                    <td className="p-3 text-center font-bold">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          {question.text.length > 60
                            ? question.text.substring(0, 60) + "..."
                            : question.text}
                        </div>
                        <EditTextButton 
                          id={question.id} 
                          field="text" 
                          value={question.text} 
                          onUpdate={handleTextUpdate} 
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          {question.answer.length > 20
                            ? question.answer.substring(0, 20) + "..."
                            : question.answer}
                        </div>
                        <EditTextButton 
                          id={question.id} 
                          field="answer" 
                          value={question.answer} 
                          onUpdate={handleTextUpdate} 
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-2 rtl">
                            <span className="font-bold text-primary">{question.categoryName}</span>
                          </div>
                          {question.subcategoryName && (
                            <div className="mr-2 mt-1 flex items-center gap-1">
                              <span className="text-xs text-gray-500">الفئة الفرعية:</span>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                {question.subcategoryName}
                              </span>
                            </div>
                          )}
                        </div>
                        <EditCategoryButton 
                          id={question.id}
                          categoryId={question.categoryId}
                          subcategoryId={question.subcategoryId}
                          categories={categories}
                          onUpdate={handleCategoryUpdate}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          {question.difficulty === 1
                            ? "سهل"
                            : question.difficulty === 2
                              ? "متوسط"
                              : "صعب"}
                        </div>
                        <EditDifficultyButton 
                          id={question.id}
                          difficulty={question.difficulty}
                          onUpdate={handleDifficultyUpdate}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right">{question.usageCount} مرة</td>
                    <td className="p-3 text-right">
                      {new Date(question.createdAt).toLocaleDateString("ar", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        calendar: "gregory"
                      })}
                    </td>
                    <td className="p-3 text-right">
                      {question.isActive ? (
                        <span className="text-green-600 font-medium">فعال</span>
                      ) : (
                        <span className="text-red-600 font-medium">غير فعال</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showEditQuestionForm(question)}
                          className="h-8 px-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                          className="h-8 px-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* ترقيم الصفحات */}
          {filteredQuestions.length > pageSize && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  الأولى
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                
                <div className="mx-2">
                  صفحة {currentPage} من {Math.ceil(filteredQuestions.length / pageSize)}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(filteredQuestions.length / pageSize)}
                >
                  التالي
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.ceil(filteredQuestions.length / pageSize))}
                  disabled={currentPage >= Math.ceil(filteredQuestions.length / pageSize)}
                >
                  الأخيرة
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* نموذج إضافة/تعديل سؤال */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "تعديل السؤال" : "إضافة سؤال جديد"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitQuestion)} className="space-y-4">
              {/* حقل نص السؤال */}
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نص السؤال</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="أدخل نص السؤال هنا"
                        className="h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقل الإجابة */}
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الإجابة الصحيحة</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="أدخل الإجابة الصحيحة" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقول الفئة والفئة الفرعية */}
              <div className="grid grid-cols-2 gap-4">
                {/* الفئة الرئيسية */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value || "none"}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                          <option value="none" disabled>
                            اختر الفئة
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* الفئة الفرعية */}
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة الفرعية</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={field.value || 0}
                          onChange={(e) => {
                            form.setValue("subcategoryId", parseInt(e.target.value));
                          }}
                          disabled={!form.getValues("categoryId")}
                        >
                          <option value={0}>بدون فئة فرعية</option>
                          {form.getValues("categoryId") > 0 &&
                            categories
                              .find((c) => c.id === form.getValues("categoryId"))
                              ?.children.map((subcat) => (
                                <option key={subcat.id} value={subcat.id}>
                                  {subcat.name}
                                </option>
                              ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* مستوى الصعوبة */}
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مستوى الصعوبة</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={field.value}
                        onChange={(e) => {
                          form.setValue("difficulty", parseInt(e.target.value));
                        }}
                      >
                        <option value={1}>سهل</option>
                        <option value={2}>متوسط</option>
                        <option value={3}>صعب</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* نوع الوسائط */}
              <FormField
                control={form.control}
                name="mediaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الوسائط</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={field.value}
                        onChange={(e) => {
                          form.setValue("mediaType", e.target.value as "image" | "video" | "none");
                        }}
                      >
                        <option value="none">بدون وسائط</option>
                        <option value="image">صورة</option>
                        <option value="video">فيديو</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقول الوسائط - تظهر حسب نوع الوسائط المختار */}
              {form.watch("mediaType") === "image" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط الصورة</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="أدخل رابط الصورة هنا"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">أو قم بتحميل صورة من جهازك</label>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="imageUpload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            // إظهار معاينة للصورة
                            const previewURL = URL.createObjectURL(e.target.files[0]);
                            setMediaPreview(previewURL);
                            
                            // إعداد FormData لرفع الصورة
                            const formData = new FormData();
                            formData.append("file", e.target.files[0]);
                            
                            try {
                              // عرض حالة التحميل
                              setUploading(true);
                              
                              // رفع الصورة إلى الخادم
                              const response = await fetch("/api/upload-media", {
                                method: "POST",
                                body: formData,
                              });
                              
                              if (!response.ok) {
                                throw new Error("فشل تحميل الصورة");
                              }
                              
                              const data = await response.json();
                              // تحديث رابط الصورة في النموذج
                              form.setValue("imageUrl", data.url);
                              
                              toast({
                                title: "تم التحميل بنجاح",
                                description: "تم تحميل الصورة بنجاح",
                              });
                            } catch (error) {
                              console.error("Error uploading image:", error);
                              toast({
                                title: "خطأ في التحميل",
                                description: "فشل تحميل الصورة. يرجى المحاولة مرة أخرى أو استخدام رابط بدلاً من ذلك.",
                                variant: "destructive",
                              });
                            } finally {
                              setUploading(false);
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="imageUpload"
                        className="cursor-pointer block p-4 text-center hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span>جاري التحميل...</span>
                          </div>
                        ) : (
                          <div>
                            <span className="block font-semibold">انقر لاختيار صورة</span>
                            <span className="text-sm text-muted-foreground">
                              (PNG, JPG, WEBP)
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    {/* معاينة الصورة */}
                    {mediaPreview && form.watch("mediaType") === "image" && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">معاينة الصورة:</p>
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={mediaPreview} 
                            alt="معاينة الصورة"
                            className="max-h-[200px] max-w-full object-contain mx-auto"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500"
                          onClick={() => {
                            setMediaPreview("");
                            form.setValue("imageUrl", "");
                          }}
                        >
                          إزالة الصورة
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {form.watch("mediaType") === "video" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط الفيديو</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="أدخل رابط الفيديو هنا"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">أو قم بتحميل فيديو من جهازك</label>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="videoUpload"
                        className="hidden"
                        accept="video/*"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            // إظهار معاينة للفيديو
                            const previewURL = URL.createObjectURL(e.target.files[0]);
                            setMediaPreview(previewURL);
                            
                            // إعداد FormData لرفع الفيديو
                            const formData = new FormData();
                            formData.append("file", e.target.files[0]);
                            
                            try {
                              // عرض حالة التحميل
                              setUploading(true);
                              
                              // رفع الفيديو إلى الخادم
                              const response = await fetch("/api/upload-media", {
                                method: "POST",
                                body: formData,
                              });
                              
                              if (!response.ok) {
                                throw new Error("فشل تحميل الفيديو");
                              }
                              
                              const data = await response.json();
                              // تحديث رابط الفيديو في النموذج
                              form.setValue("videoUrl", data.url);
                              
                              toast({
                                title: "تم التحميل بنجاح",
                                description: "تم تحميل الفيديو بنجاح",
                              });
                            } catch (error) {
                              console.error("Error uploading video:", error);
                              toast({
                                title: "خطأ في التحميل",
                                description: "فشل تحميل الفيديو. يرجى المحاولة مرة أخرى أو استخدام رابط بدلاً من ذلك.",
                                variant: "destructive",
                              });
                            } finally {
                              setUploading(false);
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="videoUpload"
                        className="cursor-pointer block p-4 text-center hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span>جاري التحميل...</span>
                          </div>
                        ) : (
                          <div>
                            <span className="block font-semibold">انقر لاختيار فيديو</span>
                            <span className="text-sm text-muted-foreground">
                              (MP4, WebM)
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    {/* معاينة الفيديو */}
                    {mediaPreview && form.watch("mediaType") === "video" && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">معاينة الفيديو:</p>
                        <div className="border rounded-lg overflow-hidden">
                          <video 
                            src={mediaPreview} 
                            controls
                            className="max-h-[200px] max-w-full mx-auto"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500"
                          onClick={() => {
                            setMediaPreview("");
                            form.setValue("videoUrl", "");
                          }}
                        >
                          إزالة الفيديو
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* الكلمات المفتاحية */}
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكلمات المفتاحية</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل الكلمات المفتاحية مفصولة بفواصل"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقل الحالة */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0 rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="mr-2">
                      <FormLabel>تفعيل السؤال</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* زر الحفظ */}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEditMode ? (
                    "تحديث"
                  ) : (
                    "إضافة"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* نافذة استيراد الأسئلة */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>استيراد أسئلة من ملف Excel</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center">
              <input
                type="file"
                id="importFile"
                className="hidden"
                accept=".xlsx"
                onChange={(e) => e.target.files && setImportFile(e.target.files[0])}
              />
              <label
                htmlFor="importFile"
                className="cursor-pointer block p-4 text-center hover:bg-primary/5 rounded-lg transition-colors"
              >
                {importFile ? (
                  <div className="text-green-600">
                    <span className="block font-semibold">{importFile.name}</span>
                    <span className="text-sm">
                      ({(importFile.size / 1024).toFixed(2)} كيلوبايت)
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="block font-semibold">انقر لاختيار ملف Excel</span>
                    <span className="text-sm text-muted-foreground">
                      (.xlsx فقط)
                    </span>
                  </div>
                )}
              </label>
            </div>
            
            <div className="text-sm space-y-2">
              <h3 className="font-semibold">تعليمات هامة:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>يجب أن يحتوي الملف على الأعمدة التالية: <span className="font-medium">السؤال, الإجابة, الفئة, الصعوبة</span></li>
                <li>يجب أن تكون أسماء الفئات مطابقة تماماً للأسماء الموجودة في النظام</li>
                <li>سيتم إضافة الأسئلة في حالة غير مفعلة افتراضياً للمراجعة</li>
                <li>أعمدة الوسائط (الصور، الفيديو) اختيارية</li>
              </ul>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setImportDialogOpen(false);
                  setImportFile(null);
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleImportQuestions}
                disabled={!importFile || importLoading}
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>استيراد الأسئلة</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* نافذة تغيير الفئة للأسئلة المحددة */}
      <Dialog open={showChangeCategoryDialog} onOpenChange={setShowChangeCategoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تغيير فئة الأسئلة المحددة ({selectedQuestions.size})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر الفئة الجديدة</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={bulkCategoryId || 0}
                onChange={(e) => {
                  const categoryId = parseInt(e.target.value);
                  setBulkCategoryId(categoryId);
                  setBulkSubcategoryId(0); // إعادة تعيين الفئة الفرعية عند تغيير الفئة الرئيسية
                }}
              >
                <option value={0} disabled>اختر الفئة</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {bulkCategoryId > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">اختر الفئة الفرعية (اختياري)</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={bulkSubcategoryId || 0}
                  onChange={(e) => setBulkSubcategoryId(parseInt(e.target.value))}
                >
                  <option value={0}>بدون فئة فرعية</option>
                  {categories
                    .find((c) => c.id === bulkCategoryId)
                    ?.children.map((subcat) => (
                      <option key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowChangeCategoryDialog(false);
                  setBulkCategoryId(0);
                  setBulkSubcategoryId(0);
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={() => {
                  // استخدام دالة تغيير الفئة الجماعي المعرفة سابقاً
                  const categoryObj = categories.find(c => c.id === bulkCategoryId);
                  if (!categoryObj) {
                    toast({
                      title: "خطأ في تغيير الفئة",
                      description: "الرجاء اختيار فئة صالحة.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!confirm(`هل أنت متأكد من نقل ${selectedQuestions.size} سؤال إلى فئة "${categoryObj.name}"؟`)) {
                    return;
                  }
                  
                  setBulkActionLoading(true);
                  
                  // تغيير الفئة للأسئلة المحددة باستخدام طلبات متوازية
                  const updatePromises = Array.from(selectedQuestions).map(id => 
                    apiRequest("PATCH", `/api/questions/${id}`, { 
                      categoryId: bulkCategoryId, 
                      subcategoryId: bulkSubcategoryId || null 
                    })
                  );
                  
                  Promise.all(updatePromises)
                    .then(() => {
                      // الحصول على اسم الفئة الفرعية إن وجدت
                      const subcategoryName = bulkSubcategoryId 
                        ? categoryObj.children.find(sc => sc.id === bulkSubcategoryId)?.name || null
                        : null;
                      
                      // تحديث قائمة الأسئلة محلياً
                      setQuestions(prevQuestions => 
                        prevQuestions.map(q => 
                          selectedQuestions.has(q.id) 
                            ? { 
                                ...q, 
                                categoryId: bulkCategoryId, 
                                subcategoryId: bulkSubcategoryId || null,
                                categoryName: categoryObj.name,
                                subcategoryName: subcategoryName
                              } 
                            : q
                        )
                      );
                      
                      // تحديث قائمة الأسئلة المفلترة محلياً
                      setFilteredQuestions(prevQuestions => 
                        prevQuestions.map(q => 
                          selectedQuestions.has(q.id) 
                            ? { 
                                ...q, 
                                categoryId: bulkCategoryId, 
                                subcategoryId: bulkSubcategoryId || null,
                                categoryName: categoryObj.name,
                                subcategoryName: subcategoryName
                              } 
                            : q
                        )
                      );
                      
                      // إعادة تعيين التحديد والفئات
                      setSelectedQuestions(new Set<number>());
                      setBulkCategoryId(0);
                      setBulkSubcategoryId(0);
                      setShowChangeCategoryDialog(false);
                      setShowBulkActions(false);
                      
                      toast({
                        title: "تم تغيير الفئة",
                        description: `تم نقل ${selectedQuestions.size} سؤال إلى فئة "${categoryObj.name}" بنجاح.`,
                      });
                    })
                    .catch(error => {
                      toast({
                        title: "خطأ في تغيير الفئة",
                        description: error.message || "حدث خطأ أثناء محاولة تغيير فئة الأسئلة.",
                        variant: "destructive",
                      });
                    })
                    .finally(() => {
                      setBulkActionLoading(false);
                    });
                }}
                disabled={!bulkCategoryId || bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  <>تغيير الفئة</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* نافذة تغيير مستوى الصعوبة للأسئلة المحددة */}
      <Dialog open={showChangeDifficultyDialog} onOpenChange={setShowChangeDifficultyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تغيير مستوى صعوبة الأسئلة المحددة ({selectedQuestions.size})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر مستوى الصعوبة الجديد</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={bulkDifficulty || 0}
                onChange={(e) => setBulkDifficulty(parseInt(e.target.value))}
              >
                <option value={0} disabled>اختر مستوى الصعوبة</option>
                <option value={1}>سهل</option>
                <option value={2}>متوسط</option>
                <option value={3}>صعب</option>
              </select>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowChangeDifficultyDialog(false);
                  setBulkDifficulty(0);
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={() => {
                  // استخدام دالة تغيير مستوى الصعوبة الجماعي
                  if (selectedQuestions.size === 0 || !bulkDifficulty) return;
                  
                  const difficultyLabels = {
                    1: "سهل",
                    2: "متوسط",
                    3: "صعب"
                  };
                  
                  if (!confirm(`هل أنت متأكد من تغيير مستوى صعوبة ${selectedQuestions.size} سؤال إلى "${difficultyLabels[bulkDifficulty as keyof typeof difficultyLabels]}"؟`)) {
                    return;
                  }
                  
                  setBulkActionLoading(true);
                  
                  // تغيير مستوى الصعوبة للأسئلة المحددة باستخدام طلبات متوازية
                  const updatePromises = Array.from(selectedQuestions).map(id => 
                    apiRequest("PATCH", `/api/questions/${id}`, { difficulty: bulkDifficulty })
                  );
                  
                  Promise.all(updatePromises)
                    .then(() => {
                      // تحديث قائمة الأسئلة محلياً
                      setQuestions(prevQuestions => 
                        prevQuestions.map(q => 
                          selectedQuestions.has(q.id) ? { ...q, difficulty: bulkDifficulty } : q
                        )
                      );
                      
                      // تحديث قائمة الأسئلة المفلترة محلياً
                      setFilteredQuestions(prevQuestions => 
                        prevQuestions.map(q => 
                          selectedQuestions.has(q.id) ? { ...q, difficulty: bulkDifficulty } : q
                        )
                      );
                      
                      // إعادة تعيين التحديد ومستوى الصعوبة
                      setSelectedQuestions(new Set<number>());
                      setBulkDifficulty(0);
                      setShowChangeDifficultyDialog(false);
                      setShowBulkActions(false);
                      
                      toast({
                        title: "تم تغيير مستوى الصعوبة",
                        description: `تم تغيير مستوى صعوبة ${selectedQuestions.size} سؤال بنجاح.`,
                      });
                    })
                    .catch(error => {
                      toast({
                        title: "خطأ في تغيير مستوى الصعوبة",
                        description: error.message || "حدث خطأ أثناء محاولة تغيير مستوى صعوبة الأسئلة.",
                        variant: "destructive",
                      });
                    })
                    .finally(() => {
                      setBulkActionLoading(false);
                    });
                }}
                disabled={!bulkDifficulty || bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  <>تغيير مستوى الصعوبة</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}