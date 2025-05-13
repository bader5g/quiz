import React from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

/**
 * A mock login button for development purposes
 * In a real application, this would be replaced with a proper login form
 */
export default function LoginButton() {
  const { isAuthenticated, login, logout } = useUser();
  const { toast } = useToast();

  const handleAuth = () => {
    if (isAuthenticated) {
      logout();
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح من حسابك"
      });
    } else {
      // Mock user data - in a real app this would come from a login form and API
      login({
        id: 1,
        username: "مستخدم"
      });
      toast({
        title: "تم تسجيل الدخول",
        description: "تم تسجيل دخولك بنجاح"
      });
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