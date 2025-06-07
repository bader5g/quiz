import React from 'react';

// صفحة admin مبسطة للاختبار
export default function SimpleAdminTest() {
  return (
    <div style={{ 
      padding: '20px', 
      direction: 'rtl', 
      fontFamily: 'Arial, sans-serif',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#007bff', margin: '0 0 20px 0' }}>
          🎯 اختبار لوحة التحكم المبسط
        </h1>
        
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ✅ <strong>نجح التحميل!</strong> إذا رأيت هذه الرسالة، فإن React يعمل بشكل صحيح
        </div>

        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>📋 معلومات الاختبار:</h3>
          <ul>
            <li>التاريخ: {new Date().toLocaleDateString('ar-SA')}</li>
            <li>الوقت: {new Date().toLocaleTimeString('ar-SA')}</li>
            <li>المسار: {window.location.pathname}</li>
            <li>المضيف: {window.location.host}</li>
          </ul>
        </div>

        <div style={{ 
          background: '#fff3cd', 
          color: '#856404', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>🔧 حالة النظام:</h3>
          <p>✅ React: يعمل</p>
          <p>✅ JavaScript: يعمل</p>
          <p>✅ CSS: يعمل</p>
          <p>✅ العربية: تعمل بشكل صحيح</p>
        </div>

        <button 
          onClick={() => alert('الأزرار تعمل بشكل صحيح!')}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          اختبار التفاعل
        </button>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>
            <strong>الخطوة التالية:</strong> إذا رأيت هذه الصفحة بدون مشاكل، 
            فالمشكلة ليست في React أو JavaScript الأساسي.
          </p>
        </div>
      </div>
    </div>
  );
}
