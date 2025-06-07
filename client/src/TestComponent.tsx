import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h1 style={{ color: 'green' }}>✅ React يعمل بنجاح!</h1>
      <p>التاريخ: {new Date().toLocaleString('ar')}</p>
      <p>هذا اختبار بسيط للتأكد من عمل React بشكل صحيح</p>
    </div>
  );
};

export default TestComponent;
