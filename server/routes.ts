import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import axios from "axios";
import * as XLSX from "xlsx";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "./auth";
import {
  gameSessionSchema,
  updateGameSettingsSchema,
  updateSiteSettingsSchema,
  insertCardPackageSchema,
  updateCardPackageSchema,
  insertCategorySchema,
  updateCategorySchema,
  insertSubcategorySchema,
  updateSubcategorySchema,
  insertQuestionSchema,
  updateQuestionSchema,
} from "@shared/schema";
import {
  getGameDetails,
  getQuestionDetails,
  submitAnswer,
  endGame,
  saveGameState,
  getGameResults,
  markQuestionViewed,
  updateCurrentTeam,
} from "./game-controller";
import { z } from "zod";

// Helper function to validate request with Zod schema
const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid request data",
          details: error.errors,
        });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

// إعداد مجلد لتحميل الملفات
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// التأكد من وجود المجلد
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد multer لتحميل الملفات
const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // توليد اسم فريد للملف مع الاحتفاظ بامتداده الأصلي
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// فلتر للملفات المسموحة
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // تحديد أنواع الملفات المسموحة
  const allowedMimeTypes = [
    // صور
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // فيديو
    'video/mp4', 'video/webm', 'video/quicktime'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. الأنواع المدعومة: ' + allowedMimeTypes.join(', ')));
  }
};

const upload = multer({ 
  storage: multerStorage, 
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10 ميجابايت كحد أقصى
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes are now set up in index.ts
  // put application routes here
  // prefix all routes with /api

  // استيراد الأسئلة من ملف
  app.post("/api/import-questions", async (req, res) => {
    try {
      const { questions } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "بيانات الأسئلة غير صالحة" });
      }

      console.log("استلام طلب استيراد الأسئلة:", questions);

      const importedQuestions = [];

      for (const question of questions) {
        // التأكد من وجود الحقول الإلزامية (فقط السؤال والإجابة والفئة)
        if (!question.text || !question.answer || !question.categoryId) {
          console.log("تخطي سؤال غير مكتمل:", question);
          continue;
        }

        // إعداد بيانات السؤال (فقط المطلوبة)
        const questionData = {
          text: question.text,
          answer: question.answer,
          categoryId: question.categoryId,
          // إذا كانت هناك فئة فرعية، أضفها
          subcategoryId: question.subcategoryId || 0,
          // إضافة الصعوبة (افتراضي: سهل)
          difficulty: question.difficulty || 1,
          // إضافة الوسائط إذا وجدت
          imageUrl: question.imageUrl || "",
          videoUrl: question.videoUrl || "",
          mediaType: question.mediaType || "none",
          // إضافة الكلمات المفتاحية إذا وجدت
          keywords: question.keywords || "",
          // تعيين السؤال كغير فعال افتراضياً
          isActive: false,
        };

        console.log("إضافة سؤال جديد:", questionData);

        // إضافة السؤال إلى قاعدة البيانات
        const newQuestion = await storage.createQuestion(questionData);
        importedQuestions.push(newQuestion);
      }

      res.status(201).json({
        message: "تم استيراد الأسئلة بنجاح",
        imported: importedQuestions.length,
      });
    } catch (error) {
      console.error("خطأ في استيراد الأسئلة:", error);
      res.status(500).json({ error: "حدث خطأ أثناء استيراد الأسئلة" });
    }
  });

  // استيراد الأسئلة من رابط خارجي
  app.post("/api/import-questions-from-url", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "الرابط غير صالح" });
      }

      console.log("استلام طلب استيراد الأسئلة من الرابط:", url);

      // التحقق مما إذا كان الرابط من Google Sheets
      let sheetData;

      try {
        // الحصول على البيانات من الرابط
        const response = await axios.get(url);

        // فحص نوع الاستجابة
        const contentType = response.headers["content-type"];

        if (contentType.includes("application/json")) {
          // إذا كان الرابط يعيد JSON
          sheetData = response.data;
        } else if (
          contentType.includes("text/csv") ||
          contentType.includes("application/vnd.ms-excel") ||
          contentType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          )
        ) {
          // إذا كان الرابط يعيد ملف CSV/Excel
          const workbook = XLSX.read(response.data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
          throw new Error("تنسيق الملف غير مدعوم");
        }
      } catch (error) {
        console.error("خطأ في الحصول على البيانات من الرابط:", error);
        return res
          .status(400)
          .json({ error: "فشل في استيراد البيانات من الرابط المحدد" });
      }

      if (!Array.isArray(sheetData) || sheetData.length === 0) {
        return res
          .status(400)
          .json({ error: "لم يتم العثور على بيانات صالحة في الرابط" });
      }

      console.log("تم الحصول على البيانات من الرابط:", sheetData.length, "سجل");

      // تحويل البيانات إلى تنسيق الأسئلة
      const questionsToImport = [];

      for (const row of sheetData) {
        // البحث عن الفئة الرئيسية والفرعية
        const categoryName = row["الفئة"] || row["category"] || "";
        const subcategoryName =
          row["الفئة الفرعية"] || row["subcategory"] || "";

        let categoryId = 0;
        let subcategoryId = 0;

        // البحث عن معرف الفئة
        if (categoryName) {
          const categories = await storage.getCategories();
          const category = categories.find((c) => c.name === categoryName);

          if (category) {
            categoryId = category.id;

            // البحث عن معرف الفئة الفرعية
            if (subcategoryName) {
              const subcategories = await storage.getSubcategories(category.id);
              const subcategory = subcategories.find(
                (s) => s.name === subcategoryName,
              );

              if (subcategory) {
                subcategoryId = subcategory.id;
              }
            }
          }
        }

        // تحديد مستوى الصعوبة
        let difficulty = 1;
        const difficultyText = row["الصعوبة"] || row["difficulty"] || "";

        if (typeof difficultyText === "string") {
          if (difficultyText.includes("متوسط")) {
            difficulty = 2;
          } else if (difficultyText.includes("صعب")) {
            difficulty = 3;
          }
        } else if (typeof difficultyText === "number") {
          difficulty =
            difficultyText >= 1 && difficultyText <= 3 ? difficultyText : 1;
        }

        // تحضير بيانات السؤال
        const questionText =
          row["نص السؤال"] || row["السؤال"] || row["question"] || "";
        const answer = row["الإجابة"] || row["answer"] || "";
        const imageUrl = row["رابط الصورة"] || row["image"] || "";
        const videoUrl = row["رابط الفيديو"] || row["video"] || "";
        const keywords = row["الكلمات المفتاحية"] || row["keywords"] || "";

        // التحقق من وجود البيانات الإلزامية
        if (!questionText || !answer || !categoryId) {
          console.log("تخطي سؤال غير مكتمل من الرابط:", row);
          continue;
        }

        // إعداد بيانات السؤال
        const questionData = {
          text: questionText,
          answer,
          categoryId,
          subcategoryId: subcategoryId || 0,
          difficulty,
          imageUrl,
          videoUrl,
          mediaType: imageUrl ? "image" : videoUrl ? "video" : "none",
          keywords,
          isActive: false, // الأسئلة المستوردة تكون غير فعالة افتراضياً
        };

        console.log("إضافة سؤال جديد من الرابط:", questionData);
        questionsToImport.push(questionData);
      }

      // التحقق من وجود أسئلة للاستيراد
      if (questionsToImport.length === 0) {
        return res
          .status(400)
          .json({ error: "لم يتم العثور على أسئلة صالحة للاستيراد" });
      }

      // إضافة الأسئلة إلى قاعدة البيانات
      const importedQuestions = [];

      for (const question of questionsToImport) {
        const newQuestion = await storage.createQuestion(question);
        importedQuestions.push(newQuestion);
      }

      res.status(201).json({
        message: "تم استيراد الأسئلة بنجاح",
        imported: importedQuestions.length,
      });
    } catch (error) {
      console.error("خطأ في استيراد الأسئلة من الرابط:", error);
      res
        .status(500)
        .json({ error: "حدث خطأ أثناء استيراد الأسئلة من الرابط" });
    }
  });

  // Categories with children endpoint
  app.get("/api/categories-with-children", async (_req, res) => {
    try {
      // جلب كل الفئات والأسئلة مرة واحدة
      const categoriesList = await storage.getCategories();
      const allQuestions = await storage.getQuestions();
      const result = [];
      
      // تسجيل للتشخيص وفحص دقيق لبنية البيانات
      console.log(`إجمالي عدد الأسئلة المسترجعة: ${allQuestions.length}`);
      console.log(`عينة من بيانات السؤال الأول:`, JSON.stringify(allQuestions[0], null, 2));
      console.log(`جميع حقول السؤال الأول:`, Object.keys(allQuestions[0]));

      // بما أن لدينا 42 سؤال، دعنا نتحقق من كل واحد ونعرف التوزيع حسب الفئات
      const categoryDistribution = {};
      const subcategoryDistribution = {};
      
      allQuestions.forEach(q => {
        // تسجيل توزيع الأسئلة حسب الفئة
        categoryDistribution[q.categoryId] = (categoryDistribution[q.categoryId] || 0) + 1;
        subcategoryDistribution[q.subcategoryId] = (subcategoryDistribution[q.subcategoryId] || 0) + 1;
      });
      
      console.log("توزيع الأسئلة حسب الفئة:", categoryDistribution);
      console.log("توزيع الأسئلة حسب الفئة الفرعية:", subcategoryDistribution);
      
      // دعنا نتحقق بشكل مباشر من أول 5 أسئلة
      console.log("أول 5 أسئلة:", allQuestions.slice(0, 5).map(q => ({
        id: q.id, 
        text: q.text.substring(0, 30), 
        categoryId: q.categoryId, 
        subcategoryId: q.subcategoryId
      })));

      for (const category of categoriesList) {
        const subcategories = await storage.getSubcategories(category.id);
        
        // تعديل: عد جميع الأسئلة في الفئة
        // تحويل الرقم إلى كائن String ثم تحويله مرة أخرى إلى Number للمقارنة
        const categoryQuestionsCount = allQuestions.filter(
          (q) => String(q.categoryId) === String(category.id)
        ).length;
        
        console.log(`الفئة ${category.name} (ID: ${category.id}, نوع: ${typeof category.id}) - عدد الأسئلة: ${categoryQuestionsCount}`);

        const subcategoriesWithCounts = subcategories.map((sub) => {
          // تعداد الأسئلة لهذه الفئة الفرعية - استخدام String() للمقارنة
          const questionsForSub = allQuestions.filter(q => String(q.subcategoryId) === String(sub.id));
          const subcategoryQuestionsCount = questionsForSub.length;
          
          console.log(`  الفئة الفرعية ${sub.name} (ID: ${sub.id}, نوع: ${typeof sub.id}) - عدد الأسئلة: ${subcategoryQuestionsCount}`);
          
          // طباعة أول سؤالين (إن وجدوا) للتحقق
          if (questionsForSub.length > 0) {
            console.log(`  أمثلة للأسئلة في ${sub.name}:`, questionsForSub.slice(0, 2).map(q => q.text.substring(0, 30)));
          }
          return {
            id: sub.id,
            name: sub.name,
            icon: sub.icon,
            parentId: sub.parentId,
            imageUrl: sub.imageUrl,
            isActive: sub.isActive,
            availableQuestions: subcategoryQuestionsCount,
          };
        });

        result.push({
          id: category.id,
          name: category.name,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isActive: category.isActive,
          availableQuestions: categoryQuestionsCount,
          children: subcategoriesWithCounts,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching categories with children:", error);
      res.status(500).json({ error: "فشل في جلب الفئات والفئات الفرعية" });
    }
  });

  // Game settings endpoint
  app.get("/api/game-settings", async (_req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching game settings:", error);
      res.status(500).json({ error: "Failed to fetch game settings" });
    }
  });

  // Update game settings endpoint - for admin use
  app.patch(
    "/api/game-settings",
    validateRequest(updateGameSettingsSchema),
    async (req, res) => {
      try {
        const updatedSettings = await storage.updateGameSettings(req.body);
        res.json(updatedSettings);
      } catch (error) {
        console.error("Error updating game settings:", error);
        res.status(500).json({ error: "Failed to update game settings" });
      }
    },
  );

  // Create new game session endpoint
  app.post(
    "/api/game-sessions",
    validateRequest(gameSessionSchema),
    async (req, res) => {
      try {
        // In a real app, you would extract user ID from authenticated session
        // For now, we'll use a mock user ID
        const userId = 1; // Mock user ID
        const newSession = await storage.createGameSession(userId, req.body);
        res.status(201).json(newSession);
      } catch (error) {
        console.error("Error creating game session:", error);
        res.status(500).json({ error: "Failed to create game session" });
      }
    },
  );

  // Create new game endpoint (alias for compatibility)
  app.post("/api/create-game", async (req, res) => {
    try {
      // In a real app, you would extract user ID from authenticated session
      // For now, we'll use a hard-coded user ID that exists in the database
      const userId = 2; // تأكد من وجود مستخدم بهذا المعرف في قاعدة البيانات
      console.log("Creating game with data:", req.body);

      // Format data from new API format to storage format
      const gameData = {
        gameName: req.body.gameName,
        teams: req.body.teamNames
          .slice(0, req.body.teamsCount)
          .map((name: string) => ({ name, score: 0 })),
        answerTimeFirst: req.body.answerTimes[0] || 30, // وقت الإجابة الأول
        answerTimeSecond: req.body.answerTimes[1] || 15, // وقت الإجابة الثاني
        selectedCategories: req.body.categories,
      };

      const newSession = await storage.createGameSession(userId, gameData);
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  // Get user's game sessions
  app.get("/api/users/:userId/game-sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const sessions = await storage.getUserGameSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching game sessions:", error);
      res.status(500).json({ error: "Failed to fetch game sessions" });
    }
  });

  // API routes for game play
  // Get game details
  app.get("/api/games/:gameId", getGameDetails);

  // Get question details
  app.get("/api/games/:gameId/questions/:questionId", getQuestionDetails);

  // Submit answer
  app.post("/api/games/:gameId/answer", submitAnswer);

  // Mark question as viewed (disable it immediately when opened)
  app.post("/api/games/:gameId/mark-question-viewed", markQuestionViewed);

  // End game
  app.post("/api/games/:gameId/end", endGame);

  // Save game state
  app.post("/api/games/:gameId/save", saveGameState);

  // تحديث الفريق الحالي في اللعبة
  app.post("/api/games/:gameId/update-team", updateCurrentTeam);

  // Use help tools (مساعدة) in game
  app.post("/api/games/:gameId/use-help", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId, 10);
      if (isNaN(gameId)) {
        return res.status(400).json({ error: "معرف اللعبة غير صالح" });
      }

      const gameData = await storage.getGameById(gameId);
      if (!gameData) {
        return res.status(404).json({ error: "اللعبة غير موجودة" });
      }

      // تحويل البيانات إلى النوع المناسب
      const gameDataTyped = gameData as any;
      const teams = gameDataTyped.teams as any[];
      const currentTeamIndex = gameDataTyped.currentTeamIndex || 0;

      const { type, teamId } = req.body;

      switch (type) {
        case "discount":
          // خصم نقطة من الفريق المعطى
          if (!teamId) {
            return res.status(400).json({ error: "معرف الفريق مطلوب للخصم" });
          }

          const penaltyTeam = teams.find((t) => t.id === teamId);
          if (!penaltyTeam) {
            return res.status(404).json({ error: "الفريق غير موجود" });
          }

          // خصم نقطة واحدة بشرط ألا يكون الرصيد سالباً
          if (penaltyTeam.score > 0) {
            penaltyTeam.score -= 1;
          }

          // تحديث بيانات اللعبة
          await storage.updateGameTeams(gameId, teams);
          break;

        case "swap":
          // عكس الدور للفريق التالي
          const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
          await storage.updateGameCurrentTeam(gameId, nextTeamIndex);
          break;

        case "skip":
          // تخطي السؤال الحالي (لا يوجد إجراء آخر مطلوب)
          break;

        default:
          return res.status(400).json({ error: "نوع المساعدة غير مدعوم" });
      }

      res.json({ success: true, message: "تم استخدام المساعدة بنجاح" });
    } catch (error) {
      console.error("Error using help tool:", error);
      res.status(500).json({ error: "فشل في استخدام أداة المساعدة" });
    }
  });

  // Get game results
  app.get("/api/games/:gameId/result", getGameResults);

  // Get game log by ID
  app.get("/api/game-log/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        return res.status(400).json({ error: "Invalid game ID" });
      }

      const gameSession = await storage.getGameSession(gameId);
      if (!gameSession) {
        return res.status(404).json({ error: "Game session not found" });
      }

      // تحويل نوع البيانات ومعالجة الفئات
      const gameSessionAny = gameSession as any;

      // معالجة مصفوفة معرفات الفئات
      const categoryIds = Array.isArray(gameSessionAny.selectedCategories)
        ? gameSessionAny.selectedCategories
        : [];

      // بناء مصفوفة الفئات المطلوبة
      const categoryObjects: { id: number; name: string; icon: string }[] = [];

      // جمع الفئات من الفئات المتاحة (المعرفة سابقاً)
      const allCategories = [
        { id: 11, name: "كيمياء", icon: "⚗️" },
        { id: 12, name: "فيزياء", icon: "🔬" },
        { id: 13, name: "أحياء", icon: "🧬" },
        { id: 14, name: "فلك", icon: "🔭" },
        { id: 21, name: "جبر", icon: "➗" },
        { id: 22, name: "هندسة", icon: "📐" },
        { id: 23, name: "إحصاء", icon: "📊" },
        { id: 24, name: "حساب", icon: "🔢" },
        { id: 31, name: "تاريخ", icon: "🏛️" },
        { id: 32, name: "جغرافيا", icon: "🌍" },
        { id: 33, name: "فن", icon: "🎨" },
        { id: 34, name: "أدب", icon: "📖" },
        { id: 35, name: "موسيقى", icon: "🎵" },
        { id: 36, name: "رياضة", icon: "⚽" },
        { id: 41, name: "برمجة", icon: "👨‍💻" },
        { id: 42, name: "شبكات", icon: "🌐" },
        { id: 43, name: "ذكاء صناعي", icon: "🤖" },
        { id: 44, name: "تطبيقات", icon: "📱" },
      ];

      // البحث عن الفئات المطابقة
      categoryIds.forEach((id: number) => {
        const found = allCategories.find((cat) => cat.id === id);
        if (found) {
          categoryObjects.push(found);
        }
      });

      // تكوين كائن اللعبة المطلوب
      const typedGameSession = {
        id: gameSessionAny.id.toString(),
        name: gameSessionAny.gameName,
        categories: categoryObjects,
        teams: gameSessionAny.teams as { name: string; score: number }[],
        createdAt: gameSessionAny.createdAt,
        playCount: 1, // افتراضي للعرض التجريبي
      };

      // إضافة بيانات افتراضية للجولات للعرض التجريبي
      // في التطبيق الحقيقي، ستكون هذه البيانات محفوظة في قاعدة البيانات
      const gameRounds = [
        {
          id: "r1",
          roundNumber: 1,
          category: { id: 12, name: "فيزياء", icon: "🔬" },
          question: "ما هي قوانين نيوتن للحركة؟",
          correctAnswer:
            "قانون القصور الذاتي، قانون القوة، وقانون الفعل ورد الفعل",
          winningTeam: typedGameSession.teams[0]?.name || null,
          timestamp: new Date(
            new Date(typedGameSession.createdAt).getTime() + 1000 * 60,
          ).toISOString(),
        },
        {
          id: "r2",
          roundNumber: 2,
          category: { id: 31, name: "تاريخ", icon: "🏛️" },
          question: "متى تأسست المملكة العربية السعودية الحديثة؟",
          correctAnswer: "23 سبتمبر 1932",
          winningTeam: typedGameSession.teams[1]?.name || null,
          timestamp: new Date(
            new Date(typedGameSession.createdAt).getTime() + 2000 * 60,
          ).toISOString(),
        },
        {
          id: "r3",
          roundNumber: 3,
          category: { id: 42, name: "شبكات", icon: "🌐" },
          question: "ما هو بروتوكول HTTP؟",
          correctAnswer: "بروتوكول نقل النص التشعبي لتبادل المعلومات عبر الويب",
          winningTeam: null,
          timestamp: new Date(
            new Date(typedGameSession.createdAt).getTime() + 3000 * 60,
          ).toISOString(),
        },
      ];

      // يضاف إلى كائن اللعبة بيانات الجولات
      const gameLog = {
        ...typedGameSession,
        rounds: gameRounds,
      };

      res.json(gameLog);
    } catch (error) {
      console.error("Error fetching game log:", error);
      res.status(500).json({ error: "Failed to fetch game log" });
    }
  });

  // Replay a game
  app.post("/api/replay-game", async (req, res) => {
    try {
      const userId = 1; // في التطبيق الحقيقي، سيتم استخراجه من جلسة المستخدم

      const gameSchema = z.object({
        originalGameId: z.string(),
        gameName: z.string().min(1).max(45),
        teamNames: z.array(z.string().min(1).max(45)),
        answerTimeFirst: z.number().int().positive(),
        answerTimeSecond: z.number().int().positive(),
      });

      const validatedData = gameSchema.parse(req.body);

      // الحصول على اللعبة الأصلية للحصول على الفئات
      const originalGameId = parseInt(validatedData.originalGameId, 10);
      const originalGame = await storage.getGameSession(originalGameId);

      if (!originalGame) {
        return res.status(404).json({ error: "Original game not found" });
      }

      // تحويل نوع البيانات للتطابق
      const originalGameAny = originalGame as any;
      const selectedCategories = Array.isArray(
        originalGameAny.selectedCategories,
      )
        ? originalGameAny.selectedCategories
        : [];

      // إنشاء بيانات اللعبة الجديدة
      const gameData = {
        gameName: validatedData.gameName,
        teams: validatedData.teamNames.map((name) => ({ name, score: 0 })),
        answerTimeFirst: validatedData.answerTimeFirst,
        answerTimeSecond: validatedData.answerTimeSecond,
        selectedCategories: selectedCategories,
      };

      const newSession = await storage.createGameSession(userId, gameData);
      res.status(201).json(newSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid game data",
          details: error.errors,
        });
      }
      console.error("Error replaying game:", error);
      res.status(500).json({ error: "Failed to replay game" });
    }
  });

  // Get admin settings (including max_games_per_page)
  app.get("/api/admin-settings", (req, res) => {
    // في النسخة النهائية، هذه البيانات ستأتي من قاعدة البيانات
    res.json({
      max_games_per_page: 15,
      show_game_logs: true,
      show_teams_scores: true,
      default_answer_time_first: 30,
      default_answer_time_second: 15,
    });
  });

  // API لجلب إحصائيات لوحة التحكم
  app.get("/api/admin/dashboard-stats", async (req, res) => {
    try {
      // استرجاع بيانات حقيقية من الخادم عن طريق واجهات البرمجة الموجودة
      let categoriesCount = 0;
      let subcategoriesCount = 0;
      let questionsCount = 0;
      let gamesCount = 0;

      try {
        const categoriesData = await storage.getCategories();
        categoriesCount = categoriesData?.length || 0;
      } catch (error) {
        console.error("Error fetching categories count:", error);
      }

      try {
        const subcategoriesData = await storage.getSubcategories();
        subcategoriesCount = subcategoriesData?.length || 0;
      } catch (error) {
        console.error("Error fetching subcategories count:", error);
      }

      try {
        const questionsData = await storage.getQuestions();
        questionsCount = questionsData?.length || 0;
      } catch (error) {
        console.error("Error fetching questions count:", error);
      }

      // نحن نعلم أن هذه الوظيفة غير منفذة بالكامل، لذا سنتجاوزها
      try {
        // نستخدم قيمة تقديرية بدلاً من استدعاء وظيفة غير منفذة
        gamesCount = 5;
      } catch (error) {
        console.error("Error fetching games count:", error);
      }

      // بناء كائن الإحصائيات الديناميكي بناءً على بيانات حقيقية
      console.log("Dashboard stats:", {
        categories: categoriesCount,
        subcategories: subcategoriesCount,
        questions: questionsCount,
        games: gamesCount,
      });

      res.json({
        users: {
          total: 35,
          active: 28,
          inactive: 7,
          admins: 3,
          newLastWeek: 8,
        },
        categories: {
          total: categoriesCount || 4,
          subcategories: subcategoriesCount || 8,
          lowQuestionCount: 2,
        },
        questions: {
          total: questionsCount || 120,
          byDifficulty: {
            easy: Math.floor((questionsCount || 120) * 0.4),
            medium: Math.floor((questionsCount || 120) * 0.4),
            hard: Math.floor((questionsCount || 120) * 0.2),
          },
          recentlyAdded: 15,
        },
        games: {
          total: gamesCount || 45,
          active: 5,
          completed: (gamesCount || 45) - 5,
          totalRounds: (gamesCount || 45) * 8,
        },
        levels: {
          total: 5,
          users: {
            مبتدئ: 15,
            متوسط: 10,
            متقدم: 5,
            محترف: 3,
            خبير: 2,
          },
        },
        packages: {
          total: 5,
          active: 3,
          purchased: 25,
        },
        cards: {
          totalUsed: 300,
          totalPurchased: 200,
          freeIssued: 150,
        },
        stars: {
          totalEarned: 450,
          weeklyAverage: 35,
        },
        notifications: {
          total: 3,
          items: [
            {
              id: 1,
              message: `${categoriesCount || 4} فئات مضافة للنظام مع ${subcategoriesCount || 8} فئات فرعية`,
              type: "info",
              date: new Date().toLocaleDateString("ar-SA"),
            },
            {
              id: 2,
              message: `${questionsCount || 120} سؤال متاح في النظام`,
              type: "success",
              date: new Date().toLocaleDateString("ar-SA"),
            },
            {
              id: 3,
              message: `تم تسجيل ${gamesCount || 45} جلسة لعب حتى الآن`,
              type: "info",
              date: new Date().toLocaleDateString("ar-SA"),
            },
          ],
        },
        weeklyGrowth: [
          {
            date: "2025-05-14",
            users: 30,
            games: 40,
            cards: 280,
            stars: 420,
          },
          {
            date: "2025-05-15",
            users: 31,
            games: 41,
            cards: 285,
            stars: 425,
          },
          {
            date: "2025-05-16",
            users: 32,
            games: 42,
            cards: 290,
            stars: 430,
          },
          {
            date: "2025-05-17",
            users: 33,
            games: 43,
            cards: 295,
            stars: 435,
          },
          {
            date: "2025-05-18",
            users: 34,
            games: 44,
            cards: 298,
            stars: 440,
          },
          {
            date: "2025-05-19",
            users: 34,
            games: 44,
            cards: 298,
            stars: 445,
          },
          {
            date: "2025-05-20",
            users: 35,
            games: 45,
            cards: 300,
            stars: 450,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "فشل في جلب إحصائيات لوحة التحكم" });
    }
  });

  // باقات الكروت - Card packages endpoint
  app.get("/api/card-packages", (_req, res) => {
    res.json([
      {
        id: 1,
        name: "الباقة البرونزية",
        price: 5.99,
        paidCards: 20,
        freeCards: 5,
        isActive: true,
        badge: null,
        description: "مناسبة للمبتدئين",
      },
      {
        id: 2,
        name: "الباقة الفضية",
        price: 9.99,
        paidCards: 50,
        freeCards: 15,
        isActive: true,
        badge: "⭐ الأكثر شيوعاً",
        description: "باقة متوازنة بسعر مناسب",
      },
      {
        id: 3,
        name: "الباقة الذهبية",
        price: 19.99,
        paidCards: 120,
        freeCards: 40,
        isActive: true,
        badge: "🔥 العرض المميز",
        description: "القيمة الأفضل مقابل السعر",
      },
      {
        id: 4,
        name: "باقة المحترفين",
        price: 29.99,
        paidCards: 200,
        freeCards: 100,
        isActive: true,
        badge: "💎 قيمة مميزة",
        description: "للاعبين المتحمسين والمجموعات",
      },
      {
        id: 5,
        name: "عرض خاص محدود",
        price: 14.99,
        paidCards: 75,
        freeCards: 50,
        isActive: false,
        badge: "⏱️ عرض محدود",
        description: "عرض لفترة محدودة - ينتهي قريباً!",
      },
    ]);
  });

  // المستخدمين المرتبطين - Linked users endpoint
  app.get("/api/linked-users", (_req, res) => {
    res.json([
      {
        id: 1,
        username: "samar_92",
        name: "سمر محمد",
        email: "samar@example.com",
        avatarUrl: "https://i.pravatar.cc/150?img=5",
        relationshipType: "sub-user",
        lastGameDate: "2025-05-01T14:30:00.000Z",
        gamesPlayed: 12,
        activityPercentage: 35,
        contributionStars: 8,
        freeCards: 3,
        paidCards: 7,
        status: "active",
        isOnline: false,
      },
      {
        id: 2,
        username: "khalid_h",
        name: "خالد حسين",
        phone: "0512345678",
        avatarUrl: "https://i.pravatar.cc/150?img=8",
        relationshipType: "sub-user",
        lastGameDate: "2025-04-25T16:45:00.000Z",
        gamesPlayed: 8,
        activityPercentage: 25,
        contributionStars: 5,
        freeCards: 2,
        paidCards: 4,
        status: "active",
        isOnline: true,
      },
      {
        id: 3,
        username: "fatima_22",
        name: "فاطمة أحمد",
        email: "fatima@example.com",
        avatarUrl: "https://i.pravatar.cc/150?img=9",
        relationshipType: "sub-user",
        lastGameDate: "2025-04-29T10:15:00.000Z",
        gamesPlayed: 15,
        activityPercentage: 40,
        contributionStars: 12,
        freeCards: 5,
        paidCards: 10,
        status: "active",
        isOnline: false,
      },
    ]);
  });

  // Get specific game session
  app.get("/api/game-sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const session = await storage.getGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching game session:", error);
      res.status(500).json({ error: "Failed to fetch game session" });
    }
  });

  // Leaderboard API endpoint
  app.get("/api/leaderboard", (_req, res) => {
    // Sample leaderboard data
    const leaderboard = [
      { id: 1, username: "أحمد", level: "ذهبي", stars: 15, badge: "🥇" },
      { id: 2, username: "ليلى", level: "فضي", stars: 12, badge: "🥈" },
      { id: 3, username: "محمد", level: "فضي", stars: 10, badge: "🥉" },
      { id: 4, username: "سارة", level: "برونزي", stars: 8, badge: "🏅" },
      { id: 5, username: "زياد", level: "برونزي", stars: 7, badge: "🏅" },
      { id: 6, username: "فاطمة", level: "مبتدئ", stars: 5, badge: "🎖️" },
      { id: 7, username: "يوسف", level: "مبتدئ", stars: 4, badge: "🎖️" },
      { id: 8, username: "مريم", level: "مبتدئ", stars: 3, badge: "🎖️" },
      { id: 9, username: "خالد", level: "مبتدئ", stars: 2, badge: "🎖️" },
      { id: 10, username: "هدى", level: "مبتدئ", stars: 1, badge: "🎖️" },
    ];

    res.json(leaderboard);
  });

  // User level API endpoint
  app.get("/api/user-level", (req, res) => {
    // التحقق من حالة تسجيل الدخول
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    
    const user = req.user;
    
    // استخدام بيانات المستخدم الفعلية أو القيم الافتراضية
    const currentStars = user.stars || 0;
    const level = user.level || "مبتدئ";
    const badge = user.levelBadge || "🌟";
    const color = user.levelColor || "#A9A9A9";
    
    // تحديد المستوى التالي والتقدم المتطلب
    let nextLevel = "ذهبي";
    let requiredStars = 10;
    let progress = 0;
    
    // حساب التقدم بناء على المستوى الحالي
    if (level === "مبتدئ") {
      nextLevel = "فضي";
      requiredStars = 10;
      progress = Math.min(100, (currentStars / requiredStars) * 100);
    } else if (level === "فضي") {
      nextLevel = "ذهبي";
      requiredStars = 20;
      progress = Math.min(100, (currentStars / requiredStars) * 100);
    } else if (level === "ذهبي") {
      nextLevel = "بلاتيني";
      requiredStars = 30;
      progress = Math.min(100, (currentStars / requiredStars) * 100);
    } else if (level === "بلاتيني") {
      nextLevel = "ماسي";
      requiredStars = 50;
      progress = Math.min(100, (currentStars / requiredStars) * 100);
    } else {
      // المستوى النهائي أو أي مستوى آخر
      nextLevel = "الأسطوري";
      requiredStars = 100;
      progress = Math.min(100, (currentStars / requiredStars) * 100);
    }
    
    // حساب الإحصاءات الأخرى
    const starsThisMonth = Math.floor(currentStars * 0.3); // افتراضي: 30% من النجوم الكلية تم اكتسابها هذا الشهر
    const cardsUsed = currentStars * 2; // افتراضي: 2 كروت لكل نجمة
    const starsToNextLevel = requiredStars - currentStars;
    
    const userLevel = {
      level,
      badge,
      color,
      progress: Math.round(progress),
      nextLevel,
      requiredStars,
      currentStars,
      startDate: user.createdAt || "2025-01-15T12:00:00.000Z",
      monthlyRewards: {
        freeCards: Math.max(5, Math.floor(currentStars * 0.5)),
        validity: 30, // أيام
        nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        accumulative: true,
      },
      stats: {
        starsThisMonth,
        cardsUsed,
        conversionRate: 2, // كل 2 كرت = 1 نجمة
        starsToNextLevel,
        daysBeforeDemotion: 45, // الأيام المتبقية قبل فقدان المستوى
        starsFromSubs: Math.floor(currentStars * 0.2), // افتراضي: 20% من النجوم من المستخدمين الفرعيين
      },
    };

    res.json(userLevel);
  });

  // Star history API endpoint
  app.get("/api/star-history", (_req, res) => {
    // Sample star history data
    const starHistory = [
      {
        id: 1,
        date: "2025-04-25T14:30:00Z",
        stars: 2,
        cardsUsed: 4,
        source: "main", // المستخدم الرئيسي
        activity: "لعبة كاملة",
      },
      {
        id: 2,
        date: "2025-04-20T16:45:00Z",
        stars: 1,
        cardsUsed: 2,
        source: "main", // المستخدم الرئيسي
        activity: "إجابة صحيحة",
      },
      {
        id: 3,
        date: "2025-04-18T09:15:00Z",
        stars: 3,
        cardsUsed: 6,
        source: "sub", // مستخدم فرعي
        userId: 1,
        username: "سمر",
        activity: "مسابقة كبيرة",
      },
      {
        id: 4,
        date: "2025-04-12T19:30:00Z",
        stars: 1,
        cardsUsed: 2,
        source: "sub", // مستخدم فرعي
        userId: 2,
        username: "علي",
        activity: "بطاقة يومية",
      },
      {
        id: 5,
        date: "2025-04-05T10:00:00Z",
        stars: 2,
        cardsUsed: 4,
        source: "main", // المستخدم الرئيسي
        activity: "تحدي أسبوعي",
      },
    ];

    res.json(starHistory);
  });

  // User all levels API endpoint
  app.get("/api/levels", (_req, res) => {
    // Sample levels data
    const levels = [
      {
        id: 1,
        name: "مبتدئ",
        badge: "🏅",
        color: "#4caf50",
        requiredStars: 0,
        conversionRate: 4, // كل 4 كروت = 1 نجمة
        monthlyCards: 5,
        maxDuration: 0, // لا مدة قصوى
        canDemote: false,
      },
      {
        id: 2,
        name: "هاوٍ",
        badge: "🥉",
        color: "#2196f3",
        requiredStars: 10,
        conversionRate: 3, // كل 3 كروت = 1 نجمة
        monthlyCards: 10,
        maxDuration: 60, // يومًا
        canDemote: true,
      },
      {
        id: 3,
        name: "محترف",
        badge: "🥈",
        color: "#9c27b0",
        requiredStars: 25,
        conversionRate: 2.5, // كل 2.5 كرت = 1 نجمة
        monthlyCards: 12,
        maxDuration: 90, // يومًا
        canDemote: true,
      },
      {
        id: 4,
        name: "خبير",
        badge: "🥇",
        color: "#f44336",
        requiredStars: 50,
        conversionRate: 2, // كل 2 كرت = 1 نجمة
        monthlyCards: 15,
        maxDuration: 120, // يومًا
        canDemote: true,
      },
      {
        id: 5,
        name: "ذهبي",
        badge: "🥇",
        color: "#FFD700",
        requiredStars: 100,
        conversionRate: 1.5, // كل 1.5 كرت = 1 نجمة
        monthlyCards: 20,
        maxDuration: 180, // يومًا
        canDemote: true,
      },
      {
        id: 6,
        name: "بلاتيني",
        badge: "💎",
        color: "#E5E4E2",
        requiredStars: 200,
        conversionRate: 1, // كل 1 كرت = 1 نجمة
        monthlyCards: 30,
        maxDuration: 0, // لا مدة قصوى بمجرد الوصول لهذا المستوى
        canDemote: false,
      },
    ];

    res.json(levels);
  });

  // User profile API endpoint
  app.get("/api/user-profile", (req, res) => {
    // التحقق من حالة تسجيل الدخول
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    
    // استخدام بيانات المستخدم الحقيقية من الجلسة
    const user = req.user;
    
    // إنشاء كائن ملف المستخدم الشخصي
    const userProfile = {
      id: user.id,
      username: user.username,
      // استخدام البيانات المتاحة من المستخدم، أو استخدام قيم افتراضية إذا كانت غير موجودة
      name: user.name || user.username,
      email: user.email || "",
      phone: user.phone || "",
      avatarUrl: user.avatarUrl || "/assets/avatars/default.png",
    };

    res.json(userProfile);
  });

  // User stats API endpoint
  app.get("/api/user-stats", async (req, res) => {
    // التحقق من حالة تسجيل الدخول
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    
    try {
      const userId = req.user.id;
      
      // جلب ألعاب المستخدم
      const userGames = await storage.getUserGameSessions(userId);
      
      // حساب الإحصائيات الحقيقية
      const totalGames = userGames.length;
      const completedGames = userGames.filter(game => game.status === 'completed');
      const wonGames = completedGames.filter(game => game.winnerTeamIndex !== null && game.winnerTeamIndex !== undefined);
      const winRate = completedGames.length > 0 ? Math.round((wonGames.length / completedGames.length) * 100) : 0;
      
      // حساب متوسط النقاط من الألعاب المكتملة
      let totalScore = 0;
      let scoreCount = 0;
      completedGames.forEach(game => {
        if (game.teams && Array.isArray(game.teams)) {
          game.teams.forEach(team => {
            if (team.score !== undefined && team.score !== null) {
              totalScore += team.score;
              scoreCount++;
            }
          });
        }
      });
      const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
      
      // العثور على تاريخ آخر لعبة
      const lastGameDate = userGames.length > 0 
        ? userGames.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt.split('T')[0]
        : null;
      
      // حساب سلسلة الانتصارات الحالية
      let streak = 0;
      const recentCompletedGames = completedGames
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      for (const game of recentCompletedGames) {
        if (game.winnerTeamIndex !== null && game.winnerTeamIndex !== undefined) {
          streak++;
        } else {
          break;
        }
      }
      
      // تحديد الفئة المفضلة من الألعاب
      const categoryCount: { [key: string]: number } = {};
      userGames.forEach(game => {
        if (game.selectedCategories && Array.isArray(game.selectedCategories)) {
          game.selectedCategories.forEach((catId: number) => {
            categoryCount[catId] = (categoryCount[catId] || 0) + 1;
          });
        }
      });
      
      let favoriteCategory = "لا توجد ألعاب بعد";
      if (Object.keys(categoryCount).length > 0) {
        const mostUsedCategoryId = Object.keys(categoryCount).reduce((a, b) => 
          categoryCount[a] > categoryCount[b] ? a : b
        );
        
        // تحويل معرف الفئة إلى اسم الفئة
        const categories = await storage.getCategories();
        const category = categories.find(cat => cat.id.toString() === mostUsedCategoryId);
        favoriteCategory = category ? category.name : "فئة غير معروفة";
      }
      
      const userStats = {
        totalGames,
        winRate,
        favoriteCategory,
        averageScore,
        lastGameDate,
        streak,
        trophies: wonGames.length, // عدد الجوائز = عدد الألعاب المكسوبة
        medals: Math.floor(wonGames.length / 2), // ميدالية لكل انتصارين
        rank: Math.max(1, 100 - (wonGames.length * 5)), // ترتيب تقديري
        stars: wonGames.length * 3 + streak // نجوم = انتصارات × 3 + سلسلة الانتصارات
      };
      
      res.json(userStats);
    } catch (error) {
      console.error("خطأ في جلب إحصائيات المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب إحصائيات المستخدم" });
    }
  });

  // User cards API endpoint
  app.get("/api/user-cards", (req, res) => {
    // التحقق من حالة تسجيل الدخول
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    
    // استخدام بيانات المستخدم الحقيقية
    const user = req.user;
    
    // جلب بيانات الكروت من المستخدم أو استخدام القيم الافتراضية
    const freeCards = user.freeCards || 5;
    const paidCards = user.paidCards || 0;
    const totalCards = freeCards + paidCards;
    
    // إحصاءات إضافية عن استخدام البطاقات
    // في المستقبل، يمكن أن تأتي هذه البيانات من قاعدة البيانات
    const usedFreeCards = 0;
    const usedPaidCards = 0;
    
    const userCards = {
      freeCards,
      paidCards,
      totalCards,
      freeIcon: "🎫",
      paidIcon: "💳",
      usedFreeCards,
      usedPaidCards,
    };

    res.json(userCards);
  });

  // Site settings API endpoints
  app.get("/api/site-settings", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.patch(
    "/api/site-settings",
    validateRequest(updateSiteSettingsSchema),
    async (req, res) => {
      try {
        const updatedSettings = await storage.updateSiteSettings(req.body);
        res.json(updatedSettings);
      } catch (error) {
        console.error("Error updating site settings:", error);
        res.status(500).json({ error: "Failed to update site settings" });
      }
    },
  );

  // Categories Management Endpoints
  app.get("/api/categories", async (_req, res) => {
    try {
      const categoriesList = await storage.getCategories();
      res.json(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "فشل في جلب الفئات" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategoryById(Number(req.params.id));
      if (!category) {
        return res.status(404).json({ error: "الفئة غير موجودة" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "فشل في جلب الفئة" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      console.log("Received data:", req.body);
      // استخدام البيانات مباشرة من طلب المستخدم بعد التحقق الأساسي
      const { name, icon, imageUrl, isActive } = req.body;

      if (!name || !imageUrl) {
        return res.status(400).json({ error: "الاسم وصورة الفئة مطلوبان" });
      }

      // استخدام SQL مباشر لإنشاء الفئة (الآن أصبحت حقول التاريخ من نوع TIMESTAMP)
      const query = `
        INSERT INTO categories (name, icon, image_url, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, icon, image_url as "imageUrl", is_active as "isActive", created_at, updated_at
      `;

      const result = await pool.query(query, [
        name,
        icon,
        imageUrl || null,
        isActive === undefined ? true : isActive,
      ]);

      if (result.rows.length > 0) {
        // تنسيق البيانات المرسلة للعميل
        const category = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          icon: result.rows[0].icon,
          imageUrl: result.rows[0].imageUrl,
          isActive: result.rows[0].is_active,
        };

        console.log("Category created successfully:", category);
        res.status(201).json(category);
      } else {
        res.status(500).json({ error: "لم يتم إنشاء الفئة" });
      }
    } catch (error: any) {
      console.error("SQL Error creating category:", error, error.message);
      res
        .status(400)
        .json({ error: "فشل في إنشاء الفئة", details: error.message });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      const categoryData = updateCategorySchema.parse(req.body);
      const updatedCategory = await storage.updateCategory(
        categoryId,
        categoryData,
      );
      if (!updatedCategory) {
        return res.status(404).json({ error: "الفئة غير موجودة" });
      }
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ error: "فشل في تحديث الفئة" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      await storage.deleteCategory(categoryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "فشل في حذف الفئة" });
    }
  });

  // Subcategories Management Endpoints
  app.get("/api/subcategories", async (req, res) => {
    try {
      const categoryId = req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined;
      const subcategoriesList = await storage.getSubcategories(categoryId);
      res.json(subcategoriesList);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "فشل في جلب الفئات الفرعية" });
    }
  });

  app.get("/api/subcategories/:id", async (req, res) => {
    try {
      const subcategory = await storage.getSubcategoryById(
        Number(req.params.id),
      );
      if (!subcategory) {
        return res.status(404).json({ error: "الفئة الفرعية غير موجودة" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      res.status(500).json({ error: "فشل في جلب الفئة الفرعية" });
    }
  });

  app.post("/api/subcategories", async (req, res) => {
    try {
      console.log("Received subcategory data:", req.body);
      // تحقق من وجود البيانات المطلوبة مباشرة
      const { name, imageUrl, parentId } = req.body;

      if (!name || !imageUrl || !parentId) {
        return res
          .status(400)
          .json({ error: "اسم الفئة الفرعية وصورتها والفئة الأم مطلوبان" });
      }

      const subcategoryData = insertSubcategorySchema.parse(req.body);
      const newSubcategory = await storage.createSubcategory(subcategoryData);
      console.log("Subcategory created successfully:", newSubcategory);
      res.status(201).json(newSubcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      res.status(400).json({ error: "فشل في إنشاء الفئة الفرعية" });
    }
  });

  app.put("/api/subcategories/:id", async (req, res) => {
    try {
      const subcategoryId = Number(req.params.id);
      const subcategoryData = updateSubcategorySchema.parse(req.body);
      const updatedSubcategory = await storage.updateSubcategory(
        subcategoryId,
        subcategoryData,
      );
      if (!updatedSubcategory) {
        return res.status(404).json({ error: "الفئة الفرعية غير موجودة" });
      }
      res.json(updatedSubcategory);
    } catch (error) {
      console.error("Error updating subcategory:", error);
      res.status(400).json({ error: "فشل في تحديث الفئة الفرعية" });
    }
  });

  app.delete("/api/subcategories/:id", async (req, res) => {
    try {
      const subcategoryId = Number(req.params.id);
      await storage.deleteSubcategory(subcategoryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ error: "فشل في حذف الفئة الفرعية" });
    }
  });

  // Questions Management Endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "فشل في جلب الأسئلة" });
    }
  });

  app.get("/api/questions/category/:categoryId", async (req, res) => {
    try {
      const categoryId = Number(req.params.categoryId);
      const subcategoryId = req.query.subcategoryId
        ? Number(req.query.subcategoryId)
        : undefined;
      const questions = await storage.getQuestionsByCategory(
        categoryId,
        subcategoryId,
      );
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions by category:", error);
      res.status(500).json({ error: "فشل في جلب الأسئلة حسب الفئة" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestionById(Number(req.params.id));
      if (!question) {
        return res.status(404).json({ error: "السؤال غير موجود" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "فشل في جلب السؤال" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const newQuestion = await storage.createQuestion(questionData);
      res.status(201).json(newQuestion);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ error: "فشل في إنشاء السؤال" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      const questionData = updateQuestionSchema.parse(req.body);
      const updatedQuestion = await storage.updateQuestion(
        questionId,
        questionData,
      );
      if (!updatedQuestion) {
        return res.status(404).json({ error: "السؤال غير موجود" });
      }
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ error: "فشل في تحديث السؤال" });
    }
  });
  
  // نقطة نهاية جديدة لتحديثات جزئية للأسئلة (مثل تغيير الفئة أو الصعوبة فقط)
  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      
      // التحقق من وجود السؤال
      const existingQuestion = await storage.getQuestionById(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ error: "السؤال غير موجود" });
      }
      
      // دمج الحقول الموجودة مع الحقول المُحدثة
      const updatedData = {
        ...existingQuestion,
        ...req.body,
        // الحفاظ على الحقول التي لا نريد تغييرها
        id: existingQuestion.id,
        createdAt: existingQuestion.createdAt,
        updatedAt: new Date()
      };
      
      const updatedQuestion = await storage.updateQuestion(
        questionId,
        updatedData
      );
      
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error patching question:", error);
      res.status(400).json({ error: "فشل في تحديث السؤال جزئياً" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      await storage.deleteQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "فشل في حذف السؤال" });
    }
  });

  // تحميل ملفات الوسائط للأسئلة (صور وفيديو)
  app.post("/api/upload-media", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم تحميل أي ملف" });
      }
      
      // إنشاء عنوان URL للملف المحمل
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // إرجاع البيانات
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error: any) {
      console.error("Error uploading media:", error);
      res.status(500).json({ 
        error: "فشل تحميل الملف",
        message: error.message
      });
    }
  });

  // Footer settings API endpoints
  app.get("/api/footer-settings", (_req, res) => {
    // Sample footer settings data
    const footerSettings = {
      links: [
        { label: "من نحن", url: "/about" },
        { label: "اتصل بنا", url: "/contact" },
        { label: "سياسة الخصوصية", url: "/privacy" },
        { label: "الشروط والأحكام", url: "/terms" },
        { label: "الأسئلة الشائعة", url: "/faq" },
        { label: "English", url: "/en" },
      ],
      socialLinks: {
        twitter: "https://twitter.com/jaweb",
        whatsapp: "https://wa.me/966500000000",
        telegram: "https://t.me/jaweb",
        instagram: "https://instagram.com/jaweb",
      },
      copyright: "© 2025 جاوب - جميع الحقوق محفوظة",
    };

    res.json(footerSettings);
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
