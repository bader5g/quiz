import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Shield, Settings, User, Book, Edit, LogOut, BarChart3, Package, Globe } from 'lucide-react';
import { useSite } from '@/context/SiteContext';

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { siteSettings } = useSite();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAuthenticated(true);
    }
  }, []);

  // تسجيل الدخول للوحة التحكم
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // في النسخة المبدئية، نستخدم كلمة مرور ثابتة للتحقق
    // ملاحظة: هذه طريقة غير آمنة وينبغي استبدالها بنظام تحقق مناسب في الإنتاج
    if (password === 'admin123') {
      localStorage.setItem('adminToken', 'temp-token-' + Date.now());
      setIsAuthenticated(true);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحبًا بك في لوحة تحكم المدير',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: 'كلمة المرور غير صحيحة',
      });
    }
    
    setIsLoading(false);
  };

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'تم تسجيل خروجك من لوحة التحكم',
    });
  };

  // شاشة تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">لوحة تحكم المدير</CardTitle>
            <CardDescription>
              الرجاء إدخال كلمة المرور للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                />
              </div>
              <Button disabled={isLoading} className="w-full" type="submit">
                {isLoading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
              </Button>
              <div className="text-center text-sm text-muted-foreground mt-2">
                <Link href="/" className="hover:underline">
                  العودة للصفحة الرئيسية
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">لوحة تحكم المسؤول | {siteSettings?.appName}</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-5 w-5 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <div className="container px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* القائمة الجانبية */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-xl">أقسام الإدارة</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Button 
                    variant={activeTab === 'general' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('general')}
                  >
                    <Settings className="h-5 w-5 ml-2" />
                    الإعدادات العامة
                  </Button>
                  <Button 
                    variant={activeTab === 'site' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('site')}
                  >
                    <Globe className="h-5 w-5 ml-2" />
                    إعدادات الموقع
                  </Button>
                  <Button 
                    variant={activeTab === 'users' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('users')}
                  >
                    <User className="h-5 w-5 ml-2" />
                    إدارة المستخدمين
                  </Button>
                  <Button 
                    variant={activeTab === 'categories' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('categories')}
                  >
                    <Book className="h-5 w-5 ml-2" />
                    إدارة الفئات
                  </Button>
                  <Button 
                    variant={activeTab === 'questions' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('questions')}
                  >
                    <Edit className="h-5 w-5 ml-2" />
                    إدارة الأسئلة
                  </Button>
                  <Button 
                    variant={activeTab === 'gameSettings' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('gameSettings')}
                  >
                    <BarChart3 className="h-5 w-5 ml-2" />
                    إعدادات اللعبة
                  </Button>
                  <Button 
                    variant={activeTab === 'packages' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('packages')}
                  >
                    <Package className="h-5 w-5 ml-2" />
                    إدارة باقات البطاقات
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="space-y-6">
            {/* عنوان الصفحة الحالية */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeTab === 'general' && 'الإعدادات العامة'}
                {activeTab === 'site' && 'إعدادات الموقع'}
                {activeTab === 'users' && 'إدارة المستخدمين'}
                {activeTab === 'categories' && 'إدارة الفئات والتصنيفات'}
                {activeTab === 'questions' && 'إدارة الأسئلة والإجابات'}
                {activeTab === 'gameSettings' && 'إعدادات اللعبة'}
                {activeTab === 'packages' && 'إدارة باقات البطاقات'}
              </h2>
              <p className="text-muted-foreground">
                {activeTab === 'general' && 'إدارة الإعدادات العامة للتطبيق'}
                {activeTab === 'site' && 'تخصيص شكل ومظهر الموقع والمحتوى'}
                {activeTab === 'users' && 'إضافة وتعديل وإدارة المستخدمين'}
                {activeTab === 'categories' && 'إدارة تصنيفات وفئات الأسئلة'}
                {activeTab === 'questions' && 'إضافة وتعديل وإدارة الأسئلة والإجابات'}
                {activeTab === 'gameSettings' && 'ضبط إعدادات وقواعد اللعبة'}
                {activeTab === 'packages' && 'إدارة باقات البطاقات والعروض'}
              </p>
              <Separator className="my-4" />
            </div>

            {/* محتوى القسم الحالي */}
            <div>
              {activeTab === 'general' && <div>قسم الإعدادات العامة - قيد التطوير</div>}
              {activeTab === 'site' && <div>قسم إعدادات الموقع - قيد التطوير</div>}
              {activeTab === 'users' && <div>قسم إدارة المستخدمين - قيد التطوير</div>}
              {activeTab === 'categories' && <div>قسم إدارة الفئات - قيد التطوير</div>}
              {activeTab === 'questions' && <div>قسم إدارة الأسئلة - قيد التطوير</div>}
              {activeTab === 'gameSettings' && <div>قسم إعدادات اللعبة - قيد التطوير</div>}
              {activeTab === 'packages' && <div>قسم إدارة باقات البطاقات - قيد التطوير</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}