// فحص مباشر لقاعدة البيانات لرؤية الفئات المحفوظة
const axios = require('axios');

async function checkDatabaseDirectly() {
  try {
    console.log('🔍 فحص مباشر لقاعدة البيانات...\n');

    // 1. إنشاء لعبة جديدة أولاً
    console.log('1️⃣ إنشاء لعبة جديدة...');
    const gameData = {
      gameName: "فحص قاعدة البيانات",
      teams: [
        { name: "فريق الأول", score: 0 },
        { name: "فريق الثاني", score: 0 }
      ],
      selectedCategories: [5, 12], // فئات محددة للاختبار
      answerTimes: { first: 30, second: 15 }
    };

    const createResponse = await axios.post('http://localhost:5000/api/create-game', gameData);
    
    if (createResponse.status !== 200) {
      console.log('❌ فشل في إنشاء اللعبة');
      return;
    }

    const gameId = createResponse.data.gameId;
    console.log(`✅ تم إنشاء اللعبة بنجاح - ID: ${gameId}`);
    
    // 2. استعلام مباشر على قاعدة البيانات
    console.log('2️⃣ فحص البيانات المحفوظة...');
    
    // محاولة الوصول لـ endpoint خاص بفحص البيانات الخام
    try {
      const rawDataResponse = await axios.get(`http://localhost:5000/api/debug/game/${gameId}`);
      console.log('📊 البيانات الخام من قاعدة البيانات:');
      console.log(JSON.stringify(rawDataResponse.data, null, 2));
    } catch (debugError) {
      console.log('⚠️  لا يوجد endpoint للفحص المباشر، سننشئه...');
      
      // جلب تفاصيل اللعبة العادية لرؤية المشكلة
      const gameDetailsResponse = await axios.get(`http://localhost:5000/api/games/${gameId}`);
      console.log('📊 البيانات من getGameDetails:');
      console.log(JSON.stringify(gameDetailsResponse.data, null, 2));
    }

  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.response?.data || error.message);
  }
}

checkDatabaseDirectly();
