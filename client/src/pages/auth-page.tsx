import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedCallback } from "use-debounce";

// تعريف مخطط نموذج تسجيل الدخول
const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل")
    .regex(/[^A-Za-z0-9]/, "يجب أن تحتوي على رمز خاص واحد على الأقل"),
});

// تعريف مخطط نموذج التسجيل
const registerSchema = z
  .object({
    username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
      .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل")
      .regex(/[^A-Za-z0-9]/, "يجب أن تحتوي على رمز خاص واحد على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { loginMutation, registerMutation, isLoading } = useAuth();
  const [tab, setTab] = useState("login");

  // استخدام التأخير للتحقق من صحة النموذج
  const debouncedValidation = useDebouncedCallback(
    (form: any) => form.trigger(),
    500,
  );

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isProcessingAuth =
    loginMutation.isPending || registerMutation.isPending;

  // معالجة تسجيل الدخول ـ التحويل يتم فقط عند النجاح
  async function onLoginSubmit(data: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(data, {
        onSuccess: () => {
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "مرحباً بك في جاوب!",
          });
          setTimeout(() => {
            navigate("/");
          }, 700); // لإظهار رسالة التوست أولاً
        },
        onError: (error: Error) => {
          toast({
            title: "خطأ في تسجيل الدخول",
            description: error?.message || "حدث خطأ غير متوقع",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  }

  // معالجة إنشاء حساب جديد ـ التحويل يتم فقط عند النجاح
  async function onRegisterSubmit(data: RegisterFormValues) {
    try {
      const { confirmPassword, ...userData } = data;
      await registerMutation.mutateAsync(userData, {
        onSuccess: () => {
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: "مرحباً بك في جاوب!",
          });
          setTimeout(() => {
            navigate("/");
          }, 700); // لإظهار رسالة التوست أولاً
        },
        onError: (error: Error) => {
          toast({
            title: "خطأ في إنشاء الحساب",
            description: error?.message || "حدث خطأ غير متوقع",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex h-screen">
      {/* جانب النموذج */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-8 lg:px-12 py-6 bg-background">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">جاوب</h1>
            <p className="text-muted-foreground mt-2">
              منصة الألعاب التعليمية المبتكرة
            </p>
          </div>

          <Tabs
            value={tab}
            onValueChange={setTab}
            className="w-full"
            defaultValue="login"
          >
            <TabsList
              className="grid w-full grid-cols-2 mb-6"
              aria-label="نموذج المصادقة"
            >
              <TabsTrigger value="login" role="tab">
                تسجيل الدخول
              </TabsTrigger>
              <TabsTrigger value="register" role="tab">
                إنشاء حساب
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" role="tabpanel">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسم المستخدم"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedValidation(loginForm);
                            }}
                            aria-label="اسم المستخدم"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedValidation(loginForm);
                            }}
                            aria-label="كلمة المرور"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isProcessingAuth}
                  >
                    {isProcessingAuth ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="register" role="tabpanel">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسم المستخدم"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedValidation(registerForm);
                            }}
                            aria-label="اسم المستخدم"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedValidation(registerForm);
                            }}
                            aria-label="كلمة المرور"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedValidation(registerForm);
                            }}
                            aria-label="تأكيد كلمة المرور"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isProcessingAuth}
                  >
                    {isProcessingAuth ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* الجانب الترحيبي */}
      <div className="hidden md:flex md:w-1/2 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center items-center p-12 text-center">
          <h1 className="text-4xl font-extrabold mb-6">مرحباً بك في جاوب!</h1>
          <p className="text-xl mb-8 max-w-md">
            منصة الألعاب التعليمية الرائدة. استمتع بتجربة مسابقات ثقافية تفاعلية
            مع الأصدقاء والعائلة.
          </p>
          <div className="space-y-4 text-start w-full max-w-md">
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground text-primary w-10 h-10 flex items-center justify-center ml-4">
                1
              </div>
              <span>سجل دخولك أو أنشئ حساباً جديداً</span>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground text-primary w-10 h-10 flex items-center justify-center ml-4">
                2
              </div>
              <span>أنشئ لعبة جديدة واختر الفئات المفضلة لديك</span>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground text-primary w-10 h-10 flex items-center justify-center ml-4">
                3
              </div>
              <span>ادعُ أصدقاءك للمشاركة واستمتع بالمنافسة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
