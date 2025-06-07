// Schema for Simple Questions Management System
import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// جدول الأسئلة المبسط
export const questions_simple = pgTable("questions_simple", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(), // نص السؤال
  correctAnswer: text("correct_answer").notNull(), // الإجابة الصحيحة
  wrongAnswers: jsonb("wrong_answers").notNull(), // الإجابات الخاطئة (مصفوفة)
  categoryId: integer("category_id"), // معرف الفئة (اختياري)
  subcategoryId: integer("subcategory_id"), // معرف الفئة الفرعية (اختياري)
  difficulty: text("difficulty").notNull().default("medium"), // مستوى الصعوبة: easy, medium, hard
  points: integer("points").notNull().default(10), // النقاط المكتسبة
  isActive: boolean("is_active").notNull().default(true), // هل السؤال نشط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema لإنشاء سؤال جديد
export const insertQuestionSimpleSchema = createInsertSchema(questions_simple).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema لتحديث سؤال
export const updateQuestionSimpleSchema = createInsertSchema(questions_simple).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// أنواع البيانات
export type QuestionSimple = typeof questions_simple.$inferSelect;
export type InsertQuestionSimple = z.infer<typeof insertQuestionSimpleSchema>;
export type UpdateQuestionSimple = z.infer<typeof updateQuestionSimpleSchema>;

// Schema للتحقق من صحة البيانات
export const questionValidationSchema = z.object({
  text: z.string().min(5, "نص السؤال يجب أن يكون 5 أحرف على الأقل"),
  correctAnswer: z.string().min(1, "الإجابة الصحيحة مطلوبة"),
  wrongAnswers: z.array(z.string().min(1)).min(1, "يجب إضافة إجابة خاطئة واحدة على الأقل").max(3, "يمكن إضافة 3 إجابات خاطئة كحد أقصى"),
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  points: z.number().int().positive().min(1).max(100).default(10),
  isActive: z.boolean().default(true),
});

export type QuestionValidation = z.infer<typeof questionValidationSchema>;
