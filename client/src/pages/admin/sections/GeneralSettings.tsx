import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Calendar, User, BarChart3, Trophy, Star, Package } from 'lucide-react';

export default function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* إحصائيات عامة */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">إجمالي المستخدمين</CardTitle>
            <CardDescription>عدد المستخدمين المسجلين في التطبيق</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <User className="h-6 w-6 text-primary ml-2" />
              <div className="text-2xl font-bold">450</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className="ml-1">+15%</Badge>
              زيادة منذ الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">إجمالي الألعاب</CardTitle>
            <CardDescription>عدد الألعاب التي تم إنشاؤها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-primary ml-2" />
              <div className="text-2xl font-bold">1,250</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className="ml-1">+22%</Badge>
              زيادة منذ الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">إجمالي الأسئلة</CardTitle>
            <CardDescription>عدد الأسئلة في قاعدة البيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="h-6 w-6 text-primary ml-2" />
              <div className="text-2xl font-bold">3,740</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className="ml-1">+8%</Badge>
              زيادة منذ الشهر الماضي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات النجوم والمستويات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>توزيع المستويات</CardTitle>
            <CardDescription>توزيع المستخدمين على المستويات المختلفة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="ml-2 bg-blue-500">🥉</Badge>
                  <span>المستوى البرونزي</span>
                </div>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="ml-2 bg-gray-400">🥈</Badge>
                  <span>المستوى الفضي</span>
                </div>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="ml-2 bg-yellow-500">🥇</Badge>
                  <span>المستوى الذهبي</span>
                </div>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                </div>
                <span className="text-sm font-medium">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع البطاقات</CardTitle>
            <CardDescription>عدد البطاقات المباعة والمتاحة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-primary ml-2" />
                  <span>البطاقات المباعة</span>
                </div>
                <span className="font-bold">4,500</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 ml-2" />
                  <span>البطاقات المجانية الموزعة</span>
                </div>
                <span className="font-bold">2,100</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 ml-2" />
                  <span>متوسط استخدام البطاقات/شهر</span>
                </div>
                <span className="font-bold">680</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معلومات عامة عن النظام */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات النظام</CardTitle>
          <CardDescription>معلومات عامة عن حالة النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">إصدار النظام:</span>
                <span className="font-medium">v1.5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">آخر تحديث:</span>
                <span className="font-medium">18 مايو 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">حالة النظام:</span>
                <Badge className="bg-green-500">نشط</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">مجموع الفئات:</span>
                <span className="font-medium">35</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مجموع الباقات:</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">معدل إكمال الألعاب:</span>
                <span className="font-medium">87%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
