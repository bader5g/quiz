import { 
  users, 
  type User, 
  type InsertUser, 
  type GameSettings, 
  type UpdateGameSettings, 
  type GameSession, 
  type InsertGameSession,
  type SiteSettings,
  type UpdateSiteSettings
} from "@shared/schema";

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
  endGame(gameId: number, winnerIndex: number): Promise<void>;
  saveGameState(gameId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameSettings: GameSettings;
  private siteSettings: SiteSettings;
  private gameSessions: Map<number, GameSession>;
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
      const updatedGame = { ...game, teams };
      this.gameSessions.set(gameId, updatedGame);
    }
  }

  async updateGameCurrentTeam(gameId: number, teamIndex: number): Promise<void> {
    const game = await this.getGameSession(gameId);
    if (game) {
      const updatedGame = { ...game, currentTeamIndex: teamIndex };
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

export const storage = new MemStorage();
