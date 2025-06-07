// مخططات التحقق من البيانات للأسئلة
// filepath: d:\DigitalDashboard\server\schemas\question-schemas.ts

import { z } from "zod";

// مخطط إضافة سؤال جديد
export const createQuestionSchema = z.object({
  text: z.string().min(5, "نص السؤال يجب أن يكون 5 أحرف على الأقل").max(500, "نص السؤال طويل جداً"),
  correctAnswer: z.string().min(1, "الإجابة الصحيحة مطلوبة").max(200, "الإجابة الصحيحة طويلة جداً"),
  wrongAnswers: z.array(z.string().min(1).max(200)).min(2, "يجب إضافة خيارين خاطئين على الأقل").max(4, "حد أقصى 4 خيارات خاطئة"),
  categoryId: z.number().int().positive("معرف الفئة مطلوب"),
  subcategoryId: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard'], { required_error: "مستوى الصعوبة مطلوب" }),
  points: z.number().int().min(1, "النقاط يجب أن تكون رقم موجب").max(100, "حد أقصى 100 نقطة"),
  isActive: z.boolean().default(true)
});

// مخطط تعديل سؤال موجود
export const updateQuestionSchema = z.object({
  text: z.string().min(5).max(500).optional(),
  correctAnswer: z.string().min(1).max(200).optional(),
  wrongAnswers: z.array(z.string().min(1).max(200)).min(2).max(4).optional(),
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  points: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional()
});

// مخطط فلترة الأسئلة
export const questionFiltersSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  search: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionFiltersInput = z.infer<typeof questionFiltersSchema>;
