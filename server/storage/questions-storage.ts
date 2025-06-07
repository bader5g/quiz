// طبقة التخزين للأسئلة - نظام مبسط
// filepath: d:\DigitalDashboard\server\storage\questions-storage.ts

import { db } from "../db";
import { questions } from "@shared/schema";
import { eq, and, like, desc, asc } from "drizzle-orm";
import type { SimpleQuestion, QuestionFilters, QuestionStats } from "../types/question-types";

export class QuestionsStorage {
  
  // إضافة سؤال جديد
  async createQuestion(questionData: Omit<SimpleQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<SimpleQuestion> {
    try {
      const [newQuestion] = await db.insert(questions).values({
        text: questionData.text,
        correctAnswer: questionData.correctAnswer,
        wrongAnswers: questionData.wrongAnswers,
        categoryId: questionData.categoryId,
        subcategoryId: questionData.subcategoryId,
        difficulty: questionData.difficulty,
        points: questionData.points,
        isActive: questionData.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return newQuestion as SimpleQuestion;
    } catch (error) {
      console.error("Error creating question:", error);
      throw new Error("فشل في إضافة السؤال");
    }
  }

  // الحصول على سؤال بالمعرف
  async getQuestionById(id: number): Promise<SimpleQuestion | null> {
    try {
      const [question] = await db.select()
        .from(questions)
        .where(eq(questions.id, id))
        .limit(1);

      return question as SimpleQuestion || null;
    } catch (error) {
      console.error("Error fetching question:", error);
      throw new Error("فشل في جلب السؤال");
    }
  }

  // جلب الأسئلة مع الفلترة والصفحات
  async getQuestions(filters: QuestionFilters = {}, page = 1, limit = 20): Promise<{
    questions: SimpleQuestion[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];

      // بناء شروط البحث
      if (filters.categoryId) {
        conditions.push(eq(questions.categoryId, filters.categoryId));
      }
      if (filters.subcategoryId) {
        conditions.push(eq(questions.subcategoryId, filters.subcategoryId));
      }
      if (filters.difficulty) {
        conditions.push(eq(questions.difficulty, filters.difficulty));
      }
      if (filters.search) {
        conditions.push(like(questions.text, `%${filters.search}%`));
      }
      if (typeof filters.isActive === 'boolean') {
        conditions.push(eq(questions.isActive, filters.isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // جلب الأسئلة
      const questions = await db.select()
        .from(questions)
        .where(whereClause)
        .orderBy(desc(questions.createdAt))
        .limit(limit)
        .offset(offset);

      // عد إجمالي الأسئلة
      const [{ count }] = await db.select({ count: questions.id })
        .from(questions)
        .where(whereClause);

      const totalCount = Array.isArray(count) ? count.length : (count as number);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        questions: questions as SimpleQuestion[],
        total: totalCount,
        page,
        totalPages
      };
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw new Error("فشل في جلب الأسئلة");
    }
  }

  // تحديث سؤال
  async updateQuestion(id: number, updates: Partial<SimpleQuestion>): Promise<SimpleQuestion | null> {
    try {
      const [updatedQuestion] = await db.update(questions)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(questions.id, id))
        .returning();

      return updatedQuestion as SimpleQuestion || null;
    } catch (error) {
      console.error("Error updating question:", error);
      throw new Error("فشل في تحديث السؤال");
    }
  }

  // حذف سؤال
  async deleteQuestion(id: number): Promise<boolean> {
    try {
      const result = await db.delete(questions)
        .where(eq(questions.id, id));

      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting question:", error);
      throw new Error("فشل في حذف السؤال");
    }
  }

  // إحصائيات الأسئلة
  async getQuestionsStats(): Promise<QuestionStats> {
    try {
      const allQuestions = await db.select()
        .from(questions);

      const stats: QuestionStats = {
        total: allQuestions.length,
        byCategory: {},
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        active: 0,
        inactive: 0
      };

      allQuestions.forEach(question => {
        // إحصائيات حسب الفئة
        const categoryId = question.categoryId;
        stats.byCategory[categoryId] = (stats.byCategory[categoryId] || 0) + 1;

        // إحصائيات حسب الصعوبة
        stats.byDifficulty[question.difficulty]++;

        // إحصائيات النشاط
        if (question.isActive) {
          stats.active++;
        } else {
          stats.inactive++;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error fetching questions stats:", error);
      throw new Error("فشل في جلب إحصائيات الأسئلة");
    }
  }

  // جلب أسئلة عشوائية لفئات معينة
  async getRandomQuestionsForGame(categoryIds: number[], count = 10): Promise<SimpleQuestion[]> {
    try {
      const questions = await db.select()
        .from(questions)
        .where(and(
          questions.categoryId.in ? questions.categoryId.in(categoryIds) : 
          eq(questions.categoryId, categoryIds[0]),
          eq(questions.isActive, true)
        ))
        .orderBy(asc(questions.id)); // في التطبيق الحقيقي، استخدم RANDOM()

      // اختيار عشوائي في JavaScript (للبساطة)
      const shuffled = questions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count) as SimpleQuestion[];
    } catch (error) {
      console.error("Error fetching random questions:", error);
      throw new Error("فشل في جلب الأسئلة العشوائية");
    }
  }
}
