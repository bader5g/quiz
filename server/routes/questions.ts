import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Schema لبيانات السؤال
const questionSchema = z.object({
  text: z.string().min(1, "نص السؤال مطلوب"),
  answer: z.string().min(1, "الإجابة مطلوبة"),
  categoryId: z.number().int().positive("معرف الفئة غير صحيح"),
  subcategoryId: z.number().int().min(0, "معرف الفئة الفرعية غير صحيح").optional(),
  difficulty: z.number().int().min(1).max(3, "مستوى الصعوبة يجب أن يكون بين 1 و 3").default(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional().default(""),
  isActive: z.boolean().default(true)
});

const updateQuestionSchema = questionSchema.partial();

// جلب جميع الأسئلة
router.get("/", async (req, res) => {
  try {
    const questions = await storage.getQuestions();
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "فشل في جلب الأسئلة" });
  }
});

// جلب سؤال محدد
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "معرف السؤال غير صحيح" });
    }

    const question = await storage.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: "السؤال غير موجود" });
    }

    res.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "فشل في جلب السؤال" });
  }
});

// إنشاء سؤال جديد
router.post("/", async (req, res) => {
  try {
    const validatedData = questionSchema.parse(req.body);
    const newQuestion = await storage.createQuestion(validatedData);
    res.status(201).json(newQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: error.errors 
      });
    }
    console.error("Error creating question:", error);
    res.status(500).json({ error: "فشل في إنشاء السؤال" });
  }
});

// تحديث سؤال
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "معرف السؤال غير صحيح" });
    }

    const validatedData = updateQuestionSchema.parse(req.body);
    const updatedQuestion = await storage.updateQuestion(id, validatedData);
    
    if (!updatedQuestion) {
      return res.status(404).json({ error: "السؤال غير موجود" });
    }

    res.json(updatedQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: error.errors 
      });
    }
    console.error("Error updating question:", error);
    res.status(500).json({ error: "فشل في تحديث السؤال" });
  }
});

// حذف سؤال
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "معرف السؤال غير صحيح" });
    }

    await storage.deleteQuestion(id);
    res.json({ message: "تم حذف السؤال بنجاح" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "فشل في حذف السؤال" });
  }
});

// جلب الأسئلة حسب الفئة
router.get("/category/:categoryId", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const subcategoryId = req.query.subcategoryId ? parseInt(req.query.subcategoryId as string) : undefined;
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "معرف الفئة غير صحيح" });
    }

    const questions = await storage.getQuestionsByCategory(categoryId, subcategoryId);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions by category:", error);
    res.status(500).json({ error: "فشل في جلب أسئلة الفئة" });
  }
});

// تفعيل أو إلغاء تفعيل مجموعة من الأسئلة دفعة واحدة
router.post("/bulk-activate-deactivate", async (req, res) => {
  // استدعاء الكنترولر الجديد
  const { bulkActivateDeactivateQuestions } = require("../controllers/questions-controller");
  return bulkActivateDeactivateQuestions(req, res);
});

export default router;
