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
  minQuestionsPerCategory: z.coerce.number().min(1).max(20).optional(),
  modalTitle: z.string().min(1, { message: 'يجب إدخال عنوان النافذة' }),
  pageDescription: z.string().min(1, { message: 'يجب إدخال وصف الصفحة' }),
});

// تعريف هيكل خيارات أوقات الإجابة
const answerTimeOptionSchema = z.object({
  default: z.number().min(3).max(120),
  options: z.array(z.number())
});

// مخطط التحقق من إدخالات التوقيت
const gameSettingsTimerSchema = z.object({
  timerEnabled: z.boolean().default(true),
  showTimerAnimation: z.boolean().default(true),
  pauseTimerOnQuestionView: z.boolean().default(false),
  enableTimerSounds: z.boolean().default(true),
  lowTimeThreshold: z.coerce.number().min(3).max(20),
  timerDisplayFormat: z.enum(['digital', 'analog', 'bar']).default('digital'),
  
  // خيارات أوقات الإجابة المحسنة
  answerTimeOptions: z.object({
    first: answerTimeOptionSchema,
    second: answerTimeOptionSchema,
    third: answerTimeOptionSchema,
    fourth: answerTimeOptionSchema
  }).default({
    first: { default: 30, options: [60, 30, 15, 10] },
    second: { default: 15, options: [30, 15, 10, 5] },
    third: { default: 10, options: [20, 10, 5] },
    fourth: { default: 5, options: [10, 5, 3] }
  }),
  
  // أوقات الإجابة حسب عدد الفرق (للتوافق القديم)
  answerTimesFor2Teams: z.array(z.number()).default([15, 30, 45]),
  answerTimesFor3Teams: z.array(z.number()).default([20, 40, 60]),
  answerTimesFor4Teams: z.array(z.number()).default([30, 60, 90]),
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
const gameSettingsFormSchema = gameSettingsBaseSchema
  .merge(gameSettingsTimerSchema)
  .merge(gameSettingsHelpToolsSchema)
  .merge(gameSettingsResultsSchema);

// نوع للإعدادات بناءً على المخطط
type GameSettingsFormValues = z.infer<typeof gameSettingsFormSchema>;

export default function GameSettingsManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      
      // إعدادات أوقات الإجابة
      answerTimeOptions: {
        first: {
          default: 30,
          options: [10, 20, 30, 45, 60, 90]
        },
        second: {
          default: 20,
          options: [5, 10, 15, 20, 30]
        },
        third: {
          default: 15,
          options: [5, 10, 15, 20, 30]
        },
        fourth: {
          default: 10,
          options: [5, 10, 15, 20]
        }
      },
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
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form, toast]);

  // حفظ الإعدادات
  const onSubmit = async (values: GameSettingsFormValues) => {
    try {
      setIsSaving(true);
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

      // إعداد البيانات للإرسال - مع كل البيانات المطلوبة
      const gameSettingsData = {
        minCategories: values.minCategories,
        maxCategories: values.maxCategories,
        minTeams: values.minTeams,
        maxTeams: values.maxTeams,
        maxGameNameLength: values.maxGameNameLength,
        maxTeamNameLength: values.maxTeamNameLength,
        defaultFirstAnswerTime: values.defaultFirstAnswerTime,
        defaultSecondAnswerTime: values.defaultSecondAnswerTime,
        modalTitle: values.modalTitle,
        pageDescription: values.pageDescription,
        timerEnabled: values.timerEnabled,
        helpToolsEnabled: values.helpToolsEnabled,
        minQuestionsPerCategory: values.minQuestionsPerCategory,
        answerTimeOptions: values.answerTimeOptions
      };

      console.log('إرسال البيانات للخادم...', gameSettingsData);
      
      // إرسال البيانات إلى الخادم
      await apiRequest('PATCH', '/api/game-settings', gameSettingsData);
      
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
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
                              أقصى عدد من الفئات المسموح به في اللعبة
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
                            <FormLabel>الحد الأدنى من الأسئلة لكل فئة</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              أقل عدد من الأسئلة المطلوبة لظهور الفئة للاعبين
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
                              أقصى عدد من الفرق المسموح به في اللعبة
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* إعدادات الوقت */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">إعدادات وقت الإجابة</h3>
                      <FormField
                        control={form.control}
                        name="defaultFirstAnswerTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>وقت الإجابة الأول (بالثواني)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              الوقت المتاح للفريق الأول للإجابة
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
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              الوقت المتاح للفرق اللاحقة للإجابة
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* إعدادات العرض */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">إعدادات العرض</h3>
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
                              العنوان الذي يظهر عند إنشاء لعبة جديدة
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
                            <FormLabel>وصف الصفحة الرئيسية</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              النص الوصفي الذي يظهر في الصفحة الرئيسية
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* إعدادات المؤقت */}
                <TabsContent value="timer" className="mt-6 space-y-6">
                  {/* محتوى تبويبة المؤقت */}
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
                    
                    <FormField
                      control={form.control}
                      name="showTimerAnimation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              عرض الرسوم المتحركة للمؤقت
                            </FormLabel>
                            <FormDescription>
                              إظهار الرسوم المتحركة أثناء عد المؤقت
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
                              إيقاف المؤقت مؤقتًا عندما يتم عرض السؤال لأول مرة
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
                              تشغيل أصوات عندما يقترب المؤقت من الانتهاء
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
                          <FormLabel>حد الوقت المنخفض (ثواني)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!form.watch('timerEnabled')}
                            />
                          </FormControl>
                          <FormDescription>
                            عدد الثواني المتبقية التي يتم اعتبارها "وقت منخفض" (للتنبيه)
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
                          <FormLabel>شكل عرض المؤقت</FormLabel>
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
                    
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium">إعدادات أوقات الإجابة</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      تخصيص أوقات الإجابة المتاحة وتعيين القيم الافتراضية لكل مستوى
                    </p>
                    
                    {/* واجهة إدارة أوقات الإجابة المتقدمة */}
                    <div className="space-y-6">
                      {/* وقت الإجابة الأول */}
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-3">وقت الإجابة الأول</h4>
                        <div className="flex flex-wrap gap-3 mb-3">
                          {Array.isArray(form.watch('answerTimeOptions.first.options')) && 
                            form.watch('answerTimeOptions.first.options').map((time, index) => (
                            <div 
                              key={`first-${index}`} 
                              className={`bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1 ${
                                form.watch('answerTimeOptions.first.default') === time ? 'border-2 border-primary' : ''
                              }`}
                            >
                              <span>{time} ثانية</span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-green-100"
                                  onClick={() => {
                                    form.setValue('answerTimeOptions.first.default', time);
                                  }}
                                  title="تعيين كافتراضي"
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.first.default') === time}
                                >
                                  <span className="sr-only">تعيين كافتراضي</span>
                                  {form.watch('answerTimeOptions.first.default') === time ? '✓' : '*'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-red-100"
                                  onClick={() => {
                                    const options = form.watch('answerTimeOptions.first.options');
                                    if (Array.isArray(options)) {
                                      const currentOptions = [...options];
                                      // لا تسمح بحذف الوقت الافتراضي
                                      if (form.watch('answerTimeOptions.first.default') === currentOptions[index]) {
                                        return;
                                      }
                                      currentOptions.splice(index, 1);
                                      form.setValue('answerTimeOptions.first.options', currentOptions);
                                    }
                                  }}
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.first.default') === time}
                                >
                                  <span className="sr-only">حذف</span>
                                  &times;
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="أضف وقت جديد بالثواني"
                            className="max-w-[200px]"
                            id="newTimeForFirst"
                            min={5}
                            max={120}
                            defaultValue=""
                            key="newTimeForFirst"
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              try {
                                const input = document.getElementById('newTimeForFirst') as HTMLInputElement;
                                const newTime = parseInt(input.value);
                                
                                if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                  console.log('القيمة المدخلة غير صالحة');
                                  return;
                                }
                                
                                // التأكد من وجود قيمة في options
                                let currentOptions = form.watch('answerTimeOptions.first.options');
                                if (!Array.isArray(currentOptions) || currentOptions === undefined) {
                                  currentOptions = [];
                                }
                                
                                // التأكد من عدم وجود القيمة مسبقًا
                                if (!currentOptions.includes(newTime)) {
                                  // إضافة القيمة الجديدة وترتيب المصفوفة
                                  const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                  
                                  // تعيين القيمة الجديدة في النموذج
                                  form.setValue('answerTimeOptions.first.options', newOptions);
                                  
                                  // تعيين القيمة الافتراضية إذا كانت غير موجودة
                                  if (form.watch('answerTimeOptions.first.default') === undefined) {
                                    form.setValue('answerTimeOptions.first.default', newTime);
                                  }
                                  
                                  // تفريغ حقل الإدخال
                                  input.value = '';
                                  console.log('تمت إضافة القيمة:', newTime);
                                }
                              } catch (error) {
                                console.error('خطأ في إضافة وقت جديد:', error);
                              }
                            }}
                            disabled={!form.watch('timerEnabled')}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      {/* وقت الإجابة الثاني */}
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-3">وقت الإجابة الثاني</h4>
                        <div className="flex flex-wrap gap-3 mb-3">
                          {Array.isArray(form.watch('answerTimeOptions.second.options')) && 
                            form.watch('answerTimeOptions.second.options').map((time, index) => (
                            <div 
                              key={`second-${index}`} 
                              className={`bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1 ${
                                form.watch('answerTimeOptions.second.default') === time ? 'border-2 border-primary' : ''
                              }`}
                            >
                              <span>{time} ثانية</span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-green-100"
                                  onClick={() => {
                                    form.setValue('answerTimeOptions.second.default', time);
                                  }}
                                  title="تعيين كافتراضي"
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.second.default') === time}
                                >
                                  <span className="sr-only">تعيين كافتراضي</span>
                                  {form.watch('answerTimeOptions.second.default') === time ? '✓' : '*'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-red-100"
                                  onClick={() => {
                                    const options = form.watch('answerTimeOptions.second.options');
                                    if (Array.isArray(options)) {
                                      const currentOptions = [...options];
                                      if (form.watch('answerTimeOptions.second.default') === currentOptions[index]) {
                                        return;
                                      }
                                      currentOptions.splice(index, 1);
                                      form.setValue('answerTimeOptions.second.options', currentOptions);
                                    }
                                  }}
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.second.default') === time}
                                >
                                  <span className="sr-only">حذف</span>
                                  &times;
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="أضف وقت جديد بالثواني"
                            className="max-w-[200px]"
                            id="newTimeForSecond"
                            min={5}
                            max={120}
                            defaultValue=""
                            key="newTimeForSecond"
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              try {
                                const input = document.getElementById('newTimeForSecond') as HTMLInputElement;
                                const newTime = parseInt(input.value);
                                
                                if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                  console.log('القيمة المدخلة غير صالحة');
                                  return;
                                }
                                
                                // التأكد من وجود قيمة في options
                                let currentOptions = form.watch('answerTimeOptions.second.options');
                                if (!Array.isArray(currentOptions) || currentOptions === undefined) {
                                  currentOptions = [];
                                }
                                
                                // التأكد من عدم وجود القيمة مسبقًا
                                if (!currentOptions.includes(newTime)) {
                                  // إضافة القيمة الجديدة وترتيب المصفوفة
                                  const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                  
                                  // تعيين القيمة الجديدة في النموذج
                                  form.setValue('answerTimeOptions.second.options', newOptions);
                                  
                                  // تعيين القيمة الافتراضية إذا كانت غير موجودة
                                  if (form.watch('answerTimeOptions.second.default') === undefined) {
                                    form.setValue('answerTimeOptions.second.default', newTime);
                                  }
                                  
                                  // تفريغ حقل الإدخال
                                  input.value = '';
                                  console.log('تمت إضافة القيمة:', newTime);
                                }
                              } catch (error) {
                                console.error('خطأ في إضافة وقت جديد:', error);
                              }
                            }}
                            disabled={!form.watch('timerEnabled')}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      {/* وقت الإجابة الثالث */}
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-3">وقت الإجابة الثالث</h4>
                        <div className="flex flex-wrap gap-3 mb-3">
                          {Array.isArray(form.watch('answerTimeOptions.third.options')) && 
                            form.watch('answerTimeOptions.third.options').map((time, index) => (
                            <div 
                              key={`third-${index}`} 
                              className={`bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1 ${
                                form.watch('answerTimeOptions.third.default') === time ? 'border-2 border-primary' : ''
                              }`}
                            >
                              <span>{time} ثانية</span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-green-100"
                                  onClick={() => {
                                    form.setValue('answerTimeOptions.third.default', time);
                                  }}
                                  title="تعيين كافتراضي"
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.third.default') === time}
                                >
                                  <span className="sr-only">تعيين كافتراضي</span>
                                  {form.watch('answerTimeOptions.third.default') === time ? '✓' : '*'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-red-100"
                                  onClick={() => {
                                    const options = form.watch('answerTimeOptions.third.options');
                                    if (Array.isArray(options)) {
                                      const currentOptions = [...options];
                                      if (form.watch('answerTimeOptions.third.default') === currentOptions[index]) {
                                        return;
                                      }
                                      currentOptions.splice(index, 1);
                                      form.setValue('answerTimeOptions.third.options', currentOptions);
                                    }
                                  }}
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.third.default') === time}
                                >
                                  <span className="sr-only">حذف</span>
                                  &times;
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="أضف وقت جديد بالثواني"
                            className="max-w-[200px]"
                            id="newTimeForThird"
                            min={5}
                            max={120}
                            defaultValue=""
                            key="newTimeForThird"
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              try {
                                const input = document.getElementById('newTimeForThird') as HTMLInputElement;
                                const newTime = parseInt(input.value);
                                
                                if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                  console.log('القيمة المدخلة غير صالحة');
                                  return;
                                }
                                
                                // التأكد من وجود قيمة في options
                                let currentOptions = form.watch('answerTimeOptions.third.options');
                                if (!Array.isArray(currentOptions) || currentOptions === undefined) {
                                  currentOptions = [];
                                }
                                
                                // التأكد من عدم وجود القيمة مسبقًا
                                if (!currentOptions.includes(newTime)) {
                                  // إضافة القيمة الجديدة وترتيب المصفوفة
                                  const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                  
                                  // تعيين القيمة الجديدة في النموذج
                                  form.setValue('answerTimeOptions.third.options', newOptions);
                                  
                                  // تعيين القيمة الافتراضية إذا كانت غير موجودة
                                  if (form.watch('answerTimeOptions.third.default') === undefined) {
                                    form.setValue('answerTimeOptions.third.default', newTime);
                                  }
                                  
                                  // تفريغ حقل الإدخال
                                  input.value = '';
                                  console.log('تمت إضافة القيمة:', newTime);
                                }
                              } catch (error) {
                                console.error('خطأ في إضافة وقت جديد:', error);
                              }
                            }}
                            disabled={!form.watch('timerEnabled')}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      {/* وقت الإجابة الرابع */}
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-3">وقت الإجابة الرابع</h4>
                        <div className="flex flex-wrap gap-3 mb-3">
                          {Array.isArray(form.watch('answerTimeOptions.fourth.options')) && 
                            form.watch('answerTimeOptions.fourth.options').map((time, index) => (
                            <div 
                              key={`fourth-${index}`} 
                              className={`bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1 ${
                                form.watch('answerTimeOptions.fourth.default') === time ? 'border-2 border-primary' : ''
                              }`}
                            >
                              <span>{time} ثانية</span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-green-100"
                                  onClick={() => {
                                    form.setValue('answerTimeOptions.fourth.default', time);
                                  }}
                                  title="تعيين كافتراضي"
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.fourth.default') === time}
                                >
                                  <span className="sr-only">تعيين كافتراضي</span>
                                  {form.watch('answerTimeOptions.fourth.default') === time ? '✓' : '*'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full hover:bg-red-100"
                                  onClick={() => {
                                    const options = form.watch('answerTimeOptions.fourth.options');
                                    if (Array.isArray(options)) {
                                      const currentOptions = [...options];
                                      if (form.watch('answerTimeOptions.fourth.default') === currentOptions[index]) {
                                        return;
                                      }
                                      currentOptions.splice(index, 1);
                                      form.setValue('answerTimeOptions.fourth.options', currentOptions);
                                    }
                                  }}
                                  disabled={!form.watch('timerEnabled') || form.watch('answerTimeOptions.fourth.default') === time}
                                >
                                  <span className="sr-only">حذف</span>
                                  &times;
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="أضف وقت جديد بالثواني"
                            className="max-w-[200px]"
                            id="newTimeForFourth"
                            min={5}
                            max={120}
                            defaultValue=""
                            key="newTimeForFourth"
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              try {
                                const input = document.getElementById('newTimeForFourth') as HTMLInputElement;
                                const newTime = parseInt(input.value);
                                
                                if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                  console.log('القيمة المدخلة غير صالحة');
                                  return;
                                }
                                
                                // التأكد من وجود قيمة في options
                                let currentOptions = form.watch('answerTimeOptions.fourth.options');
                                if (!Array.isArray(currentOptions) || currentOptions === undefined) {
                                  currentOptions = [];
                                }
                                
                                // التأكد من عدم وجود القيمة مسبقًا
                                if (!currentOptions.includes(newTime)) {
                                  // إضافة القيمة الجديدة وترتيب المصفوفة
                                  const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                  
                                  // تعيين القيمة الجديدة في النموذج
                                  form.setValue('answerTimeOptions.fourth.options', newOptions);
                                  
                                  // تعيين القيمة الافتراضية إذا كانت غير موجودة
                                  if (form.watch('answerTimeOptions.fourth.default') === undefined) {
                                    form.setValue('answerTimeOptions.fourth.default', newTime);
                                  }
                                  
                                  // تفريغ حقل الإدخال
                                  input.value = '';
                                  console.log('تمت إضافة القيمة:', newTime);
                                }
                              } catch (error) {
                                console.error('خطأ في إضافة وقت جديد:', error);
                              }
                            }}
                            disabled={!form.watch('timerEnabled')}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 border border-yellow-200 rounded-md text-sm">
                        <p className="mb-2 font-medium">ملاحظات:</p>
                        <ul className="list-disc list-inside space-y-1 text-yellow-700">
                          <li>الأوقات معروضة بالثواني</li>
                          <li>لا يمكن حذف الوقت المحدد كافتراضي (المحدد بعلامة ✓)</li>
                          <li>يمكن تغيير الوقت الافتراضي بالضغط على "*" بجانب الوقت المطلوب</li>
                          <li>هذه الأوقات ستظهر للمستخدمين عند إنشاء لعبة جديدة</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* أوقات الإجابة القديمة - مخفية للتوافق مع النسخ القديمة */}
                    <div className="hidden">
                      <input
                        type="hidden"
                        {...form.register('answerTimesFor2Teams')}
                      />
                      <input
                        type="hidden"
                        {...form.register('answerTimesFor3Teams')}
                      />
                      <input
                        type="hidden"
                        {...form.register('answerTimesFor4Teams')}
                      />
                    </div>
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
                    <h3 className="text-lg font-medium">إعدادات وسيلة تخطي السؤال</h3>
                    
                    <FormField
                      control={form.control}
                      name="skipQuestionEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل تخطي السؤال
                            </FormLabel>
                            <FormDescription>
                              السماح للفرق بتخطي سؤال صعب
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
                          <FormLabel>عدد مرات التخطي المسموح بها</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!form.watch('helpToolsEnabled') || !form.watch('skipQuestionEnabled')}
                            />
                          </FormControl>
                          <FormDescription>
                            عدد المرات التي يمكن فيها تخطي سؤال لكل فريق
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات وسيلة خصم النقاط</h3>
                    
                    <FormField
                      control={form.control}
                      name="pointDeductionEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل خصم النقاط
                            </FormLabel>
                            <FormDescription>
                              السماح للفرق بخصم نقاط من الفريق المنافس
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
                      name="pointDeductionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد مرات الخصم المسموح بها</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!form.watch('helpToolsEnabled') || !form.watch('pointDeductionEnabled')}
                            />
                          </FormControl>
                          <FormDescription>
                            عدد المرات التي يمكن فيها خصم نقاط لكل فريق
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
                          <FormLabel>مقدار النقاط المخصومة</FormLabel>
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
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات وسيلة عكس الدور</h3>
                    
                    <FormField
                      control={form.control}
                      name="turnReverseEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              تفعيل عكس الدور
                            </FormLabel>
                            <FormDescription>
                              السماح للفرق بعكس الدور وإرجاعه للفريق المنافس
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
                          <FormLabel>عدد مرات العكس المسموح بها</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!form.watch('helpToolsEnabled') || !form.watch('turnReverseEnabled')}
                            />
                          </FormControl>
                          <FormDescription>
                            عدد المرات التي يمكن فيها عكس الدور لكل فريق
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* إعدادات النتائج والسجل */}
                <TabsContent value="results" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات النتائج النهائية</h3>
                    
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
                              تفعيل تأثير الاحتفال
                            </FormLabel>
                            <FormDescription>
                              عرض تأثير الاحتفال للفريق الفائز
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
                              عرض رسوم متحركة للفريق الفائز
                            </FormLabel>
                            <FormDescription>
                              عرض رسوم متحركة خاصة للفريق الفائز في نهاية اللعبة
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
              
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
                {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}