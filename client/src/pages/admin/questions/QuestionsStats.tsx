// مكون إحصائيات الأسئلة - مبسط
// filepath: d:\DigitalDashboard\client\src\pages\admin\questions\QuestionsStats.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, TrendingUp, Eye, EyeOff } from "lucide-react";

interface StatsProps {
  stats: {
    total: number;
    byCategory: Record<number, number>;
    byDifficulty: Record<string, number>;
    active: number;
    inactive: number;
  } | null;
}

export default function QuestionsStats({ stats }: StatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const difficultyLabels = {
    easy: 'سهل',
    medium: 'متوسط', 
    hard: 'صعب'
  };

  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500'
  };

  const activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* البطاقات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأسئلة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأسئلة النشطة</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأسئلة المعطلة</p>
                <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
              </div>
              <EyeOff className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل النشاط</p>
                <p className="text-2xl font-bold text-blue-600">{activePercentage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* توزيع الأسئلة حسب الصعوبة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            توزيع الأسئلة حسب مستوى الصعوبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.byDifficulty).map(([difficulty, count]) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              
              return (
                <div key={difficulty} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-white border-0`}
                      >
                        {difficultyLabels[difficulty as keyof typeof difficultyLabels]}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {count} سؤال ({percentage}%)
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                      '--progress-background': difficultyColors[difficulty as keyof typeof difficultyColors]
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* توزيع الأسئلة حسب الفئات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            توزيع الأسئلة حسب الفئات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byCategory).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد أسئلة مصنفة بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byCategory)
                .sort(([,a], [,b]) => b - a) // ترتيب تنازلي حسب عدد الأسئلة
                .map(([categoryId, count]) => {
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  
                  return (
                    <div key={categoryId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">فئة {categoryId}</Badge>
                        <span className="text-sm text-gray-600">{count} سؤال</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-10">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>نصائح لتحسين بنك الأسئلة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {stats.total === 0 && (
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg">
                💡 ابدأ بإضافة أول سؤال لبناء بنك الأسئلة الخاص بك
              </div>
            )}
            
            {stats.total > 0 && stats.inactive > stats.active && (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                ⚠️ لديك أسئلة معطلة أكثر من النشطة. تأكد من تفعيل الأسئلة المهمة
              </div>
            )}
            
            {stats.byDifficulty.hard === 0 && stats.total > 5 && (
              <div className="p-3 bg-orange-50 text-orange-800 rounded-lg">
                📈 فكر في إضافة بعض الأسئلة الصعبة لتحدي اللاعبين المتقدمين
              </div>
            )}
            
            {stats.byDifficulty.easy === 0 && stats.total > 5 && (
              <div className="p-3 bg-green-50 text-green-800 rounded-lg">
                🎯 أضف بعض الأسئلة السهلة لجذب المبتدئين
              </div>
            )}

            {stats.total >= 10 && (
              <div className="p-3 bg-purple-50 text-purple-800 rounded-lg">
                🎉 ممتاز! لديك مجموعة جيدة من الأسئلة. استمر في إضافة المزيد
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
