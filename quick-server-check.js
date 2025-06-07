// فحص بسيط للاتصال بـ fetch
async function quickCheck() {
  try {
    console.log('🔍 محاولة الوصول للخادم...');
    
    // فحص إذا كان الخادم يعمل
    const response = await fetch('http://localhost:5000/', {
      method: 'GET',
      timeout: 5000
    });
    
    console.log('✅ الخادم يعمل على المنفذ 5000');
    console.log(`📊 حالة الاستجابة: ${response.status}`);
    
    // جربم محاولة الوصول لـ API الأسئلة
    try {
      const questionsResponse = await fetch('http://localhost:5000/api/questions-simple/stats', {
        method: 'GET',
        timeout: 5000
      });
      
      if (questionsResponse.ok) {
        const stats = await questionsResponse.json();
        console.log('✅ API الأسئلة يعمل!');
        console.log('📈 إحصائيات الأسئلة:', stats);
      } else {
        console.log('⚠️ API الأسئلة لا يستجيب بشكل صحيح');
      }
    } catch (apiError) {
      console.log('❌ لا يمكن الوصول لـ API الأسئلة');
    }
    
  } catch (error) {
    console.log('❌ الخادم غير متاح على المنفذ 5000');
    console.log('💡 تأكد من تشغيل الخادم بالأمر: npm run dev');
  }
}

quickCheck();
