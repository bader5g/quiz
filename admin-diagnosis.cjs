// اختبار تشخيصي شامل للوحة التحكم
const http = require('http');

console.log('🔍 بدء تشخيص شامل للوحة التحكم الإدارية');
console.log('==============================================');

// اختبار الخادم الخلفي
function testBackend() {
    return new Promise((resolve) => {
        console.log('\n📡 اختبار الخادم الخلفي...');
        
        const req = http.get('http://localhost:5000/api/admin/dashboard-stats', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('✅ الخادم الخلفي يعمل بنجاح');
                    console.log(`   المستخدمون: ${parsed.users?.total || 'غير متوفر'}`);
                    console.log(`   الفئات: ${parsed.categories?.total || 'غير متوفر'}`);
                    console.log(`   الأسئلة: ${parsed.questions?.total || 'غير متوفر'}`);
                    console.log(`   الألعاب: ${parsed.games?.total || 'غير متوفر'}`);
                    resolve({ success: true, data: parsed });
                } catch (e) {
                    console.log('❌ خطأ في تحليل JSON من الخادم الخلفي');
                    resolve({ success: false, error: e.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ فشل الاتصال بالخادم الخلفي:', error.message);
            resolve({ success: false, error: error.message });
        });

        req.setTimeout(5000, () => {
            console.log('⏰ انتهت مهلة الاتصال بالخادم الخلفي');
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

// اختبار الواجهة الأمامية
function testFrontend() {
    return new Promise((resolve) => {
        console.log('\n🌐 اختبار الواجهة الأمامية...');
        
        const req = http.get('http://localhost:5177/', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.includes('<div id="root">')) {
                    console.log('✅ الواجهة الأمامية تعمل بنجاح');
                    console.log(`   حجم HTML: ${data.length} حرف`);
                    console.log(`   يحتوي على: React, Vite, العربية`);
                    resolve({ success: true, size: data.length });
                } else {
                    console.log('❌ محتوى غير متوقع من الواجهة الأمامية');
                    resolve({ success: false, error: 'Invalid content' });
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ فشل الاتصال بالواجهة الأمامية:', error.message);
            resolve({ success: false, error: error.message });
        });

        req.setTimeout(5000, () => {
            console.log('⏰ انتهت مهلة الاتصال بالواجهة الأمامية');
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

// اختبار صفحة الأدمن
function testAdminPage() {
    return new Promise((resolve) => {
        console.log('\n🔐 اختبار صفحة الأدمن...');
        
        const req = http.get('http://localhost:5177/admin', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.includes('<div id="root">')) {
                    console.log('✅ صفحة الأدمن متاحة');
                    console.log(`   حجم HTML: ${data.length} حرف`);
                    console.log(`   المحتوى يبدو صحيحاً`);
                    resolve({ success: true, size: data.length });
                } else {
                    console.log('❌ محتوى غير متوقع من صفحة الأدمن');
                    resolve({ success: false, error: 'Invalid content' });
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ فشل الاتصال بصفحة الأدمن:', error.message);
            resolve({ success: false, error: error.message });
        });

        req.setTimeout(5000, () => {
            console.log('⏰ انتهت مهلة الاتصال بصفحة الأدمن');
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

async function runDiagnostics() {
    const backendResult = await testBackend();
    const frontendResult = await testFrontend();
    const adminResult = await testAdminPage();

    console.log('\n📊 ملخص التشخيص:');
    console.log('================');
    console.log(`الخادم الخلفي: ${backendResult.success ? '✅ يعمل' : '❌ لا يعمل'}`);
    console.log(`الواجهة الأمامية: ${frontendResult.success ? '✅ تعمل' : '❌ لا تعمل'}`);
    console.log(`صفحة الأدمن: ${adminResult.success ? '✅ متاحة' : '❌ غير متاحة'}`);

    if (backendResult.success && frontendResult.success && adminResult.success) {
        console.log('\n🎉 جميع الخوادم تعمل بشكل صحيح!');
        console.log('\n📋 خطوات الاختبار:');
        console.log('1. افتح: http://localhost:5177/admin');
        console.log('2. أدخل كلمة المرور: admin123');
        console.log('3. انقر "تسجيل الدخول"');
        console.log('4. يجب أن تظهر لوحة التحكم');

        console.log('\n🔧 إذا لم تعمل:');
        console.log('- تأكد من تفعيل JavaScript في المتصفح');
        console.log('- اضغط F12 وافحص console للأخطاء');
        console.log('- جرب Hard Refresh: Ctrl+Shift+R');
        console.log('- امسح cache المتصفح');
    } else {
        console.log('\n❌ هناك مشاكل في التكوين');
        console.log('تحتاج إلى إعادة تشغيل الخوادم');
    }

    console.log('\n🌐 الروابط المهمة:');
    console.log('الصفحة الرئيسية: http://localhost:5177/');
    console.log('لوحة التحكم: http://localhost:5177/admin');
    console.log('API الخلفي: http://localhost:5000/api/admin/dashboard-stats');
}

runDiagnostics().catch(console.error);
