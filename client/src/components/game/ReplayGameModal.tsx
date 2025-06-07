import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogContent
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from '../../hooks/use-toast';
import { Badge } from "../ui/badge";
import { Users, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";

interface GameCategory {
  id: number;
  name: string;
  icon: string;
}

interface GameSettings {
  allowedFirstAnswerTimes: number[];
  allowedSecondAnswerTimes: number[];
  maxTeamNameLength: number;
  minTeams: number;
  maxTeams: number;
}

interface ReplayGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: {
    id: string;
    name: string;
    categories: GameCategory[];
    teamsCount: number;
    answerTimeFirst: number;
    answerTimeSecond: number;
  };
}

export default function ReplayGameModal({ open, onOpenChange, game }: ReplayGameProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // تعريف أنماط CSS المشتركة
  const inputClasses = "h-8 text-xs";
  const smallButtonClasses = "text-xs h-8";
  
  // الحصول على إعدادات اللعبة من API
  const { data: gameSettings, isLoading: isLoadingSettings } = useQuery<GameSettings>({
    queryKey: ['/api/game-settings'],
    enabled: open, // تنفيذ الاستعلام فقط عندما يكون المودال مفتوحاً
  });

  // إنشاء سكيما للتحقق من صحة النموذج
  const formSchema = z.object({
    teamNames: z.array(
      z.string()
        .min(1, { message: "يرجى إدخال اسم للفريق" })
        .max(gameSettings?.maxTeamNameLength || 45, { 
          message: `يجب أن لا يتجاوز اسم الفريق ${gameSettings?.maxTeamNameLength || 45} حرفاً` 
        })
    ).min(game.teamsCount, { message: `يجب إدخال ${game.teamsCount} أسماء للفرق على الأقل` }),
    answerTimeFirst: z.string(),
    answerTimeSecond: z.string(),
  });

  // تعريف نوع لقيم النموذج
  type FormSchemaType = z.infer<typeof formSchema>;
  
  // إعداد نموذج React Hook Form
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamNames: Array(game.teamsCount).fill("").map((_, idx) => `الفريق ${idx + 1}`),
      answerTimeFirst: game.answerTimeFirst.toString(),
      answerTimeSecond: game.answerTimeSecond.toString(),
    },
  });

  // تقديم النموذج
  const onSubmit = async (values: FormSchemaType) => {
    setLoading(true);
    setFormError(null);
    
    try {
      // إنشاء بيانات اللعبة الجديدة مع توليد اسم اللعبة تلقائيًا
      const replayData = {
        originalGameId: game.id,
        gameName: `${game.name} (إعادة)`, // هذا سيتم إنشاؤه تلقائيًا وليس من النموذج
        ...values, // نستخدم باقي قيم النموذج كما هي
        answerTimeFirst: parseInt(values.answerTimeFirst),
        answerTimeSecond: parseInt(values.answerTimeSecond),
      };

      // إرسال الطلب إلى الخادم
      const response = await axios.post('/api/replay-game', replayData);

      toast({
        title: "تم إنشاء اللعبة",
        description: "جاري الانتقال إلى صفحة اللعب",
      });

      // تخزين معلومات اللعبة في localStorage
      localStorage.setItem('currentGameSession', JSON.stringify(response.data));

      // الانتقال إلى صفحة اللعب
      navigate('/play');
    } catch (error: any) {
      console.error('Error replaying game:', error);
      
      // عرض رسالة الخطأ من الخادم إذا كانت متوفرة
      const errorMessage = error.response?.data?.message || 
        "حدث خطأ أثناء إعادة اللعبة، يرجى المحاولة مرة أخرى";
      
      setFormError(errorMessage);
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:rounded-lg p-3" dir="rtl">
        <DialogHeader className="pb-1.5">
          <DialogTitle className="text-lg font-bold text-center">اللعب مجدداً</DialogTitle>
        </DialogHeader>
        
        {isLoadingSettings && (
          <div className="py-2 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <p className="text-sm">جاري تحميل إعدادات اللعبة...</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {game.categories.map((category) => (
            <Badge key={category.id} className="bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-full border-0 px-2 py-0.5 text-xs">
              <span className="mr-0.5">{category.icon}</span>
              {category.name}
            </Badge>
          ))}
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 ml-2" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5">

            {/* أسماء الفرق */}
            <div className="space-y-1.5 border border-gray-200 rounded-md p-2 bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-medium text-gray-700">أسماء الفرق</h3>
                <Badge variant="outline" className="bg-blue-50 text-xs px-1.5 py-0.5 h-5">
                  <Users className="h-2.5 w-2.5 mr-0.5" />
                  {game.teamsCount} فرق
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Array.from({ length: game.teamsCount }).map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`teamNames.${index}`}
                    render={({ field }) => (
                      <FormItem className="space-y-0.5">
                        <FormLabel className="text-xs text-gray-600 block mb-0">
                          الفريق {index + 1}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`اسم الفريق ${index + 1}`}
                            maxLength={gameSettings?.maxTeamNameLength || 45}
                            {...field}
                            className={`${inputClasses} py-1 px-2`}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

            </div>

            <div className="space-y-1.5 border border-gray-200 rounded-md p-2 bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-medium text-gray-700">أوقات الإجابة</h3>
                <Badge variant="outline" className="bg-blue-50 text-xs px-1.5 py-0.5 h-5">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  وقت الإجابة
                </Badge>
              </div>
            
              {/* وقت الإجابة الأولى */}
              <FormField
                control={form.control}
                name="answerTimeFirst"
                render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-xs text-gray-600 block mb-0">وقت الإجابة الأولى</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر الوقت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(gameSettings?.allowedFirstAnswerTimes || [15, 30, 45, 60]).map((time) => (
                          <SelectItem key={time} value={time.toString()} className="text-xs">
                            {time} ثانية
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* وقت الإجابة الثانية */}
              <FormField
                control={form.control}
                name="answerTimeSecond"
                render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-xs text-gray-600 block mb-0">وقت الإجابة الثانية</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر الوقت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(gameSettings?.allowedSecondAnswerTimes || [10, 15, 20, 30]).map((time) => (
                          <SelectItem key={time} value={time.toString()} className="text-xs">
                            {time} ثانية
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-between mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                size="sm"
                className={smallButtonClasses}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={loading || isLoadingSettings}
                className={`bg-green-600 hover:bg-green-700 text-white ${smallButtonClasses}`}
                size="sm"
              >
                {loading ? 'جاري الإنشاء...' : 'بدء اللعبة'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
