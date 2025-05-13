import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import axios from 'axios';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface GameCategory {
  id: number;
  name: string;
  icon: string;
}

interface ReplayGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: {
    id: string;
    name: string;
    categories: GameCategory[];
    teamsCount: number;
  };
}

export default function ReplayGameModal({ open, onOpenChange, game }: ReplayGameProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // إنشاء سكيما للتحقق من صحة النموذج
  const formSchema = z.object({
    gameName: z.string()
      .min(1, { message: "يرجى إدخال اسم للعبة" })
      .max(45, { message: "يجب أن لا يتجاوز اسم اللعبة 45 حرفاً" }),
    teamNames: z.array(
      z.string()
        .min(1, { message: "يرجى إدخال اسم للفريق" })
        .max(45, { message: "يجب أن لا يتجاوز اسم الفريق 45 حرفاً" })
    ).min(game.teamsCount, { message: `يجب إدخال ${game.teamsCount} أسماء للفرق على الأقل` }),
    answerTimeFirst: z.string(),
    answerTimeSecond: z.string(),
  });

  // إعداد نموذج React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameName: `${game.name} (إعادة)`,
      teamNames: Array(game.teamsCount).fill("").map((_, idx) => `الفريق ${idx + 1}`),
      answerTimeFirst: "30",
      answerTimeSecond: "15",
    },
  });

  // تقديم النموذج
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // إنشاء بيانات اللعبة الجديدة
      const replayData = {
        originalGameId: game.id,
        gameName: values.gameName,
        teamNames: values.teamNames,
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
    } catch (error) {
      console.error('Error replaying game:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة اللعبة، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl" aria-describedby="replay-game-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            إعادة اللعب
          </DialogTitle>
          <DialogDescription id="replay-game-description" className="text-center">
            قم بإعداد معلومات اللعبة الجديدة باستخدام نفس الفئات
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1 my-3 justify-center">
          {game.categories.map((category) => (
            <Badge key={category.id} className="bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-full border-0">
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Badge>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* اسم اللعبة */}
            <FormField
              control={form.control}
              name="gameName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم اللعبة</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسماً للعبة" maxLength={45} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* أسماء الفرق */}
            <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">أسماء الفرق</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: game.teamsCount }).map((_, index) => (
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
                            maxLength={45}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* وقت الإجابة الأولى */}
            <FormField
              control={form.control}
              name="answerTimeFirst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وقت الإجابة الأولى (ثانية)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وقت الإجابة الأولى" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[15, 30, 45, 60].map((time) => (
                        <SelectItem key={time} value={time.toString()}>
                          {time} ثانية
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* وقت الإجابة الثانية */}
            <FormField
              control={form.control}
              name="answerTimeSecond"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وقت الإجابة الثانية (ثانية)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وقت الإجابة الثانية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[10, 15, 20, 30].map((time) => (
                        <SelectItem key={time} value={time.toString()}>
                          {time} ثانية
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mr-2"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
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