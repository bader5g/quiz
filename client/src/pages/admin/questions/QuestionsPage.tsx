// صفحة إدارة الأسئلة - واجهة مبسطة
// filepath: d:\DigitalDashboard\client\src\pages\admin\questions\QuestionsPage.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionForm from "./QuestionForm";
import QuestionsList from "./QuestionsList";
import QuestionsStats from "./QuestionsStats";

export interface Question {
  id: number;
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  categoryId: number;
  subcategoryId?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionFilters {
  categoryId?: number;
  subcategoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  search?: string;
  isActive?: boolean;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  // جلب الأسئلة من API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.subcategoryId) params.append('subcategoryId', filters.subcategoryId.toString());
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (searchTerm) params.append('search', searchTerm);
      if (typeof filters.isActive === 'boolean') params.append('isActive', filters.isActive.toString());

      const response = await fetch(`/api/questions?${params}`);
      if (!response.ok) throw new Error('فشل في جلب الأسئلة');
      
      const result = await response.json();
      setQuestions(result.data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب إحصائيات الأسئلة
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/questions/stats');
      if (!response.ok) throw new Error('فشل في جلب الإحصائيات');
      
      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [filters, searchTerm]);

  const handleQuestionSaved = () => {
    setShowForm(false);
    setEditingQuestion(null);
    fetchQuestions();
    fetchStats();
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('فشل في حذف السؤال');

      fetchQuestions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('فشل في حذف السؤال');
    }
  };

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

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأسئلة</h1>
          <p className="text-gray-600 mt-1">إضافة وتعديل وإدارة أسئلة النظام</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة سؤال جديد
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">قائمة الأسئلة</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          <TabsTrigger value="bulk">العمليات المجمعة</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* شريط البحث والفلاتر */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في النص أو الإجابات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  فلترة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الأسئلة */}
          <QuestionsList
            questions={questions}
            loading={loading}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
          />
        </TabsContent>

        <TabsContent value="stats">
          <QuestionsStats stats={stats} />
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>العمليات المجمعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>العمليات المجمعة قيد التطوير</p>
                <p className="text-sm mt-2">سيتم إضافة خيارات الاستيراد والتصدير قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نموذج إضافة/تعديل السؤال */}
      {showForm && (
        <QuestionForm
          question={editingQuestion}
          onClose={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
          onSave={handleQuestionSaved}
        />
      )}
    </div>
  );
}
