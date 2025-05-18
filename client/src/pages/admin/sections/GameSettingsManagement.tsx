import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// مخطط التحقق من الإدخالات
const gameSettingsFormSchema = z.object({
  minCategories: z.coerce.number().min(1, { message: 'عدد الفئات الأدنى يجب أن يكون 1 على الأقل' }).max(20),
  maxCategories: z.coerce.number().min(1).max(20),
  minTeams: z.coerce.number().min(2, { message: 'يجب أن يكون هناك فريقان على الأقل' }).max(10),
  maxTeams: z.coerce.number().min(2).max(10),
  maxGameNameLength: z.coerce.number().min(5).max(100),
  maxTeamNameLength: z.coerce.number().min(3).max(50),
  defaultFirstAnswerTime: z.coerce.number().min(10).max(120),
  defaultSecondAnswerTime: z.coerce.number().min(5).max(60),
  minQuestionsPerCategory: z.coerce.number().min(1).max(20),
  modalTitle: z.string().min(1, { message: 'يجب إدخال عنوان النافذة' }),
  pageDescription: z.string().min(1, { message: 'يجب إدخال وصف الصفحة' }),
});

// نوع للإعدادات بناءً على المخطط
type GameSettingsFormValues = z.infer<typeof gameSettingsFormSchema>;

export default function GameSettingsManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // إعداد النموذج
  const form = useForm<GameSettingsFormValues>({
    resolver: zodResolver(gameSettingsFormSchema),
    defaultValues: {
      minCategories: 4,
      maxCategories: 8,
      minTeams: 2,
      maxTeams: 4,
      maxGameNameLength: 50,
      maxTeamNameLength: 20,
      defaultFirstAnswerTime: 30,
      defaultSecondAnswerTime: 15,
      minQuestionsPerCategory: 5,
      modalTitle: 'أنشئ لعبة جديدة',
      pageDescription: 'قم بإعداد لعبة جديدة واختر الفئات والفرق',
    },
  });

  // جلب الإعدادات الحالية
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/game-settings');
        const data = await response.json();
        
        // تحديث النموذج بالبيانات المستلمة
        form.reset(data);
      } catch (error) {
        console.error('Error fetching game settings:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب الإعدادات',
          description: 'حدث خطأ أثناء محاولة جلب إعدادات اللعبة',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form, toast]);

  // حفظ الإعدادات
  const onSubmit = async (values: GameSettingsFormValues) => {
    try {
      setSaving(true);
      
      // التحقق من أن الحد الأقصى أكبر من أو يساوي الحد الأدنى
      if (values.maxCategories < values.minCategories) {
        toast({
          variant: 'destructive',
          title: 'خطأ في الإعدادات',
          description: 'الحد الأقصى للفئات يجب أن يكون أكبر من أو يساوي الحد الأدنى',
        });
        return;
      }
      
      if (values.maxTeams < values.minTeams) {
        toast({
          variant: 'destructive',
          title: 'خطأ في الإعدادات',
          description: 'الحد الأقصى للفرق يجب أن يكون أكبر من أو يساوي الحد الأدنى',
        });
        return;
      }

      // إرسال البيانات إلى الخادم
      await apiRequest('PATCH', '/api/game-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات اللعبة بنجاح',
      });
    } catch (error) {
      console.error('Error saving game settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات اللعبة',
      });
    } finally {
      setSaving(false);
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
      <Card>
        <CardHeader>
          <CardTitle>إعدادات اللعبة الأساسية</CardTitle>
          <CardDescription>
            قم بضبط الحدود والإعدادات الأساسية للعبة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* إعدادات الفئات */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">إعدادات الفئات</h3>
                  <FormField
                    control={form.control}
                    name="minCategories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأدنى لعدد الفئات</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          أقل عدد من الفئات المطلوبة للعبة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxCategories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأقصى لعدد الفئات</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          أقصى عدد من الفئات المسموح بها للعبة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="minQuestionsPerCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأدنى للأسئلة لكل فئة</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          الحد الأدنى لعدد الأسئلة المطلوبة في كل فئة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* إعدادات الفرق */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">إعدادات الفرق</h3>
                  <FormField
                    control={form.control}
                    name="minTeams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأدنى لعدد الفرق</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          أقل عدد من الفرق المطلوبة للعبة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxTeams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأقصى لعدد الفرق</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          أقصى عدد من الفرق المسموح بها للعبة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* إعدادات الأسماء */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxGameNameLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى لطول اسم اللعبة</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        أقصى عدد من الأحرف المسموح بها لاسم اللعبة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxTeamNameLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى لطول اسم الفريق</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        أقصى عدد من الأحرف المسموح بها لاسم الفريق
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* إعدادات الوقت */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultFirstAnswerTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وقت الإجابة الأول الافتراضي (بالثواني)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        وقت الإجابة الافتراضي للفريق الأول (بالثواني)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="defaultSecondAnswerTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وقت الإجابة الثاني الافتراضي (بالثواني)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        وقت الإجابة الافتراضي للفريق الثاني (بالثواني)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* إعدادات النصوص */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات النصوص</h3>
                <FormField
                  control={form.control}
                  name="modalTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان نافذة إنشاء اللعبة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        العنوان الذي يظهر في نافذة إنشاء اللعبة الجديدة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pageDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف صفحة إنشاء اللعبة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        النص الوصفي الذي يظهر في صفحة إنشاء اللعبة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}