import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CircleHelp,
  Star,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Trophy,
  User,
  Users,
  Award,
  Crown,
} from 'lucide-react';

// أنواع البيانات
interface UserLevel {
  level: string;
  badge: string;
  color: string;
  progress: number;
  nextLevel: string;
  requiredStars: number;
  currentStars: number;
  startDate: string;
  monthlyRewards: {
    freeCards: number;
    validity: number;
    nextRenewal: string;
    accumulative: boolean;
  };
  stats: {
    starsThisMonth: number;
    cardsUsed: number;
    conversionRate: number;
    starsToNextLevel: number;
    daysBeforeDemotion: number;
  };
}

interface LevelInfo {
  id: number;
  name: string;
  badge: string;
  color: string;
  requiredStars: number;
  conversionRate: number;
  monthlyCards: number;
  maxDuration: number;
  canDemote: boolean;
}

interface StarHistoryItem {
  id: number;
  date: string;
  stars: number;
  cardsUsed: number;
  source: "main" | "sub";
  userId?: number;
  username?: string;
  activity: string;
}

export default function LevelPage() {
  const [starHistoryDialog, setStarHistoryDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // جلب بيانات المستوى الحالي
  const { 
    data: userLevel, 
    isLoading: levelLoading 
  } = useQuery<UserLevel>({
    queryKey: ['/api/user-level'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // جلب جدول المستويات
  const { 
    data: allLevels, 
    isLoading: levelsLoading 
  } = useQuery<LevelInfo[]>({
    queryKey: ['/api/levels'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // جلب سجل النجوم
  const { 
    data: starHistory, 
    isLoading: historyLoading 
  } = useQuery<StarHistoryItem[]>({
    queryKey: ['/api/star-history'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // تنسيق التاريخ باللغة العربية
  const formatDate = (dateString?: string, includeTime = false) => {
    if (!dateString) return "غير متوفر";
    try {
      const date = new Date(dateString);
      return format(
        date, 
        includeTime ? 'dd MMMM yyyy - hh:mm a' : 'dd MMMM yyyy', 
        { locale: ar }
      );
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  // تنسيق الوقت المتبقي
  const formatRemainingDays = (days?: number) => {
    if (days === undefined) return "غير محدد";
    if (days === 0) return "غير محدد";
    if (days === 1) return "يوم واحد";
    if (days === 2) return "يومين";
    if (days >= 3 && days <= 10) return `${days} أيام`;
    return `${days} يوماً`;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 md:px-6" dir="rtl">
        <div className="grid gap-6 md:gap-8">
          {/* عنوان الصفحة */}
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">مستوى الحساب</h1>
              <p className="text-muted-foreground mt-1">تابع تقدمك وفك المزيد من المكافآت</p>
            </div>
          </div>

          {/* تنقل علامات التبويب */}
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full md:w-auto">
              <TabsTrigger value="details">تفاصيل المستوى</TabsTrigger>
              <TabsTrigger value="levels">جدول المستويات</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-6">
              {/* القسم 1: عرض المستوى الحالي */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle>المستوى الحالي</CardTitle>
                    <CardDescription>معلومات المستوى والتقدم</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {levelLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-3/4" />
                      </div>
                    ) : userLevel && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="rounded-full p-4 text-4xl" 
                            style={{ backgroundColor: `${userLevel.color}20` }}
                          >
                            {userLevel.badge}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold" style={{ color: userLevel.color }}>
                              مستوى {userLevel.level}
                            </h2>
                            <p className="text-muted-foreground">
                              {formatDate(userLevel.startDate)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {userLevel.currentStars} نجمة
                            </span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              المستوى التالي: {userLevel.nextLevel}
                              <Star className="h-4 w-4" />
                              {userLevel.requiredStars} نجمة
                            </span>
                          </div>
                          <Progress
                            value={userLevel.progress}
                            className="h-2"
                            style={{ 
                              "--progress-background": `${userLevel.color}20`,
                              "--progress-foreground": userLevel.color
                            } as React.CSSProperties}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-muted/20 p-3 rounded-md flex gap-3 items-center">
                            <div className="bg-blue-100 rounded-full p-2">
                              <Star className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">النجوم المتبقية</p>
                              <p className="font-semibold">{userLevel.stats?.starsToNextLevel || userLevel.requiredStars - userLevel.currentStars} نجمة</p>
                            </div>
                          </div>
                          
                          <div className="bg-muted/20 p-3 rounded-md flex gap-3 items-center">
                            <div className="bg-amber-100 rounded-full p-2">
                              <ArrowUpRight className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">نجوم هذا الشهر</p>
                              <p className="font-semibold">{userLevel.stats?.starsThisMonth || 0} نجمة</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* المكافآت الشهرية */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>المكافآت الشهرية</CardTitle>
                    <CardDescription>المزايا المتاحة في مستواك الحالي</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {levelLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : userLevel && userLevel.monthlyRewards && (
                      <div className="space-y-4">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 items-center">
                              <Calendar className="h-5 w-5 text-green-500" />
                              <span className="font-semibold">الكروت الشهرية</span>
                            </div>
                            <span className="text-xl font-bold">
                              {userLevel.monthlyRewards.freeCards}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            تحصل على {userLevel.monthlyRewards.freeCards} كرت مجاني كل شهر
                          </p>
                          <div className="flex items-center justify-between mt-3 text-sm">
                            <span className="text-muted-foreground">التجديد القادم:</span>
                            <span>{formatDate(userLevel.monthlyRewards.nextRenewal)}</span>
                          </div>
                        </div>
                        
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 items-center">
                              <Clock className="h-5 w-5 text-purple-500" />
                              <span className="font-semibold">صلاحية الكروت</span>
                            </div>
                            <span className="font-bold">
                              {userLevel.monthlyRewards.validity} يوم
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {userLevel.monthlyRewards.accumulative
                              ? "الكروت تتراكم من شهر لآخر ولا تنتهي تلقائياً"
                              : `تنتهي صلاحية الكروت بعد ${userLevel.monthlyRewards.validity} يوم من استلامها`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* القسم 2: إحصائيات التقدم */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>إحصائيات التقدم</CardTitle>
                  <CardDescription>معلومات مفصلة عن طريقة اكتساب النجوم</CardDescription>
                </CardHeader>
                <CardContent>
                  {levelLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : !userLevel ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لم يتم تصنيفك بعد. ابدأ باستخدام الكروت لتكتسب النجوم وتفتح المستويات!
                    </div>
                  ) : userLevel && userLevel.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                          معدل التحويل
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                          {userLevel.stats.conversionRate} كرت
                        </div>
                        <p className="text-sm text-muted-foreground">
                          كل {userLevel.stats.conversionRate} كرت = نجمة واحدة
                        </p>
                      </div>
                      
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-amber-500" />
                          الكروت المستهلكة
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                          {userLevel.stats.cardsUsed} كرت
                        </div>
                        <p className="text-sm text-muted-foreground">
                          عدد الكروت المستخدمة حتى الآن
                        </p>
                      </div>
                      
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          المستوى التالي
                        </h3>
                        <div className="text-2xl font-bold mb-1">
                          {userLevel.stats.starsToNextLevel} نجمة
                        </div>
                        <p className="text-sm text-muted-foreground">
                          المتبقي للترقية إلى {userLevel.nextLevel}
                        </p>
                      </div>
                      
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                          وقت المستوى
                        </h3>
                        <div className="text-2xl font-bold mb-1 whitespace-nowrap">
                          {formatRemainingDays(userLevel.stats.daysBeforeDemotion)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {userLevel.stats.daysBeforeDemotion === 0 
                            ? "لا يمكن فقدان هذا المستوى"
                            : "المتبقي قبل فقدان المستوى"
                          }
                        </p>
                        {userLevel.stats.daysBeforeDemotion !== 0 && userLevel.stats.daysBeforeDemotion <= 5 && (
                          <p className="text-red-600 text-sm mt-2 font-semibold flex items-center gap-1">
                            <span className="text-lg">⚠️</span> يجب عليك استهلاك كروت إضافية خلال {formatRemainingDays(userLevel.stats.daysBeforeDemotion)} لتفادي خسارة المستوى
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
                    <Dialog open={starHistoryDialog} onOpenChange={setStarHistoryDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          سجل النجوم
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>سجل النجوم</DialogTitle>
                          <DialogDescription>
                            تفاصيل اكتساب النجوم للحساب الرئيسي والمستخدمين الفرعيين
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="max-h-[400px] overflow-y-auto">
                          {historyLoading ? (
                            <div className="space-y-4 py-4">
                              {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 w-full" />
                              ))}
                            </div>
                          ) : starHistory && starHistory.length > 0 ? (
                            <div className="space-y-3 py-2">
                              {starHistory.map(item => (
                                <div key={item.id} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {item.source === "main" ? (
                                        <User className="h-5 w-5 text-blue-500" />
                                      ) : (
                                        <Users className="h-5 w-5 text-purple-500" />
                                      )}
                                      <div>
                                        <p className="font-medium">
                                          {item.source === "main" ? "الحساب الرئيسي" : item.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(item.date)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <p className="font-bold text-green-600 flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                                        {item.stars} نجمة
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.cardsUsed} كرت
                                      </p>
                                    </div>
                                  </div>
                                  <p className="mt-2 text-sm border-t pt-2">{item.activity}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              لا يوجد سجل للنجوم حتى الآن
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="levels" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>جدول المستويات</CardTitle>
                  <CardDescription>
                    جميع المستويات المتاحة ومتطلباتها ومزاياها
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {levelsLoading ? (
                    <Skeleton className="h-60 w-full" />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableCaption>المستويات المتاحة في نظام جاوب</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">المستوى</TableHead>
                            <TableHead className="text-center">النجوم المطلوبة</TableHead>
                            <TableHead className="text-center">معدل التحويل</TableHead>
                            <TableHead className="text-center">الكروت الشهرية</TableHead>
                            <TableHead className="text-center">مدة الصلاحية</TableHead>
                            <TableHead className="text-center">إمكانية الهبوط</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allLevels?.map(level => (
                            <TableRow key={level.id}>
                              <TableCell className="text-center font-medium">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="bg-muted-foreground/10 rounded-full w-7 h-7 flex items-center justify-center">
                                    {level.badge}
                                  </span>
                                  <span style={{ color: level.color }}>{level.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{level.requiredStars}</TableCell>
                              <TableCell className="text-center">{level.conversionRate}</TableCell>
                              <TableCell className="text-center">{level.monthlyCards}</TableCell>
                              <TableCell className="text-center">
                                {level.maxDuration === 0 ? 
                                  "غير محدد" : 
                                  `${level.maxDuration} يوم`
                                }
                              </TableCell>
                              <TableCell className="text-center">
                                {level.canDemote ? (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-200">نعم</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200">لا</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">كيف يعمل نظام المستويات؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <div className="bg-blue-100 rounded-full p-2 h-fit">
                        <Trophy className="h-4 w-4 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">ترقية المستوى</h4>
                        <p className="text-muted-foreground">
                          تتم ترقية المستوى تلقائياً عند تحقيق عدد النجوم المطلوب، حيث يتم الحصول على النجوم عند استخدام الكروت في اللعب.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="bg-amber-100 rounded-full p-2 h-fit">
                        <Star className="h-4 w-4 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">اكتساب النجوم</h4>
                        <p className="text-muted-foreground">
                          يتم احتساب النجوم بناءً على عدد الكروت المستخدمة. كل عدد معين من الكروت (حسب معدل التحويل) يمنح نجمة واحدة.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="bg-red-100 rounded-full p-2 h-fit">
                        <ArrowDownRight className="h-4 w-4 text-red-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">فقدان المستوى</h4>
                        <p className="text-muted-foreground">
                          بعض المستويات قابلة للفقدان في حال عدم النشاط أو عدم الوصول للحد الأدنى من النجوم خلال فترة زمنية محددة.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="bg-green-100 rounded-full p-2 h-fit">
                        <Award className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">مزايا المستويات</h4>
                        <p className="text-muted-foreground">
                          مع ارتفاع المستوى تحصل على مزايا أكثر، مثل زيادة عدد الكروت الشهرية المجانية وتحسين معدل التحويل للنجوم.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}