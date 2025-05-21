import { 
  users, categories, subcategories, questions, gameSettings, siteSettings, gameSessions,
  type User, 
  type InsertUser, 
  type GameSettings, 
  type UpdateGameSettings, 
  type GameSession, 
  type InsertGameSession,
  type SiteSettings,
  type UpdateSiteSettings,
  type Category,
  type InsertCategory,
  type UpdateCategory,
  type Subcategory,
  type InsertSubcategory,
  type UpdateSubcategory,
  type Question,
  type InsertQuestion,
  type UpdateQuestion
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game settings related methods
  getGameSettings(): Promise<GameSettings | undefined>;
  updateGameSettings(settings: UpdateGameSettings): Promise<GameSettings>;
  
  // Site settings related methods
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings>;
  
  // Game sessions related methods
  createGameSession(userId: number, session: InsertGameSession): Promise<GameSession>;
  getUserGameSessions(userId: number): Promise<GameSession[]>;
  getGameSession(id: number): Promise<GameSession | undefined>;
  
  // Game play methods
  getGameById(id: number): Promise<GameSession | undefined>;
  updateGameTeams(gameId: number, teams: any[]): Promise<void>;
  updateGameCurrentTeam(gameId: number, teamIndex: number): Promise<void>;
  updateGameQuestions(gameId: number, questions: any[]): Promise<void>; // إضافة وظيفة تحديث حالة الأسئلة
  updateGameViewedQuestions(gameId: number, viewedQuestionIds: any[]): Promise<void>; // إضافة وظيفة تحديث الأسئلة المعروضة
  endGame(gameId: number, winnerIndex: number): Promise<void>;
  saveGameState(gameId: number): Promise<void>;
  
  // Categories management
  getCategories(): Promise<any[]>;
  getCategoryById(id: number): Promise<any | undefined>;
  createCategory(category: any): Promise<any>;
  updateCategory(id: number, category: any): Promise<any>;
  deleteCategory(id: number): Promise<void>;
  
  // Subcategories management
  getSubcategories(categoryId?: number): Promise<any[]>;
  getSubcategoryById(id: number): Promise<any | undefined>;
  createSubcategory(subcategory: any): Promise<any>;
  updateSubcategory(id: number, subcategory: any): Promise<any>;
  deleteSubcategory(id: number): Promise<void>;
  
  // Questions management
  getQuestions(): Promise<any[]>;
  getQuestionById(id: number): Promise<any | undefined>;
  getQuestionsByCategory(categoryId: number, subcategoryId?: number): Promise<any[]>;
  createQuestion(question: any): Promise<any>;
  updateQuestion(id: number, question: any): Promise<any>;
  deleteQuestion(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameSettings: GameSettings;
  private siteSettings: SiteSettings;
  private gameSessions: Map<number, GameSession>;
  private categories: Map<number, any>;
  private subcategories: Map<number, any>;
  private questions: Map<number, any>;
  currentCategoryId: number;
  currentSubcategoryId: number;
  currentQuestionId: number;
  currentUserId: number;
  currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.gameSessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    
    // إضافة مستخدم افتراضي للاختبار
    this.users.set(1, {
      id: 1,
      username: "أحمد",
      password: "hashed_password", // في التطبيق الحقيقي ستكون كلمة المرور مشفرة
    });
    
    // إضافة جلسات لعب تجريبية
    // Game Session 1
    const gameSession1: GameSession = {
      id: 1,
      userId: 1,
      gameName: "لعبة العلوم والثقافة",
      teams: [
        { name: "النجوم", score: 12 },
        { name: "العباقرة", score: 9 }
      ],
      answerTimeFirst: 30,
      answerTimeSecond: 15,
      selectedCategories: [12, 13, 31, 34], // فيزياء، أحياء، تاريخ، أدب
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // قبل أسبوع
    };
    
    // Game Session 2
    const gameSession2: GameSession = {
      id: 2,
      userId: 1,
      gameName: "مسابقة التقنية",
      teams: [
        { name: "المبرمجون", score: 15 },
        { name: "الشبكات", score: 10 },
        { name: "الذكاء الصناعي", score: 8 }
      ],
      answerTimeFirst: 45,
      answerTimeSecond: 20,
      selectedCategories: [41, 42, 43, 44], // برمجة، شبكات، ذكاء صناعي، تطبيقات
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // قبل 3 أيام
    };
    
    // Game Session 3
    const gameSession3: GameSession = {
      id: 3,
      userId: 1,
      gameName: "تحدي الرياضيات",
      teams: [
        { name: "فريق الجبر", score: 7 },
        { name: "فريق الهندسة", score: 10 }
      ],
      answerTimeFirst: 30,
      answerTimeSecond: 15,
      selectedCategories: [21, 22, 23, 24], // جبر، هندسة، إحصاء، حساب
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // قبل يوم
    };
    
    // إضافة جلسات اللعب إلى المخزن
    this.gameSessions.set(gameSession1.id, gameSession1);
    this.gameSessions.set(gameSession2.id, gameSession2);
    this.gameSessions.set(gameSession3.id, gameSession3);
    
    // تحديث currentSessionId
    this.currentSessionId = 4;
    
    // Initialize default game settings
    this.gameSettings = {
      id: 1,
      minCategories: 4,
      maxCategories: 8,
      minTeams: 2,
      maxTeams: 4,
      maxGameNameLength: 45,
      maxTeamNameLength: 45,
      defaultFirstAnswerTime: 30,
      defaultSecondAnswerTime: 15,
      allowedFirstAnswerTimes: [15, 30, 45, 60],
      allowedSecondAnswerTimes: [10, 15, 20, 30],
      maxSubUsers: 5, // الحد الأقصى للمستخدمين الفرعيين
      modalTitle: "إعدادات اللعبة",
      pageDescription: "اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Initialize default site settings
    this.siteSettings = {
      id: 1,
      logoUrl: "/assets/jaweb-logo.png",
      appName: "جاوب",
      faviconUrl: "/favicon.ico",
      modalStyle: "default", // قيمة افتراضية لنمط المودال
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Game settings related methods
  async getGameSettings(): Promise<GameSettings | undefined> {
    return this.gameSettings;
  }
  
  async updateGameSettings(settings: UpdateGameSettings): Promise<GameSettings> {
    this.gameSettings = {
      ...this.gameSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    return this.gameSettings;
  }
  
  // Site settings related methods
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return this.siteSettings;
  }
  
  async updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
    this.siteSettings = {
      ...this.siteSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    return this.siteSettings;
  }
  
  // Game sessions related methods
  async createGameSession(userId: number, session: InsertGameSession): Promise<GameSession> {
    const id = this.currentSessionId++;
    const newSession: GameSession = {
      id,
      userId,
      ...session,
      createdAt: new Date().toISOString()
    };
    this.gameSessions.set(id, newSession);
    return newSession;
  }
  
  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values()).filter(
      (session) => session.userId === userId
    );
  }
  
  async getGameSession(id: number): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }

  // Implement Game play methods
  async getGameById(id: number): Promise<GameSession | undefined> {
    return this.getGameSession(id);
  }

  async updateGameTeams(gameId: number, teams: any[]): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      console.log("تحديث فرق اللعبة:", { 
        قبل: JSON.stringify(game.teams),
        بعد: JSON.stringify(teams)
      });
      
      // نسخ عميق لفرق اللعبة لتجنب التعديل المباشر على الكائن الأصلي
      const updatedTeams = JSON.parse(JSON.stringify(teams));
      
      // التأكد من أن جميع الفرق لديها قيمة score
      updatedTeams.forEach((team: any, index: number) => {
        if (typeof team.score !== 'number') {
          team.score = 0;
        }
      });
      
      const updatedGame = { 
        ...game, 
        teams: updatedTeams 
      };
      
      this.gameSessions.set(gameId, updatedGame);
      console.log("تم تحديث فرق اللعبة بنجاح:", updatedGame.teams);
    } else {
      console.error("لم يتم العثور على اللعبة رقم", gameId);
    }
  }

  async updateGameCurrentTeam(gameId: number, teamIndex: number): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      const updatedGame = { ...game, currentTeamIndex: teamIndex };
      this.gameSessions.set(gameId, updatedGame);
    }
  }

  async updateGameViewedQuestions(gameId: number, viewedQuestionIds: any[]): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      // تحديث قائمة الأسئلة التي تم عرضها
      const updatedGame = { 
        ...game, 
        viewedQuestionIds 
      };
      this.gameSessions.set(gameId, updatedGame);
    }
  }

  async updateGameQuestions(gameId: number, questions: any[]): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      // ندمج الأسئلة مع الأسئلة الموجودة حاليًا في اللعبة
      // نخزن الأسئلة المجاب عليها بخاصية answeredQuestions
      const answeredQuestions = game.answeredQuestions || [];
      
      // إضافة الأسئلة الجديدة المجاب عليها
      questions.forEach(q => {
        if (q.isAnswered) {
          // إذا لم يكن السؤال موجود بالفعل في القائمة، نضيفه
          const questionKey = `${q.categoryId}-${q.difficulty}-${q.teamIndex}-${q.questionId}`;
          if (!answeredQuestions.some(aq => aq === questionKey)) {
            answeredQuestions.push(questionKey);
          }
        }
      });
      
      // تحديث اللعبة بالأسئلة المجاب عليها
      const updatedGame = { 
        ...game, 
        answeredQuestions 
      };
      this.gameSessions.set(gameId, updatedGame);
    }
  }

  async endGame(gameId: number, winnerIndex: number): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      const updatedGame = { 
        ...game, 
        isCompleted: true,
        winnerIndex
      };
      this.gameSessions.set(gameId, updatedGame);
    }
  }

  async saveGameState(gameId: number): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      const updatedGame = { 
        ...game, 
        isSaved: true
      };
      this.gameSessions.set(gameId, updatedGame);
    }
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      // للتجربة: إنشاء مستخدم وهمي للمعرّف 2
      if (id === 2) {
        return {
          id: 2,
          username: "user_test",
          password: "password_hash",
          name: "مستخدم تجريبي",
          email: "test@example.com",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [createdUser] = await db.insert(users).values(user).returning();
      return createdUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Game settings related methods
  async getGameSettings(): Promise<GameSettings | undefined> {
    try {
      const [settings] = await db.select().from(gameSettings);
      return settings;
    } catch (error) {
      console.error("Error getting game settings:", error);
      return undefined;
    }
  }

  async updateGameSettings(settings: UpdateGameSettings): Promise<GameSettings> {
    try {
      const [updatedSettings] = await db
        .update(gameSettings)
        .set({
          ...settings,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(gameSettings.id, 1))
        .returning();
      return updatedSettings;
    } catch (error) {
      console.error("Error updating game settings:", error);
      throw error;
    }
  }

  // Site settings related methods
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    try {
      const [settings] = await db.select().from(siteSettings);
      return settings;
    } catch (error) {
      console.error("Error getting site settings:", error);
      return undefined;
    }
  }

  async updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
    try {
      const [updatedSettings] = await db
        .update(siteSettings)
        .set({
          ...settings,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(siteSettings.id, 1))
        .returning();
      return updatedSettings;
    } catch (error) {
      console.error("Error updating site settings:", error);
      throw error;
    }
  }

  // Categories related methods
  async getCategories(): Promise<any[]> {
    try {
      const categoriesData = await db.select().from(categories);
      return categoriesData;
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  async getCategoryById(id: number): Promise<any | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error) {
      console.error("Error getting category by ID:", error);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      // عدم إضافة حقول التاريخ لأنها ستُضاف تلقائيًا بواسطة Drizzle
      const [createdCategory] = await db.insert(categories).values({
        name: category.name,
        icon: category.icon,
        imageUrl: category.imageUrl,
        isActive: category.isActive !== undefined ? category.isActive : true
      }).returning();
      return createdCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, category: UpdateCategory): Promise<Category> {
    try {
      // عدم تعديل حقل updatedAt لأنه سيُحدث تلقائياً بواسطة Drizzle
      const [updatedCategory] = await db
        .update(categories)
        .set({
          name: category.name,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isActive: category.isActive
        })
        .where(eq(categories.id, id))
        .returning();
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }

  // Subcategories related methods
  async getSubcategories(categoryId?: number): Promise<any[]> {
    try {
      if (categoryId) {
        return await db.select().from(subcategories).where(eq(subcategories.parentId, categoryId));
      }
      return await db.select().from(subcategories);
    } catch (error) {
      console.error("Error getting subcategories:", error);
      return [];
    }
  }

  async getSubcategoryById(id: number): Promise<any | undefined> {
    try {
      const [subcategory] = await db.select().from(subcategories).where(eq(subcategories.id, id));
      return subcategory;
    } catch (error) {
      console.error("Error getting subcategory by ID:", error);
      return undefined;
    }
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    try {
      // نتعامل مع الحقول ذات الصلة فقط ونترك Drizzle يتعامل مع حقول التاريخ
      const [createdSubcategory] = await db.insert(subcategories).values({
        name: subcategory.name,
        icon: subcategory.icon,
        parentId: subcategory.parentId,
        imageUrl: subcategory.imageUrl,
        isActive: subcategory.isActive !== undefined ? subcategory.isActive : true
      }).returning();
      return createdSubcategory;
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  }

  async updateSubcategory(id: number, subcategory: UpdateSubcategory): Promise<Subcategory> {
    try {
      const [updatedSubcategory] = await db
        .update(subcategories)
        .set({
          name: subcategory.name,
          icon: subcategory.icon,
          parentId: subcategory.parentId,
          imageUrl: subcategory.imageUrl,
          isActive: subcategory.isActive
        })
        .where(eq(subcategories.id, id))
        .returning();
      return updatedSubcategory;
    } catch (error) {
      console.error("Error updating subcategory:", error);
      throw error;
    }
  }

  async deleteSubcategory(id: number): Promise<void> {
    try {
      await db.delete(subcategories).where(eq(subcategories.id, id));
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      throw error;
    }
  }

  // Questions related methods
  async getQuestions(): Promise<any[]> {
    try {
      const questionsData = await db.select().from(questions);
      return questionsData;
    } catch (error) {
      console.error("Error getting questions:", error);
      return [];
    }
  }

  async getQuestionById(id: number): Promise<any | undefined> {
    try {
      const [question] = await db.select().from(questions).where(eq(questions.id, id));
      return question;
    } catch (error) {
      console.error("Error getting question by ID:", error);
      return undefined;
    }
  }

  async getQuestionsByCategory(categoryId: number, subcategoryId?: number): Promise<any[]> {
    try {
      let query = db.select().from(questions).where(eq(questions.categoryId, categoryId));
      if (subcategoryId) {
        query = query.where(eq(questions.subcategoryId, subcategoryId));
      }
      return await query;
    } catch (error) {
      console.error("Error getting questions by category:", error);
      return [];
    }
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    try {
      // نتعامل مع الحقول ذات الصلة فقط ونترك Drizzle يتعامل مع حقول التاريخ وحقل usageCount
      const [createdQuestion] = await db.insert(questions).values({
        text: question.text,
        answer: question.answer,
        categoryId: question.categoryId,
        subcategoryId: question.subcategoryId,
        difficulty: question.difficulty,
        imageUrl: question.imageUrl,
        videoUrl: question.videoUrl,
        isActive: question.isActive !== undefined ? question.isActive : true,
        tags: question.tags
      }).returning();
      return createdQuestion;
    } catch (error) {
      console.error("Error creating question:", error);
      throw error;
    }
  }

  async updateQuestion(id: number, question: UpdateQuestion): Promise<Question> {
    try {
      // تحديث الحقول المحددة فقط دون التدخل في حقول التاريخ
      const [updatedQuestion] = await db
        .update(questions)
        .set({
          text: question.text,
          answer: question.answer,
          categoryId: question.categoryId,
          subcategoryId: question.subcategoryId,
          difficulty: question.difficulty,
          imageUrl: question.imageUrl,
          videoUrl: question.videoUrl,
          isActive: question.isActive,
          tags: question.tags,
          usageCount: question.usageCount
        })
        .where(eq(questions.id, id))
        .returning();
      return updatedQuestion;
    } catch (error) {
      console.error("Error updating question:", error);
      throw error;
    }
  }

  async deleteQuestion(id: number): Promise<void> {
    try {
      await db.delete(questions).where(eq(questions.id, id));
    } catch (error) {
      console.error("Error deleting question:", error);
      throw error;
    }
  }

  // Game sessions related methods
  async createGameSession(userId: number, session: InsertGameSession): Promise<GameSession> {
    try {
      console.log("تم إنشاء جلسة لعبة جديدة:", session);
      
      // استخدام واجهة Drizzle مباشرة بدلاً من SQL
      const [gameSession] = await db
        .insert(gameSessions)
        .values({
          userId: userId,
          gameName: session.gameName,
          teams: session.teams,
          answerTimeFirst: session.answerTimeFirst,
          answerTimeSecond: session.answerTimeSecond,
          selectedCategories: session.selectedCategories,
          createdAt: new Date().toISOString()
        })
        .returning();
      
      console.log("تم حفظ جلسة اللعبة في قاعدة البيانات:", gameSession);
      
      // وضع أسئلة اللعبة في ذاكرة المستخدم لاستعادتها فيما بعد
      const gameWithQuestions = {
        ...gameSession,
        gameKey: `game_${gameSession.id}`,
      };
      
      return gameWithQuestions;
    } catch (error) {
      console.error("خطأ في إنشاء جلسة اللعبة:", error);
      
      // إذا كان هناك خطأ، نقوم بإنشاء لعبة بشكل مباشر في الذاكرة
      const tempGame: GameSession = {
        id: Math.floor(Math.random() * 1000) + 1, // رقم عشوائي للاختبار
        userId: userId,
        gameName: session.gameName,
        teams: session.teams,
        answerTimeFirst: session.answerTimeFirst,
        answerTimeSecond: session.answerTimeSecond,
        selectedCategories: session.selectedCategories,
        createdAt: new Date().toISOString()
      };
      
      console.log("تم إنشاء جلسة مؤقتة في الذاكرة:", tempGame);
      return tempGame;
    }
  }

  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    try {
      const sessions = await db.select().from(gameSessions).where(eq(gameSessions.userId, userId));
      return sessions;
    } catch (error) {
      console.error("Error getting user game sessions:", error);
      return [];
    }
  }

  async getGameSession(id: number): Promise<GameSession | undefined> {
    try {
      const [game] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
      return game;
    } catch (error) {
      console.error("Error getting game session:", error);
      return undefined;
    }
  }

  // Game play methods
  async getGameById(id: number): Promise<GameSession | undefined> {
    try {
      console.log(`محاولة جلب اللعبة برقم ${id} من قاعدة البيانات`);
      
      // استخدام استعلام SQL صريح للتأكد من عمل الاستعلام
      const result = await db.execute(
        sql`SELECT * FROM game_sessions WHERE id = ${id} LIMIT 1`
      );
      
      if (!result || !result.rows || result.rows.length === 0) {
        console.log(`لم يتم العثور على لعبة برقم ${id}`);
        return undefined;
      }
      
      const game = result.rows[0];
      console.log(`تم العثور على اللعبة:`, JSON.stringify(game, null, 2));
      return game as GameSession;
    } catch (error) {
      console.error("Error getting game by ID:", error);
      return undefined;
    }
  }

  async updateGameTeams(gameId: number, teams: any[]): Promise<void> {
    try {
      await db.update(gameSessions)
        .set({ teams: JSON.stringify(teams) })
        .where(eq(gameSessions.id, gameId));
    } catch (error) {
      console.error("Error updating game teams:", error);
      throw error;
    }
  }

  async updateGameCurrentTeam(gameId: number, teamIndex: number): Promise<void> {
    try {
      await db.update(gameSessions)
        .set({ currentTeam: teamIndex })
        .where(eq(gameSessions.id, gameId));
    } catch (error) {
      console.error("Error updating current team:", error);
      throw error;
    }
  }

  async updateGameQuestions(gameId: number, questions: any[]): Promise<void> {
    try {
      await db.update(gameSessions)
        .set({ questions: JSON.stringify(questions) })
        .where(eq(gameSessions.id, gameId));
    } catch (error) {
      console.error("Error updating game questions:", error);
      throw error;
    }
  }

  async updateGameViewedQuestions(gameId: number, viewedQuestionIds: any[]): Promise<void> {
    try {
      await db.update(gameSessions)
        .set({ viewedQuestions: JSON.stringify(viewedQuestionIds) })
        .where(eq(gameSessions.id, gameId));
    } catch (error) {
      console.error("Error updating viewed questions:", error);
      throw error;
    }
  }

  async endGame(gameId: number, winnerIndex: number): Promise<void> {
    try {
      await db.update(gameSessions)
        .set({ 
          isCompleted: true,
          winnerIndex: winnerIndex,
          completedAt: new Date().toISOString()
        })
        .where(eq(gameSessions.id, gameId));
    } catch (error) {
      console.error("Error ending game:", error);
      throw error;
    }
  }

  async saveGameState(gameId: number): Promise<void> {
    try {
      // حفظ آخر وقت تحديث للعبة
      await db.update(gameSessions)
        .set({ 
          lastUpdated: new Date().toISOString()
        })
        .where(eq(gameSessions.id, gameId));
    } catch (error) {
      console.error("Error saving game state:", error);
      throw error;
    }
  }
}

// استخدام التخزين المؤقت في الذاكرة حتى نتمكن من إصلاح مشاكل قاعدة البيانات
export const storage = new MemStorage();
