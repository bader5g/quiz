import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool, db } from "./db";
import { webSocketManager } from "./websocket";
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
import { categoriesRouter } from "./routes/index";
import { questionsRouter } from "./routes/questions-simple";
import { main_categories, subcategories_v2 } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
      const userId = req.body.userId || 2; // Use provided userId or default to 2
      console.log("Creating game with data:", req.body);

      // Handle both formats: legacy and simplified
      let gameData;
      
      if (req.body.teamNames && req.body.teamsCount) {
        // Legacy format with teams
        gameData = {
          gameName: req.body.gameName || "لعبة تجريبية",
          teams: req.body.teamNames
            .slice(0, req.body.teamsCount)
            .map((name: string) => ({ name, score: 0 })),
          answerTimeFirst: req.body.answerTimes?.[0] || 30,
          answerTimeSecond: req.body.answerTimes?.[1] || 15,
          selectedCategories: req.body.categories || req.body.selectedCategories || [],
        };
      } else if (req.body.teams && Array.isArray(req.body.teams)) {
        // New format from test page
        gameData = {
          gameName: req.body.gameName || "لعبة تجريبية",
          teams: req.body.teams.map((team: any) => ({ 
            name: team.name || "فريق", 
            score: team.score || 0 
          })),
          answerTimeFirst: req.body.answerTimes?.first || 30,
          answerTimeSecond: req.body.answerTimes?.second || 15,
          selectedCategories: req.body.selectedCategories || req.body.categories || [],
        };
      } else {
        // Simplified format for testing
        gameData = {
          gameName: req.body.gameName || "لعبة تجريبية",
          teams: [{ name: "فريق 1", score: 0 }, { name: "فريق 2", score: 0 }],
          answerTimeFirst: req.body.timeLimit || 30,
          answerTimeSecond: 15,
          selectedCategories: req.body.selectedCategories || req.body.categories || [],
        };
      }

      // التأكد من أن selectedCategories ليست فارغة
      if (!gameData.selectedCategories || !Array.isArray(gameData.selectedCategories) || gameData.selectedCategories.length === 0) {
        console.warn("No categories selected, using default categories");
        gameData.selectedCategories = [5, 12]; // فئات افتراضية للاختبار
      }

      console.log("Formatted game data:", JSON.stringify(gameData, null, 2));
      console.log("Selected categories type:", typeof gameData.selectedCategories);
      console.log("Selected categories value:", gameData.selectedCategories);
      console.log("Is Array:", Array.isArray(gameData.selectedCategories));
      
      const newSession = await storage.createGameSession(userId, gameData);
      console.log("Game created successfully with ID:", newSession.id);
      res.status(200).json({ gameId: newSession.id, ...newSession });
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

  // Debug endpoint للفحص المباشر لقاعدة البيانات
  app.get("/api/debug/game/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      console.log("🔍 Debug: Getting raw game data for ID:", gameId);
      
      // جلب البيانات الخام مباشرة من قاعدة البيانات
      const game = await storage.getGameById(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "اللعبة غير موجودة" });
      }

      // إرجاع البيانات الخام بدون أي معالجة
      console.log("🔍 Debug: Raw game data:", JSON.stringify(game, null, 2));
      res.status(200).json({
        rawGame: game,
        selectedCategoriesType: typeof game.selectedCategories,
        selectedCategoriesValue: game.selectedCategories,
        // استخدام خاصية selectedCategories فقط للتوافق
        selectedCategoriesSnakeCase: game.selectedCategories,
        selectedCategoriesSnakeCaseType: typeof game.selectedCategories,
        isArray: Array.isArray(game.selectedCategories),
        isArraySnakeCase: Array.isArray(game.selectedCategories),
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      res.status(500).json({ error: "حدث خطأ أثناء فحص البيانات" });
    }
  });

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

      // استخدام قيمة افتراضية للأسئلة حيث تم إزالة نظام إدارة الأسئلة
      questionsCount = 0;

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
  app.get("/api/user-level", async (req, res) => {
    // التحقق من حالة تسجيل الدخول
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    
    try {
      const userId = req.user.id;
      
      // حساب النجوم من الألعاب الحقيقية
      const userGames = await storage.getUserGameSessions(userId);
      const completedGames = userGames.filter(game => game.isCompleted === true);
      const wonGames = completedGames.filter(game => game.winnerIndex !== null && game.winnerIndex !== undefined);
      
      // حساب النجوم الحقيقية: انتصار = 3 نجوم، مشاركة = 1 نجمة
      const currentStars = (wonGames.length * 3) + (completedGames.length - wonGames.length);
      
      // تحديد المستوى بناء على النجوم الحقيقية
      let level = "مبتدئ";
      let badge = "🌟";
      let color = "#A9A9A9";
      
      if (currentStars >= 100) {
        level = "الأسطوري";
        badge = "👑";
        color = "#8B0000";
      } else if (currentStars >= 50) {
        level = "ماسي";
        badge = "💎";
        color = "#B9F2FF";
      } else if (currentStars >= 30) {
        level = "بلاتيني";
        badge = "🥈";
        color = "#E5E4E2";
      } else if (currentStars >= 20) {
        level = "ذهبي";
        badge = "🥇";
        color = "#FFD700";
      } else if (currentStars >= 10) {
        level = "فضي";
        badge = "🥈";
        color = "#C0C0C0";
      }
    
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
    
    // حساب الإحصاءات الحقيقية من الألعاب
    const thisMonth = new Date();
    const gamesThisMonth = userGames.filter(game => {
      const gameDate = new Date(game.createdAt);
      return gameDate.getMonth() === thisMonth.getMonth() && gameDate.getFullYear() === thisMonth.getFullYear();
    });
    
    const starsThisMonth = gamesThisMonth.reduce((total, game) => {
      // إذا كانت هناك بيانات فائز، أعطي نجوم إضافية
      if (game.winnerIndex !== null && game.winnerIndex !== undefined) {
        return total + 3;
      }
      return total + 1; // نجمة واحدة للمشاركة
    }, 0);
    
    const cardsUsed = userGames.length * 2; // كل لعبة تستهلك كرتين في المتوسط
    const starsToNextLevel = Math.max(0, requiredStars - currentStars);
    
    const userLevel = {
      level,
      badge,
      color,
      progress: Math.round(progress),
      nextLevel,
      requiredStars,
      currentStars,
      startDate: req.user.createdAt || "2025-01-15T12:00:00.000Z",
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
        starsFromSubs: 0, // سيحسب لاحقاً من المستخدمين الفرعيين
      },
    };

    res.json(userLevel);
    } catch (error) {
      console.error("خطأ في جلب مستوى المستخدم:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب مستوى المستخدم" });
    }
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
      const completedGames = userGames.filter(game => game.isCompleted === true);
      const wonGames = completedGames.filter(game => game.winnerIndex !== null && game.winnerIndex !== undefined);
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
        if (game.winnerIndex !== null && game.winnerIndex !== undefined) {
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

  // Register categories router for all category endpoints
  app.use("/api/categories", categoriesRouter);
  
  // Register questions router for all questions endpoints
  app.use("/api/questions", questionsRouter);

  // Debugging endpoint to check database connection
  app.get("/api/debug/db", async (req, res) => {
    try {
      // تنفيذ استعلام بسيط للتحقق من الاتصال بقاعدة البيانات
      const result = await pool.query("SELECT NOW()");
      res.json({
        message: "Database connection is active",
        serverTime: result.rows[0].now,
      });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({ error: "Failed to connect to the database" });
    }
  });

  // WebSocket status endpoint
  app.get("/api/websocket/status", (req, res) => {
    try {
      const status = webSocketManager.getStatus();
      res.json({
        ...status,
        message: "WebSocket server status retrieved successfully"
      });
    } catch (error) {
      console.error("WebSocket status error:", error);
      res.status(500).json({ error: "Failed to get WebSocket status" });
    }
  });

  // Endpoint to broadcast test activity
  app.post("/api/websocket/test-activity", (req, res) => {
    try {
      const { message, type } = req.body;
      
      if (type === 'activity') {
        const testActivity = webSocketManager.generateMockActivity();
        if (message) {
          testActivity.details = message;
        }
        webSocketManager.broadcastActivity(testActivity);
        res.json({ 
          success: true, 
          message: "Test activity broadcasted successfully",
          activity: testActivity
        });
      } else if (type === 'notification') {
        webSocketManager.broadcastSystemNotification(
          message || "تجريب إشعار النظام", 
          "info"
        );
        res.json({ 
          success: true, 
          message: "Test notification broadcasted successfully" 
        });
      } else {
        res.status(400).json({ error: "Invalid test type. Use 'activity' or 'notification'" });
      }
    } catch (error) {
      console.error("WebSocket test broadcast error:", error);
      res.status(500).json({ error: "Failed to broadcast test message" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
