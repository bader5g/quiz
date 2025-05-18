import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Settings, Users, Timer, HelpCircle, FileText } from 'lucide-react';

// مخطط التحقق من الإدخالات الأساسية
const gameSettingsBaseSchema = z.object({
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

// مخطط التحقق من إدخالات التوقيت
const gameSettingsTimerSchema = z.object({
  timerEnabled: z.boolean().default(true),
  showTimerAnimation: z.boolean().default(true),
  pauseTimerOnQuestionView: z.boolean().default(false),
  enableTimerSounds: z.boolean().default(true),
  lowTimeThreshold: z.coerce.number().min(3).max(20),
  timerDisplayFormat: z.enum(['digital', 'analog', 'bar']).default('digital'),
});

// مخطط التحقق من إدخالات وسائل المساعدة
const gameSettingsHelpToolsSchema = z.object({
  helpToolsEnabled: z.boolean().default(true),
  onlyEnabledForTwoTeams: z.boolean().default(true),
  skipQuestionEnabled: z.boolean().default(true),
  skipQuestionCount: z.coerce.number().min(0).max(10),
  pointDeductionEnabled: z.boolean().default(true),
  pointDeductionCount: z.coerce.number().min(0).max(10),
  pointDeductionAmount: z.coerce.number().min(0).max(100),
  turnReverseEnabled: z.boolean().default(true),
  turnReverseCount: z.coerce.number().min(0).max(10),
});

// مخطط التحقق من إدخالات النتائج والسجل
const gameSettingsResultsSchema = z.object({
  showFinalResults: z.boolean().default(true),
  enableConfetti: z.boolean().default(true),
  showAnswerStats: z.boolean().default(true),
  showGameLog: z.boolean().default(true),
  gameLogVisibility: z.enum(['all', 'judge', 'none']).default('all'),
  showTeamScoresDuringGame: z.boolean().default(true),
  showWinningTeamAnimation: z.boolean().default(true),
  saveGameHistory: z.boolean().default(true),
  historyRetentionDays: z.coerce.number().min(1).max(365),
});

// دمج جميع المخططات معًا
const gameSettingsFormSchema = gameSettingsBaseSchema.merge(gameSettingsTimerSchema).merge(gameSettingsHelpToolsSchema).merge(gameSettingsResultsSchema);

// نوع للإعدادات بناءً على المخطط
type GameSettingsFormValues = z.infer<typeof gameSettingsFormSchema>;

export default function GameSettingsManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // إعداد النموذج
  const form = useForm<GameSettingsFormValues>({
    resolver: zodResolver(gameSettingsFormSchema),
    defaultValues: {
      // الإعدادات الأساسية
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
      
      // إعدادات المؤقت
      timerEnabled: true,
      showTimerAnimation: true,
      pauseTimerOnQuestionView: false,
      enableTimerSounds: true,
      lowTimeThreshold: 5,
      timerDisplayFormat: 'digital',
      
      // إعدادات وسائل المساعدة
      helpToolsEnabled: true,
      onlyEnabledForTwoTeams: true,
      skipQuestionEnabled: true,
      skipQuestionCount: 1,
      pointDeductionEnabled: true,
      pointDeductionCount: 1,
      pointDeductionAmount: 50,
      turnReverseEnabled: true,
      turnReverseCount: 1,
      
      // إعدادات النتائج والسجل
      showFinalResults: true,
      enableConfetti: true,
      showAnswerStats: true,
      showGameLog: true,
      gameLogVisibility: 'all',
      showTeamScoresDuringGame: true,
      showWinningTeamAnimation: true,
      saveGameHistory: true,
      historyRetentionDays: 30,
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
      console.log('بدء حفظ الإعدادات...', values);
      
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

      // تحققات أخرى
      if (values.defaultFirstAnswerTime < values.defaultSecondAnswerTime) {
        toast({
          variant: 'destructive',
          title: 'خطأ في إعدادات الوقت',
          description: 'وقت الإجابة الأول يجب أن يكون أكبر من أو يساوي وقت الإجابة الثاني',
        });
        return;
      }

      // إعداد البيانات للإرسال (إستخراج فقط الحقول المطلوبة لتجنب أي خطأ في التحقق)
      const gameSettingsData = {
        minCategories: values.minCategories,
        maxCategories: values.maxCategories,
        minTeams: values.minTeams,
        maxTeams: values.maxTeams,
        maxGameNameLength: values.maxGameNameLength,
        maxTeamNameLength: values.maxTeamNameLength,
        defaultFirstAnswerTime: values.defaultFirstAnswerTime,
        defaultSecondAnswerTime: values.defaultSecondAnswerTime,
        minQuestionsPerCategory: values.minQuestionsPerCategory || 5,
        modalTitle: values.modalTitle,
        pageDescription: values.pageDescription
      };

      console.log('إرسال البيانات للخادم...', gameSettingsData);
      
      // إرسال البيانات إلى الخادم
      const response = await apiRequest('PATCH', '/api/game-settings', gameSettingsData);
      console.log('تم حفظ الإعدادات بنجاح');
      
      // إعادة تحميل الإعدادات
      try {
        const refreshResponse = await apiRequest('GET', '/api/game-settings');
        const updatedSettings = await refreshResponse.json();
        console.log('الإعدادات المحدثة:', updatedSettings);
        form.reset(updatedSettings);
      } catch (err) {
        console.error('خطأ في إعادة تحميل الإعدادات', err);
      }
      
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إعدادات اللعبة</h3>
          <p className="text-sm text-muted-foreground">
            تخصيص إعدادات وضوابط اللعبة بشكل كامل
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات اللعبة</CardTitle>
          <CardDescription>
            قم بضبط جميع إعدادات اللعبة واختر ما يناسب تجربة المستخدمين الخاصة بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center">
                    <Settings className="h-4 w-4 ml-2" />
                    أساسي
                  </TabsTrigger>
                  <TabsTrigger value="timer" className="flex items-center">
                    <Timer className="h-4 w-4 ml-2" />
                    المؤقت
                  </TabsTrigger>
                  <TabsTrigger value="help-tools" className="flex items-center">
                    <HelpCircle className="h-4 w-4 ml-2" />
                    وسائل المساعدة
                  </TabsTrigger>
                  <TabsTrigger value="results" className="flex items-center">
                    <FileText className="h-4 w-4 ml-2" />
                    النتائج والسجل
                  </TabsTrigger>
                </TabsList>
                
                {/* الإعدادات الأساسية */}
                <TabsContent value="basic" className="mt-6">
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
                  
                  <Separator className="my-6" />
                  
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
                  
                  <Separator className="my-6" />
                  
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
                </TabsContent>

                {/* إعدادات المؤقت */}
                <TabsContent value="timer" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات المؤقت الأساسية</h3>
                    
                    <FormField
                      control={form.control}
                      name="timerEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل المؤقت
                            </FormLabel>
                            <FormDescription>
                              تفعيل أو تعطيل المؤقت في اللعبة
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="defaultFirstAnswerTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>وقت الإجابة الأول (بالثواني)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                disabled={!form.watch('timerEnabled')}
                              />
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
                            <FormLabel>وقت الإجابة الثاني (بالثواني)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                disabled={!form.watch('timerEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              وقت الإجابة الافتراضي للفريق الثاني (بالثواني)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات عرض المؤقت</h3>
                    
                    <FormField
                      control={form.control}
                      name="showTimerAnimation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              عرض تحريك المؤقت
                            </FormLabel>
                            <FormDescription>
                              عرض تأثيرات الحركة والتنبيه على المؤقت
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('timerEnabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="enableTimerSounds"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل أصوات المؤقت
                            </FormLabel>
                            <FormDescription>
                              تفعيل الأصوات عند انتهاء الوقت وفي آخر 5 ثوانٍ
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('timerEnabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pauseTimerOnQuestionView"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              إيقاف المؤقت عند عرض السؤال
                            </FormLabel>
                            <FormDescription>
                              إيقاف المؤقت مؤقتًا عند عرض السؤال لأول مرة
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('timerEnabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lowTimeThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عتبة الوقت المنخفض (بالثواني)</FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-2">
                              <Slider
                                defaultValue={[field.value]}
                                min={3}
                                max={20}
                                step={1}
                                onValueChange={(value) => field.onChange(value[0])}
                                disabled={!form.watch('timerEnabled')}
                              />
                              <div className="flex justify-between">
                                <span>3 ثوانٍ</span>
                                <span>{field.value} ثانية</span>
                                <span>20 ثانية</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            عدد الثواني التي يتم عندها تنبيه اللاعبين بأن الوقت قارب على الانتهاء
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timerDisplayFormat"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>طريقة عرض المؤقت</FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id="timer-digital"
                                  checked={field.value === 'digital'}
                                  onCheckedChange={() => field.onChange('digital')}
                                  disabled={!form.watch('timerEnabled')}
                                />
                                <label
                                  htmlFor="timer-digital"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  رقمي (00:30)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id="timer-analog"
                                  checked={field.value === 'analog'}
                                  onCheckedChange={() => field.onChange('analog')}
                                  disabled={!form.watch('timerEnabled')}
                                />
                                <label
                                  htmlFor="timer-analog"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  تناظري (ساعة)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id="timer-bar"
                                  checked={field.value === 'bar'}
                                  onCheckedChange={() => field.onChange('bar')}
                                  disabled={!form.watch('timerEnabled')}
                                />
                                <label
                                  htmlFor="timer-bar"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  شريط تقدم
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            طريقة عرض المؤقت في واجهة اللعبة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* إعدادات وسائل المساعدة */}
                <TabsContent value="help-tools" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات وسائل المساعدة الأساسية</h3>
                    
                    <FormField
                      control={form.control}
                      name="helpToolsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل وسائل المساعدة
                            </FormLabel>
                            <FormDescription>
                              تفعيل أو تعطيل وسائل المساعدة في اللعبة
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
                    
                    <FormField
                      control={form.control}
                      name="onlyEnabledForTwoTeams"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              فقط لفريقين
                            </FormLabel>
                            <FormDescription>
                              تفعيل وسائل المساعدة فقط في حالة وجود فريقين
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('helpToolsEnabled')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">وسائل المساعدة المتاحة</h3>
                    
                    {/* تخطي السؤال */}
                    <div className="rounded-lg border p-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="skipQuestionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                تخطي السؤال
                              </FormLabel>
                              <FormDescription>
                                تفعيل وسيلة مساعدة تخطي السؤال الحالي
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!form.watch('helpToolsEnabled')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="skipQuestionCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد مرات الاستخدام المسموح بها</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                disabled={!form.watch('helpToolsEnabled') || !form.watch('skipQuestionEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              عدد المرات التي يمكن فيها استخدام هذه الميزة في كل لعبة
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* خصم النقاط */}
                    <div className="rounded-lg border p-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="pointDeductionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                خصم نقاط من الفريق الآخر
                              </FormLabel>
                              <FormDescription>
                                تفعيل وسيلة مساعدة خصم نقاط من الفريق المنافس
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!form.watch('helpToolsEnabled')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="pointDeductionCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>عدد مرات الاستخدام</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  disabled={!form.watch('helpToolsEnabled') || !form.watch('pointDeductionEnabled')}
                                />
                              </FormControl>
                              <FormDescription>
                                عدد المرات المسموح بها
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pointDeductionAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>مقدار الخصم</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  disabled={!form.watch('helpToolsEnabled') || !form.watch('pointDeductionEnabled')}
                                />
                              </FormControl>
                              <FormDescription>
                                عدد النقاط التي يتم خصمها في كل مرة
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* عكس الدور */}
                    <div className="rounded-lg border p-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="turnReverseEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                عكس الدور
                              </FormLabel>
                              <FormDescription>
                                تفعيل وسيلة مساعدة عكس ترتيب الأدوار بين الفرق
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!form.watch('helpToolsEnabled')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="turnReverseCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد مرات الاستخدام المسموح بها</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                disabled={!form.watch('helpToolsEnabled') || !form.watch('turnReverseEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              عدد المرات التي يمكن فيها استخدام هذه الميزة في كل لعبة
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* إعدادات النتائج والسجل */}
                <TabsContent value="results" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات النتائج</h3>
                    
                    <FormField
                      control={form.control}
                      name="showFinalResults"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              عرض النتائج النهائية
                            </FormLabel>
                            <FormDescription>
                              عرض صفحة النتائج النهائية بعد انتهاء اللعبة
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
                    
                    <FormField
                      control={form.control}
                      name="enableConfetti"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل تأثيرات الاحتفال
                            </FormLabel>
                            <FormDescription>
                              عرض تأثيرات الاحتفال (كونفيتي) للفريق الفائز
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('showFinalResults')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="showWinningTeamAnimation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تحريك الفريق الفائز
                            </FormLabel>
                            <FormDescription>
                              عرض رسوم متحركة خاصة للفريق الفائز في النتائج
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('showFinalResults')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="showTeamScoresDuringGame"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              عرض نقاط الفريق أثناء اللعب
                            </FormLabel>
                            <FormDescription>
                              عرض نقاط كل فريق في الواجهة أثناء سير اللعبة
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
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات سجل اللعبة</h3>
                    
                    <FormField
                      control={form.control}
                      name="showGameLog"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              عرض سجل اللعبة
                            </FormLabel>
                            <FormDescription>
                              عرض تفاصيل وسجل الأسئلة والإجابات
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
                    
                    <FormField
                      control={form.control}
                      name="gameLogVisibility"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>إعدادات رؤية سجل اللعبة</FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id="game-log-all"
                                  checked={field.value === 'all'}
                                  onCheckedChange={() => field.onChange('all')}
                                  disabled={!form.watch('showGameLog')}
                                />
                                <label
                                  htmlFor="game-log-all"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  الكل (جميع اللاعبين)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id="game-log-judge"
                                  checked={field.value === 'judge'}
                                  onCheckedChange={() => field.onChange('judge')}
                                  disabled={!form.watch('showGameLog')}
                                />
                                <label
                                  htmlFor="game-log-judge"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  المحكم فقط
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id="game-log-none"
                                  checked={field.value === 'none'}
                                  onCheckedChange={() => field.onChange('none')}
                                  disabled={!form.watch('showGameLog')}
                                />
                                <label
                                  htmlFor="game-log-none"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  لا أحد (مخفي تمامًا)
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            تحديد من يمكنه رؤية سجل اللعبة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="showAnswerStats"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              عرض إحصائيات الإجابات
                            </FormLabel>
                            <FormDescription>
                              عرض إحصائيات الإجابات الصحيحة والخاطئة لكل فريق
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!form.watch('showGameLog')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات حفظ السجل</h3>
                    
                    <FormField
                      control={form.control}
                      name="saveGameHistory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              حفظ سجل اللعبة
                            </FormLabel>
                            <FormDescription>
                              حفظ تاريخ اللعبة للرجوع إليه لاحقًا
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
                    
                    <FormField
                      control={form.control}
                      name="historyRetentionDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مدة الاحتفاظ بالسجل (بالأيام)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!form.watch('saveGameHistory')}
                            />
                          </FormControl>
                          <FormDescription>
                            عدد الأيام التي يتم فيها الاحتفاظ بسجل اللعبة قبل حذفه تلقائيًا
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
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