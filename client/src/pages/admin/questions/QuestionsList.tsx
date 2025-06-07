// مكون عرض قائمة الأسئلة - مبسط
// filepath: d:\DigitalDashboard\client\src\pages\admin\questions\QuestionsList.tsx

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import type { Question } from './QuestionsPage';

interface QuestionsListProps {
  questions: Question[];
  loading: boolean;
  onEdit: (question: Question) => void;
  onDelete: (questionId: number) => void;
}

export default function QuestionsList({ questions, loading, onEdit, onDelete }: QuestionsListProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  const difficultyLabels = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب'
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <p className="text-lg mb-2">لا توجد أسئلة</p>
            <p className="text-sm">قم بإضافة أول سؤال باستخدام زر "إضافة سؤال جديد"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                {/* نص السؤال */}
                <div>
                  <h3 className="font-medium text-gray-900 leading-relaxed">
                    {question.text}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">الإجابة الصحيحة:</span> {question.correctAnswer}
                  </p>
                </div>

                {/* الإجابات الخاطئة */}
                <div>
                  <span className="text-xs text-gray-500 font-medium">الإجابات الخاطئة:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {question.wrongAnswers.map((answer, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {answer}
                      </span>
                    ))}
                  </div>
                </div>

                {/* معلومات السؤال */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge 
                    className={`${difficultyColors[question.difficulty]} border-0`}
                  >
                    {difficultyLabels[question.difficulty]}
                  </Badge>
                  
                  <Badge variant="outline">
                    {question.points} نقطة
                  </Badge>

                  <Badge 
                    variant={question.isActive ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {question.isActive ? (
                      <>
                        <Eye className="h-3 w-3" />
                        نشط
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        معطل
                      </>
                    )}
                  </Badge>

                  {question.categoryId && (
                    <Badge variant="outline">
                      فئة {question.categoryId}
                    </Badge>
                  )}

                  {question.subcategoryId && (
                    <Badge variant="outline">
                      فرعية {question.subcategoryId}
                    </Badge>
                  )}
                </div>

                {/* تاريخ الإنشاء */}
                {question.createdAt && (
                  <p className="text-xs text-gray-400">
                    تم الإنشاء: {new Date(question.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                )}
              </div>

              {/* أزرار العمليات */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(question)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  تعديل
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(question.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  حذف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
