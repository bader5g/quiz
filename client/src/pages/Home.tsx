import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
}

interface CategoryParent {
  id: number;
  name: string;
  icon: string;
  children: CategoryChild[];
}

export default function Home() {
  const [categories, setCategories] = useState<CategoryParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.get('/api/categories-with-children');
      setCategories(res.data);
      setLoading(false);
    } catch (err) {
      console.error("فشل تحميل الفئات", err);
      setError("حدث خطأ أثناء تحميل الفئات، يرجى المحاولة مرة أخرى");
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-sky-50 p-6 relative">
      {/* أزرار التسجيل */}
      <div className="absolute top-4 left-6 flex gap-4">
        <button 
          onClick={() => navigate('/login')} 
          className="text-blue-600 hover:text-blue-800 transition-colors hover:underline font-medium"
        >
          تسجيل الدخول
        </button>
        <button 
          onClick={() => navigate('/register')} 
          className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-4 py-1 rounded-full font-medium"
        >
          إنشاء حساب
        </button>
      </div>

      {/* الشعار والنص */}
      <div className="text-center pt-8 md:pt-12 pb-8">
        <h1 className="text-6xl md:text-7xl font-extrabold text-blue-700 mb-3 mt-10">جاوب</h1>
        <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-2xl mx-auto">اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!</p>
      </div>

      {/* عرض الفئات */}
      <div className="flex-grow">
        {loading ? (
          <div className="space-y-10 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-40" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-4">
                  <Button variant="outline" onClick={fetchCategories}>
                    إعادة المحاولة
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-12 max-w-6xl mx-auto">
            {categories.map((parent) => (
              <div key={parent.id} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center justify-center gap-2">
                  <span className="text-3xl">{parent.icon}</span>
                  <span>{parent.name}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {parent.children.map((child) => (
                    <div 
                      key={child.id} 
                      className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 flex flex-col items-center"
                      onClick={() => navigate(`/categories/${child.id}`)}
                    >
                      <div className="text-3xl mb-3 transition-transform category-icon">{child.icon}</div>
                      <div className="text-gray-800 font-medium text-center">{child.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* زر بدء اللعبة */}
      <div className="text-center py-10 pb-14">
        <Button
          onClick={() => navigate('/categories')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          size="lg"
        >
          ابدأ اللعب
        </Button>
      </div>
    </div>
  );
}
