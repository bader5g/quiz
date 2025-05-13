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
    
    // Initialize default game settings
    this.gameSettings = {
      id: 1,
      minCategories: 4,
      maxCategories: 8,
      minTeams: 2,
      maxTeams: 4,
      maxGameNameLength: 30,
      maxTeamNameLength: 20,
      defaultFirstAnswerTime: 30,
      defaultSecondAnswerTime: 15,
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
}

export const storage = new MemStorage();
