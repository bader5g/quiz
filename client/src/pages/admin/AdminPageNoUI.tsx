import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';

// نسخة من AdminPage بدون مكونات shadcn/ui
export default function AdminPageNoUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
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
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  const getPageTitle = () => {
    if (location === '/admin-no-ui') return 'لوحة التحكم';
    if (location === '/admin-no-ui/users') return 'إدارة المستخدمين';
    return 'لوحة التحكم';
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
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
        background: '#f8f9fa',
        padding: '16px',
        direction: 'rtl'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '28rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 24px 16px',
            background: '#007bff',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{
              height: '48px',
              width: '48px',
              margin: '0 auto 8px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              ⚙️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              لوحة تحكم الإدارة
            </h2>
            <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px', margin: 0 }}>
              تطبيق جاوب
            </p>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                كلمة المرور
              </label>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#007bff'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
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
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}              onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#0056b3'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#007bff'}
            >
              تسجيل الدخول
            </button>
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '16px'
            }}>
              <p>للوصول إلى لوحة التحكم، أدخل كلمة المرور الخاصة بالمسؤول</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Mobile Header */}
      <div style={{
        display: 'flex',
        height: '56px',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white'
      }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            {getPageTitle()}
          </h1>
          <Link href="/">
            <button style={{
              background: 'none',
              border: '1px solid #d1d5db',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              🏠 الرئيسية
            </button>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          position: sidebarOpen ? 'fixed' : 'relative',
          top: sidebarOpen ? 0 : 'auto',
          right: 0,
          zIndex: 50,
          display: 'flex',
          width: '288px',
          flexDirection: 'column',
          borderLeft: '1px solid #e5e7eb',
          background: 'white',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s',
          height: sidebarOpen ? '100vh' : 'auto'
        }}>
          <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                جاوب
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🚪
              </button>
            </div>
            
            <div style={{
              height: '1px',
              background: '#e5e7eb',
              margin: '16px 0'
            }}></div>
            
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '4px' }}>
                <Link href="/admin-no-ui">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '8px',
                    padding: '12px',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    background: location === '/admin-no-ui' ? '#007bff' : 'transparent',
                    color: location === '/admin-no-ui' ? 'white' : '#6b7280'
                  }}>
                    <span>📊</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      لوحة التحكم
                    </span>
                  </div>
                </Link>
              </div>
              
              <div style={{ marginBottom: '4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#6b7280'
                }}>
                  <span>👥</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    إدارة المستخدمين
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#6b7280'
                }}>
                  <span>📚</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    إدارة الفئات
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{
              height: '1px',
              background: '#e5e7eb',
              margin: '16px 0'
            }}></div>
            
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>🚪</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflow: 'auto'
        }}>
          <div style={{ padding: '16px 32px' }}>
            <Switch>
              <Route path="/admin-no-ui">
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: '#1f2937'
                  }}>
                    🎯 مرحباً بك في لوحة التحكم (بدون مكونات UI)
                  </h1>
                  
                  <div style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    ✅ <strong>نجح التحميل!</strong> هذه النسخة تعمل بدون مكونات shadcn/ui
                  </div>

                  <div style={{
                    background: '#eff6ff',
                    padding: '16px',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ marginBottom: '12px' }}>📋 إحصائيات النظام:</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>0</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>المستخدمين</div>
                      </div>
                      <div style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>0</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>الفئات</div>
                      </div>
                      <div style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>0</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>الأسئلة</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Route>
              <Route>
                <div>الصفحة غير موجودة</div>
              </Route>
            </Switch>
          </div>
        </main>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40
            }}
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
