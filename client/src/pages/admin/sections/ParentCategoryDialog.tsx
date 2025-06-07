import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Save } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ParentCategory } from "./CategoriesManagement.types";

interface ParentCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ParentCategory>;
  onSubmit: (values: ParentCategory) => void;
  isEdit: boolean;
}

export const ParentCategoryDialog: React.FC<ParentCategoryDialogProps> = ({ open, onOpenChange, form, onSubmit, isEdit }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "تعديل فئة" : "إضافة فئة جديدة"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "قم بتعديل بيانات الفئة" : "قم بإدخال بيانات الفئة الجديدة"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الفئة</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="اسم الفئة" />
                </FormControl>
                <FormDescription>اسم الفئة الذي سيظهر للمستخدمين</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>صورة الفئة</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="أدخل رابط الصورة هنا" onChange={e => field.onChange(e.target.value)} value={field.value || ""} />
                </FormControl>
                <FormDescription>يجب إضافة رابط لصورة الفئة. ستظهر في واجهة اللعبة.</FormDescription>
                {field.value && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">معاينة الصورة:</p>
                    <div className="border rounded-md overflow-hidden w-20 h-20">
                      <img src={field.value} alt="معاينة صورة الفئة" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ"; }} />
                    </div>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم إنجليزي (slug) للفئة</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="مثل: islamic أو sport" disabled={isEdit} />
                </FormControl>
                <FormDescription>يجب أن يكون الاسم بالإنجليزية وصغيرًا وبدون مسافات.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 ml-2" />
              {isEdit ? "حفظ التعديلات" : "إضافة الفئة"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
);
