import { useLocation, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/context/UserContext";

// Define login form schema
const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

// Define registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const { login: userLogin } = useUser();
  const isLoading = loginMutation.isPending || registerMutation.isPending;

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
      phone: "",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    try {
      const userData = await loginMutation.mutateAsync(data);
      // أيضًا قم بتسجيل الدخول إلى UserContext لضمان عمل كلا النظامين
      userLogin(userData);
      navigate("/");
    } catch (error) {
      // Error handling is already done in the mutation
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    try {
      const userData = await registerMutation.mutateAsync(data);
      // أيضًا قم بتسجيل الدخول إلى UserContext لضمان عمل كلا النظامين
      userLogin(userData);
      navigate("/");
    } catch (error) {
      // Error handling is already done in the mutation
    }
  }

  return (
    <div className="flex h-screen">
      {/* Form Side */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-8 lg:px-12 py-6 bg-background">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">جاوب</h1>
            <p className="text-muted-foreground mt-2">منصة الألعاب التعليمية المبتكرة</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المستخدم" {...field} />
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
                          <Input type="password" placeholder="••••••" {...field} />
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
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسمك الكامل" {...field} />
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="05xxxxxxxx" {...field} />
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
                          <Input type="password" placeholder="••••••" {...field} />
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

      {/* Hero Side */}
      <div className="hidden md:flex md:w-1/2 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center items-center p-12 text-center">
          <h1 className="text-4xl font-extrabold mb-6">مرحباً بك في جاوب!</h1>
          <p className="text-xl mb-8 max-w-md">
            منصة الألعاب التعليمية الرائدة. استمتع بتجربة مسابقات ثقافية تفاعلية مع الأصدقاء والعائلة.
          </p>
          <div className="space-y-4 text-start w-full max-w-md">
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground text-primary w-10 h-10 flex items-center justify-center mr-4">1</div>
              <span>سجل دخولك أو أنشئ حساباً جديداً</span>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground text-primary w-10 h-10 flex items-center justify-center mr-4">2</div>
              <span>أنشئ لعبة جديدة واختر الفئات المفضلة لديك</span>
            </div>
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground text-primary w-10 h-10 flex items-center justify-center mr-4">3</div>
              <span>ادعُ أصدقاءك للمشاركة واستمتع بالمنافسة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}