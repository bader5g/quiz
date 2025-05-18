import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import SafeNumberInput from '@/components/SafeNumberInput';

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

// تعريف هيكل مخطط إعدادات اللعبة الكامل
const gameSettingsSchema = gameSettingsBaseSchema.extend({
  timerEnabled: z.boolean().default(true),
  showTimerAnimation: z.boolean().default(true),
  pauseTimerOnQuestionView: z.boolean().default(false),
  enableTimerSounds: z.boolean().default(true),
  lowTimeThreshold: z.number().min(1).max(10).default(5),
  timerDisplayFormat: z.string().default('digital'),
  
  helpToolsEnabled: z.boolean().default(true),
  onlyEnabledForTwoTeams: z.boolean().default(true),
  skipQuestionEnabled: z.boolean().default(true),
  skipQuestionCount: z.number().min(0).max(10).default(1),
  pointDeductionEnabled: z.boolean().default(true),
  pointDeductionCount: z.number().min(0).max(10).default(1),
  pointDeductionAmount: z.number().min(0).max(100).default(50),
  turnReverseEnabled: z.boolean().default(true),
  turnReverseCount: z.number().min(0).max(10).default(1),
  
  showFinalResults: z.boolean().default(true),
  enableConfetti: z.boolean().default(true),
  showAnswerStats: z.boolean().default(true),
  showGameLog: z.boolean().default(true),
  gameLogVisibility: z.string().default('all'),
  showTeamScoresDuringGame: z.boolean().default(true),
  showWinningTeamAnimation: z.boolean().default(true),
  saveGameHistory: z.boolean().default(true),
  historyRetentionDays: z.number().min(1).max(365).default(30),
  
  answerTimeOptions: z.object({
    first: answerTimeOptionSchema,
    second: answerTimeOptionSchema,
    third: answerTimeOptionSchema,
    fourth: answerTimeOptionSchema
  })
});

// استنتاج نوع بيانات إعدادات اللعبة من المخطط
type GameSettingsFormValues = z.infer<typeof gameSettingsSchema>;

export default function GameSettingsManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // متغيرات حالة لإضافة قيم جديدة لخيارات الوقت
  const [newTimeForFirst, setNewTimeForFirst] = useState('');
  const [newTimeForSecond, setNewTimeForSecond] = useState('');
  const [newTimeForThird, setNewTimeForThird] = useState('');
  const [newTimeForFourth, setNewTimeForFourth] = useState('');
  
  // تهيئة نموذج الإعدادات
  const form = useForm<GameSettingsFormValues>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: {
      minCategories: 4,
      maxCategories: 8, 
      minTeams: 2,
      maxTeams: 4,
      maxGameNameLength: 45,
      maxTeamNameLength: 30,
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
        
        // تحديث النموذج بالبيانات المستلمة وضمان أن جميع الحقول لها قيم أولية
        console.log("البيانات المستلمة من الخادم:", data);
        form.reset({
          ...data,
          // ضمان أن جميع الحقول لها قيم افتراضية لتجنب تحويلها من غير متحكم بها إلى متحكم بها
          minCategories: data.minCategories ?? 4,
          maxCategories: data.maxCategories ?? 8,
          minTeams: data.minTeams ?? 2,
          maxTeams: data.maxTeams ?? 4,
          maxGameNameLength: data.maxGameNameLength ?? 50,
          maxTeamNameLength: data.maxTeamNameLength ?? 30,
          defaultFirstAnswerTime: data.defaultFirstAnswerTime ?? 30,
          defaultSecondAnswerTime: data.defaultSecondAnswerTime ?? 20,
          minQuestionsPerCategory: data.minQuestionsPerCategory ?? 5,
          modalTitle: data.modalTitle ?? '',
          pageDescription: data.pageDescription ?? '',
          timerEnabled: data.timerEnabled !== undefined ? data.timerEnabled : true,
          helpToolsEnabled: data.helpToolsEnabled !== undefined ? data.helpToolsEnabled : true,
          answerTimeOptions: data.answerTimeOptions ?? {
            first: { default: 30, options: [10, 20, 30, 45, 60, 90] },
            second: { default: 20, options: [5, 10, 15, 20, 30] },
            third: { default: 15, options: [5, 10, 15, 20, 30] },
            fourth: { default: 10, options: [5, 10, 15, 20] }
          }
        });
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
      
      console.log("بدء عملية حفظ الإعدادات:", values);
      
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

      // معالجة خيارات أوقات الإجابة للتأكد من صحة البيانات
      const answerTimeOptions = {
        first: {
          default: Number(values.answerTimeOptions?.first?.default) || 30,
          options: values.answerTimeOptions?.first?.options || [10, 20, 30, 45, 60, 90]
        },
        second: {
          default: Number(values.answerTimeOptions?.second?.default) || 15,
          options: values.answerTimeOptions?.second?.options || [5, 10, 15, 20, 30]
        },
        third: {
          default: Number(values.answerTimeOptions?.third?.default) || 10,
          options: values.answerTimeOptions?.third?.options || [5, 10, 15, 20]
        },
        fourth: {
          default: Number(values.answerTimeOptions?.fourth?.default) || 5,
          options: values.answerTimeOptions?.fourth?.options || [5, 10, 15]
        }
      };
      
      console.log('أوقات الإجابة للإرسال (بعد المعالجة):', answerTimeOptions);

      // إعداد البيانات للإرسال مع التأكد من تحويل أنواع البيانات بشكل صحيح
      const gameSettingsData = {
        minCategories: Number(values.minCategories),
        maxCategories: Number(values.maxCategories),
        minTeams: Number(values.minTeams),
        maxTeams: Number(values.maxTeams),
        maxGameNameLength: Number(values.maxGameNameLength),
        maxTeamNameLength: Number(values.maxTeamNameLength),
        defaultFirstAnswerTime: Number(values.defaultFirstAnswerTime),
        defaultSecondAnswerTime: Number(values.defaultSecondAnswerTime),
        modalTitle: String(values.modalTitle || ''),
        pageDescription: String(values.pageDescription || ''),
        timerEnabled: Boolean(values.timerEnabled),
        helpToolsEnabled: Boolean(values.helpToolsEnabled),
        minQuestionsPerCategory: values.minQuestionsPerCategory ? Number(values.minQuestionsPerCategory) : undefined,
        answerTimeOptions: answerTimeOptions
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={1}
                                max={20}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={1}
                                max={20}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={1}
                                max={20}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={2}
                                max={10}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={2}
                                max={10}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={10}
                                max={120}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={5}
                                max={60}
                              />
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
                              <Input 
                                value={field.value ?? ''} 
                                onChange={field.onChange}
                              />
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
                              <Input 
                                value={field.value ?? ''} 
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              الوصف المعروض أسفل العنوان في صفحة اختيار الفئات
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maxGameNameLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحد الأقصى لطول اسم اللعبة</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={5}
                                max={100}
                              />
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
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={3}
                                max={50}
                              />
                            </FormControl>
                            <FormDescription>
                              أقصى عدد من الأحرف المسموح بها لاسم الفريق
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">تفعيل المؤقت</h3>
                      <p className="text-sm text-muted-foreground">
                        تفعيل حساب الوقت وإظهار المؤقت أثناء اللعب
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="timerEnabled"
                      render={({ field }) => (
                        <FormItem>
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
                    <h3 className="text-lg font-medium">خيارات أوقات الإجابة</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-medium mb-2">وقت الإجابة للفريقين</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {form.watch('answerTimeOptions.first.options')?.map((time) => (
                            <div key={time} className="flex items-center">
                              <div 
                                className={`py-1 px-3 rounded-md ${form.watch('answerTimeOptions.first.default') === time ? 'bg-primary text-white' : 'bg-secondary'}`}
                                onClick={() => {
                                  if (form.watch('timerEnabled')) {
                                    form.setValue('answerTimeOptions.first.default', time);
                                  }
                                }}
                              >
                                {time} ثانية
                              </div>
                              <div className="ml-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    if (!form.watch('timerEnabled')) return;
                                    
                                    const currentOptions = form.getValues('answerTimeOptions.first.options') || [];
                                    
                                    // التأكد من عدم حذف القيمة الافتراضية
                                    if (form.watch('answerTimeOptions.first.default') === time) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'لا يمكن حذف الوقت المحدد',
                                        description: 'لا يمكن حذف الوقت المحدد كافتراضي حالياً'
                                      });
                                      return;
                                    }
                                    
                                    // التأكد من وجود خيارات كافية
                                    if (currentOptions.length <= 1) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'غير مسموح',
                                        description: 'يجب أن يكون هناك خيار واحد على الأقل'
                                      });
                                      return;
                                    }
                                    
                                    // حذف القيمة من المصفوفة
                                    const newOptions = currentOptions.filter(t => t !== time);
                                    form.setValue('answerTimeOptions.first.options', newOptions);
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
                            value={newTimeForFirst || ''}
                            onChange={(e) => setNewTimeForFirst(e.target.value)}
                            min={5}
                            max={120}
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              // التحقق من القيمة
                              const newTime = parseInt(newTimeForFirst);
                              
                              if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                console.log('القيمة المدخلة غير صالحة');
                                return;
                              }
                              
                              // الحصول على الخيارات الحالية
                              const currentOptions = form.getValues('answerTimeOptions.first.options') || [];
                              
                              // التأكد من عدم وجود القيمة مسبقًا
                              if (!currentOptions.includes(newTime)) {
                                // إنشاء مصفوفة جديدة مرتبة
                                const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                
                                // تحديث قيمة الخيارات
                                form.setValue('answerTimeOptions.first.options', newOptions);
                                
                                // إذا لم تكن هناك قيمة افتراضية، نضع هذه القيمة كافتراضية
                                if (!form.getValues('answerTimeOptions.first.default')) {
                                  form.setValue('answerTimeOptions.first.default', newTime);
                                }
                                
                                // تفريغ الحقل
                                setNewTimeForFirst('');
                                console.log('تمت إضافة القيمة:', newTime);
                              }
                            }}
                            disabled={!form.watch('timerEnabled') || !newTimeForFirst || isNaN(parseInt(newTimeForFirst))}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium mb-2">وقت الإجابة لثلاثة فرق</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {form.watch('answerTimeOptions.second.options')?.map((time) => (
                            <div key={time} className="flex items-center">
                              <div 
                                className={`py-1 px-3 rounded-md ${form.watch('answerTimeOptions.second.default') === time ? 'bg-primary text-white' : 'bg-secondary'}`}
                                onClick={() => {
                                  if (form.watch('timerEnabled')) {
                                    form.setValue('answerTimeOptions.second.default', time);
                                  }
                                }}
                              >
                                {time} ثانية
                              </div>
                              <div className="ml-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    if (!form.watch('timerEnabled')) return;
                                    
                                    const currentOptions = form.getValues('answerTimeOptions.second.options') || [];
                                    
                                    // التأكد من عدم حذف القيمة الافتراضية
                                    if (form.watch('answerTimeOptions.second.default') === time) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'لا يمكن حذف الوقت المحدد',
                                        description: 'لا يمكن حذف الوقت المحدد كافتراضي حالياً'
                                      });
                                      return;
                                    }
                                    
                                    // التأكد من وجود خيارات كافية
                                    if (currentOptions.length <= 1) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'غير مسموح',
                                        description: 'يجب أن يكون هناك خيار واحد على الأقل'
                                      });
                                      return;
                                    }
                                    
                                    // حذف القيمة من المصفوفة
                                    const newOptions = currentOptions.filter(t => t !== time);
                                    form.setValue('answerTimeOptions.second.options', newOptions);
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
                            value={newTimeForSecond || ''}
                            onChange={(e) => setNewTimeForSecond(e.target.value)}
                            min={5}
                            max={120}
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              // التحقق من القيمة
                              const newTime = parseInt(newTimeForSecond);
                              
                              if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                console.log('القيمة المدخلة غير صالحة');
                                return;
                              }
                              
                              // الحصول على الخيارات الحالية
                              const currentOptions = form.getValues('answerTimeOptions.second.options') || [];
                              
                              // التأكد من عدم وجود القيمة مسبقًا
                              if (!currentOptions.includes(newTime)) {
                                // إنشاء مصفوفة جديدة مرتبة
                                const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                
                                // تحديث قيمة الخيارات
                                form.setValue('answerTimeOptions.second.options', newOptions);
                                
                                // إذا لم تكن هناك قيمة افتراضية، نضع هذه القيمة كافتراضية
                                if (!form.getValues('answerTimeOptions.second.default')) {
                                  form.setValue('answerTimeOptions.second.default', newTime);
                                }
                                
                                // تفريغ الحقل
                                setNewTimeForSecond('');
                                console.log('تمت إضافة القيمة:', newTime);
                              }
                            }}
                            disabled={!form.watch('timerEnabled') || !newTimeForSecond || isNaN(parseInt(newTimeForSecond))}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium mb-2">وقت الإجابة لأربعة فرق</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {form.watch('answerTimeOptions.third.options')?.map((time) => (
                            <div key={time} className="flex items-center">
                              <div 
                                className={`py-1 px-3 rounded-md ${form.watch('answerTimeOptions.third.default') === time ? 'bg-primary text-white' : 'bg-secondary'}`}
                                onClick={() => {
                                  if (form.watch('timerEnabled')) {
                                    form.setValue('answerTimeOptions.third.default', time);
                                  }
                                }}
                              >
                                {time} ثانية
                              </div>
                              <div className="ml-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    if (!form.watch('timerEnabled')) return;
                                    
                                    const currentOptions = form.getValues('answerTimeOptions.third.options') || [];
                                    
                                    // التأكد من عدم حذف القيمة الافتراضية
                                    if (form.watch('answerTimeOptions.third.default') === time) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'لا يمكن حذف الوقت المحدد',
                                        description: 'لا يمكن حذف الوقت المحدد كافتراضي حالياً'
                                      });
                                      return;
                                    }
                                    
                                    // التأكد من وجود خيارات كافية
                                    if (currentOptions.length <= 1) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'غير مسموح',
                                        description: 'يجب أن يكون هناك خيار واحد على الأقل'
                                      });
                                      return;
                                    }
                                    
                                    // حذف القيمة من المصفوفة
                                    const newOptions = currentOptions.filter(t => t !== time);
                                    form.setValue('answerTimeOptions.third.options', newOptions);
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
                            value={newTimeForThird || ''}
                            onChange={(e) => setNewTimeForThird(e.target.value)}
                            min={5}
                            max={120}
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              // التحقق من القيمة
                              const newTime = parseInt(newTimeForThird);
                              
                              if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                console.log('القيمة المدخلة غير صالحة');
                                return;
                              }
                              
                              // الحصول على الخيارات الحالية
                              const currentOptions = form.getValues('answerTimeOptions.third.options') || [];
                              
                              // التأكد من عدم وجود القيمة مسبقًا
                              if (!currentOptions.includes(newTime)) {
                                // إنشاء مصفوفة جديدة مرتبة
                                const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                
                                // تحديث قيمة الخيارات
                                form.setValue('answerTimeOptions.third.options', newOptions);
                                
                                // إذا لم تكن هناك قيمة افتراضية، نضع هذه القيمة كافتراضية
                                if (!form.getValues('answerTimeOptions.third.default')) {
                                  form.setValue('answerTimeOptions.third.default', newTime);
                                }
                                
                                // تفريغ الحقل
                                setNewTimeForThird('');
                                console.log('تمت إضافة القيمة:', newTime);
                              }
                            }}
                            disabled={!form.watch('timerEnabled') || !newTimeForThird || isNaN(parseInt(newTimeForThird))}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium mb-2">وقت الإجابة السريعة</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {form.watch('answerTimeOptions.fourth.options')?.map((time) => (
                            <div key={time} className="flex items-center">
                              <div 
                                className={`py-1 px-3 rounded-md ${form.watch('answerTimeOptions.fourth.default') === time ? 'bg-primary text-white' : 'bg-secondary'}`}
                                onClick={() => {
                                  if (form.watch('timerEnabled')) {
                                    form.setValue('answerTimeOptions.fourth.default', time);
                                  }
                                }}
                              >
                                {time} ثانية
                              </div>
                              <div className="ml-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    if (!form.watch('timerEnabled')) return;
                                    
                                    const currentOptions = form.getValues('answerTimeOptions.fourth.options') || [];
                                    
                                    // التأكد من عدم حذف القيمة الافتراضية
                                    if (form.watch('answerTimeOptions.fourth.default') === time) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'لا يمكن حذف الوقت المحدد',
                                        description: 'لا يمكن حذف الوقت المحدد كافتراضي حالياً'
                                      });
                                      return;
                                    }
                                    
                                    // التأكد من وجود خيارات كافية
                                    if (currentOptions.length <= 1) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'غير مسموح',
                                        description: 'يجب أن يكون هناك خيار واحد على الأقل'
                                      });
                                      return;
                                    }
                                    
                                    // حذف القيمة من المصفوفة
                                    const newOptions = currentOptions.filter(t => t !== time);
                                    form.setValue('answerTimeOptions.fourth.options', newOptions);
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
                            value={newTimeForFourth || ''}
                            onChange={(e) => setNewTimeForFourth(e.target.value)}
                            min={5}
                            max={120}
                            disabled={!form.watch('timerEnabled')}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              // التحقق من القيمة
                              const newTime = parseInt(newTimeForFourth);
                              
                              if (isNaN(newTime) || newTime < 5 || newTime > 120) {
                                console.log('القيمة المدخلة غير صالحة');
                                return;
                              }
                              
                              // الحصول على الخيارات الحالية
                              const currentOptions = form.getValues('answerTimeOptions.fourth.options') || [];
                              
                              // التأكد من عدم وجود القيمة مسبقًا
                              if (!currentOptions.includes(newTime)) {
                                // إنشاء مصفوفة جديدة مرتبة
                                const newOptions = [...currentOptions, newTime].sort((a, b) => a - b);
                                
                                // تحديث قيمة الخيارات
                                form.setValue('answerTimeOptions.fourth.options', newOptions);
                                
                                // إذا لم تكن هناك قيمة افتراضية، نضع هذه القيمة كافتراضية
                                if (!form.getValues('answerTimeOptions.fourth.default')) {
                                  form.setValue('answerTimeOptions.fourth.default', newTime);
                                }
                                
                                // تفريغ الحقل
                                setNewTimeForFourth('');
                                console.log('تمت إضافة القيمة:', newTime);
                              }
                            }}
                            disabled={!form.watch('timerEnabled') || !newTimeForFourth || isNaN(parseInt(newTimeForFourth))}
                          >
                            إضافة
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* خيارات عرض المؤقت */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">خيارات عرض المؤقت</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="showTimerAnimation"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">تحريك المؤقت</FormLabel>
                                <FormDescription>
                                  إظهار رسوم متحركة للمؤقت أثناء العد التنازلي
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
                                <FormLabel className="text-base">إيقاف المؤقت عند عرض السؤال</FormLabel>
                                <FormDescription>
                                  إيقاف المؤقت مؤقتًا عند ظهور السؤال لقراءته
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
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="enableTimerSounds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">أصوات المؤقت</FormLabel>
                                <FormDescription>
                                  تشغيل صوت التكات والتنبيهات عند اقتراب انتهاء الوقت
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
                                <Input 
                                  type="number" 
                                  value={field.value ?? 5} 
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 5)}
                                  min={1}
                                  max={10}
                                  disabled={!form.watch('timerEnabled')}
                                />
                              </FormControl>
                              <FormDescription>
                                عدد الثواني المتبقية عندما يتغير لون المؤقت للتنبيه
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* إعدادات وسائل المساعدة */}
                <TabsContent value="help-tools" className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">تفعيل وسائل المساعدة</h3>
                      <p className="text-sm text-muted-foreground">
                        تفعيل أدوات المساعدة التي يمكن للفرق استخدامها أثناء اللعب
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="helpToolsEnabled"
                      render={({ field }) => (
                        <FormItem>
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
                  
                  <FormField
                    control={form.control}
                    name="onlyEnabledForTwoTeams"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">تفعيل فقط مع فريقين</FormLabel>
                          <FormDescription>
                            تفعيل وسائل المساعدة فقط عندما يكون هناك فريقان متنافسان
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
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* أداة تخطي السؤال */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="skipQuestionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">تخطي السؤال</FormLabel>
                              <FormDescription>
                                السماح للفريق بتخطي سؤال صعب
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
                            <FormLabel>عدد مرات تخطي السؤال</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={1}
                                max={5}
                                disabled={!form.watch('helpToolsEnabled') || !form.watch('skipQuestionEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              عدد المرات المسموح فيها لكل فريق بتخطي سؤال
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* أداة خصم النقاط */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="pointDeductionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">خصم النقاط</FormLabel>
                              <FormDescription>
                                السماح للفريق بخصم نقاط من الفريق المنافس
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
                            <FormLabel>عدد مرات خصم النقاط</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={1}
                                max={5}
                                disabled={!form.watch('helpToolsEnabled') || !form.watch('pointDeductionEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              عدد المرات المسموح فيها لكل فريق بخصم نقاط
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
                            <FormLabel>مقدار خصم النقاط (نسبة مئوية)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={10}
                                max={100}
                                disabled={!form.watch('helpToolsEnabled') || !form.watch('pointDeductionEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              النسبة المئوية للنقاط التي يتم خصمها (من 10% إلى 100%)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* أداة عكس الدور */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="turnReverseEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">عكس الدور</FormLabel>
                              <FormDescription>
                                السماح للفريق بعكس دور اللعب مع الفريق المنافس
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
                            <FormLabel>عدد مرات عكس الدور</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                min={1}
                                max={5}
                                disabled={!form.watch('helpToolsEnabled') || !form.watch('turnReverseEnabled')}
                              />
                            </FormControl>
                            <FormDescription>
                              عدد المرات المسموح فيها لكل فريق بعكس الدور
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
                  <h3 className="text-lg font-medium">إعدادات النتائج</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="showFinalResults"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">عرض النتائج النهائية</FormLabel>
                              <FormDescription>
                                عرض شاشة النتائج النهائية بعد انتهاء اللعبة
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
                              <FormLabel className="text-base">تمكين تأثيرات النصر</FormLabel>
                              <FormDescription>
                                عرض تأثيرات بصرية للاحتفال بالفريق الفائز
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
                        name="showAnswerStats"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">عرض إحصائيات الإجابات</FormLabel>
                              <FormDescription>
                                عرض إحصائيات عن الإجابات الصحيحة والخاطئة في النتائج
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
                              <FormLabel className="text-base">رسوم متحركة للفريق الفائز</FormLabel>
                              <FormDescription>
                                عرض رسوم متحركة خاصة للفريق الفائز عند انتهاء اللعبة
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
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="showTeamScoresDuringGame"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">عرض نقاط الفرق أثناء اللعب</FormLabel>
                              <FormDescription>
                                عرض نقاط كل فريق بشكل مستمر أثناء اللعبة
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
                        name="showGameLog"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">عرض سجل اللعبة</FormLabel>
                              <FormDescription>
                                عرض سجل مفصل للعبة بعد انتهائها
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
                        name="saveGameHistory"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">حفظ سجل اللعبة</FormLabel>
                              <FormDescription>
                                حفظ سجلات الألعاب السابقة للرجوع إليها لاحقًا
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
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 30)}
                                min={1}
                                max={365}
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