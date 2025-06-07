import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import { Separator } from "../../../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { 
  Database, 
  Activity, 
  Zap, 
  HardDrive, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";

interface DatabaseStats {
  totalQuestions: number;
  activeQuestions: number;
  totalCategories: number;
  avgResponseTime: number;
  cacheHitRate: number;
  indexEfficiency: number;
  storageUsed: string;
  lastOptimized: Date;
}

interface PerformanceMetrics {
  queryTime: number;
  memoryUsage: number;
  cpuUsage: number;
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
}

interface OptimizationRecommendation {
  id: string;
  type: "index" | "query" | "cache" | "maintenance";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  status: "pending" | "applied" | "ignored";
}

interface DatabaseOptimizationProps {
  onOptimize?: (type: string) => Promise<void>;
  onRefreshStats?: () => Promise<void>;
}

export default function DatabaseOptimization({ 
  onOptimize, 
  onRefreshStats 
}: DatabaseOptimizationProps) {
  const [stats, setStats] = useState<DatabaseStats>({
    totalQuestions: 1250,
    activeQuestions: 1180,
    totalCategories: 12,
    avgResponseTime: 85,
    cacheHitRate: 94.2,
    indexEfficiency: 87.5,
    storageUsed: "2.4 GB",
    lastOptimized: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  const [performance, setPerformance] = useState<PerformanceMetrics>({
    queryTime: 12,
    memoryUsage: 68,
    cpuUsage: 23,
    connectionPool: {
      active: 5,
      idle: 15,
      total: 20
    }
  });

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([
    {
      id: "1",
      type: "index",
      title: "إضافة فهرس للبحث النصي",
      description: "إضافة فهرس full-text للبحث في نصوص الأسئلة",
      impact: "high",
      effort: "medium",
      status: "pending"
    },
    {
      id: "2",
      type: "cache",
      title: "تحسين ذاكرة التخزين المؤقت",
      description: "زيادة حجم cache للاستعلامات المتكررة",
      impact: "medium",
      effort: "low",
      status: "pending"
    },
    {
      id: "3",
      type: "query",
      title: "تحسين استعلام الإحصائيات",
      description: "استخدام materialized views للإحصائيات",
      impact: "medium",
      effort: "high",
      status: "applied"
    }
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleOptimize = async (type: string) => {
    setIsOptimizing(true);
    try {
      if (onOptimize) {
        await onOptimize(type);
      }
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update stats to show improvement
      setStats(prev => ({
        ...prev,
        avgResponseTime: Math.max(prev.avgResponseTime - 10, 20),
        cacheHitRate: Math.min(prev.cacheHitRate + 2, 99),
        indexEfficiency: Math.min(prev.indexEfficiency + 5, 95),
        lastOptimized: new Date()
      }));
      
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRefreshStats = async () => {
    try {
      if (onRefreshStats) {
        await onRefreshStats();
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to refresh stats:", error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "ignored": return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  const getPerformanceColor = (value: number, type: "response" | "usage" | "efficiency") => {
    if (type === "response") {
      return value < 50 ? "text-green-600" : value < 100 ? "text-yellow-600" : "text-red-600";
    }
    if (type === "usage") {
      return value < 70 ? "text-green-600" : value < 85 ? "text-yellow-600" : "text-red-600";
    }
    if (type === "efficiency") {
      return value > 90 ? "text-green-600" : value > 70 ? "text-yellow-600" : "text-red-600";
    }
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              تحسين قاعدة البيانات
            </CardTitle>
            <CardDescription>
              مراقبة الأداء وتحسين قاعدة بيانات الأسئلة
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isOptimizing}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            تحديث
          </Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الأسئلة</p>
                    <p className="text-2xl font-bold">{stats.totalQuestions.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">متوسط وقت الاستجابة</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(stats.avgResponseTime, "response")}`}>
                      {stats.avgResponseTime} ms
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">معدل إصابة التخزين المؤقت</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(stats.cacheHitRate, "efficiency")}`}>
                      {stats.cacheHitRate}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">مساحة التخزين</p>
                    <p className="text-2xl font-bold">{stats.storageUsed}</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">كفاءة الفهارس</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">كفاءة الفهارس العامة</span>
                  <span className={`font-medium ${getPerformanceColor(stats.indexEfficiency, "efficiency")}`}>
                    {stats.indexEfficiency}%
                  </span>
                </div>
                <Progress value={stats.indexEfficiency} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">وقت الاستعلام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {performance.queryTime} ms
                </div>
                <Progress value={(performance.queryTime / 100) * 100} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">استخدام الذاكرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getPerformanceColor(performance.memoryUsage, "usage")}`}>
                  {performance.memoryUsage}%
                </div>
                <Progress value={performance.memoryUsage} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">استخدام المعالج</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getPerformanceColor(performance.cpuUsage, "usage")}`}>
                  {performance.cpuUsage}%
                </div>
                <Progress value={performance.cpuUsage} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مجموعة الاتصالات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {performance.connectionPool.active}
                  </div>
                  <div className="text-sm text-gray-600">نشط</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {performance.connectionPool.idle}
                  </div>
                  <div className="text-sm text-gray-600">خامل</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {performance.connectionPool.total}
                  </div>
                  <div className="text-sm text-gray-600">الإجمالي</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(rec.status)}
                        <h3 className="font-medium">{rec.title}</h3>
                        <Badge variant="outline" className={getImpactColor(rec.impact)}>
                          تأثير {rec.impact === "high" ? "عالي" : rec.impact === "medium" ? "متوسط" : "منخفض"}
                        </Badge>
                        <Badge variant="outline">
                          جهد {rec.effort === "high" ? "عالي" : rec.effort === "medium" ? "متوسط" : "منخفض"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                    {rec.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleOptimize(rec.type)}
                        disabled={isOptimizing}
                      >
                        {isOptimizing ? "جاري التطبيق..." : "تطبيق"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">عمليات الصيانة</CardTitle>
              <CardDescription>
                آخر تحسين: {stats.lastOptimized.toLocaleDateString('ar-SA')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center justify-center p-6 h-auto"
                  onClick={() => handleOptimize("vacuum")}
                  disabled={isOptimizing}
                >
                  <div className="text-center">
                    <Database className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-medium">تنظيف قاعدة البيانات</div>
                    <div className="text-sm text-gray-500">إزالة البيانات المحذوفة</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-center p-6 h-auto"
                  onClick={() => handleOptimize("reindex")}
                  disabled={isOptimizing}
                >
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-medium">إعادة بناء الفهارس</div>
                    <div className="text-sm text-gray-500">تحسين أداء البحث</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-center p-6 h-auto"
                  onClick={() => handleOptimize("analyze")}
                  disabled={isOptimizing}
                >
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-medium">تحليل الإحصائيات</div>
                    <div className="text-sm text-gray-500">تحديث إحصائيات الجداول</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-center p-6 h-auto"
                  onClick={() => handleOptimize("optimize")}
                  disabled={isOptimizing}
                >
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-medium">تحسين شامل</div>
                    <div className="text-sm text-gray-500">تحسين جميع الجداول</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
