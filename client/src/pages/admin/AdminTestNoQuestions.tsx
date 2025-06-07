import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { Button } from '../../components/ui/button';

// صفحة اختبار بسيطة لمعرفة إذا كانت المشكلة في QuestionsManagement
export default function AdminTestNoQuestions() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">🧪 اختبار لوحة التحكم</h1>
          <p className="text-center mb-4 text-gray-600">
            اختبار لمعرفة إذا كانت المشكلة في مجلد questions
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button className="w-full" onClick={handleLogin}>
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4 text-center">✅ لوحة التحكم تعمل!</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h2 className="font-bold text-green-800 mb-2">✅ النتيجة الإيجابية:</h2>
              <p className="text-green-700">
                إذا ظهرت هذه الصفحة بدون مشاكل، فإن المشكلة كانت في <strong>مجلد questions</strong>
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h2 className="font-bold text-red-800 mb-2">❌ النتيجة السلبية:</h2>
              <p className="text-red-700">
                إذا لم تظهر هذه الصفحة أو ظهرت صفحة بيضاء، فإن المشكلة في مكان آخر
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">📋 تشخيص محتمل:</h3>
            <ul className="text-blue-700 space-y-2">
              <li>• مشكلة في استيراد مكونات questions</li>
              <li>• خطأ في JavaScript يمنع تحميل المكونات</li>
              <li>• مشكلة في API calls في مجلد questions</li>
              <li>• تعارض في types أو interfaces</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Button 
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
              }}
              variant="outline"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
