import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSite } from '@/context/SiteContext';
import { Loader2, Upload, Image as ImageIcon, PaintBucket, Link as LinkIcon, Save, Plus, Trash2, Globe, Edit } from 'lucide-react';

// مخطط التحقق من إعدادات الموقع
const siteSettingsFormSchema = z.object({
  appName: z.string().min(2, 'اسم التطبيق يجب أن يحتوي على حرفين على الأقل'),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  welcomeText: z.string().optional(),
  contactEmail: z.string().email('البريد الإلكتروني غير صالح').optional().nullable(),
  modalStyle: z.enum(['standard', 'rounded', 'floating']).default('standard'),
  themeColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'يجب أن يكون لون صالح بصيغة HEX').default('#1e40af'),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'يجب أن يكون لون صالح بصيغة HEX').default('#f59e0b'),
  rtlMode: z.boolean().default(true),
});

// مخطط التحقق من روابط التذييل
const footerLinkSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(1, 'يجب إدخال عنوان الرابط'),
  url: z.string().min(1, 'يجب إدخال عنوان URL'),
  isExternal: z.boolean().default(false),
  order: z.number().default(0),
});

const footerSettingsSchema = z.object({
  links: z.array(footerLinkSchema),
  copyrightText: z.string().optional(),
  showSocial: z.boolean().default(true),
  socialLinks: z.record(z.string()).optional(),
});

// أنواع البيانات
type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;
type FooterLink = z.infer<typeof footerLinkSchema>;
type FooterSettings = z.infer<typeof footerSettingsSchema>;

export default function SiteSettingsManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [editLinkIndex, setEditLinkIndex] = useState<number | null>(null);
  const [footerDialogOpen, setFooterDialogOpen] = useState(false);
  const { siteSettings } = useSite();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // نموذج إعدادات الموقع العامة
  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    defaultValues: {
      appName: '',
      logoUrl: '',
      faviconUrl: '',
      welcomeText: '',
      contactEmail: '',
      modalStyle: 'standard',
      themeColor: '#1e40af',
      secondaryColor: '#f59e0b',
      rtlMode: true,
    },
  });

  // نموذج روابط التذييل
  const footerLinkForm = useForm<FooterLink>({
    resolver: zodResolver(footerLinkSchema),
    defaultValues: {
      label: '',
      url: '',
      isExternal: false,
      order: 0,
    },
  });

  // نموذج إعدادات التذييل
  const footerSettingsForm = useForm({
    defaultValues: {
      copyrightText: `© ${new Date().getFullYear()} جميع الحقوق محفوظة`,
      showSocial: true,
      socialLinks: {
        twitter: '',
        facebook: '',
        instagram: '',
      },
    },
  });

  // جلب إعدادات الموقع
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // جلب الإعدادات العامة
        const siteResponse = await apiRequest('GET', '/api/site-settings');
        const siteData = await siteResponse.json();
        
        form.reset({
          appName: siteData.appName || 'جاوب',
          logoUrl: siteData.logoUrl || '',
          faviconUrl: siteData.faviconUrl || '',
          welcomeText: siteData.welcomeText || '',
          contactEmail: siteData.contactEmail || '',
          modalStyle: siteData.modalStyle || 'standard',
          themeColor: siteData.themeColor || '#1e40af',
          secondaryColor: siteData.secondaryColor || '#f59e0b',
          rtlMode: siteData.rtlMode !== undefined ? siteData.rtlMode : true,
        });
        
        if (siteData.logoUrl) {
          setLogoPreview(siteData.logoUrl);
        }
        
        if (siteData.faviconUrl) {
          setFaviconPreview(siteData.faviconUrl);
        }
        
        // جلب إعدادات التذييل
        const footerResponse = await apiRequest('GET', '/api/footer-settings');
        const footerData = await footerResponse.json();
        
        if (footerData.links && Array.isArray(footerData.links)) {
          setFooterLinks(footerData.links);
        }
        
        footerSettingsForm.reset({
          copyrightText: footerData.copyrightText || `© ${new Date().getFullYear()} جميع الحقوق محفوظة`,
          showSocial: footerData.showSocial !== undefined ? footerData.showSocial : true,
          socialLinks: footerData.socialLinks || {
            twitter: '',
            facebook: '',
            instagram: '',
          },
        });
        
      } catch (error) {
        console.error('Error fetching site settings:', error);
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
  }, [form, toast]);

  // حفظ الإعدادات العامة
  const onSubmitGeneral = async (values: SiteSettingsFormValues) => {
    try {
      setSaving(true);
      
      // إذا كان هناك ملف شعار جديد، قم برفعه أولاً
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadResponse = await apiRequest('POST', '/api/upload-logo', formData);
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.logoUrl) {
          values.logoUrl = uploadResult.logoUrl;
        }
      }
      
      // إذا كان هناك ملف أيقونة جديد، قم برفعه أيضًا
      if (faviconFile) {
        const formData = new FormData();
        formData.append('favicon', faviconFile);
        
        const uploadResponse = await apiRequest('POST', '/api/upload-favicon', formData);
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.faviconUrl) {
          values.faviconUrl = uploadResult.faviconUrl;
        }
      }
      
      // إرسال البيانات إلى الخادم
      await apiRequest('PATCH', '/api/site-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات الموقع بنجاح',
      });
      
      // تحديث معاينات الصورة
      if (values.logoUrl) {
        setLogoPreview(values.logoUrl);
      }
      
      if (values.faviconUrl) {
        setFaviconPreview(values.faviconUrl);
      }
      
      // إعادة تعيين الملفات المختارة
      setLogoFile(null);
      setFaviconFile(null);
      
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات الموقع',
      });
    } finally {
      setSaving(false);
    }
  };

  // حفظ إعدادات التذييل
  const onSubmitFooter = async () => {
    try {
      setSaving(true);
      
      const values = {
        links: footerLinks,
        ...footerSettingsForm.getValues(),
      };
      
      // إرسال البيانات إلى الخادم
      await apiRequest('PATCH', '/api/footer-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات التذييل بنجاح',
      });
      
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات التذييل',
      });
    } finally {
      setSaving(false);
    }
  };

  // إضافة رابط جديد للتذييل
  const addFooterLink = () => {
    footerLinkForm.reset({
      label: '',
      url: '',
      isExternal: false,
      order: footerLinks.length,
    });
    setEditLinkIndex(null);
    setFooterDialogOpen(true);
  };

  // تعديل رابط موجود
  const editFooterLink = (index: number) => {
    const link = footerLinks[index];
    footerLinkForm.reset({
      id: link.id,
      label: link.label,
      url: link.url,
      isExternal: link.isExternal,
      order: link.order,
    });
    setEditLinkIndex(index);
    setFooterDialogOpen(true);
  };

  // حذف رابط
  const deleteFooterLink = (index: number) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الرابط؟')) {
      const newLinks = [...footerLinks];
      newLinks.splice(index, 1);
      // إعادة ترتيب الروابط
      const reorderedLinks = newLinks.map((link, idx) => ({
        ...link,
        order: idx,
      }));
      setFooterLinks(reorderedLinks);
    }
  };

  // حفظ رابط التذييل
  const onSubmitFooterLink = (values: FooterLink) => {
    if (editLinkIndex !== null) {
      // تعديل رابط موجود
      const newLinks = [...footerLinks];
      newLinks[editLinkIndex] = values;
      setFooterLinks(newLinks);
    } else {
      // إضافة رابط جديد
      setFooterLinks([...footerLinks, values]);
    }
    setFooterDialogOpen(false);
  };

  // معالجة اختيار ملف الشعار
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // عرض معاينة الصورة
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // معالجة اختيار ملف الأيقونة
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      
      // عرض معاينة الصورة
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFaviconPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إعدادات الموقع</h3>
          <p className="text-sm text-muted-foreground">
            تخصيص شكل ومحتوى الموقع
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="general" className="flex items-center">
            <Globe className="h-4 w-4 ml-2" />
            الإعدادات العامة
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center">
            <LinkIcon className="h-4 w-4 ml-2" />
            إعدادات التذييل
          </TabsTrigger>
        </TabsList>
        
        {/* تبويب الإعدادات العامة */}
        <TabsContent value="general" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>
                تحديد المعلومات الأساسية للموقع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitGeneral)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="appName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم التطبيق</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="اسم التطبيق" />
                            </FormControl>
                            <FormDescription>
                              اسم التطبيق الذي سيظهر في العنوان والهيدر
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="welcomeText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>النص الترحيبي</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="أهلاً بك في تطبيق جاوب..."
                                className="resize-none min-h-[100px]"
                              />
                            </FormControl>
                            <FormDescription>
                              النص الذي سيظهر في الصفحة الرئيسية
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني للتواصل</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="info@example.com"
                                type="email"
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              البريد الإلكتروني الذي سيستخدم للتواصل
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <FormItem>
                        <FormLabel>شعار الموقع</FormLabel>
                        <div className="border rounded-md p-4">
                          <div className="mb-4 flex justify-center">
                            {logoPreview ? (
                              <div className="relative h-24 w-48 border rounded-md overflow-hidden">
                                <img
                                  src={logoPreview}
                                  alt="معاينة الشعار"
                                  className="h-full w-full object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 left-1 h-7 w-7 p-0"
                                  onClick={() => {
                                    setLogoPreview(null);
                                    setLogoFile(null);
                                    form.setValue('logoUrl', '');
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border border-dashed rounded-md h-24 w-48 flex items-center justify-center bg-muted">
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={logoInputRef}
                              onChange={handleLogoChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => logoInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 ml-2" />
                              {logoPreview ? 'تغيير الشعار' : 'رفع شعار'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            الصيغ المدعومة: PNG, JPG أو SVG. الحجم المناسب: 240 × 80
                          </p>
                        </div>
                      </FormItem>
                      
                      <FormItem>
                        <FormLabel>أيقونة الموقع (Favicon)</FormLabel>
                        <div className="border rounded-md p-4">
                          <div className="mb-4 flex justify-center">
                            {faviconPreview ? (
                              <div className="relative h-16 w-16 border rounded-md overflow-hidden">
                                <img
                                  src={faviconPreview}
                                  alt="معاينة الأيقونة"
                                  className="h-full w-full object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 left-1 h-5 w-5 p-0"
                                  onClick={() => {
                                    setFaviconPreview(null);
                                    setFaviconFile(null);
                                    form.setValue('faviconUrl', '');
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border border-dashed rounded-md h-16 w-16 flex items-center justify-center bg-muted">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={faviconInputRef}
                              onChange={handleFaviconChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => faviconInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 ml-2" />
                              {faviconPreview ? 'تغيير الأيقونة' : 'رفع أيقونة'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            الصيغ المدعومة: PNG, ICO. الحجم المناسب: 32 × 32
                          </p>
                        </div>
                      </FormItem>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">إعدادات المظهر</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="modalStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نمط النوافذ</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر نمط النوافذ" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="standard">قياسي</SelectItem>
                                <SelectItem value="rounded">مستدير</SelectItem>
                                <SelectItem value="floating">عائم</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              نمط عرض النوافذ المنبثقة في التطبيق
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="themeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اللون الرئيسي</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} placeholder="#1e40af" />
                                <div
                                  className="h-10 w-10 rounded-md border"
                                  style={{ backgroundColor: field.value }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              اللون الرئيسي للتطبيق (مثل #1e40af)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اللون الثانوي</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} placeholder="#f59e0b" />
                                <div
                                  className="h-10 w-10 rounded-md border"
                                  style={{ backgroundColor: field.value }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              اللون الثانوي للتطبيق (مثل #f59e0b)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="rtlMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              وضع RTL
                            </FormLabel>
                            <FormDescription>
                              تمكين اتجاه النص من اليمين إلى اليسار (للغة العربية)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب إعدادات التذييل */}
        <TabsContent value="footer" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التذييل</CardTitle>
              <CardDescription>
                تحديد المحتوى والروابط التي تظهر في تذييل الموقع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">روابط التذييل</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFooterLink}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة رابط
                    </Button>
                  </div>
                  
                  {footerLinks.length === 0 ? (
                    <div className="text-center p-6 border rounded-md bg-slate-50">
                      <LinkIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">لا توجد روابط</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        لم تتم إضافة أي روابط للتذييل بعد
                      </p>
                      <Button variant="outline" size="sm" onClick={addFooterLink}>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة رابط جديد
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="divide-y">
                        {footerLinks.map((link, index) => (
                          <div key={index} className="flex justify-between items-center p-4">
                            <div>
                              <div className="font-medium">{link.label}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <LinkIcon className="h-3 w-3 ml-1" />
                                <span>{link.url}</span>
                                {link.isExternal && (
                                  <Badge variant="outline" className="mr-2 text-xs">
                                    خارجي
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editFooterLink(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteFooterLink(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">إعدادات أخرى</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="copyrightText">نص حقوق النشر</Label>
                      <Input
                        id="copyrightText"
                        placeholder="© 2023 جميع الحقوق محفوظة"
                        value={footerSettingsForm.getValues('copyrightText')}
                        onChange={(e) => footerSettingsForm.setValue('copyrightText', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        النص الذي سيظهر في أسفل التذييل
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">
                          عرض روابط التواصل الاجتماعي
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          عرض أيقونات وروابط وسائل التواصل الاجتماعي في التذييل
                        </p>
                      </div>
                      <Switch
                        checked={footerSettingsForm.getValues('showSocial')}
                        onCheckedChange={(checked) => footerSettingsForm.setValue('showSocial', checked)}
                      />
                    </div>
                    
                    {footerSettingsForm.getValues('showSocial') && (
                      <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-medium">روابط التواصل الاجتماعي</h4>
                        
                        <div className="grid gap-3">
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="twitter">تويتر</Label>
                            <Input
                              id="twitter"
                              placeholder="https://twitter.com/username"
                              value={footerSettingsForm.getValues('socialLinks.twitter') || ''}
                              onChange={(e) => {
                                const socialLinks = footerSettingsForm.getValues('socialLinks') || {};
                                footerSettingsForm.setValue('socialLinks', {
                                  ...socialLinks,
                                  twitter: e.target.value,
                                });
                              }}
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="facebook">فيسبوك</Label>
                            <Input
                              id="facebook"
                              placeholder="https://facebook.com/page"
                              value={footerSettingsForm.getValues('socialLinks.facebook') || ''}
                              onChange={(e) => {
                                const socialLinks = footerSettingsForm.getValues('socialLinks') || {};
                                footerSettingsForm.setValue('socialLinks', {
                                  ...socialLinks,
                                  facebook: e.target.value,
                                });
                              }}
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="instagram">انستغرام</Label>
                            <Input
                              id="instagram"
                              placeholder="https://instagram.com/username"
                              value={footerSettingsForm.getValues('socialLinks.instagram') || ''}
                              onChange={(e) => {
                                const socialLinks = footerSettingsForm.getValues('socialLinks') || {};
                                footerSettingsForm.setValue('socialLinks', {
                                  ...socialLinks,
                                  instagram: e.target.value,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  className="w-full"
                  onClick={onSubmitFooter}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                  {saving ? 'جاري الحفظ...' : 'حفظ إعدادات التذييل'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* نافذة إضافة/تعديل رابط التذييل */}
      <Dialog open={footerDialogOpen} onOpenChange={setFooterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editLinkIndex !== null ? 'تعديل رابط' : 'إضافة رابط جديد'}
            </DialogTitle>
            <DialogDescription>
              {editLinkIndex !== null ? 'قم بتعديل بيانات الرابط' : 'قم بإدخال بيانات الرابط الجديد'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...footerLinkForm}>
            <form onSubmit={footerLinkForm.handleSubmit(onSubmitFooterLink)} className="space-y-6">
              <FormField
                control={footerLinkForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الرابط</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="من نحن" />
                    </FormControl>
                    <FormDescription>
                      النص الذي سيظهر للمستخدمين
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={footerLinkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="/about" />
                    </FormControl>
                    <FormDescription>
                      الرابط الذي سيتم التوجيه إليه
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={footerLinkForm.control}
                name="isExternal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        رابط خارجي
                      </FormLabel>
                      <FormDescription>
                        فتح الرابط في نافذة جديدة
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFooterDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {editLinkIndex !== null ? 'حفظ التعديلات' : 'إضافة الرابط'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}