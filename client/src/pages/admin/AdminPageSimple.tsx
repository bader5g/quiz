import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';

// نسخة مبسطة من AdminPage بدون SiteContext
export default function AdminPageSimple() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem('adminAuth') === 'true';
      setIsAuthenticated(isLoggedIn);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      alert('تم تسجيل الدخول بنجاح');
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    alert('تم تسجيل الخروج بنجاح');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #007bff',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: '20px',
        direction: 'rtl'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '30px 20px 20px',
            background: '#007bff',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              margin: '0 auto 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⚙️
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '20px' }}>لوحة تحكم الإدارة</h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>تطبيق جاوب - النسخة المبسطة</p>
          </div>
          
          <div style={{ padding: '30px 20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                كلمة المرور
              </label>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              تسجيل الدخول
            </button>
            
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#666'
            }}>
              <p>كلمة المرور: <strong>admin123</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      direction: 'rtl',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* القائمة الجانبية */}
      <aside style={{
        width: '250px',
        background: 'white',
        borderLeft: '1px solid #e5e5e5',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px'
        }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>جاوب</span>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            خروج
          </button>
        </div>
        
        <nav>
          <div style={{ marginBottom: '15px' }}>
            <Link href="/admin-simple">
              <div style={{
                padding: '10px',
                background: '#e3f2fd',
                borderRadius: '5px',
                cursor: 'pointer',
                color: '#007bff'
              }}>
                📊 لوحة التحكم
              </div>
            </Link>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '5px',
              color: '#666'
            }}>
              👥 إدارة المستخدمين
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '5px',
              color: '#666'
            }}>
              📚 إدارة الفئات
            </div>
          </div>
        </nav>
      </aside>

      {/* المحتوى الرئيسي */}
      <main style={{
        flex: 1,
        padding: '30px',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            margin: '0 0 20px',
            color: '#333',
            fontSize: '24px'
          }}>
            🎉 مرحباً بك في لوحة التحكم المبسطة
          </h1>
          
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            ✅ <strong>نجح تسجيل الدخول!</strong> لوحة التحكم تعمل بدون مشاكل
          </div>

          <div style={{
            background: '#e3f2fd',
            padding: '20px',
            borderRadius: '5px'
          }}>
            <h3>📋 معلومات النظام:</h3>
            <ul>
              <li>✅ React: يعمل بشكل طبيعي</li>
              <li>✅ التوجيه (wouter): يعمل بشكل طبيعي</li>
              <li>✅ localStorage: يعمل بشكل طبيعي</li>
              <li>✅ المصادقة: تعمل بشكل طبيعي</li>
              <li>✅ CSS والتصميم: يعمل بشكل طبيعي</li>
            </ul>
            
            <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              <strong>استنتاج:</strong> إذا رأيت هذه الصفحة، فالمشكلة في النسخة الأصلية 
              قد تكون بسبب مكونات UI المعقدة أو SiteContext أو مكتبات أخرى.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
