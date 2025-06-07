import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from "../../lib/queryClient";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import {
  Users,
  BookText,
  HelpCircle,
  Crown,
  Package,
  Settings,
  BarChart3,
  AlertTriangle,
  Bell,
  Activity,
  FileText,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Star as StarIcon,
  AlertCircle,
  MessageSquare,
  Loader2,
  Layers,
} from "lucide-react";

// نوع بيانات الإحصائيات
interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    newLastWeek: number;
  };
  categories: {
    total: number;
    subcategories: number;
    lowQuestionCount: number;
  };
  questions: {
    total: number;
    byDifficulty: {
      easy: number;
      medium: number;
      hard: number;
    };
    recentlyAdded: number;
  };
  games: {
    total: number;
    active: number;
    completed: number;
    totalRounds: number;
  };
  levels: {
    total: number;
    users: Record<string, number>; // عدد المستخدمين في كل مستوى
  };
  packages: {
    total: number;
    active: number;
    purchased: number;
  };
  cards: {
    totalUsed: number;
    totalPurchased: number;
    freeIssued: number;
  };
  stars: {
    totalEarned: number;
    weeklyAverage: number;
  };
  notifications: {
    total: number;
    items: Array<{
      id: number;
      message: string;
      type: "warning" | "info" | "success";
      date: string;
    }>;
  };
  weeklyGrowth: Array<{
    date: string;
    users: number;
    games: number;
    cards: number;
    stars: number;
  }>;
}

// نوع بيانات بطاقة الإحصائيات
interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

// مكون بطاقة الإحصائيات
const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  color = "default",
}: StatCardProps) => {
  // قاموس الألوان حسب النوع
  const colorMap = {
    default: "bg-slate-100 text-slate-700",
    primary: "bg-blue-100 text-blue-700",
    secondary: "bg-purple-100 text-purple-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };

  const iconColorClass = colorMap[color];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${iconColorClass}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-xs ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              } flex items-center`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 ml-1" />
              ) : (
                <TrendingUp className="h-3 w-3 ml-1 transform rotate-180" />
              )}
              {trend.isPositive ? "+" : "-"}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground mr-1">
              مقارنة بالأسبوع الماضي
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// مكون بطاقة الروابط السريعة
interface QuickLinkCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
}

const QuickLinkCard = ({
  title,
  description,
  icon,
  to,
  color,
}: QuickLinkCardProps) => {
  return (
    <Link href={to}>
      <Card className="cursor-pointer hover:shadow-md transition-all">
        <CardHeader className={`${color} text-white rounded-t-lg`}>
          <div className="flex items-center">
            {icon}
            <CardTitle className="mr-2 text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

// مكون بطاقة الإشعارات
interface NotificationItemProps {
  message: string;
  type: "warning" | "info" | "success";
  date: string;
}

const NotificationItem = ({
  message,
  type,
  date,
}: NotificationItemProps) => {
  const iconMap = {
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <MessageSquare className="h-5 w-5 text-blue-500" />,
    success: <Star className="h-5 w-5 text-green-500" />,
  };

  return (
    <div className="flex items-start space-x-4 space-x-reverse p-3 hover:bg-slate-50 rounded-md">
      <div className="flex-shrink-0">{iconMap[type]}</div>
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{date}</p>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // جلب الإحصائيات
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/admin/dashboard-stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast({
          variant: "destructive",
          title: "خطأ في جلب الإحصائيات",
          description: "حدث خطأ أثناء محاولة جلب إحصائيات لوحة التحكم",
        });
        
        // بيانات افتراضية لأغراض العرض فقط (سيتم استبدالها بالبيانات الحقيقية من الخادم)
        setStats({
          users: {
            total: 240,
            active: 180,
            inactive: 60,
            admins: 5,
            newLastWeek: 15,
          },
          categories: {
            total: 12,
            subcategories: 45,
            lowQuestionCount: 3,
          },
          questions: {
            total: 850,
            byDifficulty: {
              easy: 350,
              medium: 350,
              hard: 150,
            },
            recentlyAdded: 25,
          },
          games: {
            total: 120,
            active: 15,
            completed: 105,
            totalRounds: 1250,
          },
          levels: {
            total: 5,
            users: {
              "مبتدئ": 80,
              "متوسط": 60,
              "متقدم": 40,
              "محترف": 20,
              "خبير": 10,
            },
          },
          packages: {
            total: 8,
            active: 6,
            purchased: 85,
          },
          cards: {
            totalUsed: 3600,
            totalPurchased: 2000,
            freeIssued: 2500,
          },
          stars: {
            totalEarned: 1800,
            weeklyAverage: 120,
          },
          notifications: {
            total: 3,
            items: [
              {
                id: 1,
                message: "3 فئات تحتوي على أقل من الحد الأدنى من الأسئلة",
                type: "warning",
                date: "اليوم، 10:30 صباحًا",
              },
              {
                id: 2,
                message: "5 مستخدمين جدد سجلوا خلال آخر 24 ساعة",
                type: "info",
                date: "اليوم، 9:15 صباحًا",
              },
              {
                id: 3,
                message: "تمت إضافة 25 سؤال جديد هذا الأسبوع",
                type: "success",
                date: "أمس، 2:45 مساءً",
              },
            ],
          },
          weeklyGrowth: [
            {
              date: "2023-05-01",
              users: 220,
              games: 100,
              cards: 3200,
              stars: 1600,
            },
            {
              date: "2023-05-02",
              users: 225,
              games: 102,
              cards: 3300,
              stars: 1650,
            },
            {
              date: "2023-05-03",
              users: 228,
              games: 105,
              cards: 3400,
              stars: 1700,
            },
            {
              date: "2023-05-04",
              users: 232,
              games: 108,
              cards: 3450,
              stars: 1720,
            },
            {
              date: "2023-05-05",
              users: 235,
              games: 110,
              cards: 3500,
              stars: 1750,
            },
            {
              date: "2023-05-06",
              users: 238,
              games: 115,
              cards: 3550,
              stars: 1780,
            },
            {
              date: "2023-05-07",
              users: 240,
              games: 120,
              cards: 3600,
              stars: 1800,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الإحصائيات...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">لا يمكن تحميل الإحصائيات</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          حدث خطأ أثناء محاولة جلب إحصائيات لوحة التحكم
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          إعادة تحميل الصفحة
        </Button>
      </div>
    );
  }

  // حساب مجموع كافة الكروت
  const totalCards = stats.cards.totalPurchased + stats.cards.freeIssued;
  // حساب نسبة الأسئلة حسب الصعوبة
  const easyPercentage = Math.round(
    (stats.questions.byDifficulty.easy / stats.questions.total) * 100
  );
  const mediumPercentage = Math.round(
    (stats.questions.byDifficulty.medium / stats.questions.total) * 100
  );
  const hardPercentage = Math.round(
    (stats.questions.byDifficulty.hard / stats.questions.total) * 100
  );

  // حساب النمو خلال الأسبوع
  const userGrowth = stats.weeklyGrowth.length > 1
    ? Math.round(
        ((stats.weeklyGrowth[stats.weeklyGrowth.length - 1].users -
          stats.weeklyGrowth[0].users) /
          stats.weeklyGrowth[0].users) *
          100
      )
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">لوحة التحكم</h2>
          <p className="text-muted-foreground">
            نظرة عامة على المنصة والإحصائيات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">
              آخر تحديث: اليوم، {new Date().toLocaleTimeString("ar")}
            </span>
          </div>
          <Button variant="outline" size="sm" className="mr-2">
            <Calendar className="h-4 w-4 ml-2" />
            تقارير مفصلة
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="المستخدمون"
          value={stats.users.total}
          description={`${stats.users.active} نشط، ${stats.users.inactive} غير نشط`}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 6, isPositive: true }}
          color="primary"
        />
        <StatCard
          title="الأسئلة"
          value={stats.questions.total}
          description={`${stats.questions.recentlyAdded} سؤال مضاف حديثًا`}
          icon={<BookText className="h-5 w-5" />}
          color="secondary"
        />
        <StatCard
          title="الألعاب"
          value={stats.games.total}
          description={`${stats.games.active} نشطة، ${stats.games.completed} مكتملة`}
          icon={<Activity className="h-5 w-5" />}
          trend={{ value: 10, isPositive: true }}
          color="success"
        />
        <StatCard
          title="الفئات"
          value={`${stats.categories.total} / ${stats.categories.subcategories}`}
          description="فئة رئيسية / فئة فرعية"
          icon={<Layers className="h-5 w-5" />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* مؤشرات الاستخدام */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>مؤشرات الاستخدام</CardTitle>
            <CardDescription>
              إحصائيات الاستخدام خلال الأسبوع الماضي
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-500 ml-2" />
                    <span className="text-sm font-medium">النجوم المكتسبة</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Badge variant="outline">{stats.stars.totalEarned}</Badge>
                    <span className="text-muted-foreground">المجموع</span>
                    <span className="text-muted-foreground">|</span>
                    <Badge variant="outline">
                      {stats.stars.weeklyAverage}
                    </Badge>
                    <span className="text-muted-foreground">المتوسط الأسبوعي</span>
                  </div>
                </div>
                <Progress value={85} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-indigo-500 ml-2" />
                      <span className="text-sm font-medium">الكروت المستخدمة</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Badge variant="outline">{stats.cards.totalUsed}</Badge>
                    <span className="text-muted-foreground">المجموع</span>
                    <span className="text-muted-foreground">|</span>
                    <Badge variant="outline">
                      {Math.round(stats.cards.totalUsed / 7)}
                    </Badge>
                    <span className="text-muted-foreground">يوميًا</span>
                  </div>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <HelpCircle className="h-4 w-4 text-red-500 ml-2" />
                      <span className="text-sm font-medium">صعوبة الأسئلة</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      سهلة {easyPercentage}%
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                      متوسطة {mediumPercentage}%
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                      صعبة {hardPercentage}%
                    </Badge>
                  </div>
                </div>
                <div className="flex w-full h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${easyPercentage}%` }}
                  ></div>
                  <div
                    className="bg-yellow-500 h-full"
                    style={{ width: `${mediumPercentage}%` }}
                  ></div>
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${hardPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">نمو المستخدمين</p>
                <p className="text-3xl font-bold">{stats.users.total}</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Badge className="bg-green-100 text-green-700">
                    +{userGrowth}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    مقارنة بالأسبوع الماضي
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">مستويات اللاعبين</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {Object.entries(stats.levels.users).map(([level, count]) => (
                    <Badge
                      key={level}
                      variant="outline"
                      className="bg-slate-50"
                    >
                      {level}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الإشعارات */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>التنبيهات</CardTitle>
              <Badge>{stats.notifications.total}</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[330px] overflow-auto">
            <div className="space-y-1">
              {stats.notifications.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  message={notification.message}
                  type={notification.type}
                  date={notification.date}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full">
              <Bell className="h-4 w-4 ml-2" />
              عرض جميع التنبيهات
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* الروابط السريعة */}
      <div>
        <h3 className="text-lg font-medium mb-4">الإدارة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <QuickLinkCard
            title="إدارة المستخدمين"
            description="إضافة، تعديل، وحذف حسابات المستخدمين"
            icon={<Users className="h-6 w-6" />}
            to="/admin/users"
            color="bg-blue-600"
          />
          <QuickLinkCard
            title="إدارة الفئات"
            description="تنظيم الفئات الرئيسية والفرعية للأسئلة"
            icon={<Layers className="h-6 w-6" />}
            to="/admin/categories"
            color="bg-amber-600"
          />
          <QuickLinkCard
            title="إدارة الأسئلة"
            description="إضافة وتعديل قاعدة بيانات الأسئلة"
            icon={<HelpCircle className="h-6 w-6" />}
            to="/admin/questions"
            color="bg-purple-600"
          />
          <QuickLinkCard
            title="إعدادات اللعبة"
            description="ضبط قواعد وإعدادات اللعب"
            icon={<Settings className="h-6 w-6" />}
            to="/admin/game-settings"
            color="bg-green-600"
          />
          <QuickLinkCard
            title="إدارة الباقات"
            description="إدارة باقات الكروت وخيارات الشراء"
            icon={<Package className="h-6 w-6" />}
            to="/admin/packages"
            color="bg-indigo-600"
          />
          <QuickLinkCard
            title="نظام المستويات"
            description="إعدادات المستويات والترقيات والنجوم"
            icon={<Crown className="h-6 w-6" />}
            to="/admin/levels"
            color="bg-orange-600"
          />
        </div>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الكروت</CardTitle>
            <CardDescription>
              إجمالي الكروت المجانية والمدفوعة المستخدمة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">الكروت المدفوعة</span>
                <span className="text-sm font-medium">
                  {stats.cards.totalPurchased} ({Math.round((stats.cards.totalPurchased / totalCards) * 100)}%)
                </span>
              </div>
              <Progress
                value={(stats.cards.totalPurchased / totalCards) * 100}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">الكروت المجانية</span>
                <span className="text-sm font-medium">
                  {stats.cards.freeIssued} ({Math.round((stats.cards.freeIssued / totalCards) * 100)}%)
                </span>
              </div>
              <Progress
                value={(stats.cards.freeIssued / totalCards) * 100}
                className="h-2"
              />

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">الباقات النشطة</span>
                  <Badge>{stats.packages.active}</Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">إجمالي الشراء</span>
                  <Badge>{stats.packages.purchased}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أداء الفئات</CardTitle>
            <CardDescription>
              قياس استخدام واكتمال الأسئلة في كل فئة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">فئات بحاجة للأسئلة</span>
                <Badge
                  variant={
                    stats.categories.lowQuestionCount > 0
                      ? "destructive"
                      : "outline"
                  }
                >
                  {stats.categories.lowQuestionCount}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 ml-2" />
                    <span className="text-sm">متوسط وقت اللعبة</span>
                  </div>
                  <Badge variant="outline">12 دقيقة</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-green-500 ml-2" />
                    <span className="text-sm">جولات اللعب</span>
                  </div>
                  <Badge variant="outline">{stats.games.totalRounds}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-purple-500 ml-2" />
                    <span className="text-sm">نسبة الإجابات الصحيحة</span>
                  </div>
                  <Badge variant="outline">68%</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />
                    <span className="text-sm font-medium">ملاحظات</span>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center">
                    <span className="ml-1">•</span>
                    <span>
                      {stats.categories.lowQuestionCount} فئات تحتاج إلى المزيد من الأسئلة
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="ml-1">•</span>
                    <span>نسبة أسئلة المستوى الصعب منخفضة ({hardPercentage}%)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
