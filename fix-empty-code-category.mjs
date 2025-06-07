import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { main_categories, subcategories_v2, questions } from '@shared/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { main_categories, subcategories_v2, questions } });

async function fixEmptyCodeCategory() {
  try {
    console.log('🔍 البحث عن الفئة الإسلامية بكود فارغ...');
    
    // البحث عن الفئة بكود فارغ
    const emptyCodeCategories = await db.select().from(main_categories).where(eq(main_categories.code, ''));
    console.log('🔍 الفئات بكود فارغ:', emptyCodeCategories);
    
    if (emptyCodeCategories.length === 0) {
      console.log('✅ لا توجد فئات بكود فارغ');
      return;
    }

    const emptyCategory = emptyCodeCategories[0];
    console.log('🎯 الفئة الموجودة:', emptyCategory);
    
    // البحث عن الفئات الفرعية المرتبطة
    const subcategoriesWithEmpty = await db.select().from(subcategories_v2).where(eq(subcategories_v2.main_category_code, ''));
    console.log('📂 الفئات الفرعية المرتبطة:', subcategoriesWithEmpty);
    
    // البحث عن الأسئلة المرتبطة
    const questionsWithEmpty = await db.select().from(questions).where(eq(questions.main_category_code, ''));
    console.log('❓ الأسئلة المرتبطة:', questionsWithEmpty.length);

    // حل المشكلة: إعطاء كود صحيح للفئة الإسلامية
    const newCode = 'islamic';
    
    console.log(`🔧 تحديث كود الفئة من "" إلى "${newCode}"...`);
    
    // تحديث الفئة الرئيسية
    await db.update(main_categories)
      .set({ code: newCode })
      .where(eq(main_categories.code, ''));
    
    console.log('✅ تم تحديث الفئة الرئيسية');
    
    // تحديث الفئات الفرعية
    if (subcategoriesWithEmpty.length > 0) {
      await db.update(subcategories_v2)
        .set({ main_category_code: newCode })
        .where(eq(subcategories_v2.main_category_code, ''));
      
      console.log(`✅ تم تحديث ${subcategoriesWithEmpty.length} فئة فرعية`);
    }
    
    // تحديث الأسئلة
    if (questionsWithEmpty.length > 0) {
      await db.update(questions)
        .set({ main_category_code: newCode })
        .where(eq(questions.main_category_code, ''));
      
      console.log(`✅ تم تحديث ${questionsWithEmpty.length} سؤال`);
    }
    
    // التحقق من الإصلاح
    const fixedCategory = await db.select().from(main_categories).where(eq(main_categories.code, newCode));
    console.log('🎉 الفئة بعد الإصلاح:', fixedCategory[0]);
    
    const fixedSubcategories = await db.select().from(subcategories_v2).where(eq(subcategories_v2.main_category_code, newCode));
    console.log('📂 الفئات الفرعية بعد الإصلاح:', fixedSubcategories.length);
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error);
  } finally {
    await pool.end();
  }
}

fixEmptyCodeCategory();
