import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  FolderPlus,
  Save,
} from "lucide-react";

const parentCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "اسم الفئة يجب أن يحتوي على حرفين على الأقل"),
  icon: z.string().optional(),
  imageUrl: z.string().min(1, "يجب إدخال رابط الصورة للفئة"),
});

const childCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "اسم الفئة الفرعية يجب أن يحتوي على حرفين على الأقل"),
  icon: z.string().min(1, "يجب اختيار أيقونة للفئة الفرعية"),
  parentId: z.number(),
  availableQuestions: z.number().default(0),
});

type ParentCategory = z.infer<typeof parentCategorySchema>;
type ChildCategory = z.infer<typeof childCategorySchema>;

interface CategoryWithChildren extends ParentCategory {
  children: ChildCategory[];
}

const availableIcons = [
  { value: "🧪", label: "علوم" },
  { value: "🧮", label: "رياضيات" },
  { value: "📚", label: "أدب" },
  { value: "🌍", label: "جغرافيا" },
  { value: "🏺", label: "تاريخ" },
  { value: "🎭", label: "فنون" },
  { value: "🏀", label: "رياضة" },
  { value: "🎬", label: "سينما" },
  { value: "🎵", label: "موسيقى" },
  { value: "💻", label: "تكنولوجيا" },
  { value: "🍔", label: "طعام" },
  { value: "🌿", label: "طبيعة" },
];

export default function CategoriesManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [editMode, setEditMode] = useState<"parent" | "child" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // نموذج الفئة الرئيسية
  const parentForm = useForm<ParentCategory>({
    resolver: zodResolver(parentCategorySchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  // نموذج الفئة الفرعية
  const childForm = useForm<ChildCategory>({
    resolver: zodResolver(childCategorySchema),
    defaultValues: {
      name: "",
      icon: "",
      parentId: 0,
      availableQuestions: 0,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(
          "GET",
          "/api/categories-with-children",
        );
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          variant: "destructive",
          title: "خطأ في جلب الفئات",
          description: "حدث خطأ أثناء محاولة جلب الفئات",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [toast]);

  const showAddParentCategoryForm = () => {
    parentForm.reset({
      name: "",
      icon: "",
    });
    setEditMode("parent");
    setDialogOpen(true);
  };

  const showEditParentCategoryForm = (category: ParentCategory) => {
    parentForm.reset({
      id: category.id,
      name: category.name,
      icon: category.icon,
    });
    setEditMode("parent");
    setDialogOpen(true);
  };

  const showAddChildCategoryForm = (parentId: number) => {
    childForm.reset({
      name: "",
      icon: "",
      parentId,
      availableQuestions: 0,
    });
    setSelectedCategoryId(parentId);
    setEditMode("child");
    setDialogOpen(true);
  };

  const showEditChildCategoryForm = (category: ChildCategory) => {
    childForm.reset({
      id: category.id,
      name: category.name,
      icon: category.icon,
      parentId: category.parentId,
      availableQuestions: category.availableQuestions,
    });
    setSelectedCategoryId(category.parentId);
    setEditMode("child");
    setDialogOpen(true);
  };

  const onSubmitParentCategory = async (values: ParentCategory) => {
    try {
      // تحقق من البيانات المدخلة
      if (!values.name || !values.imageUrl) {
        throw new Error("يرجى ملء اسم الفئة وإضافة صورة لها.");
      }

      if (values.id) {
        const response = await apiRequest(
          "PATCH",
          `/api/categories/${values.id}`,
          values,
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "حدث خطأ غير معروف");
        }
        setCategories(
          categories.map((category) =>
            category.id === values.id
              ? { ...category, ...values, children: category.children }
              : category,
          ),
        );
        toast({
          title: "تم التعديل بنجاح",
          description: "تم تعديل الفئة بنجاح",
        });
      } else {
        const response = await apiRequest("POST", "/api/categories", values);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "حدث خطأ غير معروف");
        }
        const newCategory = await response.json();
        setCategories([...categories, { ...newCategory, children: [] }]);
        toast({
          title: "تمت الإضافة بنجاح",
          description: "تمت إضافة الفئة بنجاح",
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving parent category:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء محاولة حفظ الفئة",
      });
    }
  };

  const onSubmitChildCategory = async (values: ChildCategory) => {
    try {
      if (values.id) {
        await apiRequest("PATCH", `/api/subcategories/${values.id}`, values);
        setCategories(
          categories.map((category) => {
            if (category.id === values.parentId) {
              return {
                ...category,
                children: category.children.map((child) =>
                  child.id === values.id ? { ...values } : child,
                ),
              };
            }
            return category;
          }),
        );
        toast({
          title: "تم التعديل بنجاح",
          description: "تم تعديل الفئة الفرعية بنجاح",
        });
      } else {
        const response = await apiRequest("POST", "/api/subcategories", values);
        const newSubcategory = await response.json();
        setCategories(
          categories.map((category) => {
            if (category.id === values.parentId) {
              return {
                ...category,
                children: [...category.children, newSubcategory],
              };
            }
            return category;
          }),
        );
        toast({
          title: "تمت الإضافة بنجاح",
          description: "تمت إضافة الفئة الفرعية بنجاح",
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving child category:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء محاولة حفظ الفئة الفرعية",
      });
    }
  };

  const deleteParentCategory = async (id: number) => {
    if (
      confirm(
        "هل أنت متأكد من رغبتك في حذف هذه الفئة وجميع الفئات الفرعية المرتبطة بها؟",
      )
    ) {
      try {
        await apiRequest("DELETE", `/api/categories/${id}`);
        setCategories(categories.filter((category) => category.id !== id));
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الفئة والفئات الفرعية المرتبطة بها بنجاح",
        });
      } catch (error) {
        console.error("Error deleting parent category:", error);
        toast({
          variant: "destructive",
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء محاولة حذف الفئة",
        });
      }
    }
  };

  const deleteChildCategory = async (id: number, parentId: number) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه الفئة الفرعية؟")) {
      try {
        await apiRequest("DELETE", `/api/subcategories/${id}`);
        setCategories(
          categories.map((category) => {
            if (category.id === parentId) {
              return {
                ...category,
                children: category.children.filter((child) => child.id !== id),
              };
            }
            return category;
          }),
        );
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الفئة الفرعية بنجاح",
        });
      } catch (error) {
        console.error("Error deleting child category:", error);
        toast({
          variant: "destructive",
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء محاولة حذف الفئة الفرعية",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الفئات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">الفئات الرئيسية والفرعية</h3>
          <p className="text-sm text-muted-foreground">
            إدارة فئات الأسئلة والفئات الفرعية المندرجة تحتها
          </p>
        </div>
        <Button onClick={showAddParentCategoryForm}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة فئة جديدة
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          {categories.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">لا توجد فئات حاليًا</h3>
              <p className="text-sm text-muted-foreground mt-1">
                قم بإضافة فئات جديدة لتنظيم أسئلة التطبيق
              </p>
            </div>
          ) : (
            <Accordion
              type="single"
              defaultValue={categories[0]?.id?.toString()}
              collapsible
              className="w-full"
            >
              {categories.map((category) => (
                <AccordionItem
                  key={category.id}
                  value={category.id?.toString() || ""}
                >
                  <AccordionTrigger className="group">
                    <div className="flex items-center mr-2">
                      <div className="flex items-center">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="h-8 w-8 rounded-full ml-2 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ";
                            }}
                          />
                        ) : (
                          <span className="text-xl ml-2">{category.icon}</span>
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge variant="outline" className="mr-auto ml-2">
                        {category.children.length} فئة فرعية
                      </Badge>
                    </div>
                    <div className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <div
                        className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-3 whitespace-nowrap text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          showAddChildCategoryForm(category.id || 0);
                        }}
                      >
                        <FolderPlus className="h-4 w-4 ml-1" />
                        فئة فرعية
                      </div>
                      <div
                        className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-3 whitespace-nowrap text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          showEditParentCategoryForm(category);
                        }}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </div>
                      <div
                        className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-3 whitespace-nowrap text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteParentCategory(category.id || 0);
                        }}
                      >
                        <Trash2 className="h-4 w-4 ml-1 text-destructive" />
                        حذف
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-md border mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">الأيقونة</TableHead>
                            <TableHead>اسم الفئة الفرعية</TableHead>
                            <TableHead className="text-center">
                              عدد الأسئلة
                            </TableHead>
                            <TableHead className="text-left">
                              الإجراءات
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.children.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground py-4"
                              >
                                لا توجد فئات فرعية في هذه الفئة
                              </TableCell>
                            </TableRow>
                          ) : (
                            category.children.map((child) => (
                              <TableRow key={child.id}>
                                <TableCell className="text-lg">
                                  {child.icon}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {child.name}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      child.availableQuestions > 0
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {child.availableQuestions}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        showEditChildCategoryForm(child)
                                      }
                                    >
                                      <Edit className="h-4 w-4 ml-1" />
                                      تعديل
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        deleteChildCategory(
                                          child.id || 0,
                                          category.id || 0,
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 ml-1 text-destructive" />
                                      حذف
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* مودال الفئة الرئيسية */}
      <Dialog
        open={dialogOpen && editMode === "parent"}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {parentForm.getValues("id") ? "تعديل فئة" : "إضافة فئة جديدة"}
            </DialogTitle>
            <DialogDescription>
              {parentForm.getValues("id")
                ? "قم بتعديل بيانات الفئة"
                : "قم بإدخال بيانات الفئة الجديدة"}
            </DialogDescription>
          </DialogHeader>
          <Form {...parentForm}>
            <form
              onSubmit={parentForm.handleSubmit(onSubmitParentCategory)}
              className="space-y-6"
            >
              <FormField
                control={parentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الفئة</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="اسم الفئة" />
                    </FormControl>
                    <FormDescription>
                      اسم الفئة الذي سيظهر للمستخدمين
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={parentForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أيقونة الفئة</FormLabel>
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      {availableIcons.map((icon) => (
                        <button
                          key={icon.value}
                          type="button"
                          className={`h-12 text-xl flex items-center justify-center rounded border 
                            ${field.value === icon.value ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}
                            focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
                          onClick={() =>
                            parentForm.setValue("icon", icon.value)
                          }
                          aria-label={icon.label}
                        >
                          {icon.value}
                        </button>
                      ))}
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="أيقونة الفئة" />
                    </FormControl>
                    <FormDescription>
                      يمكنك اختيار أيقونة من الأعلى أو كتابة رمز تعبيري
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={parentForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صورة الفئة (اختياري)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="أدخل رابط الصورة هنا" 
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      يمكنك إضافة رابط لصورة الفئة. ستظهر في واجهة اللعبة.
                    </FormDescription>
                    {field.value && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">معاينة الصورة:</p>
                        <div className="border rounded-md overflow-hidden w-20 h-20">
                          <img 
                            src={field.value} 
                            alt="معاينة صورة الفئة" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ";
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 ml-2" />
                  {parentForm.getValues("id") ? "حفظ التعديلات" : "إضافة الفئة"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* مودال الفئة الفرعية */}
      <Dialog
        open={dialogOpen && editMode === "child"}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {childForm.getValues("id")
                ? "تعديل فئة فرعية"
                : "إضافة فئة فرعية جديدة"}
            </DialogTitle>
            <DialogDescription>
              {childForm.getValues("id")
                ? "قم بتعديل بيانات الفئة الفرعية"
                : "قم بإدخال بيانات الفئة الفرعية الجديدة"}
            </DialogDescription>
          </DialogHeader>
          <Form {...childForm}>
            <form
              onSubmit={childForm.handleSubmit(onSubmitChildCategory)}
              className="space-y-6"
            >
              <FormField
                control={childForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الفئة الفرعية</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="اسم الفئة الفرعية" />
                    </FormControl>
                    <FormDescription>
                      اسم الفئة الفرعية الذي سيظهر للمستخدمين
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أيقونة الفئة الفرعية</FormLabel>
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      {availableIcons.map((icon) => (
                        <button
                          key={icon.value}
                          type="button"
                          className={`h-12 text-xl flex items-center justify-center rounded border 
                                              ${field.value === icon.value ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}
                                              focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
                          onClick={() => childForm.setValue("icon", icon.value)}
                          aria-label={icon.label}
                        >
                          {icon.value}
                        </button>
                      ))}
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="أيقونة الفئة الفرعية" />
                    </FormControl>
                    <FormDescription>
                      يمكنك اختيار أيقونة من الأعلى أو كتابة رمز تعبيري
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 ml-2" />
                  {childForm.getValues("id")
                    ? "حفظ التعديلات"
                    : "إضافة الفئة الفرعية"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
