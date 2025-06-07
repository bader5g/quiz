import React, { useState, useEffect } from "react";
import { useToast } from '../../../hooks/use-toast';
import { apiRequest } from "../../../lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCategoryStore } from "../../../hooks/use-category-store";
import { Card, CardContent } from "../../../components/ui/card";
import { Accordion } from "../../../components/ui/accordion";
import { Loader2, Plus, BookOpen } from "lucide-react";
import { MainCategoryItem } from "./MainCategoryItem";
import { ParentCategoryDialog } from "./ParentCategoryDialog";
import { ChildCategoryDialog } from "./ChildCategoryDialog";
import { ParentCategory, ChildCategory, CategoryWithChildren } from "./CategoriesManagement.types";

const parentCategorySchema = z.object({
  code: z.string().min(2).regex(/^[a-z0-9\-]+$/),
  name: z.string().min(2),
  icon: z.string().optional(),
  imageUrl: z.string().min(1),
});
const childCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2),
  icon: z.string().optional(),
  imageUrl: z.string().min(1),
  parentCode: z.string(),
  availableQuestions: z.number(),
});

export default function CategoriesManagement() {
  const { toast } = useToast();
  const { categories, fetchCategories, loading, error } = useCategoryStore();
  const [editMode, setEditMode] = useState<"parent" | "child" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoryCode, setEditingCategoryCode] = useState<string | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null);

  const parentForm = useForm<ParentCategory>({
    resolver: zodResolver(parentCategorySchema),
    defaultValues: { name: "", code: "", icon: "", imageUrl: "" },
  });
  const childForm = useForm<ChildCategory>({
    resolver: zodResolver(childCategorySchema),
    defaultValues: { name: "", icon: "", imageUrl: "", parentCode: "", availableQuestions: 0 },
  });

  useEffect(() => { 
    fetchCategories();
  }, [fetchCategories]);

  // Dialog handlers
  const showAddParentCategoryForm = () => {
    parentForm.reset({ name: "", code: "", icon: "", imageUrl: "" });
    setEditingCategoryCode(null);
    setEditMode("parent");
    setDialogOpen(true);
  };
  const showEditParentCategoryForm = (category: ParentCategory) => {
    parentForm.reset({ name: category.name, code: category.code, icon: category.icon || "", imageUrl: category.imageUrl || "" });
    setEditingCategoryCode(category.code);
    setEditMode("parent");
    setDialogOpen(true);
  };
  const showAddChildCategoryForm = (parentCode: string) => {
    childForm.reset({ name: "", icon: "", imageUrl: "", parentCode, availableQuestions: 0 });
    setSelectedCategoryCode(parentCode);
    setEditMode("child");
    setDialogOpen(true);
  };
  const showEditChildCategoryForm = (category: ChildCategory) => {
    childForm.reset({ id: category.id, name: category.name, icon: category.icon || "", imageUrl: category.imageUrl || "", parentCode: category.parentCode, availableQuestions: category.availableQuestions });
    setSelectedCategoryCode(category.parentCode);
    setEditMode("child");
    setDialogOpen(true);
  };

  // CRUD
  const onSubmitParentCategory = async (values: ParentCategory) => {
    try {
      if (!values.name || !values.code || !values.imageUrl) throw new Error("يرجى ملء جميع الحقول المطلوبة: الاسم، الكود الإنجليزي، والصورة.");
      if (editingCategoryCode) {
        const response = await apiRequest("PUT", `/api/categories/main/${editingCategoryCode}`, values);
        if (!response.ok) throw new Error((await response.json()).error || "حدث خطأ غير معروف");
        toast({ title: "تم التعديل بنجاح", description: "تم تعديل الفئة بنجاح" });
      } else {
        const response = await apiRequest("POST", "/api/categories/main", values);
        if (!response.ok) throw new Error((await response.json()).error || "حدث خطأ غير معروف");
        toast({ title: "تمت الإضافة بنجاح", description: "تمت إضافة الفئة بنجاح" });
      }
      await fetchCategories();
      setDialogOpen(false);
      setEditingCategoryCode(null);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ في الحفظ", description: (error as any).message });
    }
  };
  const onSubmitChildCategory = async (values: ChildCategory) => {
    try {
      if (!values.name || !values.imageUrl) throw new Error("يرجى ملء اسم الفئة الفرعية وإضافة صورة لها.");
      const payload = { 
        main_category_code: values.parentCode,
        name: values.name,
        icon: values.icon || "",
        imageUrl: values.imageUrl,
        isActive: true
      };
      
      if (values.id) {
        // للتعديل، نستخدم endpoint PUT للفئات الفرعية
        const response = await apiRequest("PUT", `/api/categories/sub/${values.parentCode}/${values.id}`, payload);
        if (!response.ok) throw new Error((await response.json()).error || "حدث خطأ في التعديل");
        toast({ title: "تم التعديل بنجاح", description: "تم تعديل الفئة الفرعية بنجاح" });
      } else {
        // للإضافة، نستخدم endpoint POST الصحيح
        const response = await apiRequest("POST", "/api/categories/sub", payload);
        if (!response.ok) throw new Error((await response.json()).error || "حدث خطأ غير معروف");
        toast({ title: "تمت الإضافة بنجاح", description: "تمت إضافة الفئة الفرعية بنجاح" });
      }
      await fetchCategories();
      setDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ في الحفظ", description: error.message });
    }
  };
  const deleteParentCategory = async (code: string) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه الفئة وجميع الفئات الفرعية والأسئلة المرتبطة بها؟")) {
      try {
        const response = await apiRequest("DELETE", `/api/categories/main/${code}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "حدث خطأ أثناء الحذف");
        }
        await fetchCategories();
        toast({ title: "تم الحذف بنجاح", description: "تم حذف الفئة والفئات الفرعية والأسئلة المرتبطة بها بنجاح" });
      } catch (error) {
        console.error("خطأ في الحذف:", error);
        toast({ variant: "destructive", title: "خطأ في الحذف", description: (error as Error).message || "حدث خطأ أثناء محاولة حذف الفئة" });
      }
    }
  };
  const deleteChildCategory = async (id: number, parentCode: string) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه الفئة الفرعية وجميع الأسئلة المرتبطة بها؟")) {
      try {
        // استخدام endpoint الصحيح للحذف
        const response = await apiRequest("DELETE", `/api/categories/sub/${parentCode}/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "حدث خطأ أثناء الحذف");
        }
        await fetchCategories();
        toast({ title: "تم الحذف بنجاح", description: "تم حذف الفئة الفرعية والأسئلة المرتبطة بها بنجاح" });
      } catch (error) {
        console.error("خطأ في حذف الفئة الفرعية:", error);
        toast({ variant: "destructive", title: "خطأ في الحذف", description: (error as Error).message || "حدث خطأ أثناء محاولة حذف الفئة الفرعية" });
      }
    }
  };

  if (loading) return (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="mr-2">جاري تحميل الفئات...</span></div>);
  if (error) return (<div className="flex justify-center items-center h-64"><div className="text-center"><p className="text-red-500 mb-2">خطأ في تحميل الفئات: {error}</p><button onClick={fetchCategories} className="btn btn-outline">إعادة المحاولة</button></div></div>);

  console.log('🎯 البيانات الحالية في المكون:', { categories, loading, error });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">الفئات الرئيسية والفرعية</h3>
          <p className="text-sm text-muted-foreground">إدارة فئات الأسئلة والفئات الفرعية المندرجة تحتها</p>
        </div>
        <button onClick={showAddParentCategoryForm} className="btn btn-primary flex items-center"><Plus className="h-4 w-4 ml-2" />إضافة فئة جديدة</button>
      </div>
      <Card>
        <CardContent className="p-6">
          {categories.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">لا توجد فئات حاليًا</h3>
              <p className="text-sm text-muted-foreground mt-1">قم بإضافة فئات جديدة لتنظيم أسئلة التطبيق</p>
            </div>
          ) : (
            <Accordion type="single" defaultValue={categories[0]?.code} collapsible className="w-full">
              {categories.map((category: CategoryWithChildren) => (
                <MainCategoryItem
                  key={category.code}
                  category={category}
                  onAddChild={showAddChildCategoryForm}
                  onEdit={showEditParentCategoryForm}
                  onDelete={deleteParentCategory}
                  onEditChild={showEditChildCategoryForm}
                  onDeleteChild={deleteChildCategory}
                />
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
      <ParentCategoryDialog
        open={dialogOpen && editMode === "parent"}
        onOpenChange={open => { if (!open) setDialogOpen(false); }}
        form={parentForm}
        onSubmit={onSubmitParentCategory}
        isEdit={!!editingCategoryCode}
      />
      <ChildCategoryDialog
        open={dialogOpen && editMode === "child"}
        onOpenChange={open => { if (!open) setDialogOpen(false); }}
        form={childForm}
        onSubmit={onSubmitChildCategory}
        isEdit={!!childForm.getValues("id")}
      />
    </div>
  );
}
