import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  updateQuestionSchema
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

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Categories with children endpoint
  app.get("/api/categories-with-children", async (_req, res) => {
    try {
      const categoriesList = await storage.getCategories();
      const result = [];
      
      for (const category of categoriesList) {
        const subcategories = await storage.getSubcategories(category.id);
        
        result.push({
          id: category.id,
          name: category.name,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isActive: category.isActive,
          children: subcategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            icon: sub.icon,
            parentId: sub.parentId,
            imageUrl: sub.imageUrl,
            isActive: sub.isActive,
            availableQuestions: sub.availableQuestions || 0
          }))
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
      // For now, we'll use a mock user ID
      const userId = 1; // Mock user ID
      console.log("Creating game with data:", req.body);

      // Format data from new API format to storage format
      const gameData = {
        gameName: req.body.gameName,
        teams: req.body.teamNames
          .slice(0, req.body.teamsCount)
          .map((name: string) => ({ name })),
        answerTimes: req.body.answerTimes,
        // answerTimeFirst: parseInt(req.body.firstAnswerTime, 10),
        //  answerTimeSecond: parseInt(req.body.secondAnswerTime, 10),
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
  app.get("/api/user-level", (_req, res) => {
    // Sample user level data
    const userLevel = {
      level: "ذهبي",
      badge: "🥇",
      color: "#FFD700",
      progress: 75,
      nextLevel: "بلاتيني",
      requiredStars: 20,
      currentStars: 15,
      startDate: "2025-01-15T12:00:00.000Z",
      monthlyRewards: {
        freeCards: 15,
        validity: 30, // أيام
        nextRenewal: "2025-05-15T12:00:00.000Z",
        accumulative: true,
      },
      stats: {
        starsThisMonth: 7,
        cardsUsed: 28,
        conversionRate: 2, // كل 2 كرت = 1 نجمة
        starsToNextLevel: 5,
        daysBeforeDemotion: 45, // الأيام المتبقية قبل فقدان المستوى
        starsFromSubs: 3, // النجوم من المستخدمين الفرعيين
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
  app.get("/api/user-profile", (_req, res) => {
    // Sample user profile data
    const userProfile = {
      id: 1,
      username: "ahmed_88",
      name: "أحمد محمد",
      email: "ahmed@example.com",
      phone: "966512345678",
      avatarUrl: "/assets/avatars/avatar1.png",
    };

    res.json(userProfile);
  });

  // User stats API endpoint
  app.get("/api/user-stats", (_req, res) => {
    // Sample user stats data
    const userStats = {
      gamesPlayed: 15,
      lastPlayed: "2025-04-28T14:30:00Z",
    };

    res.json(userStats);
  });

  // User cards API endpoint
  app.get("/api/user-cards", (_req, res) => {
    // Sample user cards data
    const userCards = {
      freeCards: 5,
      paidCards: 10,
      totalCards: 15,
      freeIcon: "🎫",
      paidIcon: "💳",
      usedFreeCards: 3,
      usedPaidCards: 2,
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
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ error: "فشل في إنشاء الفئة" });
    }
  });
  
  app.put("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      const categoryData = updateCategorySchema.parse(req.body);
      const updatedCategory = await storage.updateCategory(categoryId, categoryData);
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
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const subcategoriesList = await storage.getSubcategories(categoryId);
      res.json(subcategoriesList);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "فشل في جلب الفئات الفرعية" });
    }
  });
  
  app.get("/api/subcategories/:id", async (req, res) => {
    try {
      const subcategory = await storage.getSubcategoryById(Number(req.params.id));
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
      const subcategoryData = insertSubcategorySchema.parse(req.body);
      const newSubcategory = await storage.createSubcategory(subcategoryData);
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
      const updatedSubcategory = await storage.updateSubcategory(subcategoryId, subcategoryData);
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
      const subcategoryId = req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined;
      const questions = await storage.getQuestionsByCategory(categoryId, subcategoryId);
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
      const updatedQuestion = await storage.updateQuestion(questionId, questionData);
      if (!updatedQuestion) {
        return res.status(404).json({ error: "السؤال غير موجود" });
      }
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ error: "فشل في تحديث السؤال" });
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
