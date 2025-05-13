import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gameSessionSchema, updateGameSettingsSchema, updateSiteSettingsSchema } from "@shared/schema";
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
  app.get('/api/categories-with-children', (_req, res) => {
    // Sample data based on the requirements
    const categories = [
      {
        "id": 1,
        "name": "علوم",
        "icon": "⚗️",
        "children": [
          { "id": 11, "name": "كيمياء", "icon": "⚗️" },
          { "id": 12, "name": "فيزياء", "icon": "🔬" },
          { "id": 13, "name": "أحياء", "icon": "🧬" },
          { "id": 14, "name": "فلك", "icon": "🔭" }
        ]
      },
      {
        "id": 2,
        "name": "رياضيات",
        "icon": "🧮",
        "children": [
          { "id": 21, "name": "جبر", "icon": "➗" },
          { "id": 22, "name": "هندسة", "icon": "📐" },
          { "id": 23, "name": "إحصاء", "icon": "📊" },
          { "id": 24, "name": "حساب", "icon": "🔢" }
        ]
      },
      {
        "id": 3,
        "name": "ثقافة عامة",
        "icon": "📚",
        "children": [
          { "id": 31, "name": "تاريخ", "icon": "🏛️" },
          { "id": 32, "name": "جغرافيا", "icon": "🌍" },
          { "id": 33, "name": "فن", "icon": "🎨" },
          { "id": 34, "name": "أدب", "icon": "📖" },
          { "id": 35, "name": "موسيقى", "icon": "🎵" },
          { "id": 36, "name": "رياضة", "icon": "⚽" }
        ]
      },
      {
        "id": 4,
        "name": "تقنية",
        "icon": "💻",
        "children": [
          { "id": 41, "name": "برمجة", "icon": "👨‍💻" },
          { "id": 42, "name": "شبكات", "icon": "🌐" },
          { "id": 43, "name": "ذكاء صناعي", "icon": "🤖" },
          { "id": 44, "name": "تطبيقات", "icon": "📱" }
        ]
      }
    ];
    
    // Return the categories
    res.json(categories);
  });

  // Game settings endpoint
  app.get('/api/game-settings', async (_req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching game settings:', error);
      res.status(500).json({ error: 'Failed to fetch game settings' });
    }
  });

  // Update game settings endpoint - for admin use
  app.patch('/api/game-settings', validateRequest(updateGameSettingsSchema), async (req, res) => {
    try {
      const updatedSettings = await storage.updateGameSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating game settings:', error);
      res.status(500).json({ error: 'Failed to update game settings' });
    }
  });

  // Create new game session endpoint
  app.post('/api/game-sessions', validateRequest(gameSessionSchema), async (req, res) => {
    try {
      // In a real app, you would extract user ID from authenticated session
      // For now, we'll use a mock user ID
      const userId = 1; // Mock user ID
      const newSession = await storage.createGameSession(userId, req.body);
      res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating game session:', error);
      res.status(500).json({ error: 'Failed to create game session' });
    }
  });
  
  // Create new game endpoint (alias for compatibility)
  app.post('/api/create-game', async (req, res) => {
    try {
      // In a real app, you would extract user ID from authenticated session
      // For now, we'll use a mock user ID
      const userId = 1; // Mock user ID
      console.log('Creating game with data:', req.body);
      
      // Format data from new API format to storage format
      const gameData = {
        gameName: req.body.gameName,
        teams: req.body.teamNames.slice(0, req.body.teamsCount).map((name: string) => ({ name })),
        answerTimeFirst: parseInt(req.body.firstAnswerTime, 10),
        answerTimeSecond: parseInt(req.body.secondAnswerTime, 10),
        selectedCategories: req.body.categories
      };
      
      const newSession = await storage.createGameSession(userId, gameData);
      res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({ error: 'Failed to create game' });
    }
  });

  // Get user's game sessions
  app.get('/api/users/:userId/game-sessions', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const sessions = await storage.getUserGameSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching game sessions:', error);
      res.status(500).json({ error: 'Failed to fetch game sessions' });
    }
  });
  
  // Get game log by ID
  app.get('/api/game-log/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });
      }
      
      const gameSession = await storage.getGameSession(gameId);
      if (!gameSession) {
        return res.status(404).json({ error: 'Game session not found' });
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
        { id: 44, name: "تطبيقات", icon: "📱" }
      ];
      
      // البحث عن الفئات المطابقة
      categoryIds.forEach((id: number) => {
        const found = allCategories.find(cat => cat.id === id);
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
        playCount: 1 // افتراضي للعرض التجريبي
      };
      
      // إضافة بيانات افتراضية للجولات للعرض التجريبي
      // في التطبيق الحقيقي، ستكون هذه البيانات محفوظة في قاعدة البيانات
      const gameRounds = [
        {
          id: "r1",
          roundNumber: 1,
          category: { id: 12, name: "فيزياء", icon: "🔬" },
          question: "ما هي قوانين نيوتن للحركة؟",
          correctAnswer: "قانون القصور الذاتي، قانون القوة، وقانون الفعل ورد الفعل",
          winningTeam: typedGameSession.teams[0]?.name || null,
          timestamp: new Date(new Date(typedGameSession.createdAt).getTime() + 1000*60).toISOString()
        },
        {
          id: "r2",
          roundNumber: 2,
          category: { id: 31, name: "تاريخ", icon: "🏛️" },
          question: "متى تأسست المملكة العربية السعودية الحديثة؟",
          correctAnswer: "23 سبتمبر 1932",
          winningTeam: typedGameSession.teams[1]?.name || null,
          timestamp: new Date(new Date(typedGameSession.createdAt).getTime() + 2000*60).toISOString()
        },
        {
          id: "r3",
          roundNumber: 3,
          category: { id: 42, name: "شبكات", icon: "🌐" },
          question: "ما هو بروتوكول HTTP؟",
          correctAnswer: "بروتوكول نقل النص التشعبي لتبادل المعلومات عبر الويب",
          winningTeam: null,
          timestamp: new Date(new Date(typedGameSession.createdAt).getTime() + 3000*60).toISOString()
        }
      ];
      
      // يضاف إلى كائن اللعبة بيانات الجولات
      const gameLog = {
        ...typedGameSession,
        rounds: gameRounds
      };
      
      res.json(gameLog);
    } catch (error) {
      console.error('Error fetching game log:', error);
      res.status(500).json({ error: 'Failed to fetch game log' });
    }
  });
  
  // Replay a game
  app.post('/api/replay-game', async (req, res) => {
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
        return res.status(404).json({ error: 'Original game not found' });
      }
      
      // تحويل نوع البيانات للتطابق
      const originalGameAny = originalGame as any;
      const selectedCategories = Array.isArray(originalGameAny.selectedCategories) 
        ? originalGameAny.selectedCategories 
        : [];
      
      // إنشاء بيانات اللعبة الجديدة
      const gameData = {
        gameName: validatedData.gameName,
        teams: validatedData.teamNames.map(name => ({ name, score: 0 })),
        answerTimeFirst: validatedData.answerTimeFirst,
        answerTimeSecond: validatedData.answerTimeSecond,
        selectedCategories: selectedCategories
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
      console.error('Error replaying game:', error);
      res.status(500).json({ error: 'Failed to replay game' });
    }
  });
  
  // Get admin settings (including max_games_per_page)
  app.get('/api/admin-settings', (req, res) => {
    // في النسخة النهائية، هذه البيانات ستأتي من قاعدة البيانات
    res.json({
      max_games_per_page: 15,
      show_game_logs: true,
      show_teams_scores: true,
      default_answer_time_first: 30,
      default_answer_time_second: 15
    });
  });

  // Get specific game session
  app.get('/api/game-sessions/:id', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: 'Invalid session ID' });
      }
      
      const session = await storage.getGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }
      
      res.json(session);
    } catch (error) {
      console.error('Error fetching game session:', error);
      res.status(500).json({ error: 'Failed to fetch game session' });
    }
  });

  // Leaderboard API endpoint
  app.get('/api/leaderboard', (_req, res) => {
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
      { id: 10, username: "هدى", level: "مبتدئ", stars: 1, badge: "🎖️" }
    ];
    
    res.json(leaderboard);
  });

  // User level API endpoint
  app.get('/api/user-level', (_req, res) => {
    // Sample user level data
    const userLevel = {
      level: "ذهبي",
      badge: "🥇",
      color: "#FFD700",
      progress: 75,
      nextLevel: "بلاتيني",
      requiredStars: 20,
      currentStars: 15
    };
    
    res.json(userLevel);
  });
  
  // User profile API endpoint
  app.get('/api/user-profile', (_req, res) => {
    // Sample user profile data
    const userProfile = {
      id: 1,
      username: "ahmed_88",
      name: "أحمد محمد",
      email: "ahmed@example.com",
      phone: "966512345678",
      avatarUrl: "/assets/avatars/avatar1.png"
    };
    
    res.json(userProfile);
  });
  
  // User stats API endpoint
  app.get('/api/user-stats', (_req, res) => {
    // Sample user stats data
    const userStats = {
      gamesPlayed: 15,
      lastPlayed: "2025-04-28T14:30:00Z"
    };
    
    res.json(userStats);
  });

  // User cards API endpoint
  app.get('/api/user-cards', (_req, res) => {
    // Sample user cards data
    const userCards = {
      freeCards: 5,
      paidCards: 10,
      totalCards: 15,
      freeIcon: "🎫",
      paidIcon: "💳",
      usedFreeCards: 3,
      usedPaidCards: 2
    };
    
    res.json(userCards);
  });

  // Site settings API endpoints
  app.get('/api/site-settings', async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching site settings:', error);
      res.status(500).json({ error: 'Failed to fetch site settings' });
    }
  });

  app.patch('/api/site-settings', validateRequest(updateSiteSettingsSchema), async (req, res) => {
    try {
      const updatedSettings = await storage.updateSiteSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating site settings:', error);
      res.status(500).json({ error: 'Failed to update site settings' });
    }
  });

  // Footer settings API endpoints
  app.get('/api/footer-settings', (_req, res) => {
    // Sample footer settings data
    const footerSettings = {
      links: [
        { label: "من نحن", url: "/about" },
        { label: "اتصل بنا", url: "/contact" },
        { label: "سياسة الخصوصية", url: "/privacy" },
        { label: "الشروط والأحكام", url: "/terms" },
        { label: "الأسئلة الشائعة", url: "/faq" },
        { label: "English", url: "/en" }
      ],
      socialLinks: {
        twitter: "https://twitter.com/jaweb",
        whatsapp: "https://wa.me/966500000000",
        telegram: "https://t.me/jaweb",
        instagram: "https://instagram.com/jaweb"
      },
      copyright: "© 2025 جاوب - جميع الحقوق محفوظة"
    };
    
    res.json(footerSettings);
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
