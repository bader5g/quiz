import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

/**
 * A mock login button for development purposes
 * In a real application, this would be replaced with a proper login form
 */
export default function LoginButton() {
  const { isAuthenticated, logoutMutation, loginMutation } = useAuth();
  const { toast } = useToast();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await logoutMutation.mutateAsync();
    } else {
      // في تطبيق حقيقي، سيتم توجيه المستخدم إلى صفحة تسجيل الدخول
      // هذا مجرد تنفيذ مؤقت للاختبار
      try {
        await loginMutation.mutateAsync({
          username: "مستخدم",
          password: "Password1!"
        });
      } catch (error) {
        console.error("خطأ في تسجيل الدخول:", error);
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "حدث خطأ أثناء محاولة تسجيل الدخول",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Button 
      onClick={handleAuth}
      variant={isAuthenticated ? "outline" : "default"}
    >
      {isAuthenticated ? "تسجيل الخروج" : "تسجيل دخول تجريبي"}
    </Button>
  );
}