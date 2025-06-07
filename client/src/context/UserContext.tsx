import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from "./hooks/use-auth";

interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, loginMutation, logoutMutation } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // استخدام بيانات المستخدم من نظام المصادقة AuthProvider
  useEffect(() => {
    if (authUser) {
      // تحويل بيانات المستخدم من AuthProvider إلى النموذج المطلوب
      const formattedUser: User = {
        id: authUser.id,
        username: authUser.username,
        // إضافة حقول إضافية إذا كانت متوفرة في authUser
      };
      
      setUser(formattedUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(formattedUser));
    } else {
      // تحقق من وجود بيانات في التخزين المحلي
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [authUser]);
  
  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // تحديث بيانات المستخدم دون إعادة تسجيل الدخول
  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
