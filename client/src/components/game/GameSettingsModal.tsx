import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import axios from 'axios';

interface GameSettings {
  minTeams: number;
  maxTeams: number;
  maxGameNameLength: number;
  maxTeamNameLength: number;
  defaultFirstAnswerTime: number;
  defaultSecondAnswerTime: number;
  modalTitle: string;
  minCategories: number;
  maxCategories: number;
}

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
}

interface GameSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: CategoryChild[];
}

// زود سكيما للتحقق من صحة البيانات
const formSchema = z.object({
  gameName: z.string()
    .min(1, { message: "يرجى إدخال اسم للعبة" })
    .max(30, { message: "يجب أن لا يتجاوز اسم اللعبة 30 حرفاً" }),
  teamCount: z.string(),
  teamNames: z.array(
    z.string()
      .min(1, { message: "يرجى إدخال اسم للفريق" })
      .max(20, { message: "يجب أن لا يتجاوز اسم الفريق 20 حرفاً" })
  ),
  answerTimeFirst: z.string()
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 10 && num <= 300;
    }, { message: "يجب أن يكون وقت الإجابة الأولى بين 10 و 300 ثانية" }),
  answerTimeSecond: z.string()
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 5 && num <= 60;
    }, { message: "يجب أن يكون وقت الإجابة الثانية بين 5 و 60 ثانية" }),
});

type FormValues = z.infer<typeof formSchema>;

export function GameSettingsModal({
  open,
  onOpenChange,
  selectedCategories
}: GameSettingsModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  // إعداد نموذج React Hook Form مع التحقق باستخدام Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameName: "لعبتي الجديدة",
      teamCount: "2",
      teamNames: ["الفريق الأول", "الفريق الثاني", "الفريق الثالث", "الفريق الرابع"],
      answerTimeFirst: "30",
      answerTimeSecond: "15",
    },
  });

  // جلب إعدادات اللعبة عند فتح المودال
  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try {
          const response = await axios.get('/api/game-settings');
          setSettings(response.data);
          
          // تحديث القيم الافتراضية بناءً على الإعدادات المستلمة
          form.setValue("answerTimeFirst", response.data.defaultFirstAnswerTime.toString());
          form.setValue("answerTimeSecond", response.data.defaultSecondAnswerTime.toString());
        } catch (error) {
          console.error('Error fetching game settings:', error);
          toast({
            title: "خطأ",
            description: "فشل في تحميل إعدادات اللعبة",
            variant: "destructive"
          });
        }
      };
      
      fetchSettings();
    }
  }, [open, toast, form]);

  // متابعة عدد الفرق وتحديث أسماء الفرق
  const watchTeamCount = form.watch("teamCount");
  
  // عند تغيير عدد الفرق، نتأكد من توفر أسماء كافية للفرق
  useEffect(() => {
    const count = parseInt(watchTeamCount, 10);
    const currentTeamNames = form.getValues("teamNames");
    
    // إذا كان عدد الأسماء أقل من عدد الفرق المطلوبة، نضيف أسماء افتراضية
    if (currentTeamNames.length < count) {
      const newTeamNames = [...currentTeamNames];
      for (let i = currentTeamNames.length; i < count; i++) {
        newTeamNames.push(`الفريق ${i + 1}`);
      }
      form.setValue("teamNames", newTeamNames);
    }
  }, [watchTeamCount, form]);
  
  // معالجة تقديم النموذج
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    
    try {
      const numTeams = parseInt(data.teamCount, 10);
      
      // استخدام أسماء الفرق من النموذج
      const teamNames = data.teamNames
        .slice(0, numTeams)
        .map(name => ({ name }));
      
      // إنشاء بيانات جلسة اللعبة
      const gameData = {
        gameName: data.gameName,
        teams: teamNames,
        teamsCount: numTeams,
        firstAnswerTime: parseInt(data.answerTimeFirst, 10),
        secondAnswerTime: parseInt(data.answerTimeSecond, 10),
        selectedCategories: selectedCategories.map(cat => cat.id)
      };
      
      // تحديث نقطة النهاية للإنشاء إلى الصحيحة حسب المواصفات
      const response = await axios.post('/api/create-game', gameData);
      
      // تخزين جلسة اللعبة في التخزين المحلي للوصول السهل
      localStorage.setItem('currentGameSession', JSON.stringify({
        id: response.data.id,
        ...gameData
      }));
      
      toast({
        title: "تم إنشاء اللعبة",
        description: "جاري الانتقال إلى صفحة اللعب"
      });
      
      // الانتقال إلى صفحة اللعب
      navigate('/play');
    } catch (error) {
      console.error('Error creating game session:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء اللعبة، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!settings) {
    return null;
  }
  
  // إعداد خيارات عدد الفرق
  const teamOptions: JSX.Element[] = [];
  for (let i = settings.minTeams; i <= settings.maxTeams; i++) {
    teamOptions.push(
      <SelectItem key={i} value={i.toString()}>{i} فرق</SelectItem>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-4">
            {settings.modalTitle}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">
            قم بإعداد معلومات اللعبة الأساسية قبل البدء
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* اسم اللعبة */}
            <FormField
              control={form.control}
              name="gameName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>اسم اللعبة</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="أدخل اسماً للعبة"
                      maxLength={settings.maxGameNameLength}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    الحد الأقصى: {settings.maxGameNameLength} حرف
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* عدد الفرق */}
            <FormField
              control={form.control}
              name="teamCount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>عدد الفرق</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر عدد الفرق" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamOptions}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* أسماء الفرق */}
            <div className="space-y-3 border border-gray-200 rounded-md p-3 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">أسماء الفرق</h3>
              {watchTeamCount && Array.from({ length: parseInt(watchTeamCount, 10) }).map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`teamNames.${index}`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-gray-600">
                        الفريق {index + 1}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`اسم الفريق ${index + 1}`}
                          maxLength={settings.maxTeamNameLength}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ))}
              <p className="text-xs text-gray-500">
                الحد الأقصى لاسم الفريق: {settings.maxTeamNameLength} حرف
              </p>
            </div>
            
            {/* وقت الإجابة الأولى */}
            <FormField
              control={form.control}
              name="answerTimeFirst"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>وقت الإجابة الأولى (ثانية)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={10}
                      max={300}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    من 10 إلى 300 ثانية
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* وقت الإجابة الثانية */}
            <FormField
              control={form.control}
              name="answerTimeSecond"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>وقت الإجابة الثانية (ثانية)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={60}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    من 5 إلى 60 ثانية
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* زر بدء اللعبة */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded mt-4"
            >
              {loading ? 'جاري الإنشاء...' : 'ابدأ اللعبة'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}