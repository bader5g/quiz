import { db } from '../db';
// ...existing code...

// دوال إدارة الفئات (categories) من التخزين المؤقت (MemStorage)
export async function getCategoriesMem(categoriesMap: Map<number, any>): Promise<any[]> {
  return Array.from(categoriesMap.values());
}

export async function getCategoryByIdMem(categoriesMap: Map<number, any>, id: number): Promise<any | undefined> {
  return categoriesMap.get(id);
}

export async function createCategoryMem(categoriesMap: Map<number, any>, currentCategoryIdRef: { value: number }, category: any): Promise<any> {
  const newCategory = { ...category, id: currentCategoryIdRef.value++ };
  categoriesMap.set(newCategory.id, newCategory);
  return newCategory;
}

export async function updateCategoryMem(categoriesMap: Map<number, any>, id: number, category: any): Promise<any> {
  const existing = categoriesMap.get(id);
  if (existing) {
    const updated = { ...existing, ...category };
    categoriesMap.set(id, updated);
    return updated;
  }
  throw new Error("Category not found");
}

export async function deleteCategoryMem(categoriesMap: Map<number, any>, id: number): Promise<void> {
  categoriesMap.delete(id);
}

// لاحقاً: أضف دوال قاعدة البيانات الفعلية هنا إذا لزم الأمر
