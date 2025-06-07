import React, { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { apiRequest } from "../../../lib/queryClient";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Loader2, Globe, Palette, Image } from 'lucide-react';

// مخطط التحقق من الإدخالات
const websiteSettingsFormSchema = z.object({
  appName: z.string().min(1, { message: 'اسم التطبيق مطلوب' }),
  logoUrl: z.string().min(1, { message: 'رابط الشعار مطلوب' }),
  faviconUrl: z.string().min(1, { message: 'رابط أيقونة التبويب مطلوب' }),
  modalStyle: z.enum(['rounded', 'squared', 'floating'], {
    message: 'اختر نمط النوافذ المنبثقة',
  }),
});

// نوع للإعدادات بناءً على المخطط
type WebsiteSettingsFormValues = z.infer<typeof websiteSettingsFormSchema>;

// مخطط وأنواع لإعدادات تذييل الصفحة
const footerLinkSchema = z.object({
  label: z.string().min(1, { message: 'عنوان الرابط مطلوب' }),
  url: z.string().min(1, { message: 'عنوان URL مطلوب' }),
});

const footerSettingsSchema = z.object({
  links: z.array(footerLinkSchema),
  copyrightText: z.string(),
  showSocialLinks: z.boolean().default(true),
  socialLinks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  }),
});

type FooterSettingsFormValues = z.infer<typeof footerSettingsSchema>;

export default function WebsiteSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [tabValue, setTabValue] = useState("general");

  // إعداد نموذج الإعدادات العامة
  const generalForm = useForm<WebsiteSettingsFormValues>({
    resolver: zodResolver(websiteSettingsFormSchema),
    defaultValues: {
      appName: 'جاوب',
      logoUrl: '/assets/jaweb-logo.png',
      faviconUrl: '/favicon.ico',
      modalStyle: 'rounded',
    },
  });

  // إعداد نموذج إعدادات التذييل
  const footerForm = useForm<FooterSettingsFormValues>({
    resolver: zodResolver(footerSettingsSchema),
    defaultValues: {
      links: [
        { label: 'من نحن', url: '/about' },
        { label: 'سياسة الخصوصية', url: '/privacy' },
        { label: 'الشروط والأحكام', url: '/terms' },
      ],
      copyrightText: '© 2025 جاوب. جميع الحقوق محفوظة.',
      showSocialLinks: true,
      socialLinks: {
        facebook: 'https://facebook.com/jaweb',
        twitter: 'https://twitter.com/jaweb',
        instagram: 'https://instagram.com/jaweb',
      },
    },
  });

  // جلب الإعدادات الحالية
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // جلب إعدادات الموقع العامة
        const generalResponse = await apiRequest('GET', '/api/site-settings');
        const generalData = await generalResponse.json();
        generalForm.reset(generalData);

        // جلب إعدادات التذييل
        const footerResponse = await apiRequest('GET', '/api/footer-settings');
        const footerData = await footerResponse.json();
        footerForm.reset(footerData);
      } catch (error) {
        console.error('Error fetching website settings:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب الإعدادات',
          description: 'حدث خطأ أثناء محاولة جلب إعدادات الموقع',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [generalForm, footerForm, toast]);

  // حفظ الإعدادات العامة
  const onSubmitGeneral = async (values: WebsiteSettingsFormValues) => {
    try {
      setSavingGeneral(true);
      await apiRequest('PATCH', '/api/site-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات الموقع بنجاح',
      });
    } catch (error) {
      console.error('Error saving website settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات الموقع',
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  // حفظ إعدادات التذييل
  const onSubmitFooter = async (values: FooterSettingsFormValues) => {
    try {
      setSavingFooter(true);
      await apiRequest('PATCH', '/api/footer-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات تذييل الصفحة بنجاح',
      });
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات تذييل الصفحة',
      });
    } finally {
      setSavingFooter(false);
    }
  };

  // إضافة رابط جديد للتذييل
  const addFooterLink = () => {
    const currentLinks = footerForm.getValues('links') || [];
    footerForm.setValue('links', [...currentLinks, { label: '', url: '' }]);
  };

  // حذف رابط من التذييل
  const removeFooterLink = (index: number) => {
    const currentLinks = footerForm.getValues('links');
    footerForm.setValue('links', currentLinks.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>إعدادات عامة</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>تذييل الصفحة</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة للموقع</CardTitle>
              <CardDescription>
                تخصيص المظهر العام للموقع والهوية المرئية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم التطبيق</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          اسم التطبيق الذي سيظهر في شريط التنقل والعنوان
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رابط الشعار</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input {...field} />
                              {field.value && (
                                <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                                  <img
                                    src={field.value}
                                    alt="Logo preview"
                                    className="max-h-8 max-w-8 object-contain"
                                    onError={(e) => e.currentTarget.src = ""}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            المسار النسبي لشعار التطبيق (مثال: /assets/logo.png)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="faviconUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رابط أيقونة التبويب</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input {...field} />
                              {field.value && (
                                <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                                  <img
                                    src={field.value}
                                    alt="Favicon preview"
                                    className="max-h-6 max-w-6 object-contain"
                                    onError={(e) => e.currentTarget.src = ""}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            المسار النسبي لأيقونة التبويب (مثال: /favicon.ico)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={generalForm.control}
                    name="modalStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نمط النوافذ المنبثقة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نمط النوافذ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rounded">دائرية الزوايا</SelectItem>
                            <SelectItem value="squared">زوايا مربعة</SelectItem>
                            <SelectItem value="floating">طافية مع ظل</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          نمط النوافذ المنبثقة في التطبيق
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={savingGeneral}>
                    {savingGeneral ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
                    {savingGeneral ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="footer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات تذييل الصفحة</CardTitle>
              <CardDescription>
                تعديل روابط وإعدادات تذييل الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...footerForm}>
                <form onSubmit={footerForm.handleSubmit(onSubmitFooter)} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">روابط التذييل</h3>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addFooterLink}
                        size="sm"
                      >
                        إضافة رابط
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {footerForm.watch('links').map((_, index) => (
                        <div key={index} className="grid gap-3 mb-4">
                          <div className="flex gap-4 items-start">
                            <div className="flex-1">
                              <FormField
                                control={footerForm.control}
                                name={`links.${index}.label`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>عنوان الرابط</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex-1">
                              <FormField
                                control={footerForm.control}
                                name={`links.${index}.url`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الرابط</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="pt-8">
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeFooterLink(index)}
                              >
                                حذف
                              </Button>
                            </div>
                          </div>
                          {index < footerForm.watch('links').length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <FormField
                    control={footerForm.control}
                    name="copyrightText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نص حقوق النشر</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          نص حقوق النشر الذي سيظهر في أسفل الصفحة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <h3 className="text-lg font-medium">روابط التواصل الاجتماعي</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={footerForm.control}
                      name="socialLinks.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>فيسبوك</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={footerForm.control}
                      name="socialLinks.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تويتر</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={footerForm.control}
                      name="socialLinks.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>إنستغرام</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={savingFooter}>
                    {savingFooter ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
                    {savingFooter ? 'جاري الحفظ...' : 'حفظ إعدادات التذييل'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
