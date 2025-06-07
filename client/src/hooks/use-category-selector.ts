import { useState, useMemo } from "react";

// Import the types from the category store
import type { MainCategory, SubCategory } from "./use-category-store";

/**
 * Hook موحد لإدارة منطق اختيار الفئة والفئة الفرعية في جميع النماذج.
 * - يستقبل قائمة الفئات (مع الفئات الفرعية) وقيم الفئة/الفئة الفرعية الحالية.
 * - يعيد: الفئة المختارة، الفئة الفرعية المختارة، قائمة الفئات الفرعية المتاحة، ودوال التغيير.
 */
export function useCategorySelector({
  categories,
  initialCategoryId = null,
  initialSubcategoryId = null,
  resetSubcategoryOnCategoryChange = true,
}: {
  categories: MainCategory[];
  initialCategoryId?: string | null;
  initialSubcategoryId?: number | null;
  resetSubcategoryOnCategoryChange?: boolean;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(initialSubcategoryId);

  // عند تغيير الفئة الرئيسية، أعد تعيين الفئة الفرعية إذا لزم الأمر
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    if (resetSubcategoryOnCategoryChange) {
      setSubcategoryId(null);
    }
  };

  // قائمة الفئات الفرعية المتاحة للفئة المختارة
  const availableSubcategories = useMemo(() => {
    const cat = categories.find((c) => c.code === categoryId);
    return cat?.children || [];
  }, [categories, categoryId]);

  // عند تغيير الفئة الفرعية
  const handleSubcategoryChange = (newSubcategoryId: number | null) => {
    setSubcategoryId(newSubcategoryId);
  };

  return {
    categoryId,
    setCategoryId: handleCategoryChange,
    subcategoryId,
    setSubcategoryId: handleSubcategoryChange,
    availableSubcategories,
  };
}
