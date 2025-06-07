// مسارات الأسئلة - نظام مبسط
import { Router } from "express";
import { questionsSimpleController } from "../controllers-questions-simple";

const router = Router();

// جلب جميع الأسئلة مع الفلترة
router.get("/", (req, res) => questionsSimpleController.getQuestions(req, res));

// جلب إحصائيات الأسئلة
router.get("/stats", (req, res) => questionsSimpleController.getQuestionStats(req, res));

// جلب أسئلة عشوائية للعبة
router.get("/random", (req, res) => questionsSimpleController.getRandomQuestions(req, res));

// جلب سؤال واحد بالمعرف
router.get("/:id", (req, res) => questionsSimpleController.getQuestionById(req, res));

// إضافة سؤال جديد
router.post("/", (req, res) => questionsSimpleController.createQuestion(req, res));

// تحديث سؤال موجود
router.put("/:id", (req, res) => questionsSimpleController.updateQuestion(req, res));

// تبديل حالة السؤال (نشط/غير نشط)
router.patch("/:id/toggle", (req, res) => questionsSimpleController.toggleQuestionStatus(req, res));

// العمليات المجمعة
router.post("/bulk", (req, res) => questionsSimpleController.bulkOperation(req, res));

// حذف سؤال
router.delete("/:id", (req, res) => questionsSimpleController.deleteQuestion(req, res));

export { router as questionsRouter };
