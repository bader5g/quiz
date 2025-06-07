// Controllers for Simple Questions Management System
import { Request, Response } from "express";
import { questionsSimpleStorage } from "./storage-questions-simple";
import {
  createQuestionSchema,
  updateQuestionSchema,
  questionFiltersSchema,
  questionIdSchema,
  bulkOperationSchema,
  type ApiResponse,
  type PaginatedResponse
} from "@shared/zod-questions-simple";

export class QuestionsSimpleController {

  // إضافة سؤال جديد
  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const validation = createQuestionSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "بيانات غير صحيحة",
          errors: validation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const newQuestion = await questionsSimpleStorage.createQuestion(validation.data);
      
      res.status(201).json({
        success: true,
        message: "تم إنشاء السؤال بنجاح",
        data: newQuestion
      } as ApiResponse);

    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في إنشاء السؤال",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // الحصول على قائمة الأسئلة
  async getQuestions(req: Request, res: Response): Promise<void> {
    try {
      // تحويل query parameters إلى الأنواع المناسبة
      const queryParams = {
        ...req.query,
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
        subcategoryId: req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
        page: req.query.page ? Number(req.query.page) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };

      const validation = questionFiltersSchema.safeParse(queryParams);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "معايير بحث غير صحيحة",
          errors: validation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const filters = validation.data;
      
      // حساب offset من page إذا تم تمريرها
      if (filters.page) {
        filters.offset = (filters.page - 1) * filters.limit;
      }

      const result = await questionsSimpleStorage.getQuestions(filters);
      
      const totalPages = Math.ceil(result.total / filters.limit);
      const currentPage = filters.page || Math.floor(filters.offset / filters.limit) + 1;

      res.json({
        success: true,
        data: result.questions,
        total: result.total,
        page: currentPage,
        limit: filters.limit,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
      } as PaginatedResponse);

    } catch (error) {
      console.error("Error getting questions:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في جلب الأسئلة",      error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // الحصول على سؤال بالمعرف
  async getQuestionById(req: Request, res: Response): Promise<void> {
    try {
      const validation = questionIdSchema.safeParse({ id: Number(req.params.id) });
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "معرف السؤال غير صحيح",
          errors: validation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const question = await questionsSimpleStorage.getQuestionById(validation.data.id);
      
      if (!question) {
        res.status(404).json({
          success: false,
          message: "السؤال غير موجود"
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: question
      } as ApiResponse);

    } catch (error) {
      console.error("Error getting question by ID:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في جلب السؤال",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }  }

  // تحديث سؤال
  async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const idValidation = questionIdSchema.safeParse({ id: Number(req.params.id) });
      
      if (!idValidation.success) {
        res.status(400).json({
          success: false,
          message: "معرف السؤال غير صحيح",
          errors: idValidation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const dataValidation = updateQuestionSchema.safeParse(req.body);
      
      if (!dataValidation.success) {
        res.status(400).json({
          success: false,
          message: "بيانات التحديث غير صحيحة",
          errors: dataValidation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const updatedQuestion = await questionsSimpleStorage.updateQuestion(
        idValidation.data.id,
        dataValidation.data
      );

      res.json({
        success: true,
        message: "تم تحديث السؤال بنجاح",
        data: updatedQuestion
      } as ApiResponse);

    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في تحديث السؤال",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // حذف سؤال
  async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const validation = questionIdSchema.safeParse({ id: Number(req.params.id) });
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "معرف السؤال غير صحيح",
          errors: validation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const deleted = await questionsSimpleStorage.deleteQuestion(validation.data.id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "السؤال غير موجود"
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "تم حذف السؤال بنجاح"
      } as ApiResponse);

    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في حذف السؤال",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // الحصول على إحصائيات الأسئلة
  async getQuestionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await questionsSimpleStorage.getQuestionStats();

      res.json({
        success: true,
        data: stats
      } as ApiResponse);

    } catch (error) {
      console.error("Error getting question stats:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في جلب إحصائيات الأسئلة",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // تبديل حالة السؤال
  async toggleQuestionStatus(req: Request, res: Response): Promise<void> {
    try {
      const validation = questionIdSchema.safeParse({ id: Number(req.params.id) });
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "معرف السؤال غير صحيح",
          errors: validation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const updatedQuestion = await questionsSimpleStorage.toggleQuestionStatus(validation.data.id);

      res.json({
        success: true,
        message: "تم تغيير حالة السؤال بنجاح",
        data: updatedQuestion
      } as ApiResponse);

    } catch (error) {
      console.error("Error toggling question status:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في تغيير حالة السؤال",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // العمليات المجمعة
  async bulkOperation(req: Request, res: Response): Promise<void> {
    try {
      const validation = bulkOperationSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "بيانات العملية المجمعة غير صحيحة",
          errors: validation.error.errors.map(err => err.message)
        } as ApiResponse);
        return;
      }

      const { action, questionIds, data } = validation.data;
      let result: any;

      switch (action) {
        case "delete":
          result = await questionsSimpleStorage.deleteMultipleQuestions(questionIds);
          res.json({
            success: true,
            message: `تم حذف ${result} أسئلة بنجاح`,
            data: { deletedCount: result }
          } as ApiResponse);
          break;

        case "activate":
          // تفعيل متعدد للأسئلة
          for (const id of questionIds) {
            await questionsSimpleStorage.updateQuestion(id, { isActive: true });
          }
          res.json({
            success: true,
            message: `تم تفعيل ${questionIds.length} أسئلة بنجاح`
          } as ApiResponse);
          break;

        case "deactivate":
          // إلغاء تفعيل متعدد للأسئلة
          for (const id of questionIds) {
            await questionsSimpleStorage.updateQuestion(id, { isActive: false });
          }
          res.json({
            success: true,
            message: `تم إلغاء تفعيل ${questionIds.length} أسئلة بنجاح`
          } as ApiResponse);
          break;

        default:
          res.status(400).json({
            success: false,
            message: "عملية غير مدعومة"
          } as ApiResponse);
      }

    } catch (error) {
      console.error("Error in bulk operation:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في العملية المجمعة",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }

  // الحصول على أسئلة عشوائية
  async getRandomQuestions(req: Request, res: Response): Promise<void> {
    try {
      const categoryIds = req.query.categoryIds ? 
        (Array.isArray(req.query.categoryIds) ? 
          req.query.categoryIds.map(id => Number(id)) : 
          [Number(req.query.categoryIds)]) : [];
      
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      if (categoryIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "يجب تحديد فئة واحدة على الأقل"
        } as ApiResponse);
        return;
      }

      const questions = await questionsSimpleStorage.getRandomQuestions(categoryIds, limit);

      res.json({
        success: true,
        data: questions
      } as ApiResponse);

    } catch (error) {
      console.error("Error getting random questions:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في جلب الأسئلة العشوائية",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      } as ApiResponse);
    }
  }
}

// إنشاء مثيل وحيد من الكلاس
export const questionsSimpleController = new QuestionsSimpleController();
