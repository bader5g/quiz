import { 
  users, categories, subcategories, gameSettings, siteSettings, gameSessions,
  type User, 
  type InsertUser,
  type UpdateUser,
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
  type UpdateSubcategory
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, asc, and } from "drizzle-orm";
import {
  getCategoriesMem,
  getCategoryByIdMem,
  createCategoryMem,
  updateCategoryMem,
  deleteCategoryMem
} from './storage/categories';
import {
  getUserMem,
  getUserByUsernameMem,
  createUserMem,
  updateUserMem
} from './storage/users';
import {
  createGameSessionMem,
  getUserGameSessionsMem,
  getGameSessionMem,
  getGameByIdMem,
  updateGameTeamsMem,
  updateGameCurrentTeamMem,
  updateGameViewedQuestionsMem,
  updateGameQuestionsMem,
  endGameMem,
  saveGameStateMem
} from './storage/games';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  
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
  updateSubcategory(id: number, subcategory: any): Promise<any>;    deleteSubcategory(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameSettings: GameSettings;
  private siteSettings: SiteSettings;
  private gameSessions: Map<number, GameSession>;
  private categories: Map<number, any>;
  private subcategories: Map<number, any>;
  currentCategoryId: number = 100;
  currentSubcategoryId: number = 100;
  currentUserId: number = 10;
  currentSessionId: number = 10;  constructor() {
    this.users = new Map();
    this.gameSessions = new Map();
    this.categories = new Map();
    this.subcategories = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    
    // إضافة مستخدم افتراضي للاختبار
    this.users.set(1, {
      id: 1,
      username: "أحمد",
      password: "hashed_password", // في التطبيق الحقيقي ستكون كلمة المرور مشفرة
      name: "أحمد محمد",
      email: null,
      phone: null,
      avatarUrl: null,
      freeCards: 5,
      paidCards: 0,
      gamesPlayed: 0,
      lastPlayedAt: null,
      stars: 0,
      level: "مبتدئ",
      levelBadge: "🌟",
      levelColor: "#A9A9A9",
      createdAt: new Date(),
      updatedAt: new Date(),
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
      answerTimeThird: null,
      answerTimeFourth: null,
      selectedCategories: [12, 13, 31, 34], // فيزياء، أحياء، تاريخ، أدب
      currentTeam: 0,
      questions: [],
      viewedQuestions: [],
      isCompleted: false,
      winnerIndex: null,
      completedAt: null,
      lastUpdated: null,
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
      answerTimeThird: null,
      answerTimeFourth: null,
      selectedCategories: [41, 42, 43, 44], // برمجة، شبكات، ذكاء صناعي، تطبيقات
      currentTeam: 0,
      questions: [],
      viewedQuestions: [],
      isCompleted: false,
      winnerIndex: null,
      completedAt: null,
      lastUpdated: null,
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
      answerTimeThird: null,
      answerTimeFourth: null,
      selectedCategories: [21, 22, 23, 24], // جبر، هندسة، إحصاء، حساب
      currentTeam: 0,
      questions: [],
      viewedQuestions: [],
      isCompleted: false,
      winnerIndex: null,
      completedAt: null,
      lastUpdated: null,
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
      answerTimeOptions: {
        first: {
          default: 30,
          options: [60, 30, 15, 10]
        },
        second: {
          default: 15,
          options: [30, 15, 10, 5]
        },
        third: {
          default: 10,
          options: [20, 10, 5]
        },
        fourth: {
          default: 5,
          options: [10, 5, 3]
        }
      },
      answerTimesFor2Teams: [15, 30, 45],
      answerTimesFor3Teams: [20, 40, 60],
      answerTimesFor4Teams: [30, 60, 90],
      helpToolsEnabled: true,
      onlyEnabledForTwoTeams: true,
      skipQuestionEnabled: true,
      pointDeductionEnabled: true,
      turnReverseEnabled: true,
      maxSubUsers: 5,
      modalTitle: "إعدادات اللعبة",
      pageDescription: "اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!",
      minQuestionsPerCategory: 5,
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
    return getUserMem(this.users, id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return getUserByUsernameMem(this.users, username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    return createUserMem(this.users, { value: this.currentUserId }, insertUser);
  }
  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    return updateUserMem(this.users, id, userData);
  }

  // Game sessions & play methods
  async createGameSession(userId: number, session: InsertGameSession): Promise<GameSession> {
    return createGameSessionMem(this.gameSessions, { value: this.currentSessionId }, userId, session);
  }
  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    return getUserGameSessionsMem(this.gameSessions, userId);
  }
  async getGameSession(id: number): Promise<GameSession | undefined> {
    return getGameSessionMem(this.gameSessions, id);
  }
  async getGameById(id: number): Promise<GameSession | undefined> {
    return getGameByIdMem(this.gameSessions, id);
  }
  async updateGameTeams(gameId: number, teams: any[]): Promise<void> {
    return updateGameTeamsMem(this.gameSessions, gameId, teams);
  }
  async updateGameCurrentTeam(gameId: number, teamIndex: number): Promise<void> {
    return updateGameCurrentTeamMem(this.gameSessions, gameId, teamIndex);
  }
  async updateGameViewedQuestions(gameId: number, viewedQuestionIds: any[]): Promise<void> {
    return updateGameViewedQuestionsMem(this.gameSessions, gameId, viewedQuestionIds);
  }
  async updateGameQuestions(gameId: number, questions: any[]): Promise<void> {
    return updateGameQuestionsMem(this.gameSessions, gameId, questions);
  }
  async endGame(gameId: number, winnerIndex: number): Promise<void> {
    return endGameMem(this.gameSessions, gameId, winnerIndex);
  }
  async saveGameState(gameId: number): Promise<void> {
    return saveGameStateMem(this.gameSessions, gameId);
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

  // Categories management methods
  async getCategories(): Promise<any[]> {
    return getCategoriesMem(this.categories);
  }
  async getCategoryById(id: number): Promise<any | undefined> {
    return getCategoryByIdMem(this.categories, id);
  }
  async createCategory(category: any): Promise<any> {
    return createCategoryMem(this.categories, { value: this.currentCategoryId }, category);
  }
  async updateCategory(id: number, category: any): Promise<any> {
    return updateCategoryMem(this.categories, id, category);
  }
  async deleteCategory(id: number): Promise<void> {
    return deleteCategoryMem(this.categories, id);
  }

  // Subcategories management methods
  async getSubcategories(categoryId?: number): Promise<any[]> {
    if (categoryId) {
      return Array.from(this.subcategories.values()).filter((s: any) => s.parentId === categoryId);
    }
    return Array.from(this.subcategories.values());
  }
  async getSubcategoryById(id: number): Promise<any | undefined> {
    return this.subcategories.get(id);
  }
  async createSubcategory(subcategory: any): Promise<any> {
    const newSubcategory = { ...subcategory, id: this.currentSubcategoryId++ };
    this.subcategories.set(newSubcategory.id, newSubcategory);
    return newSubcategory;
  }
  async updateSubcategory(id: number, subcategory: any): Promise<any> {
    const existing = this.subcategories.get(id);
    if (existing) {
      const updated = { ...existing, ...subcategory };
      this.subcategories.set(id, updated);
      return updated;
    }
    throw new Error("Subcategory not found");
  }
  async deleteSubcategory(id: number): Promise<void> {    this.subcategories.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {}
  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    try {
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
  
  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
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
  // Game sessions related methods
  async createGameSession(userId: number, session: InsertGameSession): Promise<GameSession> {
    try {
      console.log("تم إنشاء جلسة لعبة جديدة:", session);
      console.log("selectedCategories being saved:", session.selectedCategories);
      
      // استخدام واجهة Drizzle مباشرة بدلاً من SQL
      const [gameSession] = await db
        .insert(gameSessions)
        .values({
          userId: userId,
          gameName: session.gameName,
          teams: session.teams,
          answerTimeFirst: session.answerTimeFirst,
          answerTimeSecond: session.answerTimeSecond,
          selectedCategories: session.selectedCategories, // يجب أن يحفظ في selected_categories تلقائياً
          createdAt: new Date().toISOString()
        })
        .returning();
      
      console.log("تم حفظ جلسة اللعبة في قاعدة البيانات:", gameSession);
      console.log("selectedCategories after save:", gameSession.selectedCategories);
      
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
        answerTimeThird: null,
        answerTimeFourth: null,
        selectedCategories: session.selectedCategories,
        currentTeam: 0,
        questions: [],
        viewedQuestions: [],
        isCompleted: false,
        winnerIndex: null,
        completedAt: null,
        lastUpdated: null,
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
    } catch (error) {      console.error("Error saving game state:", error);
      throw error;
    }
  }
}

// استخدام قاعدة البيانات للتخزين
export const storage = new DatabaseStorage();
