import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة الأسئلة</h2>
        <Button 
          onClick={showAddQuestionForm}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة سؤال جديد</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-lg">لا توجد أسئلة. أضف سؤالاً جديداً.</p>
        </div>
      ) : (
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
                {questions.map((question, index) => (
                  <tr key={question.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 text-center font-bold">{index + 1}</td>
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
                        <div className="flex items-center gap-1 rtl">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-center rounded-full bg-primary/10 text-primary">
                            {question.categoryIcon || "📚"}
                          </span>
                          <span className="font-semibold">{question.categoryName}</span>
                        </div>
                        {question.subcategoryName && (
                          <div className="mr-6 flex items-center gap-1">
                            <span className="text-xs text-gray-500">الفئة الفرعية:</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
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
                        <span className="text-green-600">مفعل</span>
                      ) : (
                        <span className="text-red-600">معطل</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => showEditQuestionForm(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteQuestion(question.id!)}
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
      )}

      {/* مربع حوار إضافة/تعديل سؤال */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "تعديل سؤال" : "إضافة سؤال جديد"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "قم بتعديل بيانات السؤال أدناه."
                : "أدخل تفاصيل السؤال الجديد أدناه."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-2 max-h-[80vh] overflow-y-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitQuestion)}
                className="space-y-3"
                id="question-form"
              >
                {/* نص السؤال */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نص السؤال</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل نص السؤال هنا..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الإجابة الصحيحة */}
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الإجابة الصحيحة</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل الإجابة الصحيحة..."
                          className="min-h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الفئة والفئة الفرعية */}
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>الفئة</FormLabel>
                        <select
                          className="form-select w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                          onChange={(e) => {
                            const value = e.target.value;
                            handleCategoryChange(value);
                            field.onChange(value === "none" ? 0 : parseInt(value));
                          }}
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : "none"
                          }
                        >
                          <option value="none">اختر فئة</option>
                          {categories.map((category) => (
                            <option
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.icon || ""} {category.name}
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategoryId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>الفئة الفرعية</FormLabel>
                        <select
                          className="form-select w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                          disabled={
                            !(
                              form.getValues("categoryId") &&
                              form.getValues("categoryId") > 0
                            )
                          }
                          onChange={(e) =>
                            form.setValue(
                              "subcategoryId",
                              e.target.value === "none" ? 0 : parseInt(e.target.value),
                            )
                          }
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : "none"
                          }
                        >
                          <option value="none">اختر الفئة الفرعية</option>
                          {form.getValues("categoryId") &&
                          form.getValues("categoryId") > 0 && 
                            (() => {
                              const selectedCat = categories.find(
                                (c) => c.id === form.getValues("categoryId")
                              );
                              
                              if (selectedCat && selectedCat.children && selectedCat.children.length > 0) {
                                return selectedCat.children.map((subcat) => (
                                  <option
                                    key={subcat.id}
                                    value={subcat.id.toString()}
                                  >
                                    {subcat.icon || ""} {subcat.name}
                                  </option>
                                ));
                              } else {
                                return (
                                  <option value="0" disabled>
                                    لا توجد فئات فرعية
                                  </option>
                                );
                              }
                            })()
                          }
                        </select>
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
                      <FormLabel>الصعوبة</FormLabel>
                      <select
                        className="form-select w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        value={field.value.toString()}
                      >
                        <option value="1">سهل (1 نقطة)</option>
                        <option value="2">متوسط (2 نقطة)</option>
                        <option value="3">صعب (3 نقاط)</option>
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* نوع الوسائط (صورة أو فيديو) */}
                <FormField
                  control={form.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الوسائط المرفقة</FormLabel>
                      <div className="flex flex-col gap-4">
                        <select
                          className="form-select w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
                          onChange={(e) => field.onChange(e.target.value)}
                          value={field.value}
                        >
                          <option value="none">بدون وسائط</option>
                          <option value="image">صورة</option>
                          <option value="video">فيديو</option>
                        </select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* رابط الصورة */}
                {form.watch("mediaType") === "image" && (
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>رابط الصورة</FormLabel>
                        <div className="space-y-2">
                          <FormControl>
                            <Input
                              placeholder="أدخل رابط صورة للسؤال"
                              className="text-xs"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-muted-foreground">أو قم بتحميل صورة</label>
                            <Input
                              type="file"
                              accept="image/*"
                              className="text-xs"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // عادة هنا سنقوم برفع الصورة إلى خدمة استضافة ثم وضع الرابط في field.onChange
                                  // ولكن كمثال سنستخدم URL.createObjectURL
                                  const imageUrl = URL.createObjectURL(file);
                                  field.onChange(imageUrl);
                                  
                                  // ملاحظة: في التطبيق الحقيقي يجب إرسال الملف للخادم
                                  toast({
                                    title: "تم تحميل الصورة",
                                    description: "يرجى ملاحظة أن هذا رابط مؤقت. في البيئة الحقيقية، سيتم رفع الصورة للخادم."
                                  });
                                }
                              }}
                            />
                          </div>
                          {field.value && (
                            <div className="mt-2 border rounded-md p-2">
                              <p className="text-sm mb-1">معاينة الصورة:</p>
                              <img 
                                src={field.value} 
                                alt="معاينة" 
                                className="max-h-40 object-contain mx-auto"
                                onError={() => {
                                  toast({
                                    title: "خطأ في تحميل الصورة",
                                    description: "تعذر تحميل الصورة. تأكد من أن الرابط صحيح ومتاح.",
                                    variant: "destructive"
                                  });
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* رابط الفيديو */}
                {form.watch("mediaType") === "video" && (
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>رابط الفيديو</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل رابط فيديو للسؤال (مثال: رابط يوتيوب)"
                            className="text-xs"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        {field.value && (
                          <div className="mt-2 border rounded-md p-2">
                            <p className="text-sm mb-1">معاينة (إذا كان الرابط من يوتيوب):</p>
                            <iframe 
                              width="100%" 
                              height="200" 
                              src={field.value.includes('youtube.com') ? field.value.replace('watch?v=', 'embed/') : field.value} 
                              title="مشغل فيديو"
                              className="object-contain mx-auto"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          placeholder="مثال: رياضيات,علوم"
                          className="text-xs"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="mb-0">مفعل</FormLabel>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <div className="flex justify-between gap-2 px-4 py-3 border-t bg-white rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-24"
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              form="question-form"
              className="w-24"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                "تحديث"
              ) : (
                "إضافة"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}