import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// تعريف نوع SiteSettings
interface SiteSettings {
  id: number;
  logoUrl: string;
  appName: string;
  faviconUrl: string;
  modalStyle: string;
  createdAt: string;
  updatedAt: string;
}

interface SiteContextType {
  siteSettings: SiteSettings | null;
  isLoading: boolean;
  error: Error | null;
  getModalClass: () => string;
}

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  // استخدم إعدادات افتراضية فوراً لتجنب مشاكل التحميل
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>({
    id: 1,
    logoUrl: '',
    appName: 'جاوب',
    faviconUrl: '',
    modalStyle: 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<SiteSettings>('/api/site-settings');
        setSiteSettings(response.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        console.warn('Could not fetch site settings, using defaults:', err);
        // Keep default settings if API fails - no need to set again
      } finally {
        setIsLoading(false);
      }
    };

    // Don't block the UI, fetch in background
    fetchSiteSettings();
  }, []);

  // دالة لإرجاع فئة CSS الخاصة بالمودال استناداً لقيمة modalStyle
  const getModalClass = (): string => {
    if (!siteSettings) return 'bg-white shadow-md'; // التصميم الافتراضي إذا لم تكن الإعدادات متاحة

    const { modalStyle } = siteSettings;
    
    switch (modalStyle) {
      case 'glass':
        return 'bg-white/30 backdrop-blur-xl shadow-xl';
      case 'dark':
        return 'bg-gray-900 text-white shadow-lg';
      case 'bordered':
        return 'border border-blue-500 shadow-md';
      case 'custom-1':
        return 'bg-gradient-to-br from-blue-500 to-purple-600 text-white';
      default:
        return 'bg-white shadow-md'; // default
    }
  };

  return (
    <SiteContext.Provider
      value={{
        siteSettings,
        isLoading,
        error,
        getModalClass
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
