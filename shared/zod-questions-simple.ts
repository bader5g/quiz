// Zod validation schemas for Simple Questions Management System
import { z } from "zod";

// Schema أساسي للسؤال
export const questionSimpleSchema = z.object({
  id: z.number().int().positive(),
  text: z.string().min(5, "نص السؤال يجب أن يكون 5 أحرف على الأقل"),
  correctAnswer: z.string().min(1, "الإجابة الصحيحة مطلوبة"),
  wrongAnswers: z.array(z.string().min(1)).min(1, "يجب إضافة إجابة خاطئة واحدة على الأقل").max(3, "يمكن إضافة 3 إجابات خاطئة كحد أقصى"),
  categoryId: z.number().int().positive().nullable(),
  subcategoryId: z.number().int().positive().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().int().positive().min(1).max(100),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema لإنشاء سؤال جديد
export const createQuestionSchema = z.object({
  text: z.string().min(5, "نص السؤال يجب أن يكون 5 أحرف على الأقل").max(500, "نص السؤال طويل جداً"),
  correctAnswer: z.string().min(1, "الإجابة الصحيحة مطلوبة").max(200, "الإجابة الصحيحة طويلة جداً"),
  wrongAnswers: z.array(
    z.string().min(1, "الإجابة الخاطئة لا يمكن أن تكون فارغة").max(200, "الإجابة الخاطئة طويلة جداً")
  ).min(1, "يجب إضافة إجابة خاطئة واحدة على الأقل").max(3, "يمكن إضافة 3 إجابات خاطئة كحد أقصى"),
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  points: z.number().int().positive().min(1, "النقاط يجب أن تكون رقم موجب").max(100, "النقاط لا يمكن أن تزيد عن 100").default(10),
  isActive: z.boolean().default(true),
});

// Schema لتحديث سؤال
export const updateQuestionSchema = z.object({
  text: z.string().min(5, "نص السؤال يجب أن يكون 5 أحرف على الأقل").max(500, "نص السؤال طويل جداً").optional(),
  correctAnswer: z.string().min(1, "الإجابة الصحيحة مطلوبة").max(200, "الإجابة الصحيحة طويلة جداً").optional(),
  wrongAnswers: z.array(
    z.string().min(1, "الإجابة الخاطئة لا يمكن أن تكون فارغة").max(200, "الإجابة الخاطئة طويلة جداً")
  ).min(1, "يجب إضافة إجابة خاطئة واحدة على الأقل").max(3, "يمكن إضافة 3 إجابات خاطئة كحد أقصى").optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  subcategoryId: z.number().int().positive().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  points: z.number().int().positive().min(1, "النقاط يجب أن تكون رقم موجب").max(100, "النقاط لا يمكن أن تزيد عن 100").optional(),
  isActive: z.boolean().optional(),
});

// Schema للبحث والفلترة
export const questionFiltersSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  search: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  page: z.number().int().positive().optional(),
});

// Schema لمعرف السؤال
export const questionIdSchema = z.object({
  id: z.number().int().positive(),
});

// Schema لمعرفات متعددة للأسئلة
export const multipleQuestionIdsSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, "يجب تحديد سؤال واحد على الأقل"),
});

// Schema للعمليات المجمعة
export const bulkOperationSchema = z.object({
  action: z.enum(["delete", "activate", "deactivate", "update_difficulty", "update_category"]),
  questionIds: z.array(z.number().int().positive()).min(1, "يجب تحديد سؤال واحد على الأقل"),
  data: z.record(z.any()).optional(), // بيانات إضافية للعملية
});

// Schema لاستيراد الأسئلة
export const importQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, "يجب إضافة سؤال واحد على الأقل"),
  overwrite: z.boolean().default(false), // استبدال الأسئلة الموجودة
  categoryId: z.number().int().positive().optional(), // فئة افتراضية للأسئلة المستوردة
});

// Schema لتصدير الأسئلة
export const exportQuestionsSchema = z.object({
  format: z.enum(["json", "csv", "xlsx"]).default("json"),
  filters: questionFiltersSchema.optional(),
  includeInactive: z.boolean().default(false),
});

// Schema للإحصائيات
export const questionStatsSchema = z.object({
  totalQuestions: z.number().int().min(0),
  activeQuestions: z.number().int().min(0),
  questionsByDifficulty: z.object({
    easy: z.number().int().min(0),
    medium: z.number().int().min(0),
    hard: z.number().int().min(0),
  }),
  questionsByCategory: z.array(z.object({
    categoryId: z.number().int().positive().nullable(),
    count: z.number().int().min(0),
  })),
});

// Schema للاستجابة العامة
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

// Schema للاستجابة مع البيانات المُقسمة (pagination)
export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  total: z.number().int().min(0),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

// أنواع البيانات المستخرجة من Schemas
export type QuestionSimple = z.infer<typeof questionSimpleSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
export type QuestionId = z.infer<typeof questionIdSchema>;
export type MultipleQuestionIds = z.infer<typeof multipleQuestionIdsSchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
export type ImportQuestions = z.infer<typeof importQuestionsSchema>;
export type ExportQuestions = z.infer<typeof exportQuestionsSchema>;
export type QuestionStats = z.infer<typeof questionStatsSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;

// دوال مساعدة للتحقق من صحة البيانات
export const validateCreateQuestion = (data: unknown) => {
  return createQuestionSchema.safeParse(data);
};

export const validateUpdateQuestion = (data: unknown) => {
  return updateQuestionSchema.safeParse(data);
};

export const validateQuestionFilters = (data: unknown) => {
  return questionFiltersSchema.safeParse(data);
};

export const validateQuestionId = (data: unknown) => {
  return questionIdSchema.safeParse(data);
};

export const validateBulkOperation = (data: unknown) => {
  return bulkOperationSchema.safeParse(data);
};
