import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

  // جلب بيانات المستوى الحالي
  const { 
    data: currentLevel, 
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
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: ar });
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  // تنسيق الوقت المتبقي
  const formatRemainingDays = (days: number) => {
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
                ) : currentLevel && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div 
                        className="rounded-full p-4 text-4xl" 
                        style={{ backgroundColor: `${currentLevel.color}20` }}
                      >
                        {currentLevel.badge}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: currentLevel.color }}>
                          مستوى {currentLevel.level}
                        </h2>
                        <p className="text-muted-foreground">
                          {formatDate(currentLevel.startDate)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {currentLevel.currentStars} نجمة
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          المستوى التالي: {currentLevel.nextLevel}
                          <Star className="h-4 w-4" />
                          {currentLevel.requiredStars} نجمة
                        </span>
                      </div>
                      <Progress
                        value={currentLevel.progress}
                        className="h-2"
                        style={{ 
                          "--progress-background": `${currentLevel.color}20`,
                          "--progress-foreground": currentLevel.color
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
                          <p className="font-semibold">{currentLevel.stats.starsToNextLevel} نجمة</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/20 p-3 rounded-md flex gap-3 items-center">
                        <div className="bg-amber-100 rounded-full p-2">
                          <ArrowUpRight className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">نجوم هذا الشهر</p>
                          <p className="font-semibold">{currentLevel.stats.starsThisMonth} نجمة</p>
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
                ) : currentLevel && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 items-center">
                          <Calendar className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">الكروت الشهرية</span>
                        </div>
                        <span className="text-xl font-bold">
                          {currentLevel.monthlyRewards.freeCards}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        تحصل على {currentLevel.monthlyRewards.freeCards} كرت مجاني كل شهر
                      </p>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <span className="text-muted-foreground">التجديد القادم:</span>
                        <span>{formatDate(currentLevel.monthlyRewards.nextRenewal)}</span>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 items-center">
                          <Clock className="h-5 w-5 text-purple-500" />
                          <span className="font-semibold">صلاحية الكروت</span>
                        </div>
                        <span className="font-bold">
                          {currentLevel.monthlyRewards.validity} يوم
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentLevel.monthlyRewards.accumulative
                          ? "الكروت تتراكم من شهر لآخر ولا تنتهي تلقائياً"
                          : `تنتهي صلاحية الكروت بعد ${currentLevel.monthlyRewards.validity} يوم من استلامها`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* القسم 3: إحصائيات التقدم */}
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
              ) : currentLevel && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      معدل التحويل
                    </h3>
                    <div className="text-2xl font-bold mb-1">
                      {currentLevel.stats.conversionRate} كرت
                    </div>
                    <p className="text-sm text-muted-foreground">
                      كل {currentLevel.stats.conversionRate} كرت = نجمة واحدة
                    </p>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      الكروت المستهلكة
                    </h3>
                    <div className="text-2xl font-bold mb-1">
                      {currentLevel.stats.cardsUsed} كرت
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
                      {currentLevel.stats.starsToNextLevel} نجمة
                    </div>
                    <p className="text-sm text-muted-foreground">
                      المتبقي للترقية إلى {currentLevel.nextLevel}
                    </p>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      وقت المستوى
                    </h3>
                    <div className="text-2xl font-bold mb-1 whitespace-nowrap">
                      {formatRemainingDays(currentLevel.stats.daysBeforeDemotion)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentLevel.stats.daysBeforeDemotion === 0 
                        ? "لا يمكن فقدان هذا المستوى"
                        : "المتبقي قبل فقدان المستوى"
                      }
                    </p>
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
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50">
                                    <Award className="h-3 w-3 text-amber-500" />
                                    {item.cardsUsed} كرت
                                  </Badge>
                                  <Badge className="gap-1 bg-yellow-500">
                                    <Star className="h-3 w-3" />
                                    {item.stars} نجوم
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm mt-2 text-muted-foreground">
                                {item.activity}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-muted-foreground">
                          لا توجد بيانات متاحة
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* القسم 4: جدول المستويات */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>جدول المستويات الكامل</CardTitle>
              <CardDescription>المستويات المتاحة والمزايا المرتبطة بكل مستوى</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>تفاصيل مستويات اللاعبين وما يقابلها من مزايا</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-center">الشارة</TableHead>
                      <TableHead className="text-center">النجوم المطلوبة</TableHead>
                      <TableHead className="text-center">الكروت/نجمة</TableHead>
                      <TableHead className="text-center">كروت شهرية</TableHead>
                      <TableHead className="text-center">المدة القصوى</TableHead>
                      <TableHead className="text-center">يمكن الانخفاض؟</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelsLoading ? (
                      [1, 2, 3].map(i => (
                        <TableRow key={i}>
                          {[1, 2, 3, 4, 5, 6, 7].map(j => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : allLevels && allLevels.length > 0 ? (
                      allLevels.map((level) => (
                        <TableRow 
                          key={level.id}
                          className={
                            currentLevel && level.name === currentLevel.level 
                              ? "bg-muted/30" 
                              : undefined
                          }
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {currentLevel && level.name === currentLevel.level && (
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              )}
                              <span style={{ color: level.color }}>{level.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xl">{level.badge}</TableCell>
                          <TableCell className="text-center">{level.requiredStars}</TableCell>
                          <TableCell className="text-center">{level.conversionRate}</TableCell>
                          <TableCell className="text-center">{level.monthlyCards}</TableCell>
                          <TableCell className="text-center">
                            {level.maxDuration === 0 ? "غير محدد" : `${level.maxDuration} يوم`}
                          </TableCell>
                          <TableCell className="text-center">
                            {level.canDemote ? "نعم" : "لا"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          لا توجد بيانات متاحة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}