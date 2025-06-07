// سكريبت لعد الأسئلة في قاعدة البيانات
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function countQuestions() {
  try {
    console.log('🔍 جاري عد الأسئلة في قاعدة البيانات...\n');
    
    // عد الأسئلة في جدول questions الرئيسي
    console.log('📊 جدول الأسئلة الرئيسي (questions):');
    try {
      const questionsCount = await sql`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN is_active = true THEN 1 END) as active,
               COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
        FROM questions
      `;
      
      console.log(`   📈 إجمالي الأسئلة: ${questionsCount[0].total}`);
      console.log(`   ✅ الأسئلة النشطة: ${questionsCount[0].active}`);
      console.log(`   ❌ الأسئلة غير النشطة: ${questionsCount[0].inactive}`);
      
      // عد الأسئلة حسب الفئة الرئيسية
      const byCategory = await sql`
        SELECT main_category_code, COUNT(*) as count
        FROM questions
        GROUP BY main_category_code
        ORDER BY count DESC
      `;
      
      if (byCategory.length > 0) {
        console.log('\n   📂 توزيع الأسئلة حسب الفئة الرئيسية:');
        byCategory.forEach(cat => {
          console.log(`      - ${cat.main_category_code || 'غير محدد'}: ${cat.count} سؤال`);
        });
      }
      
    } catch (error) {
      console.log('   ⚠️  جدول questions غير موجود أو لا يمكن الوصول إليه');
      console.log(`   خطأ: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // عد الأسئلة في جدول questions_simple
    console.log('📊 جدول الأسئلة المبسط (questions_simple):');
    try {
      const simpleQuestionsCount = await sql`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN is_active = true THEN 1 END) as active,
               COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
        FROM questions_simple
      `;
      
      console.log(`   📈 إجمالي الأسئلة: ${simpleQuestionsCount[0].total}`);
      console.log(`   ✅ الأسئلة النشطة: ${simpleQuestionsCount[0].active}`);
      console.log(`   ❌ الأسئلة غير النشطة: ${simpleQuestionsCount[0].inactive}`);
      
      // عد الأسئلة حسب مستوى الصعوبة
      const byDifficulty = await sql`
        SELECT difficulty, COUNT(*) as count
        FROM questions_simple
        GROUP BY difficulty
        ORDER BY count DESC
      `;
      
      if (byDifficulty.length > 0) {
        console.log('\n   🎯 توزيع الأسئلة حسب مستوى الصعوبة:');
        byDifficulty.forEach(diff => {
          const difficultyName = {
            'easy': 'سهل',
            'medium': 'متوسط', 
            'hard': 'صعب'
          }[diff.difficulty] || diff.difficulty;
          console.log(`      - ${difficultyName}: ${diff.count} سؤال`);
        });
      }
      
      // عد الأسئلة حسب الفئة
      const byCategorySimple = await sql`
        SELECT category_id, COUNT(*) as count
        FROM questions_simple
        WHERE category_id IS NOT NULL
        GROUP BY category_id
        ORDER BY count DESC
      `;
      
      if (byCategorySimple.length > 0) {
        console.log('\n   📂 توزيع الأسئلة حسب الفئة:');
        byCategorySimple.forEach(cat => {
          console.log(`      - فئة ${cat.category_id}: ${cat.count} سؤال`);
        });
      }
      
    } catch (error) {
      console.log('   ⚠️  جدول questions_simple غير موجود أو لا يمكن الوصول إليه');
      console.log(`   خطأ: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // معلومات إضافية عن الجداول
    console.log('📋 معلومات إضافية:');
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%question%'
        ORDER BY table_name
      `;
      
      console.log(`   📊 الجداول المتعلقة بالأسئلة: ${tables.length}`);
      tables.forEach(table => {
        console.log(`      - ${table.table_name}`);
      });
      
    } catch (error) {
      console.log('   ⚠️  لا يمكن جلب معلومات الجداول');
    }
    
    console.log('\n✅ تم إنهاء العد بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في العد:', error.message);
  }
}

countQuestions();
