import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";

// مخطط التحقق من السؤال
const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(3, "نص السؤال يجب أن يحتوي على 3 أحرف على الأقل"),
  answer: z.string().min(1, "الإجابة مطلوبة"),
  categoryId: z.number().min(1, "يجب اختيار فئة"),
  subcategoryId: z.number().min(1, "يجب اختيار فئة فرعية"),
  difficulty: z.number().min(1).max(3),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  tags: z.string().optional(),
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
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionDisplay[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionDisplay[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] =
    useState<QuestionDisplay | null>(null);
  const [saving, setSaving] = useState(false);

  // فلترة
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // صفحات
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // نموذج السؤال
  const form = useForm<Question>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      answer: "",
      categoryId: 0,
      subcategoryId: 0,
      difficulty: 1,
      imageUrl: "",
      isActive: true,
      tags: "",
    },
  });

  useEffect(() => {
    // يمكنك استبداله ببيانات وهمية مؤقتًا أثناء عدم توفر API
    setQuestions([
      {
        id: 1,
        text: "ما هي عاصمة مصر؟",
        answer: "القاهرة",
        categoryId: 1,
        subcategoryId: 1,
        difficulty: 1,
        imageUrl: "",
        isActive: true,
        tags: "جغرافيا,عواصم",
        categoryName: "جغرافيا",
        subcategoryName: "عواصم",
        categoryIcon: "🌍",
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCategories([
      {
        id: 1,
        name: "جغرافيا",
        icon: "🌍",
        children: [
          { id: 1, name: "عواصم", icon: "🏙️", availableQuestions: 20 },
          { id: 2, name: "أنهار", icon: "🌊", availableQuestions: 8 },
        ],
      },
    ]);
    setLoading(false);
  }, []);

  const applyFilters = (data = questions) => {
    let filtered = [...data];
    if (searchQuery) {
      filtered = filtered.filter(
        (q) =>
          q.text.includes(searchQuery) ||
          q.answer.includes(searchQuery) ||
          (q.tags && q.tags.includes(searchQuery)),
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (q) => q.categoryId === parseInt(categoryFilter),
      );
    }
    if (subcategoryFilter !== "all") {
      filtered = filtered.filter(
        (q) => q.subcategoryId === parseInt(subcategoryFilter),
      );
    }
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (q) => q.difficulty === parseInt(difficultyFilter),
      );
    }
    if (sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else if (sortBy === "mostUsed") {
      filtered.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === "leastUsed") {
      filtered.sort((a, b) => a.usageCount - b.usageCount);
    }
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedQuestions = filtered.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
    setFilteredQuestions(paginatedQuestions);
  };

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
    // eslint-disable-next-line
  }, [
    searchQuery,
    categoryFilter,
    subcategoryFilter,
    difficultyFilter,
    sortBy,
    questions,
  ]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [currentPage]);

  const showAddQuestionForm = () => {
    form.reset({
      text: "",
      answer: "",
      categoryId: 0,
      subcategoryId: 0,
      difficulty: 1,
      imageUrl: "",
      isActive: true,
      tags: "",
    });
    setIsEditMode(false);
    setDialogOpen(true);
  };

  const showEditQuestionForm = (question: QuestionDisplay) => {
    form.reset({
      id: question.id,
      text: question.text,
      answer: question.answer,
      categoryId: question.categoryId,
      subcategoryId: question.subcategoryId,
      difficulty: question.difficulty,
      imageUrl: question.imageUrl,
      isActive: question.isActive,
      tags: question.tags,
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const findCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "غير معروف";
  };

  const findSubcategoryName = (
    categoryId: number,
    subcategoryId: number,
  ): string => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return "غير معروف";
    const subcategory = category.children.find((s) => s.id === subcategoryId);
    return subcategory ? subcategory.name : "غير معروف";
  };

  const findCategoryIcon = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.icon : "❓";
  };

  const handleCategoryChange = (categoryId: string) => {
    form.setValue(
      "categoryId",
      categoryId === "none" ? 0 : parseInt(categoryId),
    );
    form.setValue("subcategoryId", 0);
  };

  const onSubmitQuestion = async (values: Question) => {
    try {
      setSaving(true);
      // هنا يمكن إضافة حفظ حقيقي عبر API، حالياً فقط تحديث البيانات المحلية
      if (isEditMode) {
        setQuestions(
          questions.map((q) =>
            q.id === values.id
              ? {
                  ...q,
                  ...values,
                  categoryName: findCategoryName(values.categoryId),
                  subcategoryName: findSubcategoryName(
                    values.categoryId,
                    values.subcategoryId,
                  ),
                  categoryIcon: findCategoryIcon(values.categoryId),
                }
              : q,
          ),
        );
        toast({
          title: "تم التعديل بنجاح",
          description: "تم تعديل السؤال بنجاح",
        });
      } else {
        setQuestions([
          ...questions,
          {
            ...values,
            id: questions.length + 1,
            categoryName: findCategoryName(values.categoryId),
            subcategoryName: findSubcategoryName(
              values.categoryId,
              values.subcategoryId,
            ),
            categoryIcon: findCategoryIcon(values.categoryId),
            usageCount: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
        toast({
          title: "تمت الإضافة بنجاح",
          description: "تم إضافة السؤال بنجاح",
        });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء محاولة حفظ السؤال",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الأسئلة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إدارة الأسئلة</h3>
          <p className="text-sm text-muted-foreground">
            إضافة وتعديل وإدارة أسئلة اللعبة
          </p>
        </div>
        <Button onClick={showAddQuestionForm}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة سؤال جديد
        </Button>
      </div>

      {/* مودال إضافة/تعديل سؤال */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-sm w-full p-0 rounded-2xl shadow-lg border-0 animate-slideInUp"
          style={{ overflow: "visible" }}
        >
          {/* الهيدر */}
          <div className="px-4 pt-4 pb-2 border-b">
            <DialogHeader>
              <DialogTitle className="text-base">
                {isEditMode ? "تعديل السؤال" : "إضافة سؤال جديد"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {isEditMode
                  ? 'قم بتعديل بيانات السؤال ثم انقر "حفظ التعديلات"'
                  : 'يرجى إدخال بيانات السؤال الجديد كاملة ثم اضغط "إضافة السؤال"'}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* محتوى النموذج مع تمرير داخلي */}
          <div className="px-4 py-2 max-h-[55vh] overflow-y-auto">
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
                          placeholder="اكتب نص السؤال هنا"
                          className="resize-none min-h-[60px] text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الإجابة */}
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الإجابة الصحيحة</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="الإجابة الصحيحة"
                          className="text-sm"
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
                        <Select
                          onValueChange={handleCategoryChange}
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : "none"
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر فئة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">اختر فئة</SelectItem>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.icon} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select
                          disabled={
                            !(
                              form.getValues("categoryId") &&
                              form.getValues("categoryId") > 0
                            )
                          }
                          onValueChange={(value) =>
                            form.setValue(
                              "subcategoryId",
                              value === "none" ? 0 : parseInt(value),
                            )
                          }
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : "none"
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفئة الفرعية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              اختر الفئة الفرعية
                            </SelectItem>
                            {form.getValues("categoryId") &&
                            form.getValues("categoryId") > 0
                              ? categories
                                  .find(
                                    (c) =>
                                      c.id === form.getValues("categoryId"),
                                  )
                                  ?.children.map((subcat) => (
                                    <SelectItem
                                      key={subcat.id}
                                      value={subcat.id.toString()}
                                    >
                                      {subcat.icon} {subcat.name}
                                    </SelectItem>
                                  ))
                              : null}
                          </SelectContent>
                        </Select>
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
                      <Select
                        onValueChange={(value) =>
                          form.setValue("difficulty", parseInt(value))
                        }
                        value={
                          field.value && field.value > 0
                            ? field.value.toString()
                            : "1"
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">سهل</SelectItem>
                          <SelectItem value="2">متوسط</SelectItem>
                          <SelectItem value="3">صعب</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الصورة والكلمات المفتاحية */}
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>رابط الصورة (اختياري)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="رابط الصورة"
                            className="text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("imageUrl") && (
                    <div className="self-end">
                      <img
                        src={form.watch("imageUrl")}
                        className="h-10 w-10 object-contain border rounded"
                        alt="معاينة"
                        onError={(e) => {
                          e.currentTarget.src = "";
                        }}
                      />
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكلمات المفتاحية</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="مثال: رياضيات,علوم"
                          className="text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* حالة التفعيل */}
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

          {/* الأزرار في الأسفل خارج منطقة التمرير */}
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
              className="w-28"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : isEditMode ? (
                "حفظ التعديلات"
              ) : (
                "إضافة السؤال"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
