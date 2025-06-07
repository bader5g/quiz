// نموذج إضافة/تعديل سؤال - مبسط
// filepath: d:\DigitalDashboard\client\src\pages\admin\questions\QuestionForm.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Trash2, Save } from "lucide-react";
import type { Question } from './QuestionsPage';

interface QuestionFormProps {
  question?: Question | null;
  onClose: () => void;
  onSave: () => void;
}

interface Category {
  id: number;
  name: string;
}

export default function QuestionForm({ question, onClose, onSave }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    text: '',
    correctAnswer: '',
    wrongAnswers: ['', '', ''],
    categoryId: '',
    subcategoryId: '',
    difficulty: 'medium',
    points: 10,
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // تحميل البيانات الأولية
  useEffect(() => {
    fetchCategories();
    
    if (question) {
      setFormData({
        text: question.text,
        correctAnswer: question.correctAnswer,
        wrongAnswers: question.wrongAnswers.length >= 3 
          ? question.wrongAnswers.slice(0, 3)
          : [...question.wrongAnswers, ...Array(3 - question.wrongAnswers.length).fill('')],
        categoryId: question.categoryId.toString(),
        subcategoryId: question.subcategoryId?.toString() || '',
        difficulty: question.difficulty,
        points: question.points,
        isActive: question.isActive
      });
    }
  }, [question]);

  // جلب الفئات الرئيسية
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories/main');
      if (!response.ok) throw new Error('فشل في جلب الفئات');
      
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // جلب الفئات الفرعية عند تغيير الفئة الرئيسية
  const fetchSubcategories = async (mainCategoryCode: string) => {
    try {
      const response = await fetch(`/api/categories/sub/${mainCategoryCode}`);
      if (!response.ok) throw new Error('فشل في جلب الفئات الفرعية');
      
      const data = await response.json();
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  // تحديث قيم النموذج
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // إزالة رسالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // تحديث إجابة خاطئة
  const updateWrongAnswer = (index: number, value: string) => {
    const newWrongAnswers = [...formData.wrongAnswers];
    newWrongAnswers[index] = value;
    updateFormData('wrongAnswers', newWrongAnswers);
  };

  // إضافة إجابة خاطئة جديدة
  const addWrongAnswer = () => {
    if (formData.wrongAnswers.length < 4) {
      updateFormData('wrongAnswers', [...formData.wrongAnswers, '']);
    }
  };

  // حذف إجابة خاطئة
  const removeWrongAnswer = (index: number) => {
    if (formData.wrongAnswers.length > 2) {
      const newWrongAnswers = formData.wrongAnswers.filter((_, i) => i !== index);
      updateFormData('wrongAnswers', newWrongAnswers);
    }
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = 'نص السؤال مطلوب';
    } else if (formData.text.length < 5) {
      newErrors.text = 'نص السؤال يجب أن يكون 5 أحرف على الأقل';
    }

    if (!formData.correctAnswer.trim()) {
      newErrors.correctAnswer = 'الإجابة الصحيحة مطلوبة';
    }

    const validWrongAnswers = formData.wrongAnswers.filter(answer => answer.trim());
    if (validWrongAnswers.length < 2) {
      newErrors.wrongAnswers = 'يجب إضافة خيارين خاطئين على الأقل';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'الفئة الرئيسية مطلوبة';
    }

    if (formData.points < 1 || formData.points > 100) {
      newErrors.points = 'النقاط يجب أن تكون بين 1 و 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // حفظ السؤال
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const saveData = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
        wrongAnswers: formData.wrongAnswers.filter(answer => answer.trim())
      };

      const url = question ? `/api/questions/${question.id}` : '/api/questions';
      const method = question ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حفظ السؤال');
      }

      onSave();
    } catch (error) {
      console.error('Error saving question:', error);
      alert(error instanceof Error ? error.message : 'فشل في حفظ السؤال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir="rtl">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {question ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* نص السؤال */}
          <div className="space-y-2">
            <Label htmlFor="text">نص السؤال *</Label>
            <Textarea
              id="text"
              placeholder="اكتب نص السؤال هنا..."
              value={formData.text}
              onChange={(e) => updateFormData('text', e.target.value)}
              className={errors.text ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.text && <p className="text-red-500 text-sm">{errors.text}</p>}
          </div>

          {/* الإجابة الصحيحة */}
          <div className="space-y-2">
            <Label htmlFor="correctAnswer">الإجابة الصحيحة *</Label>
            <Input
              id="correctAnswer"
              placeholder="الإجابة الصحيحة"
              value={formData.correctAnswer}
              onChange={(e) => updateFormData('correctAnswer', e.target.value)}
              className={errors.correctAnswer ? 'border-red-500' : ''}
            />
            {errors.correctAnswer && <p className="text-red-500 text-sm">{errors.correctAnswer}</p>}
          </div>

          {/* الإجابات الخاطئة */}
          <div className="space-y-2">
            <Label>الإجابات الخاطئة * (على الأقل 2)</Label>
            {formData.wrongAnswers.map((answer, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`الإجابة الخاطئة ${index + 1}`}
                  value={answer}
                  onChange={(e) => updateWrongAnswer(index, e.target.value)}
                />
                {formData.wrongAnswers.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeWrongAnswer(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {formData.wrongAnswers.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWrongAnswer}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة إجابة خاطئة
              </Button>
            )}
            {errors.wrongAnswers && <p className="text-red-500 text-sm">{errors.wrongAnswers}</p>}
          </div>

          {/* اختيار الفئة */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الفئة الرئيسية *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  updateFormData('categoryId', value);
                  const selectedCategory = categories.find(cat => cat.id.toString() === value);
                  if (selectedCategory) {
                    // في التطبيق الحقيقي، استخدم selectedCategory.code
                    fetchSubcategories(value);
                  }
                  updateFormData('subcategoryId', '');
                }}
              >
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId}</p>}
            </div>

            <div className="space-y-2">
              <Label>الفئة الفرعية</Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) => updateFormData('subcategoryId', value)}
                disabled={!formData.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* إعدادات السؤال */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>مستوى الصعوبة</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => updateFormData('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">سهل</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="hard">صعب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">النقاط</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => updateFormData('points', parseInt(e.target.value) || 1)}
                className={errors.points ? 'border-red-500' : ''}
              />
              {errors.points && <p className="text-red-500 text-sm">{errors.points}</p>}
            </div>

            <div className="space-y-2">
              <Label>حالة السؤال</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateFormData('isActive', checked)}
                />
                <span className="text-sm">
                  {formData.isActive ? 'نشط' : 'معطل'}
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ السؤال'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
