import React, { useState } from 'react';

// صفحة اختبار تدريجي لمعرفة سبب المشكلة
export default function AdminDebugTest() {
  const [testStage, setTestStage] = useState(1);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string, isError = false) => {
    setResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`]);
  };

  const testStage1 = () => {
    addResult('React والـ State يعملان بشكل صحيح');
    setTestStage(2);
  };

  const testStage2 = () => {
    try {
      // اختبار localStorage
      localStorage.setItem('test', 'value');
      const value = localStorage.getItem('test');
      if (value === 'value') {
        addResult('localStorage يعمل بشكل صحيح');
      }
      localStorage.removeItem('test');
      
      // اختبار useLocation من wouter
      const location = window.location.pathname;
      addResult(`التوجيه يعمل - المسار الحالي: ${location}`);
      
      setTestStage(3);
    } catch (error) {
      addResult(`خطأ في الاختبار الأساسي: ${error}`, true);
    }
  };

  const testStage3 = () => {
    try {
      // اختبار استيراد مكونات UI
      import('../../components/ui/button').then(() => {
        addResult('مكونات UI متاحة');
        setTestStage(4);
      }).catch((error) => {
        addResult(`خطأ في تحميل مكونات UI: ${error}`, true);
      });
    } catch (error) {
      addResult(`خطأ في استيراد المكونات: ${error}`, true);
    }
  };

  const testStage4 = () => {
    try {
      // اختبار SiteContext
      import('../../context/SiteContext').then((module) => {
        addResult('SiteContext متاح للاستيراد');
        setTestStage(5);
      }).catch((error) => {
        addResult(`خطأ في تحميل SiteContext: ${error}`, true);
      });
    } catch (error) {
      addResult(`خطأ في SiteContext: ${error}`, true);
    }
  };

  const testStage5 = () => {
    try {
      // اختبار useToast
      import('../../hooks/use-toast').then(() => {
        addResult('useToast متاح');
        setTestStage(6);
      }).catch((error) => {
        addResult(`خطأ في تحميل useToast: ${error}`, true);
      });
    } catch (error) {
      addResult(`خطأ في useToast: ${error}`, true);
    }
  };

  const testStage6 = () => {
    addResult('جميع الاختبارات مكتملة - المشكلة قد تكون في التفاعل بين المكونات');
  };

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
          🔍 تشخيص مشكلة لوحة التحكم
        </h1>

        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>المرحلة الحالية: {testStage}/6</h3>
          <p>
            {testStage === 1 && 'اختبار React الأساسي'}
            {testStage === 2 && 'اختبار localStorage والتوجيه'}
            {testStage === 3 && 'اختبار مكونات UI'}
            {testStage === 4 && 'اختبار SiteContext'}
            {testStage === 5 && 'اختبار useToast'}
            {testStage === 6 && 'مكتمل'}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          {testStage === 1 && (
            <button onClick={testStage1} style={{
              background: '#28a745', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
            }}>
              اختبار React
            </button>
          )}
          {testStage === 2 && (
            <button onClick={testStage2} style={{
              background: '#007bff', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
            }}>
              اختبار localStorage والتوجيه
            </button>
          )}
          {testStage === 3 && (
            <button onClick={testStage3} style={{
              background: '#6f42c1', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
            }}>
              اختبار مكونات UI
            </button>
          )}
          {testStage === 4 && (
            <button onClick={testStage4} style={{
              background: '#fd7e14', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
            }}>
              اختبار SiteContext
            </button>
          )}
          {testStage === 5 && (
            <button onClick={testStage5} style={{
              background: '#20c997', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
            }}>
              اختبار useToast
            </button>
          )}
          {testStage === 6 && (
            <button onClick={testStage6} style={{
              background: '#dc3545', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
            }}>
              إنهاء الاختبار
            </button>
          )}
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h3>نتائج الاختبار:</h3>
          {results.length === 0 ? (
            <p style={{ color: '#666' }}>لم تبدأ الاختبارات بعد...</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {results.map((result, index) => (
                <li key={index} style={{ 
                  padding: '5px 0', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {result}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>
            <strong>الهدف:</strong> تحديد النقطة التي تفشل فيها لوحة التحكم الأصلية
          </p>
        </div>
      </div>
    </div>
  );
}
