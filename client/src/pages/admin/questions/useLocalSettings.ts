import React, { useState } from "react";

interface LocalSettings {
  theme: string;
  layout: "compact" | "comfortable" | "spacious";
  showPreview: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
  rightToLeft: boolean;
  autoSave: boolean;
  confirmDelete: boolean;
  itemsPerPage: number;
}

const defaultSettings: LocalSettings = {
  theme: "default",
  layout: "comfortable",
  showPreview: true,
  animationsEnabled: true,
  highContrast: false,
  rightToLeft: true,
  autoSave: true,
  confirmDelete: true,
  itemsPerPage: 20
};

export default function useLocalSettings() {
  const [settings, setSettings] = useState<LocalSettings>(() => {
    try {
      const saved = localStorage.getItem('questions-management-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = (newSettings: Partial<LocalSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem('questions-management-settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem('questions-management-settings');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
}
