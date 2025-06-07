import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Separator } from "../../../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Palette, Monitor, Smartphone, Eye, EyeOff, RefreshCw } from "lucide-react";

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  preview: string;
}

interface UISettings {
  theme: string;
  layout: "compact" | "comfortable" | "spacious";
  showPreview: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
  rightToLeft: boolean;
}

interface EnhancedUIProps {
  settings: UISettings;
  onSettingsChange: (settings: UISettings) => void;
}

const themes: Theme[] = [
  {
    id: "default",
    name: "الافتراضي",
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#1f2937"
    },
    preview: "bg-gradient-to-r from-blue-500 to-blue-600"
  },
  {
    id: "dark",
    name: "الداكن",
    colors: {
      primary: "#60a5fa",
      secondary: "#94a3b8",
      accent: "#fbbf24",
      background: "#1f2937",
      text: "#f9fafb"
    },
    preview: "bg-gradient-to-r from-gray-800 to-gray-900"
  },
  {
    id: "islamic",
    name: "إسلامي",
    colors: {
      primary: "#059669",
      secondary: "#6b7280",
      accent: "#d97706",
      background: "#f0fdf4",
      text: "#065f46"
    },
    preview: "bg-gradient-to-r from-green-600 to-emerald-600"
  },
  {
    id: "elegant",
    name: "أنيق",
    colors: {
      primary: "#7c3aed",
      secondary: "#9ca3af",
      accent: "#ec4899",
      background: "#fafaf9",
      text: "#374151"
    },
    preview: "bg-gradient-to-r from-purple-600 to-pink-600"
  }
];

export default function EnhancedUI({ settings, onSettingsChange }: EnhancedUIProps) {
  const [currentSettings, setCurrentSettings] = useState<UISettings>(settings);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof UISettings, value: any) => {
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const getCurrentTheme = () => {
    return themes.find(theme => theme.id === currentSettings.theme) || themes[0];
  };

  const getLayoutDescription = (layout: string) => {
    switch (layout) {
      case "compact": return "مضغوط - مساحة أقل بين العناصر";
      case "comfortable": return "مريح - تباعد متوسط";
      case "spacious": return "واسع - مساحة أكبر بين العناصر";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            واجهة المستخدم المحسنة
          </CardTitle>
          <CardDescription>
            خصص مظهر وتخطيط واجهة إدارة الأسئلة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="theme" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="theme">الثيمات</TabsTrigger>
              <TabsTrigger value="layout">التخطيط</TabsTrigger>
              <TabsTrigger value="display">العرض</TabsTrigger>
              <TabsTrigger value="accessibility">إمكانية الوصول</TabsTrigger>
            </TabsList>

            <TabsContent value="theme" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">اختيار الثيم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                        currentSettings.theme === theme.id
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleSettingChange("theme", theme.id)}
                    >
                      <div className={`h-20 rounded-md mb-3 ${theme.preview}`} />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{theme.name}</h4>
                          <div className="flex space-x-1 mt-2">
                            {Object.entries(theme.colors).slice(0, 3).map(([key, color]) => (
                              <div
                                key={key}
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {currentSettings.theme === theme.id && (
                          <Badge variant="default">مُحدد</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">تخطيط الواجهة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">كثافة التخطيط</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {["compact", "comfortable", "spacious"].map((layout) => (
                        <Button
                          key={layout}
                          variant={currentSettings.layout === layout ? "default" : "outline"}
                          onClick={() => handleSettingChange("layout", layout)}
                          className="flex flex-col items-center h-auto py-3"
                        >
                          <div className="text-sm font-medium">
                            {layout === "compact" ? "مضغوط" : 
                             layout === "comfortable" ? "مريح" : "واسع"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getLayoutDescription(layout)}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="display" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">إعدادات العرض</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">معاينة السؤال</div>
                      <div className="text-sm text-gray-500">عرض معاينة مباشرة للأسئلة أثناء التحرير</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettingChange("showPreview", !currentSettings.showPreview)}
                    >
                      {currentSettings.showPreview ? (
                        <><Eye className="h-4 w-4 mr-1" /> مُفعل</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-1" /> مُعطل</>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">الحركات والانتقالات</div>
                      <div className="text-sm text-gray-500">تفعيل الحركات السلسة في الواجهة</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettingChange("animationsEnabled", !currentSettings.animationsEnabled)}
                    >
                      {currentSettings.animationsEnabled ? "مُفعل" : "مُعطل"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">إمكانية الوصول</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">التباين العالي</div>
                      <div className="text-sm text-gray-500">زيادة التباين لتحسين الرؤية</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettingChange("highContrast", !currentSettings.highContrast)}
                    >
                      {currentSettings.highContrast ? "مُفعل" : "مُعطل"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">الاتجاه من اليمين لليسار</div>
                      <div className="text-sm text-gray-500">تحسين عرض النصوص العربية</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettingChange("rightToLeft", !currentSettings.rightToLeft)}
                    >
                      {currentSettings.rightToLeft ? "مُفعل" : "مُعطل"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            معاينة مباشرة
          </CardTitle>
          <CardDescription>
            شاهد كيف ستبدو الواجهة مع الإعدادات الحالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 border rounded-lg"
            style={{ 
              backgroundColor: getCurrentTheme().colors.background,
              color: getCurrentTheme().colors.text,
              direction: currentSettings.rightToLeft ? "rtl" : "ltr"
            }}
          >
            <div className="space-y-4">
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: getCurrentTheme().colors.primary + "20" }}
              >
                <h3 
                  className="font-medium"
                  style={{ color: getCurrentTheme().colors.primary }}
                >
                  عنوان تجريبي
                </h3>
                <p className="text-sm mt-1">
                  هذا نص تجريبي لمعاينة كيف ستبدو الواجهة مع الإعدادات المختارة
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 rounded text-white text-sm"
                  style={{ backgroundColor: getCurrentTheme().colors.primary }}
                >
                  زر أساسي
                </button>
                <button 
                  className="px-4 py-2 rounded border text-sm"
                  style={{ 
                    borderColor: getCurrentTheme().colors.secondary,
                    color: getCurrentTheme().colors.secondary
                  }}
                >
                  زر ثانوي
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
