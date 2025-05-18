import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash2, Filter, Search, Eye, FileText, Image as ImageIcon, RefreshCw, ArrowUpDown } from 'lucide-react';

// مخطط التحقق من السؤال
const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(3, 'نص السؤال يجب أن يحتوي على 3 أحرف على الأقل'),
  answer: z.string().min(1, 'الإجابة مطلوبة'),
  categoryId: z.number().min(1, 'يجب اختيار فئة'),
  subcategoryId: z.number().min(1, 'يجب اختيار فئة فرعية'),
  difficulty: z.number().min(1).max(3),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  tags: z.string().optional(),
});

// نوع السؤال
type Question = z.infer<typeof questionSchema>;

// نوع الفئة
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

// نوع السؤال للعرض
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
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionDisplay | null>(null);
  
  // فلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // صفحات
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // نموذج السؤال
  const form = useForm<Question>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: '',
      answer: '',
      categoryId: 0,
      subcategoryId: 0,
      difficulty: 1,
      imageUrl: '',
      isActive: true,
      tags: '',
    },
  });

  // جلب الأسئلة
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/questions');
        const data = await response.json();
        setQuestions(data);
        applyFilters(data);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب الأسئلة',
          description: 'حدث خطأ أثناء محاولة جلب الأسئلة',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [toast]);
  
  // جلب الفئات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiRequest('GET', '/api/categories-with-children');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب الفئات',
          description: 'حدث خطأ أثناء محاولة جلب الفئات',
        });
      }
    };

    fetchCategories();
  }, [toast]);

  // تطبيق الفلاتر
  const applyFilters = (data = questions) => {
    let filtered = [...data];
    
    // البحث
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.text.includes(searchQuery) || 
        q.answer.includes(searchQuery) ||
        (q.tags && q.tags.includes(searchQuery))
      );
    }
    
    // فلترة حسب الفئة
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(q => q.categoryId === parseInt(categoryFilter));
    }
    
    // فلترة حسب الفئة الفرعية
    if (subcategoryFilter !== 'all') {
      filtered = filtered.filter(q => q.subcategoryId === parseInt(subcategoryFilter));
    }
    
    // فلترة حسب الصعوبة
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === parseInt(difficultyFilter));
    }
    
    // ترتيب
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'mostUsed') {
      filtered.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'leastUsed') {
      filtered.sort((a, b) => a.usageCount - b.usageCount);
    }
    
    // تحديد عدد الصفحات
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    // تقسيم إلى صفحات
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedQuestions = filtered.slice(startIndex, startIndex + itemsPerPage);
    
    setFilteredQuestions(paginatedQuestions);
  };
  
  // تطبيق الفلاتر عند تغيير أي منها
  useEffect(() => {
    applyFilters();
    // يجب إعادة تعيين الصفحة عند تغيير الفلاتر
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, subcategoryFilter, difficultyFilter, sortBy, questions]);
  
  // تحديث القائمة عند تغيير الصفحة
  useEffect(() => {
    applyFilters();
  }, [currentPage]);

  // عرض نموذج إضافة سؤال جديد
  const showAddQuestionForm = () => {
    form.reset({
      text: '',
      answer: '',
      categoryId: 0,
      subcategoryId: 0,
      difficulty: 1,
      imageUrl: '',
      isActive: true,
      tags: '',
    });
    setIsEditMode(false);
    setDialogOpen(true);
  };

  // عرض نموذج تعديل سؤال
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

  // عرض تفاصيل السؤال
  const showQuestionDetails = (question: QuestionDisplay) => {
    setPreviewQuestion(question);
    setPreviewOpen(true);
  };

  // إرسال نموذج السؤال
  const onSubmitQuestion = async (values: Question) => {
    try {
      if (isEditMode) {
        // تعديل سؤال موجود
        await apiRequest('PATCH', `/api/admin/questions/${values.id}`, values);
        
        // تحديث الأسئلة في واجهة المستخدم
        setQuestions(questions.map(q => 
          q.id === values.id ? {
            ...q,
            ...values,
            categoryName: findCategoryName(values.categoryId),
            subcategoryName: findSubcategoryName(values.categoryId, values.subcategoryId),
            categoryIcon: findCategoryIcon(values.categoryId)
          } : q
        ));
        
        toast({
          title: 'تم التعديل بنجاح',
          description: 'تم تعديل السؤال بنجاح',
        });
      } else {
        // إضافة سؤال جديد
        const response = await apiRequest('POST', '/api/admin/questions', values);
        const newQuestion = await response.json();
        
        // إضافة السؤال الجديد إلى واجهة المستخدم
        setQuestions([...questions, {
          ...newQuestion,
          categoryName: findCategoryName(newQuestion.categoryId),
          subcategoryName: findSubcategoryName(newQuestion.categoryId, newQuestion.subcategoryId),
          categoryIcon: findCategoryIcon(newQuestion.categoryId),
          usageCount: 0,
          createdAt: new Date().toISOString()
        }]);
        
        toast({
          title: 'تمت الإضافة بنجاح',
          description: 'تم إضافة السؤال بنجاح',
        });
      }
      
      // إغلاق النموذج بعد الإرسال
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ السؤال',
      });
    }
  };

  // حذف سؤال
  const deleteQuestion = async (id: number) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال؟')) {
      try {
        await apiRequest('DELETE', `/api/admin/questions/${id}`);
        
        // حذف السؤال من واجهة المستخدم
        setQuestions(questions.filter(q => q.id !== id));
        
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف السؤال بنجاح',
        });
      } catch (error) {
        console.error('Error deleting question:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء محاولة حذف السؤال',
        });
      }
    }
  };

  // البحث عن اسم الفئة
  const findCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'غير معروف';
  };

  // البحث عن اسم الفئة الفرعية
  const findSubcategoryName = (categoryId: number, subcategoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'غير معروف';
    
    const subcategory = category.children.find(s => s.id === subcategoryId);
    return subcategory ? subcategory.name : 'غير معروف';
  };

  // البحث عن أيقونة الفئة
  const findCategoryIcon = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : '❓';
  };

  // تغيير عند اختيار فئة
  const handleCategoryChange = (categoryId: string) => {
    form.setValue('categoryId', parseInt(categoryId));
    form.setValue('subcategoryId', 0); // إعادة تعيين الفئة الفرعية
  };

  // عرض لون المستوى
  const getDifficultyColor = (level: number): string => {
    switch (level) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // عرض اسم المستوى
  const getDifficultyName = (level: number): string => {
    switch (level) {
      case 1: return 'سهل';
      case 2: return 'متوسط';
      case 3: return 'صعب';
      default: return 'غير معروف';
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير متوفر';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory'
    }).format(date);
  };

  // مصفوفة لعرض أرقام الصفحات
  const getPaginationRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
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

      {/* فلترة الأسئلة */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">تصفية وبحث</CardTitle>
          <CardDescription>فلترة وترتيب الأسئلة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث في الأسئلة والإجابات"
                  className="pl-3 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                // إعادة تعيين فلتر الفئة الفرعية عند تغيير الفئة
                if (value !== 'all') {
                  setSubcategoryFilter('all');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={subcategoryFilter} 
                onValueChange={setSubcategoryFilter}
                disabled={categoryFilter === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الفئة الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات الفرعية</SelectItem>
                  {categoryFilter !== 'all' && categories.find(c => c.id.toString() === categoryFilter)?.children.map(subcat => (
                    <SelectItem key={subcat.id} value={subcat.id.toString()}>
                      {subcat.icon} {subcat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="1">سهل</SelectItem>
                  <SelectItem value="2">متوسط</SelectItem>
                  <SelectItem value="3">صعب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Select value={sortBy} onValueChange={setSortBy} className="w-48">
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث أولاً</SelectItem>
                <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                <SelectItem value="mostUsed">الأكثر استخداماً</SelectItem>
                <SelectItem value="leastUsed">الأقل استخداماً</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setSubcategoryFilter('all');
              setDifficultyFilter('all');
              setSortBy('newest');
            }}>
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول الأسئلة */}
      <Card>
        <CardContent className="p-0">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">لا توجد أسئلة</h3>
              <p className="text-sm text-muted-foreground mt-1">
                لم يتم العثور على أسئلة مطابقة للمعايير المحددة
              </p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">الرقم</TableHead>
                    <TableHead>السؤال</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead className="text-center w-[80px]">المستوى</TableHead>
                    <TableHead className="text-center w-[80px]">الاستخدام</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question, index) => (
                    <TableRow key={question.id}>
                      <TableCell className="text-muted-foreground">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          <div className="font-medium">{question.text}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {question.answer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-lg ml-1">{question.categoryIcon}</span>
                            <span>{question.categoryName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {question.subcategoryName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {getDifficultyName(question.difficulty)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {question.usageCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showQuestionDetails(question)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showEditQuestionForm(question)}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteQuestion(question.id || 0)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* الترقيم */}
              {totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(1);
                              }}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        </>
                      )}
                      
                      {getPaginationRange().map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#" 
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentPage < totalPages - 2 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(totalPages);
                              }}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل السؤال */}
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'قم بتعديل بيانات السؤال' : 'قم بإدخال بيانات السؤال الجديد'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitQuestion)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نص السؤال</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اكتب نص السؤال هنا"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      نص السؤال الذي سيظهر للمستخدمين
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الإجابة</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="الإجابة الصحيحة" />
                    </FormControl>
                    <FormDescription>
                      الإجابة الصحيحة للسؤال
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة الرئيسية</FormLabel>
                      <Select
                        onValueChange={(value) => handleCategoryChange(value)}
                        defaultValue={field.value > 0 ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        الفئة الرئيسية التي ينتمي إليها السؤال
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة الفرعية</FormLabel>
                      <Select
                        onValueChange={(value) => form.setValue('subcategoryId', parseInt(value))}
                        defaultValue={field.value > 0 ? field.value.toString() : undefined}
                        disabled={!form.getValues('categoryId')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة الفرعية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.getValues('categoryId') && 
                            categories
                              .find(c => c.id === form.getValues('categoryId'))
                              ?.children.map(subcat => (
                                <SelectItem key={subcat.id} value={subcat.id.toString()}>
                                  {subcat.icon} {subcat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        الفئة الفرعية التي ينتمي إليها السؤال
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مستوى الصعوبة</FormLabel>
                      <Select
                        onValueChange={(value) => form.setValue('difficulty', parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مستوى الصعوبة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">سهل</SelectItem>
                          <SelectItem value="2">متوسط</SelectItem>
                          <SelectItem value="3">صعب</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        مستوى صعوبة السؤال
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الصورة (اختياري)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="رابط الصورة" value={field.value || ''} />
                          {field.value && (
                            <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                              <img
                                src={field.value}
                                alt="Image preview"
                                className="max-h-8 max-w-8 object-contain"
                                onError={(e) => e.currentTarget.src = ""}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        رابط لصورة توضيحية للسؤال (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          السؤال نشط
                        </FormLabel>
                        <FormDescription>
                          إذا كان السؤال نشطًا، فسيظهر في اللعبة
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكلمات المفتاحية</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="كلمات مفتاحية (مفصولة بفواصل)" value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        كلمات مفتاحية للبحث (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="submit">
                  {isEditMode ? 'حفظ التعديلات' : 'إضافة السؤال'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* نافذة معاينة السؤال */}
      <Dialog open={previewOpen} onOpenChange={(open) => setPreviewOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              معاينة السؤال
            </DialogTitle>
          </DialogHeader>
          {previewQuestion && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{previewQuestion.categoryIcon}</span>
                    <span className="font-semibold">{previewQuestion.categoryName}</span>
                    <span className="text-muted-foreground">({previewQuestion.subcategoryName})</span>
                  </div>
                  <Badge className={getDifficultyColor(previewQuestion.difficulty)}>
                    {getDifficultyName(previewQuestion.difficulty)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  تاريخ الإضافة: {formatDate(previewQuestion.createdAt)}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-semibold">السؤال:</h3>
                <div className="bg-slate-50 p-4 rounded-md">
                  {previewQuestion.text}
                </div>
              </div>
              
              {previewQuestion.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewQuestion.imageUrl}
                    alt="صورة توضيحية"
                    className="max-h-48 object-contain rounded-md"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-semibold">الإجابة الصحيحة:</h3>
                <div className="bg-green-50 p-3 rounded-md border-2 border-green-200">
                  {previewQuestion.answer}
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                تم استخدام هذا السؤال {previewQuestion.usageCount} مرة
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewOpen(false)}
                >
                  إغلاق
                </Button>
                <Button
                  onClick={() => {
                    setPreviewOpen(false);
                    showEditQuestionForm(previewQuestion);
                  }}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل السؤال
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}