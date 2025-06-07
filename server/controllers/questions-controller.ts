// تحكم في عمليات الأسئلة
// filepath: d:\DigitalDashboard\server\controllers\questions-controller.ts

import type { Request, Response } from "express";
import { QuestionsStorage } from "../storage/questions-storage";
import {
  createQuestionSchema,
  updateQuestionSchema,
  questionFiltersSchema
} from "../schemas/question-schemas";
import { z } from "zod";

const questionsStorage = new QuestionsStorage();

// معالج إضافة سؤال جديد
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const validatedData = createQuestionSchema.parse(req.body);
    const newQuestion = await questionsStorage.createQuestion(validatedData);
    
    res.status(201).json({
      success: true,
      message: "تم إضافة السؤال بنجاح",
      data: newQuestion
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير صالحة",
        errors: error.errors
      });
    }

    console.error("Error in createQuestion:", error);
    res.status(500).json({
      success: false,
      message: "فشل في إضافة السؤال"
    });
  }
};

// معالج جلب الأسئلة
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const filters = questionFiltersSchema.parse(req.query);
    const result = await questionsStorage.getQuestions(
      filters,
      filters.page,
      filters.limit
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "معايير البحث غير صالحة",
        errors: error.errors
      });
    }

    console.error("Error in getQuestions:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب الأسئلة"
    });
  }
};

// معالج جلب سؤال واحد
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "معرف السؤال غير صالح"
      });
    }

    const question = await questionsStorage.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "السؤال غير موجود"
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error("Error in getQuestionById:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب السؤال"
    });
  }
};

// معالج تحديث سؤال
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "معرف السؤال غير صالح"
      });
    }

    const validatedData = updateQuestionSchema.parse(req.body);
    const updatedQuestion = await questionsStorage.updateQuestion(id, validatedData);
    
    if (!updatedQuestion) {
      return res.status(404).json({
        success: false,
        message: "السؤال غير موجود"
      });
    }

    res.json({
      success: true,
      message: "تم تحديث السؤال بنجاح",
      data: updatedQuestion
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير صالحة",
        errors: error.errors
      });
    }

    console.error("Error in updateQuestion:", error);
    res.status(500).json({
      success: false,
      message: "فشل في تحديث السؤال"
    });
  }
};

// معالج حذف سؤال
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "معرف السؤال غير صالح"
      });
    }

    const deleted = await questionsStorage.deleteQuestion(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "السؤال غير موجود"
      });
    }

    res.json({
      success: true,
      message: "تم حذف السؤال بنجاح"
    });
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
    res.status(500).json({
      success: false,
      message: "فشل في حذف السؤال"
    });
  }
};

// معالج جلب إحصائيات الأسئلة
export const getQuestionsStats = async (req: Request, res: Response) => {
  try {
    const stats = await questionsStorage.getQuestionsStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error in getQuestionsStats:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب إحصائيات الأسئلة"
    });
  }
};

// معالج جلب أسئلة عشوائية للعبة
export const getRandomQuestionsForGame = async (req: Request, res: Response) => {
  try {
    const { categoryIds, count } = req.query;
    
    if (!categoryIds) {
      return res.status(400).json({
        success: false,
        message: "معرفات الفئات مطلوبة"
      });
    }

    const parsedCategoryIds = Array.isArray(categoryIds) 
      ? categoryIds.map(id => parseInt(id as string))
      : [parseInt(categoryIds as string)];

    const parsedCount = count ? parseInt(count as string) : 10;

    const questions = await questionsStorage.getRandomQuestionsForGame(
      parsedCategoryIds,
      parsedCount
    );

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error("Error in getRandomQuestionsForGame:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب الأسئلة العشوائية"
    });
  }
};

// تفعيل أو إلغاء تفعيل مجموعة من الأسئلة دفعة واحدة
export const bulkActivateDeactivateQuestions = async (req: Request, res: Response) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "البيانات غير صالحة"
      });
    }
    const updatedCount = await questionsStorage.bulkActivateDeactivate(ids, isActive);
    res.json({
      success: true,
      message: `تم تحديث حالة ${updatedCount} سؤال بنجاح`,
      updatedCount
    });
  } catch (error) {
    console.error("Error in bulkActivateDeactivateQuestions:", error);
    res.status(500).json({
      success: false,
      message: "فشل في تحديث حالة الأسئلة جماعيًا"
    });
  }
};
