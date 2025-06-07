import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Badge } from "../../../../components/ui/badge";
import { Separator } from "../../../../components/ui/separator";
import { Plus, X, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface QuestionFormData {
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  categoryId: number | null;
  subcategoryId: number | null;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  isActive: boolean;
}

interface QuestionEditFormProps {
  question?: any;
  categories: Category[];
  onSave: (questionData: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function QuestionEditForm({
  question,
  categories,
  onSave,
  onCancel,
  isLoading = false
}: QuestionEditFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    text: "",
    correctAnswer: "",
    wrongAnswers: ["", "", ""],
    categoryId: null,
    subcategoryId: null,
    difficulty: "medium",
    points: 10,
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text || "",
        correctAnswer: question.correctAnswer || "",
        wrongAnswers: question.wrongAnswers || ["", "", ""],
        categoryId: question.categoryId || null,
        subcategoryId: question.subcategoryId || null,
        difficulty: question.difficulty || "medium",
        points: question.points || 10,
        isActive: question.isActive !== false
      });
    }
  }, [question]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = "نص السؤال مطلوب";
    }

    if (!formData.correctAnswer.trim()) {
      newErrors.correctAnswer = "الإجابة الصحيحة مطلوبة";
    }

    const validWrongAnswers = formData.wrongAnswers.filter(answer => answer.trim());
    if (validWrongAnswers.length < 2) {
      newErrors.wrongAnswers = "يجب إدخال إجابتين خاطئتين على الأقل";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "يجب اختيار فئة";
    }

    if (formData.points < 1 || formData.points > 100) {
      newErrors.points = "النقاط يجب أن تكون بين 1 و 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("يرجى تصحيح الأخطاء في النموذج");
      return;
    }

    try {
      const submitData = {
        ...formData,
        wrongAnswers: formData.wrongAnswers.filter(answer => answer.trim())
      };
      
      await onSave(submitData);
      toast.success(question ? "تم تحديث السؤال بنجاح" : "تم إضافة السؤال بنجاح");
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("حدث خطأ أثناء حفظ السؤال");
    }
  };

  const handleReset = () => {
    if (question) {
      setFormData({
        text: question.text || "",
        correctAnswer: question.correctAnswer || "",
        wrongAnswers: question.wrongAnswers || ["", "", ""],
        categoryId: question.categoryId || null,
        subcategoryId: question.subcategoryId || null,
        difficulty: question.difficulty || "medium",
        points: question.points || 10,
        isActive: question.isActive !== false
      });
    } else {
      setFormData({
        text: "",
        correctAnswer: "",
        wrongAnswers: ["", "", ""],
        categoryId: null,
        subcategoryId: null,
        difficulty: "medium",
        points: 10,
        isActive: true
      });
    }
    setErrors({});
  };

  const addWrongAnswer = () => {
    if (formData.wrongAnswers.length < 5) {
      setFormData(prev => ({
        ...prev,
        wrongAnswers: [...prev.wrongAnswers, ""]
      }));
    }
  };

  const removeWrongAnswer = (index: number) => {
    if (formData.wrongAnswers.length > 2) {
      setFormData(prev => ({
        ...prev,
        wrongAnswers: prev.wrongAnswers.filter((_, i) => i !== index)
      }));
    }
  };

  const updateWrongAnswer = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      wrongAnswers: prev.wrongAnswers.map((answer, i) => 
        i === index ? value : answer
      )
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question ? "تعديل السؤال" : "إضافة سؤال جديد"}</CardTitle>
        <CardDescription>
          {question ? "قم بتعديل بيانات السؤال" : "أدخل بيانات السؤال الجديد"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="text">نص السؤال *</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="أدخل نص السؤال..."
              rows={3}
              className={errors.text ? "border-red-500" : ""}
            />
            {errors.text && <p className="text-sm text-red-600">{errors.text}</p>}
          </div>

          {/* Correct Answer */}
          <div className="space-y-2">
            <Label htmlFor="correctAnswer">الإجابة الصحيحة *</Label>
            <Input
              id="correctAnswer"
              value={formData.correctAnswer}
              onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
              placeholder="أدخل الإجابة الصحيحة..."
              className={errors.correctAnswer ? "border-red-500" : ""}
            />
            {errors.correctAnswer && <p className="text-sm text-red-600">{errors.correctAnswer}</p>}
          </div>

          {/* Wrong Answers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>الإجابات الخاطئة *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWrongAnswer}
                disabled={formData.wrongAnswers.length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                إضافة
              </Button>
            </div>
            <div className="space-y-2">
              {formData.wrongAnswers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={answer}
                    onChange={(e) => updateWrongAnswer(index, e.target.value)}
                    placeholder={`الإجابة الخاطئة ${index + 1}...`}
                  />
                  {formData.wrongAnswers.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeWrongAnswer(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.wrongAnswers && <p className="text-sm text-red-600">{errors.wrongAnswers}</p>}
          </div>

          <Separator />

          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">الفئة *</Label>
              <Select
                value={formData.categoryId?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  categoryId: value ? parseInt(value) : null 
                }))}
              >
                <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                  <SelectValue placeholder="اختر الفئة..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">مستوى الصعوبة</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  difficulty: value as "easy" | "medium" | "hard"
                }))}
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
          </div>

          {/* Points and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">النقاط *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  points: parseInt(e.target.value) || 10 
                }))}
                className={errors.points ? "border-red-500" : ""}
              />
              {errors.points && <p className="text-sm text-red-600">{errors.points}</p>}
            </div>

            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    isActive: checked as boolean 
                  }))}
                />
                <Label htmlFor="isActive">السؤال نشط</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              إعادة تعيين
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
