const fs = require('fs');
const path = require('path');

// مسار ملف السجلات
const logFilePath = path.join(__dirname, 'monitor-logs.json');

console.log('🔍 مراقب السجلات - بدء المراقبة...');
console.log('📁 مسار ملف السجلات:', logFilePath);

let lastSize = 0;
let lastRequestCount = 0;
let lastErrorCount = 0;

function parseLogsFile() {
    try {
        const data = fs.readFileSync(logFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ خطأ في قراءة ملف السجلات:', error.message);
        return null;
    }
}

function displayStats(logs) {
    if (!logs) return;

    const currentRequestCount = logs.requests ? logs.requests.length : 0;
    const currentErrorCount = logs.errors ? logs.errors.length : 0;
    const sessionDuration = logs.statistics ? logs.statistics.sessionDuration : 0;

    console.log('\n📊 إحصائيات الجلسة الحالية:');
    console.log(`   📈 إجمالي الطلبات: ${currentRequestCount}`);
    console.log(`   ❌ إجمالي الأخطاء: ${currentErrorCount}`);
    console.log(`   ⏱️  مدة الجلسة: ${Math.floor(sessionDuration / 1000)} ثانية`);

    // عرض الطلبات الجديدة
    if (currentRequestCount > lastRequestCount) {
        console.log('\n🆕 طلبات جديدة:');
        for (let i = lastRequestCount; i < currentRequestCount; i++) {
            const request = logs.requests[i];
            const timestamp = new Date(request.timestamp).toLocaleTimeString('ar-SA');
            console.log(`   [${timestamp}] ${request.message} - ${request.data.userAgent.split(' ')[0]}`);
        }
    }

    // عرض الأخطاء الجديدة
    if (currentErrorCount > lastErrorCount) {
        console.log('\n🚨 أخطاء جديدة:');
        for (let i = lastErrorCount; i < currentErrorCount; i++) {
            const error = logs.errors[i];
            const timestamp = new Date(error.timestamp).toLocaleTimeString('ar-SA');
            console.log(`   [${timestamp}] خطأ: ${error.message}`);
        }
    }

    lastRequestCount = currentRequestCount;
    lastErrorCount = currentErrorCount;
}

function displayLatestActivity(logs) {
    if (!logs || !logs.requests || logs.requests.length === 0) return;

    const latestRequest = logs.requests[logs.requests.length - 1];
    const timestamp = new Date(latestRequest.timestamp).toLocaleTimeString('ar-SA');
    console.log(`\n🕐 آخر نشاط: [${timestamp}] ${latestRequest.message}`);
}

function monitorLogs() {
    try {
        const stats = fs.statSync(logFilePath);
        const currentSize = stats.size;

        if (currentSize !== lastSize) {
            console.log('\n🔄 تم اكتشاف تغيير في ملف السجلات...');
            
            const logs = parseLogsFile();
            displayStats(logs);
            displayLatestActivity(logs);
            
            lastSize = currentSize;
        }
    } catch (error) {
        console.error('❌ خطأ في مراقبة الملف:', error.message);
    }
}

// عرض الحالة الأولية
console.log('\n📋 قراءة الحالة الأولية...');
const initialLogs = parseLogsFile();
displayStats(initialLogs);

// بدء المراقبة كل ثانيتين
console.log('\n⏰ بدء المراقبة التلقائية (كل ثانيتين)...');
setInterval(monitorLogs, 2000);

// التعامل مع إنهاء البرنامج
process.on('SIGINT', () => {
    console.log('\n\n👋 إنهاء مراقبة السجلات...');
    process.exit(0);
});

console.log('\n✅ مراقب السجلات جاهز! اضغط Ctrl+C للإنهاء');
console.log('💡 نصيحة: قم بإجراء بعض الطلبات عبر http://localhost:3001 لرؤية النشاط');
