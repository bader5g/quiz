import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Activity, Clock, Users, Eye } from "lucide-react";

interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: "create" | "edit" | "delete" | "view" | "export";
  entityType: "question" | "category" | "setting";
  entityId?: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface QuestionsActivityTrackerProps {
  activities: ActivityEntry[];
  onRefresh?: () => void;
  maxEntries?: number;
}

export default function QuestionsActivityTracker({ 
  activities = [], 
  onRefresh,
  maxEntries = 50 
}: QuestionsActivityTrackerProps) {
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Sort activities by timestamp and limit to maxEntries
    const sorted = [...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxEntries);
    setRecentActivities(sorted);
  }, [activities, maxEntries]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-800";
      case "edit": return "bg-blue-100 text-blue-800";
      case "delete": return "bg-red-100 text-red-800";
      case "view": return "bg-gray-100 text-gray-800";
      case "export": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return "➕";
      case "edit": return "✏️";
      case "delete": return "🗑️";
      case "view": return "👁️";
      case "export": return "📤";
      default: return "📝";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">سجل النشاطات</CardTitle>
          <CardDescription>
            آخر الأنشطة في نظام إدارة الأسئلة
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            {recentActivities.length} نشاط
          </Badge>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              تحديث
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد أنشطة مسجلة</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="text-lg">{getActionIcon(activity.action)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {activity.userName}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getActionColor(activity.action)}`}
                      >
                        {activity.action}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {activity.entityType}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.details}
                  </p>
                  {activity.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}        </div>
      </CardContent>
    </Card>
  );
}

export default QuestionsActivityTracker;
