import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { ModalDialogContent } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import axios from "axios";

interface AnswerTimeOption {
  default: number;
  options: number[];
}

interface AnswerTimeOptions {
  first: AnswerTimeOption;
  second: AnswerTimeOption;
  third: AnswerTimeOption;
  fourth: AnswerTimeOption;
}

interface GameSettings {
  minTeams: number;
  maxTeams: number;
  maxGameNameLength: number;
  maxTeamNameLength: number;
  defaultFirstAnswerTime: number;
  defaultSecondAnswerTime: number;
  allowedFirstAnswerTimes: number[];
  allowedSecondAnswerTimes: number[];
  answerTimesFor2Teams: number[];
  answerTimesFor3Teams: number[];
  answerTimesFor4Teams: number[];
  answerTimeOptions: AnswerTimeOptions;
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
  onGameCreated?: (gameId: string) => void;
}

const formSchema = z.object({
  gameName: z
    .string()
    .min(1, { message: "يرجى إدخال اسم للعبة" })
    .max(45, { message: "يجب أن لا يتجاوز اسم اللعبة 45 حرفاً" }),
  teamCount: z.string(),
  teamNames: z.array(
    z
      .string()
      .min(1, { message: "يرجى إدخال اسم للفريق" })
      .max(45, { message: "يجب أن لا يتجاوز اسم الفريق 45 حرفاً" }),
  ),
  answerTimeFirst: z.string(),
  answerTimeSecond: z.string(),
  answerTimeThird: z.string().optional(),
  answerTimeFourth: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GameSettingsModal({
  open,
  onOpenChange,
  selectedCategories,
  onGameCreated,
}: GameSettingsModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameName: "لعبتي الجديدة",
      teamCount: "2",
      teamNames: [
        "الفريق الأول",
        "الفريق الثاني",
        "الفريق الثالث",
        "الفريق الرابع",
      ],
      answerTimeFirst: "30",
      answerTimeSecond: "15",
      answerTimeThird: "10",
      answerTimeFourth: "5",
    },
  });

  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try {
          const response = await axios.get("/api/game-settings");
          setSettings(response.data);
          
          // تحميل الإعدادات الافتراضية من خيارات أوقات الإجابة في لوحة التحكم
          if (response.data.answerTimeOptions) {
            form.setValue(
              "answerTimeFirst",
              response.data.answerTimeOptions.first.default.toString(),
            );
            form.setValue(
              "answerTimeSecond",
              response.data.answerTimeOptions.second.default.toString(),
            );
            form.setValue(
              "answerTimeThird",
              response.data.answerTimeOptions.third.default.toString(),
            );
            form.setValue(
              "answerTimeFourth",
              response.data.answerTimeOptions.fourth.default.toString(),
            );
          } else {
            // استخدام القيم القديمة للتوافق
            form.setValue(
              "answerTimeFirst",
              response.data.defaultFirstAnswerTime.toString(),
            );
            form.setValue(
              "answerTimeSecond",
              response.data.defaultSecondAnswerTime.toString(),
            );
          }
          
          form.setValue("teamCount", response.data.minTeams.toString());
        } catch (error) {
          toast({
            title: "خطأ",
            description: "فشل في تحميل إعدادات اللعبة",
            variant: "destructive",
          });
        }
      };

      fetchSettings();
    }
  }, [open, toast, form]);

  const watchTeamCount = form.watch("teamCount");

  // دالة للحصول على خيارات أوقات الإجابة حسب عدد الفرق ونوع الوقت
  const getAnswerTimeOptions = (timeType: 'first' | 'second' | 'third' | 'fourth') => {
    if (!settings) return [];
    
    // تحقق من وجود بيانات أوقات الإجابة الجديدة
    if (settings.answerTimeOptions) {
      return settings.answerTimeOptions[timeType].options;
    }
    
    // استخدام البيانات القديمة كخيار بديل
    if (timeType === 'first') {
      return settings.allowedFirstAnswerTimes;
    } else if (timeType === 'second') {
      return settings.allowedSecondAnswerTimes;
    }
    
    // قيم افتراضية للوقت الثالث والرابع
    if (timeType === 'third') {
      return [15, 10, 5];
    } else {
      return [10, 5, 3];
    }
  };
  
  // دالة لإظهار/إخفاء أوقات الإجابة الإضافية حسب عدد الفرق
  const shouldShowAdditionalTime = (timeIndex: number) => {
    if (!watchTeamCount) return false;
    const count = parseInt(watchTeamCount, 10);
    return count >= timeIndex + 1;
  };

  useEffect(() => {
    if (!watchTeamCount) return;
    const count = parseInt(watchTeamCount, 10);
    let currentTeamNames = form.getValues("teamNames");

    if (currentTeamNames.length < count) {
      const newTeamNames = [...currentTeamNames];
      for (let i = currentTeamNames.length; i < count; i++) {
        newTeamNames.push(`الفريق ${i + 1}`);
      }
      form.setValue("teamNames", newTeamNames);
    }

    if (currentTeamNames.length > count) {
      form.setValue("teamNames", currentTeamNames.slice(0, count));
    }

    form.trigger("teamNames");
  }, [watchTeamCount, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const numTeams = parseInt(data.teamCount, 10);
      
      // جمع جميع أوقات الإجابة في مصفوفة واحدة حسب عدد الفرق
      const answerTimes = [
        parseInt(data.answerTimeFirst, 10),
        parseInt(data.answerTimeSecond, 10),
      ];
      
      // إضافة وقت الإجابة الثالث والرابع إذا كان عدد الفرق 3 أو 4
      if (numTeams >= 3 && data.answerTimeThird) {
        answerTimes.push(parseInt(data.answerTimeThird, 10));
      }
      
      if (numTeams >= 4 && data.answerTimeFourth) {
        answerTimes.push(parseInt(data.answerTimeFourth, 10));
      }
      
      const gameData = {
        gameName: data.gameName,
        teamsCount: numTeams,
        teamNames: data.teamNames.slice(0, numTeams),
        answerTimes: answerTimes, // إرسال جميع أوقات الإجابة كمصفوفة
        categories: selectedCategories.map((cat) => cat.id),
      };

      const response = await axios.post("/api/create-game", gameData);

      localStorage.setItem(
        "currentGameSession",
        JSON.stringify({
          id: response.data.id,
          ...gameData,
        }),
      );

      toast({
        title: "تم إنشاء اللعبة",
        description: "جاري الانتقال إلى صفحة اللعب",
      });

      onGameCreated
        ? onGameCreated(response.data.id)
        : navigate(`/play/${response.data.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء اللعبة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return null;

  const teamOptions: JSX.Element[] = [];
  for (let i = settings.minTeams; i <= settings.maxTeams; i++) {
    teamOptions.push(
      <SelectItem key={i} value={i.toString()}>
        {i} فرق
      </SelectItem>,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hidden"
        aria-describedby="game-settings-description"
      >
        <span id="game-settings-description" className="sr-only">
          إعدادات اللعبة
        </span>
      </DialogContent>
      <ModalDialogContent
        className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
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
            <FormField
              control={form.control}
              name="gameName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>اسم اللعبة</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={settings.maxGameNameLength} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    الحد الأقصى: {settings.maxGameNameLength} حرف
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamCount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>عدد الفرق</FormLabel>
                  <Select 
                    defaultValue={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر عدد الفرق" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999]" side="bottom" sideOffset={4}>
                      {teamOptions}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 border border-gray-200 rounded-md p-3 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">أسماء الفرق</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {watchTeamCount &&
                  Array.from({ length: parseInt(watchTeamCount, 10) }).map(
                    (_, index) => (
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
                                {...field}
                                maxLength={settings.maxTeamNameLength}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    ),
                  )}
              </div>
            </div>

            {/* وقت الإجابة الأول - لجميع الفرق */}
            <FormField
              control={form.control}
              name="answerTimeFirst"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>وقت الإجابة الأول</FormLabel>
                  <Select 
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وقت الإجابة الأول" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999]" side="bottom" sideOffset={4}>
                      {getAnswerTimeOptions('first').map((time) => (
                        <SelectItem key={`first-${time}`} value={time.toString()}>
                          {time} ثانية
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    وقت الإجابة الأساسي للفريق الأول
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* وقت الإجابة الثاني - لجميع الفرق */}
            <FormField
              control={form.control}
              name="answerTimeSecond"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>وقت الإجابة الثاني</FormLabel>
                  <Select 
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وقت الإجابة الثاني" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999]" side="bottom" sideOffset={4}>
                      {getAnswerTimeOptions('second').map((time) => (
                        <SelectItem key={`second-${time}`} value={time.toString()}>
                          {time} ثانية
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    وقت الإجابة للفريق الثاني
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* وقت الإجابة الثالث - يظهر فقط إذا كان عدد الفرق 3 أو أكثر */}
            {parseInt(watchTeamCount || "0", 10) >= 3 && (
              <FormField
                control={form.control}
                name="answerTimeThird"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>وقت الإجابة الثالث</FormLabel>
                    <Select 
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وقت الإجابة الثالث" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[9999]" side="bottom" sideOffset={4}>
                        {getAnswerTimeOptions('third').map((time) => (
                          <SelectItem key={`third-${time}`} value={time.toString()}>
                            {time} ثانية
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      وقت الإجابة للفريق الثالث
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* وقت الإجابة الرابع - يظهر فقط إذا كان عدد الفرق 4 */}
            {parseInt(watchTeamCount || "0", 10) >= 4 && (
              <FormField
                control={form.control}
                name="answerTimeFourth"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>وقت الإجابة الرابع</FormLabel>
                    <Select 
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وقت الإجابة الرابع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[9999]" side="bottom" sideOffset={4}>
                        {getAnswerTimeOptions('fourth').map((time) => (
                          <SelectItem key={`fourth-${time}`} value={time.toString()}>
                            {time} ثانية
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      وقت الإجابة للفريق الرابع
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الإنشاء..." : "إنشاء اللعبة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </ModalDialogContent>
    </Dialog>
  );
}
