const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function advancedFixEmptyCategory() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 إصلاح متقدم للفئة ذات الكود الفارغ...');
    
    // Step 1: Check current state
    console.log('\n📊 فحص الحالة الحالية...');
    
    const emptyCategories = await client.query(`
      SELECT * FROM main_categories WHERE code = '' OR code IS NULL
    `);
    
    if (emptyCategories.rows.length === 0) {
      console.log('✅ لا توجد فئة بكود فارغ - النظام سليم');
      return;
    }
    
    console.log(`🚨 وجدت ${emptyCategories.rows.length} فئة بكود فارغ:`);
    emptyCategories.rows.forEach(cat => {
      console.log(`   - "${cat.name}" (كود: "${cat.code}")`);
    });
    
    // Step 2: Check what's referencing the empty category
    console.log('\n🔍 فحص المراجع للفئة ذات الكود الفارغ...');
    
    // Check subcategories
    const referencingSubcategories = await client.query(`
      SELECT * FROM subcategories_v2 WHERE main_category_code = ''
    `);
    console.log(`📁 الفئات الفرعية المرتبطة: ${referencingSubcategories.rows.length}`);
    
    // Check questions (if the table exists)
    let referencingQuestions = { rows: [] };
    try {
      referencingQuestions = await client.query(`
        SELECT COUNT(*) as count FROM questions WHERE main_category_code = ''
      `);
      console.log(`❓ الأسئلة المرتبطة: ${referencingQuestions.rows[0]?.count || 0}`);
    } catch (error) {
      console.log('ℹ️ جدول الأسئلة غير موجود أو لا يحتوي على العمود main_category_code');
    }
    
    // Step 3: Decide on the target category
    const targetCategoryCode = 'islamic'; // نقل كل شيء للفئة الإسلامية الصحيحة
    
    console.log(`\n🎯 سيتم نقل جميع البيانات إلى الفئة: ${targetCategoryCode}`);
    
    // Step 4: Start transaction
    await client.query('BEGIN');
    
    try {
      // Update subcategories first
      if (referencingSubcategories.rows.length > 0) {
        console.log('🔄 تحديث الفئات الفرعية...');
        const subUpdateResult = await client.query(`
          UPDATE subcategories_v2 
          SET main_category_code = $1 
          WHERE main_category_code = ''
        `, [targetCategoryCode]);
        console.log(`✅ تم تحديث ${subUpdateResult.rowCount} فئة فرعية`);
      }
      
      // Update questions if they exist
      try {
        const questionUpdateResult = await client.query(`
          UPDATE questions 
          SET main_category_code = $1 
          WHERE main_category_code = ''
        `, [targetCategoryCode]);
        console.log(`✅ تم تحديث ${questionUpdateResult.rowCount} سؤال`);
      } catch (error) {
        console.log('ℹ️ لا توجد أسئلة للتحديث أو العمود غير موجود');
      }
      
      // Now delete the empty category
      console.log('🗑️ حذف الفئة ذات الكود الفارغ...');
      const deleteResult = await client.query(`
        DELETE FROM main_categories WHERE code = ''
      `);
      console.log(`✅ تم حذف ${deleteResult.rowCount} فئة`);
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ تم تأكيد جميع التغييرات');
      
      // Step 5: Verify the fix
      console.log('\n📋 التحقق من الإصلاح...');
      
      const finalCategories = await client.query(`
        SELECT code, name FROM main_categories ORDER BY code
      `);
      
      console.log('✅ الفئات الرئيسية المتبقية:');
      finalCategories.rows.forEach(row => {
        console.log(`   - "${row.name}" (${row.code})`);
      });
      
      const finalSubcategories = await client.query(`
        SELECT main_category_code, COUNT(*) as count 
        FROM subcategories_v2 
        GROUP BY main_category_code 
        ORDER BY main_category_code
      `);
      
      console.log('\n📊 توزيع الفئات الفرعية:');
      finalSubcategories.rows.forEach(row => {
        console.log(`   - ${row.main_category_code}: ${row.count} فئة فرعية`);
      });
      
      // Check for empty codes again
      const remainingEmpty = await client.query(`
        SELECT * FROM main_categories WHERE code = '' OR code IS NULL
      `);
      
      if (remainingEmpty.rows.length === 0) {
        console.log('\n🎉 تم حل مشكلة الفئة ذات الكود الفارغ بنجاح!');
      } else {
        console.log('\n⚠️ لا تزال هناك فئات بكود فارغ');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

advancedFixEmptyCategory()
  .then(() => {
    console.log('\n🎉 اكتمل الإصلاح المتقدم بنجاح');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ فشل الإصلاح المتقدم:', error);
    process.exit(1);
  });
