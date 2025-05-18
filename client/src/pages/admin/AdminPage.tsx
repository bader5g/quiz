import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Dashboard from './Dashboard';
import UserManagement from './sections/UserManagement';
import CategoriesManagement from './sections/CategoriesManagement';
import QuestionsManagement from './sections/QuestionsManagement';
import GameSettingsManagement from './sections/GameSettingsManagement';
import PackagesManagement from './sections/PackagesManagement';
import LevelsManagement from './sections/LevelsManagement';

import {
  Users,
  BookText,
  HelpCircle,
  Crown,
  Package,
  Settings,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  SlidersHorizontal,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSite } from '@/context/SiteContext';

// مكون عنصر القائمة الجانبية
interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, title, href, isActive }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all cursor-pointer",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
    </Link>
  );
};

// مكون هيدر الموبايل
interface MobileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
}

const MobileHeader = ({ sidebarOpen, setSidebarOpen, title }: MobileHeaderProps) => {
  return (
    <div className="flex h-14 items-center px-4 border-b lg:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        className="ml-2" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">{title}</h1>
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Home className="h-4 w-4 ml-1" />
            <span className="text-xs">الرئيسية</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

// الصفحة الرئيسية للوحة التحكم
export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const { siteSettings } = useSite();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('adminAuth') === 'true';
      setIsAuthenticated(isLoggedIn);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // دالة تسجيل الدخول
  const handleLogin = () => {
    // كلمة مرور بسيطة للتجريب (في الإنتاج، يجب استخدام نظام تسجيل دخول أكثر أمانًا)
    if (password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحبًا بك في لوحة التحكم',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: 'كلمة المرور غير صحيحة',
      });
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    toast({
      title: 'تم تسجيل الخروج بنجاح',
      description: 'تم تسجيل خروجك من لوحة التحكم',
    });
  };

  // تحديد العنوان الحالي
  const getPageTitle = () => {
    if (location === '/admin') return 'لوحة التحكم';
    if (location === '/admin/users') return 'إدارة المستخدمين';
    if (location === '/admin/categories') return 'إدارة الفئات';
    if (location === '/admin/questions') return 'إدارة الأسئلة';
    if (location === '/admin/game-settings') return 'إعدادات اللعبة';
    if (location === '/admin/packages') return 'إدارة الباقات';
    if (location === '/admin/levels') return 'إدارة المستويات';
    return 'لوحة التحكم';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // إذا لم يكن متصلاً، عرض صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 pb-4 bg-primary text-white text-center">
            <SlidersHorizontal className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">لوحة تحكم الإدارة</h2>
            <p className="text-sm opacity-80 mt-1">
              {siteSettings?.appName || 'تطبيق جاوب'}
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button className="w-full" onClick={handleLogin}>
                تسجيل الدخول
              </Button>
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>للوصول إلى لوحة التحكم، أدخل كلمة المرور الخاصة بالمسؤول</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        title={getPageTitle()} 
      />

      <div className="flex flex-1">
        {/* القائمة الجانبية */}
        <aside 
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l bg-white transition-transform lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {siteSettings?.appName || 'جاوب'}
              </span>
              <Button 
                variant="outline" 
                size="icon"
                className="hidden lg:flex"
                onClick={() => handleLogout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <Separator className="my-4" />
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                <SidebarItem
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  title="لوحة التحكم"
                  href="/admin"
                  isActive={location === '/admin'}
                />
                <SidebarItem
                  icon={<Users className="h-5 w-5" />}
                  title="إدارة المستخدمين"
                  href="/admin/users"
                  isActive={location === '/admin/users'}
                />
                <SidebarItem
                  icon={<BookText className="h-5 w-5" />}
                  title="إدارة الفئات"
                  href="/admin/categories"
                  isActive={location === '/admin/categories'}
                />
                <SidebarItem
                  icon={<HelpCircle className="h-5 w-5" />}
                  title="إدارة الأسئلة"
                  href="/admin/questions"
                  isActive={location === '/admin/questions'}
                />
                <SidebarItem
                  icon={<Settings className="h-5 w-5" />}
                  title="إعدادات اللعبة"
                  href="/admin/game-settings"
                  isActive={location === '/admin/game-settings'}
                />
                <SidebarItem
                  icon={<Package className="h-5 w-5" />}
                  title="إدارة الباقات"
                  href="/admin/packages"
                  isActive={location === '/admin/packages'}
                />
                <SidebarItem
                  icon={<Crown className="h-5 w-5" />}
                  title="إدارة المستويات"
                  href="/admin/levels"
                  isActive={location === '/admin/levels'}
                />
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <div className="flex items-center">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main 
          className={cn(
            "flex-1 overflow-auto",
            sidebarOpen && "lg:pr-72"
          )}
        >
          <div className="container p-4 md:p-8">
            <Switch>
              <Route path="/admin" component={Dashboard} />
              <Route path="/admin/users" component={UserManagement} />
              <Route path="/admin/categories" component={CategoriesManagement} />
              <Route path="/admin/questions" component={QuestionsManagement} />
              <Route path="/admin/game-settings" component={GameSettingsManagement} />
              <Route path="/admin/packages" component={PackagesManagement} />
              <Route path="/admin/levels" component={LevelsManagement} />
            </Switch>
          </div>
        </main>

        {/* طبقة الخلفية عند فتح القائمة في الموبايل */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
}