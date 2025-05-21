import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { insertUserSchema } from "@shared/schema";

// Login schema simplifies the registration schema to just username and password
const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

// Registration schema adds validation rules
const registerSchema = insertUserSchema.extend({
  password: z.string()
    .min(8, { message: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل" })
    .max(100, { message: "يجب أن تكون كلمة المرور أقل من 100 حرف" }),
  name: z.string().min(2, { message: "يجب أن يتكون الاسم من حرفين على الأقل" }),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, login } = useUser();
  const [_, navigate] = useLocation();

  // If user is already logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

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
      name: "",
      email: "",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      // In a real app, we'd call the login API endpoint here
      // For now, we'll simulate a successful login with the test user (ID: 2)
      login({
        id: 2,
        username: data.username,
        name: "مستخدم تجريبي"
      });
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبًا بك مرة أخرى!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      // In a real app, we'd call the register API endpoint here
      // For now, we'll simulate a successful registration with the test user
      login({
        id: 2,
        username: data.username,
        name: data.name
      });
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحبًا بك في تطبيق جاوب!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء الحساب",
        description: "حدث خطأ أثناء إنشاء الحساب. الرجاء المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col-reverse md:flex-row" dir="rtl">
      {/* طرف النموذج */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              مرحبًا بك في جاوب
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              سجل الدخول أو أنشئ حسابًا جديدًا للاستمتاع بتجربة اللعب
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>
            
            {/* نموذج تسجيل الدخول */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="ادخل اسم المستخدم" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* نموذج إنشاء حساب */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input placeholder="ادخل اسمك الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="ادخل اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="example@domain.com" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* قسم العرض */}
      <div className="relative w-full md:w-1/2 bg-primary-600 flex items-center justify-center p-8">
        <div className="relative z-10 text-white max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">جاوب - لعبة المعرفة العربية</h1>
          <p className="text-lg mb-8">
            تحدى أصدقاءك في مسابقة ممتعة من الأسئلة في مختلف المجالات. اختبر معرفتك، تعلم حقائق جديدة، واستمتع بوقتك!
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="mr-4 p-2 bg-white bg-opacity-20 rounded-full">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <p className="text-white text-right">أكثر من 1000 سؤال في مختلف المجالات</p>
            </div>
            <div className="flex items-center">
              <div className="mr-4 p-2 bg-white bg-opacity-20 rounded-full">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <p className="text-white text-right">وضع متعدد اللاعبين للمنافسة مع الأصدقاء</p>
            </div>
            <div className="flex items-center">
              <div className="mr-4 p-2 bg-white bg-opacity-20 rounded-full">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <p className="text-white text-right">اكتسب النقاط وارتق في المستويات</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/90 to-primary-700/90"></div>
      </div>
    </div>
  );
}