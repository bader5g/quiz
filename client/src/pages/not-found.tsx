import { Card, CardContent } from "../components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import Layout from "../components/layout/Layout";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  
  return (
    <Layout>
      <div className="min-h-[80vh] w-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center mb-4 gap-2">
              <AlertCircle className="h-16 w-16 text-red-500 mb-2" />
              <h1 className="text-2xl font-bold text-gray-900">404 - الصفحة غير موجودة</h1>
            </div>

            <p className="mt-4 mb-6 text-md text-gray-600">
              عذراً، الصفحة التي تبحث عنها غير متوفرة.
            </p>
            
            <Button 
              onClick={() => navigate('/')}
              className="px-6"
            >
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
