import React, { useState, useEffect, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from 'xlsx';

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
import { Loader2, Plus, Pencil, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, Upload, Link as LinkIcon, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
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

interface QuestionDisplay extends Question {
  categoryName: string;
  subcategoryName: string;
  categoryIcon: string;
  usageCount: number;
  createdAt: string;
}

export default function QuestionsManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questions, setQuestions] = useState<QuestionDisplay[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  
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
        setQuestions(data || []);
        setFilteredQuestions(data || []);
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
  
  // تطبيق الفلاتر على الأسئلة
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
      // حفظ البيانات عبر API
      const url = isEditMode ? `/api/questions/${values.id}` : "/api/questions";
      const method = isEditMode ? "PUT" : "POST";

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
  
  // تصدير الأسئلة إلى ملف
  const exportQuestions = async (format: 'csv' | 'excel') => {
    try {
      // تحضير بيانات التصدير - تبسيط البيانات، حذف الحقول غير الضرورية
      const exportData = filteredQuestions.map(q => ({
        'نص السؤال': q.text,
        'الإجابة': q.answer,
        'الفئة': q.categoryName,
        'الفئة الفرعية': q.subcategoryName || '',
        'الصعوبة': q.difficulty === 1 ? 'سهل' : q.difficulty === 2 ? 'متوسط' : 'صعب',
        'الكلمات المفتاحية': q.keywords || '',
        'رابط الصورة': q.imageUrl || '',
        'رابط الفيديو': q.videoUrl || ''
      }));

      // إنشاء ورقة عمل
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الأسئلة');

      // تصدير الملف
      if (format === 'csv') {
        XLSX.writeFile(workbook, 'الأسئلة.csv');
      } else {
        XLSX.writeFile(workbook, 'الأسئلة.xlsx');
      }

      toast({
        title: 'تم التصدير بنجاح',
        description: `تم تصدير ${exportData.length} سؤال إلى ملف ${format === 'excel' ? 'Excel' : 'CSV'} بنجاح.`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في التصدير',
        description: error.message || 'حدث خطأ أثناء محاولة تصدير الأسئلة.',
        variant: 'destructive',
      });
    }
  };

  // تصدير الأسئلة إلى ملف
  const exportQuestions = async (format: 'csv' | 'excel') => {
    try {
      // تحضير بيانات التصدير
      const exportData = filteredQuestions.map(q => ({
        'رقم السؤال': q.id,
        'نص السؤال': q.text,
        'الإجابة': q.answer,
        'الفئة': q.categoryName,
        'الفئة الفرعية': q.subcategoryName || '',
        'الصعوبة': q.difficulty === 1 ? 'سهل' : q.difficulty === 2 ? 'متوسط' : 'صعب',
        'الكلمات المفتاحية': q.keywords || '',
        'رابط الصورة': q.imageUrl || '',
        'رابط الفيديو': q.videoUrl || '',
        'عدد مرات الاستخدام': q.usageCount,
        'تاريخ الإضافة': new Date(q.createdAt).toLocaleDateString('ar', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          calendar: 'gregory'
        }),
        'فعّال': q.isActive ? 'نعم' : 'لا'
      }));

      // إنشاء ورقة عمل
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الأسئلة');

      // تصدير الملف
      if (format === 'csv') {
        XLSX.writeFile(workbook, 'الأسئلة.csv');
      } else {
        XLSX.writeFile(workbook, 'الأسئلة.xlsx');
      }

      toast({
        title: 'تم التصدير بنجاح',
        description: `تم تصدير ${exportData.length} سؤال إلى ملف ${format === 'excel' ? 'Excel' : 'CSV'} بنجاح.`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في التصدير',
        description: error.message || 'حدث خطأ أثناء محاولة تصدير الأسئلة.',
        variant: 'destructive',
      });
    }
  };

  // استيراد الأسئلة من ملف
  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      // قراءة الملف
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // تحويل البيانات إلى تنسيق الأسئلة
      const questions = jsonData.map((row: any) => {
        // تحديد الفئة الرئيسية والفرعية
        const categoryName = row['الفئة'] || '';
        const subcategoryName = row['الفئة الفرعية'] || '';
        
        let categoryId = 0;
        let subcategoryId = 0;
        
        // البحث عن الفئة الرئيسية
        const category = categories.find(c => c.name === categoryName);
        if (category) {
          categoryId = category.id;
          
          // البحث عن الفئة الفرعية إذا وجدت
          if (subcategoryName) {
            const subcategory = category.children.find(s => s.name === subcategoryName);
            if (subcategory) {
              subcategoryId = subcategory.id;
            }
          }
        }
        
        // تحديد مستوى الصعوبة
        let difficulty = 1;
        const difficultyText = row['الصعوبة'] || '';
        if (typeof difficultyText === 'string') {
          if (difficultyText.includes('متوسط')) {
            difficulty = 2;
          } else if (difficultyText.includes('صعب')) {
            difficulty = 3;
          }
        } else if (typeof difficultyText === 'number') {
          difficulty = difficultyText >= 1 && difficultyText <= 3 ? difficultyText : 1;
        }
        
        // تحديد الحالة
        let isActive = false; // الأسئلة المستوردة تكون غير فعالة افتراضياً
        
        return {
          text: row['نص السؤال'] || row['السؤال'] || '',
          answer: row['الإجابة'] || '',
          categoryId,
          subcategoryId,
          difficulty,
          imageUrl: row['رابط الصورة'] || '',
          videoUrl: row['رابط الفيديو'] || '',
          mediaType: row['رابط الصورة'] ? 'image' : row['رابط الفيديو'] ? 'video' : 'none',
          keywords: row['الكلمات المفتاحية'] || '',
          isActive,
        };
      }).filter((q: any) => q.text && q.answer && q.categoryId); // التأكد من وجود الحقول الإلزامية
      
      // إرسال الأسئلة إلى الخادم
      const response = await apiRequest('POST', '/api/import-questions', { questions });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشلت عملية الاستيراد');
      }
      
      const result = await response.json();
      
      // تحديث القائمة المحلية
      fetchQuestions();
      
      toast({
        title: 'تم الاستيراد بنجاح',
        description: `تم استيراد ${result.imported} سؤال بنجاح. الأسئلة المستوردة بحالة غير فعّالة.`,
      });
      
      // إعادة تعيين حقل الملف
      e.target.value = '';
    } catch (error: any) {
      toast({
        title: 'خطأ في الاستيراد',
        description: error.message || 'حدث خطأ أثناء محاولة استيراد الأسئلة.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  // استيراد الأسئلة من رابط
  const importQuestionsFromURL = async (url: string) => {
    if (!url) return;
    
    try {
      setImporting(true);
      
      // إرسال الرابط إلى الخادم
      const response = await apiRequest('POST', '/api/import-questions-from-url', { url });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشلت عملية الاستيراد');
      }
      
      const result = await response.json();
      
      // تحديث القائمة المحلية
      fetchQuestions();
      
      toast({
        title: 'تم الاستيراد بنجاح',
        description: `تم استيراد ${result.imported} سؤال بنجاح. الأسئلة المستوردة بحالة غير فعّالة.`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في الاستيراد',
        description: error.message || 'حدث خطأ أثناء محاولة استيراد الأسئلة من الرابط.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة الأسئلة</h2>
        <div className="flex gap-2">
          <div className="relative group">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>استيراد / تصدير</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <div className="hidden group-hover:flex absolute bg-background border rounded-md shadow-md p-2 mt-1 w-56 flex-col gap-1 z-10 right-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => exportQuestions('csv')}
                className="justify-start"
              >
                <FileText className="w-4 h-4 ml-2" />
                تصدير CSV
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => exportQuestions('excel')}
                className="justify-start"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تصدير Excel
              </Button>
              <hr className="my-1" />
              <label className="cursor-pointer w-full">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start w-full"
                  onClick={() => document.getElementById('importFile')?.click()}
                >
                  <Upload className="w-4 h-4 ml-2" />
                  استيراد ملف
                </Button>
                <input 
                  type="file" 
                  id="importFile" 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden" 
                  onChange={handleImportFile}
                />
              </label>
              <hr className="my-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start"
                onClick={() => {
                  const url = prompt('أدخل رابط ملف Google Sheets أو أي رابط متوافق');
                  if (url) importQuestionsFromURL(url);
                }}
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                استيراد من رابط
              </Button>
            </div>
          </div>
          <Button 
            onClick={showAddQuestionForm}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة سؤال جديد</span>
          </Button>
        </div>
      </div>

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
                  {filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((question, index) => (
                  <tr key={question.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 text-center font-bold">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="p-3 text-right">
                      {question.text.length > 60
                        ? question.text.substring(0, 60) + "..."
                        : question.text}
                    </td>
                    <td className="p-3 text-right">
                      {question.answer.length > 20
                        ? question.answer.substring(0, 20) + "..."
                        : question.answer}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-primary">
                          {question.categoryName}
                        </div>
                        {question.subcategoryName && (
                          <div className="mt-1">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {question.subcategoryName}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {question.difficulty === 1
                        ? "سهل"
                        : question.difficulty === 2
                          ? "متوسط"
                          : "صعب"}
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
    </div>
  );
}