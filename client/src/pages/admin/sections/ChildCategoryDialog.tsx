import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { ChildCategory } from "./CategoriesManagement.types";

interface ChildCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ChildCategory>;
  onSubmit: (values: ChildCategory) => void;
  isEdit: boolean;
}

export const ChildCategoryDialog: React.FC<ChildCategoryDialogProps> = ({ open, onOpenChange, form, onSubmit, isEdit }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "تعديل فئة فرعية" : "إضافة فئة فرعية جديدة"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "قم بتعديل بيانات الفئة الفرعية" : "قم بإدخال بيانات الفئة الفرعية الجديدة"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الفئة الفرعية</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="اسم الفئة الفرعية" />
                </FormControl>
                <FormDescription>اسم الفئة الفرعية الذي سيظهر للمستخدمين</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>صورة الفئة الفرعية</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="أدخل رابط الصورة هنا" onChange={e => field.onChange(e.target.value)} value={field.value || ""} />
                </FormControl>
                <FormDescription>يجب إضافة رابط لصورة الفئة الفرعية. ستظهر في واجهة اللعبة.</FormDescription>
                {field.value && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">معاينة الصورة:</p>
                    <div className="border rounded-md overflow-hidden w-20 h-20">
                      <img src={field.value} alt="معاينة صورة الفئة الفرعية" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ"; }} />
                    </div>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>أيقونة الفئة الفرعية (اختياري)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="استخدم رمز الإيموجي 😊" />
                </FormControl>
                <FormDescription>يمكنك إضافة رمز تعبيري كاحتياطي إذا تعذر عرض الصورة</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
);
