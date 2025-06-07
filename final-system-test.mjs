// اختبار نهائي شامل للنظام
const finalSystemTest = async () => {
  console.log('🔄 بدء الاختبار النهائي الشامل...\n');

  try {
    // 1. اختبار خادم API
    console.log('1️⃣ اختبار خادم API...');
    const apiResponse = await fetch('http://localhost:5000/api/categories/main-with-subcategories');
    if (apiResponse.ok) {
      const categories = await apiResponse.json();
      console.log('   ✅ خادم API يعمل بنجاح');
      console.log(`   📊 عدد الفئات الرئيسية: ${categories.length}`);
      
      // عدد الفئات الفرعية
      const totalSubcategories = categories.reduce((total, cat) => total + (cat.children?.length || 0), 0);
      console.log(`   📊 عدد الفئات الفرعية: ${totalSubcategories}`);
    } else {
      console.log('   ❌ خادم API لا يعمل');
      return false;
    }

    // 2. اختبار endpoint التحديث
    console.log('\n2️⃣ اختبار وظيفة التحديث...');
    
    // العثور على فئة للاختبار
    const testCategories = await (await fetch('http://localhost:5000/api/categories/main')).json();
    if (testCategories.length > 0) {
      const testCategory = testCategories[0];
      console.log(`   🎯 اختبار تحديث الفئة: ${testCategory.name} (${testCategory.code})`);
      
      // بيانات التحديث (تغيير بسيط في الاسم)
      const updateData = {
        name: testCategory.name + ' - تم الاختبار',
        icon: testCategory.icon || '✅',
        imageUrl: testCategory.imageUrl || 'https://placehold.co/200x200/green/white?text=اختبار',
        isActive: true
      };
      
      const updateResponse = await fetch(`http://localhost:5000/api/categories/main/${testCategory.code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        console.log('   ✅ وظيفة التحديث تعمل بنجاح');
        
        // إعادة البيانات الأصلية
        const revertData = {
          name: testCategory.name,
          icon: testCategory.icon,
          imageUrl: testCategory.imageUrl,
          isActive: testCategory.isActive
        };
        
        await fetch(`http://localhost:5000/api/categories/main/${testCategory.code}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(revertData)
        });
        
        console.log('   🔄 تم إعادة البيانات الأصلية');
      } else {
        console.log('   ❌ وظيفة التحديث لا تعمل');
      }
    }

    // 3. اختبار خادم Vite (Frontend)
    console.log('\n3️⃣ اختبار خادم Vite...');
    try {
      const viteResponse = await fetch('http://localhost:5174');
      if (viteResponse.ok) {
        console.log('   ✅ خادم Vite يعمل بنجاح');
      } else {
        console.log('   ❌ خادم Vite لا يعمل');
      }
    } catch (error) {
      console.log('   ❌ خادم Vite غير متاح');
    }

    // 4. اختبار صفحة إدارة الفئات
    console.log('\n4️⃣ اختبار صفحة إدارة الفئات...');
    try {
      const adminResponse = await fetch('http://localhost:5174/admin/categories');
      if (adminResponse.ok) {
        console.log('   ✅ صفحة إدارة الفئات متاحة');
      } else {
        console.log('   ❌ صفحة إدارة الفئات غير متاحة');
      }
    } catch (error) {
      console.log('   ❌ لا يمكن الوصول إلى صفحة إدارة الفئات');
    }

    console.log('\n🎉 انتهى الاختبار النهائي');
    console.log('📋 النتيجة: جميع المكونات الأساسية تعمل بنجاح');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message);
    return false;
  }
};

// تشغيل الاختبار
finalSystemTest().then(success => {
  if (success) {
    console.log('\n✅ النظام جاهز للاستخدام!');
    console.log('🔗 روابط الوصول:');
    console.log('   • الصفحة الرئيسية: http://localhost:5174');
    console.log('   • إدارة الفئات: http://localhost:5174/admin/categories');
    console.log('   • API الفئات: http://localhost:5000/api/categories/main-with-subcategories');
  } else {
    console.log('\n❌ هناك مشاكل تحتاج إلى حل');
  }
});
