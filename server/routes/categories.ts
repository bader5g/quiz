// راوتر الفئات (categories)
import { Router } from 'express';
import { db } from '../db';
import { main_categories, subcategories_v2, questions } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();

// جلب جميع الفئات الرئيسية
router.get('/main', async (req, res) => {
  try {
    const mainCategories = await db.select().from(main_categories);
    res.json(mainCategories);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'فشل في جلب الفئات الرئيسية', details });
  }
});

// جلب جميع الفئات الفرعية لفئة رئيسية معينة
router.get('/sub/:mainCategoryCode', async (req, res) => {
  const mainCategoryCode = req.params.mainCategoryCode;
  try {
    const subcategories = await db.select().from(subcategories_v2).where(eq(subcategories_v2.main_category_code, mainCategoryCode));
    res.json(subcategories);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'فشل في جلب الفئات الفرعية', details });
  }
});

// إضافة فئة رئيسية جديدة
router.post('/main', async (req, res) => {
  const { code, name, icon, imageUrl, isActive } = req.body;
  
  // إضافة تسجيل للتشخيص
  console.log('POST /main received data:', { code, name, icon, imageUrl, isActive });
  
  // التحقق من أن الكود غير فارغ
  if (!code || code.trim() === '') {
    return res.status(400).json({ error: 'كود الفئة مطلوب ولا يمكن أن يكون فارغاً' });
  }
    try {
    await db.insert(main_categories).values({ code, name, icon, imageUrl, isActive });
    res.status(201).json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error('Database error:', error);
    res.status(500).json({ error: 'فشل في إضافة الفئة الرئيسية', details });
  }
});

// تحديث فئة رئيسية
router.put('/main/:code', async (req, res) => {
  const code = req.params.code;
  const { name, icon, imageUrl, isActive } = req.body;
  
  console.log('PUT /main/:code received data:', { code, name, icon, imageUrl, isActive });
  
  try {
    await db.update(main_categories)
      .set({ name, icon, imageUrl, isActive })
      .where(eq(main_categories.code, code));
    res.status(200).json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error('Database error:', error);
    res.status(500).json({ error: 'فشل في تحديث الفئة الرئيسية', details });
  }
});

// إضافة فئة فرعية جديدة (توليد رقم متسلسل تلقائي)
router.post('/sub', async (req, res) => {
  const { main_category_code, name, icon, imageUrl, isActive } = req.body;
  try {
    // جلب آخر رقم للفئة الفرعية لهذه الفئة الرئيسية
    const last = await db.select().from(subcategories_v2)
      .where(eq(subcategories_v2.main_category_code, main_category_code))
      .orderBy(desc(subcategories_v2.subcategory_id)).limit(1);
    const subcategory_id = last.length > 0 ? last[0].subcategory_id + 1 : 1;
    await db.insert(subcategories_v2).values({ main_category_code, subcategory_id, name, icon, imageUrl, isActive });
    res.status(201).json({ success: true, subcategory_id });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'فشل في إضافة الفئة الفرعية', details });
  }
});

// تحديث فئة فرعية
router.put('/sub/:mainCategoryCode/:subcategoryId', async (req, res) => {
  const main_category_code = req.params.mainCategoryCode;
  const subcategory_id = parseInt(req.params.subcategoryId);
  const { name, icon, imageUrl, isActive } = req.body;
  try {
    await db.update(subcategories_v2).set({ name, icon, imageUrl, isActive })
      .where(and(
        eq(subcategories_v2.main_category_code, main_category_code),
        eq(subcategories_v2.subcategory_id, subcategory_id)
      ));
    res.status(200).json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'فشل في تحديث الفئة الفرعية', details });
  }
});

// حذف فئة رئيسية
router.delete('/main/:code', async (req, res) => {
  const code = req.params.code;
  
  console.log(`محاولة حذف الفئة الرئيسية: ${code}`);
  
  try {
    // أولاً، نحذف جميع الأسئلة المرتبطة بهذه الفئة
    const deletedQuestions = await db.delete(questions).where(eq(questions.main_category_code, code));
    console.log(`تم حذف الأسئلة المرتبطة بالفئة ${code}`);
    
    // ثم نحذف الفئات الفرعية المرتبطة
    const deletedSubcategories = await db.delete(subcategories_v2).where(eq(subcategories_v2.main_category_code, code));
    console.log(`تم حذف الفئات الفرعية المرتبطة بالفئة ${code}`);
    
    // أخيراً نحذف الفئة الرئيسية نفسها
    const deletedMain = await db.delete(main_categories).where(eq(main_categories.code, code));
    console.log(`تم حذف الفئة الرئيسية ${code} بنجاح`);
    
    res.status(200).json({ 
      success: true, 
      message: `تم حذف الفئة والفئات الفرعية والأسئلة المرتبطة بها بنجاح` 
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error(`خطأ في حذف الفئة ${code}:`, error);
    res.status(500).json({ error: 'فشل في حذف الفئة الرئيسية', details });
  }
});

// حذف فئة فرعية
router.delete('/sub/:mainCategoryCode/:subcategoryId', async (req, res) => {
  const main_category_code = req.params.mainCategoryCode;
  const subcategory_id = parseInt(req.params.subcategoryId);
  
  console.log(`محاولة حذف الفئة الفرعية: ${main_category_code}/${subcategory_id}`);
  
  try {
    // أولاً، نحذف جميع الأسئلة المرتبطة بهذه الفئة الفرعية
    const deletedQuestions = await db.delete(questions).where(
      and(
        eq(questions.main_category_code, main_category_code),
        eq(questions.subcategory_id, subcategory_id)
      )
    );
    console.log(`تم حذف الأسئلة المرتبطة بالفئة الفرعية ${main_category_code}/${subcategory_id}`);
    
    // ثم نحذف الفئة الفرعية نفسها
    await db.delete(subcategories_v2)
      .where(and(
        eq(subcategories_v2.main_category_code, main_category_code),
        eq(subcategories_v2.subcategory_id, subcategory_id)
      ));
    console.log(`تم حذف الفئة الفرعية ${main_category_code}/${subcategory_id} بنجاح`);
    
    res.status(200).json({ 
      success: true, 
      message: `تم حذف الفئة الفرعية والأسئلة المرتبطة بها بنجاح` 
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error(`خطأ في حذف الفئة الفرعية ${main_category_code}/${subcategory_id}:`, error);
    res.status(500).json({ error: 'فشل في حذف الفئة الفرعية', details });
  }
});

// جلب جميع الفئات الرئيسية مع الفئات الفرعية (نظام slug)
router.get('/main-with-subcategories', async (req, res) => {
  try {
    const mainCategories = await db.select().from(main_categories);
    const allSubcategories = await db.select().from(subcategories_v2);
    
    // تصفية الفئات الرئيسية لإزالة الكود الفارغ
    const validMainCategories = mainCategories.filter(main => 
      main.code && main.code.trim() !== ''
    );
    
    // ربط الفئات الفرعية بالفئات الرئيسية
    const result = validMainCategories.map(main => ({
      ...main,
      children: allSubcategories.filter(sub => sub.main_category_code === main.code)
    }));
    res.json(result);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'فشل في جلب الفئات مع الفرعية', details });
  }
});

export default router;
