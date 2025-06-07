import { create } from "zustand";

// نوع الفئة الرئيسية
export interface MainCategory {
  code: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
  children: SubCategory[];
}

// نوع الفئة الفرعية
export interface SubCategory {
  id: number;
  name: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
  parentId?: number;
}

interface CategoryStore {
  categories: MainCategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  setCategories: (categories: MainCategory[]) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loading: false,
  error: null,  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      // استخدم الرابط الصحيح حسب الـ API
      const res = await fetch("/api/categories/main-with-subcategories");
      if (!res.ok) throw new Error("فشل في جلب الفئات");
      const data = await res.json();
      
      // تصفية الفئات التي لديها كود فارغ أو غير صالح
      const validData = data.filter((cat: any) => cat.code && cat.code.trim() !== '');
      
      // تحويل خصائص الفئات الفرعية لتتوافق مع الواجهة
      const categories = validData.map((cat: any) => ({
        code: cat.code,
        name: cat.name,
        icon: cat.icon,
        imageUrl: cat.imageUrl,
        isActive: cat.isActive,
        children: (cat.children || []).map((sub: any) => ({
          id: sub.subcategory_id || sub.id,
          name: sub.name,
          icon: sub.icon,
          imageUrl: sub.imageUrl,
          isActive: sub.isActive,
          parentCode: sub.main_category_code || cat.code,
          availableQuestions: sub.availableQuestions || 0,
        })),
      }));
      
      set({ categories, loading: false });
    } catch (e: any) {
      set({ error: e.message || "خطأ غير معروف", loading: false });
    }
  },
  setCategories: (categories) => set({ categories }),
}));
