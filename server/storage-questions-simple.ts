// Storage layer for Simple Questions Management System
import { db } from "./db";
import { questions_simple } from "@shared/schema";
import { eq, and, like, desc, asc, count, inArray } from "drizzle-orm";
import type { QuestionSimple, InsertQuestionSimple, UpdateQuestionSimple } from "@shared/schema";

// أنواع البيانات للفلاتر والإحصائيات
export interface QuestionFilters {
  categoryId?: number;
  subcategoryId?: number;
  difficulty?: "easy" | "medium" | "hard";
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface QuestionStats {
  totalQuestions: number;
  activeQuestions: number;
  questionsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionsByCategory: Array<{
    categoryId: number | null;
    count: number;
  }>;
}

export class QuestionsSimpleStorage {
  
  // إضافة سؤال جديد
  async createQuestion(questionData: InsertQuestionSimple): Promise<QuestionSimple> {
    try {
      const [newQuestion] = await db.insert(questions_simple).values({
        text: questionData.text,
        correctAnswer: questionData.correctAnswer,
        categoryId: questionData.categoryId,
        subcategoryId: questionData.subcategoryId,
        difficulty: questionData.difficulty || "medium",
        points: questionData.points || 10,
        isActive: questionData.isActive !== undefined ? questionData.isActive : true,
      }).returning();

      return newQuestion;
    } catch (error) {
      console.error("Error creating question:", error);
      throw new Error("Failed to create question");
    }
  }

  // الحصول على سؤال بالمعرف
  async getQuestionById(id: number): Promise<QuestionSimple | null> {
    try {
      const [question] = await db
        .select()
        .from(questions_simple)
        .where(eq(questions_simple.id, id))
        .limit(1);

      return question || null;
    } catch (error) {
      console.error("Error getting question by ID:", error);
      throw new Error("Failed to get question");
    }
  }

  // الحصول على قائمة الأسئلة مع الفلاتر
  async getQuestions(filters: QuestionFilters = {}): Promise<{
    questions: QuestionSimple[];
    total: number;
  }> {
    try {
      const conditions = [];

      // تطبيق الفلاتر
      if (filters.categoryId !== undefined) {
        conditions.push(eq(questions_simple.categoryId, filters.categoryId));
      }
      if (filters.subcategoryId !== undefined) {
        conditions.push(eq(questions_simple.subcategoryId, filters.subcategoryId));
      }
      if (filters.difficulty) {
        conditions.push(eq(questions_simple.difficulty, filters.difficulty));
      }
      if (filters.search) {
        conditions.push(like(questions_simple.text, `%${filters.search}%`));
      }
      if (filters.isActive !== undefined) {
        conditions.push(eq(questions_simple.isActive, filters.isActive));
      }

      // الحصول على الأسئلة
      const questionsQuery = db
        .select()
        .from(questions_simple)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(questions_simple.createdAt));

      if (filters.limit) {
        questionsQuery.limit(filters.limit);
      }
      if (filters.offset) {
        questionsQuery.offset(filters.offset);
      }

      const questions = await questionsQuery;

      // الحصول على العدد الإجمالي
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(questions_simple)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        questions,
        total: totalCount
      };
    } catch (error) {
      console.error("Error getting questions:", error);
      throw new Error("Failed to get questions");
    }
  }

  // تحديث سؤال
  async updateQuestion(id: number, questionData: UpdateQuestionSimple): Promise<QuestionSimple> {
    try {
      const [updatedQuestion] = await db
        .update(questions_simple)
        .set({
          ...questionData,
          updatedAt: new Date(),
        })
        .where(eq(questions_simple.id, id))
        .returning();

      if (!updatedQuestion) {
        throw new Error("Question not found");
      }

      return updatedQuestion;
    } catch (error) {
      console.error("Error updating question:", error);
      throw new Error("Failed to update question");
    }
  }

  // حذف سؤال
  async deleteQuestion(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(questions_simple)
        .where(eq(questions_simple.id, id));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting question:", error);
      throw new Error("Failed to delete question");
    }
  }

  // الحصول على إحصائيات الأسئلة
  async getQuestionStats(): Promise<QuestionStats> {
    try {
      // إجمالي الأسئلة
      const [{ totalQuestions }] = await db
        .select({ totalQuestions: count() })
        .from(questions_simple);

      // الأسئلة النشطة
      const [{ activeQuestions }] = await db
        .select({ activeQuestions: count() })
        .from(questions_simple)
        .where(eq(questions_simple.isActive, true));

      // الأسئلة حسب مستوى الصعوبة
      const difficultyStats = await db
        .select({
          difficulty: questions_simple.difficulty,
          count: count()
        })
        .from(questions_simple)
        .groupBy(questions_simple.difficulty);

      const questionsByDifficulty = {
        easy: 0,
        medium: 0,
        hard: 0
      };

      difficultyStats.forEach(stat => {
        if (stat.difficulty in questionsByDifficulty) {
          questionsByDifficulty[stat.difficulty as keyof typeof questionsByDifficulty] = stat.count;
        }
      });

      // الأسئلة حسب الفئة
      const categoryStats = await db
        .select({
          categoryId: questions_simple.categoryId,
          count: count()
        })
        .from(questions_simple)
        .groupBy(questions_simple.categoryId);

      return {
        totalQuestions,
        activeQuestions,
        questionsByDifficulty,
        questionsByCategory: categoryStats
      };
    } catch (error) {
      console.error("Error getting question stats:", error);
      throw new Error("Failed to get question statistics");
    }
  }

  // الحصول على أسئلة عشوائية لفئة معينة
  async getRandomQuestions(categoryIds: number[], limit: number = 10): Promise<QuestionSimple[]> {
    try {
      const questions = await db
        .select()
        .from(questions_simple)        .where(
          and(
            categoryIds.length > 0 ? inArray(questions_simple.categoryId, categoryIds) : undefined,
            eq(questions_simple.isActive, true)
          )
        )
        .orderBy(asc(questions_simple.id)) // يمكن تحسين هذا لاختيار عشوائي حقيقي
        .limit(limit);

      return questions;
    } catch (error) {
      console.error("Error getting random questions:", error);
      throw new Error("Failed to get random questions");
    }
  }

  // تبديل حالة السؤال (نشط/غير نشط)
  async toggleQuestionStatus(id: number): Promise<QuestionSimple> {
    try {
      const question = await this.getQuestionById(id);
      if (!question) {
        throw new Error("Question not found");
      }

      return await this.updateQuestion(id, { isActive: !question.isActive });
    } catch (error) {
      console.error("Error toggling question status:", error);
      throw new Error("Failed to toggle question status");
    }
  }

  // حذف متعدد للأسئلة
  async deleteMultipleQuestions(ids: number[]): Promise<number> {
    try {
      const result = await db
        .delete(questions_simple)        .where(ids.length > 0 ? inArray(questions_simple.id, ids) : eq(questions_simple.id, ids[0]));

      return result.rowCount || 0;
    } catch (error) {
      console.error("Error deleting multiple questions:", error);
      throw new Error("Failed to delete questions");
    }
  }
}

// إنشاء مثيل وحيد من الكلاس
export const questionsSimpleStorage = new QuestionsSimpleStorage();
