import { pgTable, text, serial, integer, boolean, jsonb, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// الهيكل المحدث للمستخدمين في قاعدة البيانات
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  freeCards: integer("free_cards").default(5),
  paidCards: integer("paid_cards").default(0),
  gamesPlayed: integer("games_played").default(0),
  lastPlayedAt: timestamp("last_played_at"),
  stars: integer("stars").default(0),
  level: text("level").default("مبتدئ"),
  levelBadge: text("level_badge").default("🌟"),
  levelColor: text("level_color").default("#A9A9A9"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
});

// لا نحتاج حاليًا لتحديث بيانات المستخدم، لكن يمكن إضافته لاحقًا
export const updateUserSchema = createInsertSchema(users).partial().omit({
  id: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

// Game settings schema
export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  minCategories: integer("min_categories").notNull().default(4),
  maxCategories: integer("max_categories").notNull().default(8),
  minTeams: integer("min_teams").notNull().default(2),
  maxTeams: integer("max_teams").notNull().default(4),
  maxGameNameLength: integer("max_game_name_length").notNull().default(45),
  maxTeamNameLength: integer("max_team_name_length").notNull().default(45),
  
  // أوقات الإجابة الافتراضية
  defaultFirstAnswerTime: integer("default_first_answer_time").notNull().default(30),
  defaultSecondAnswerTime: integer("default_second_answer_time").notNull().default(15),
  
  // القيم المسموح بها لأوقات الإجابة
  allowedFirstAnswerTimes: jsonb("allowed_first_answer_times").notNull().default([15, 30, 45, 60]),
  allowedSecondAnswerTimes: jsonb("allowed_second_answer_times").notNull().default([10, 15, 20, 30]),
  
  // إعدادات أوقات الإجابة المرنة
  answerTimeOptions: jsonb("answer_time_options").notNull().default({
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
  }),
  
  // أوقات الإجابة حسب عدد الفرق (مبقى للتوافق)
  answerTimesFor2Teams: jsonb("answer_times_for_2_teams").notNull().default([15, 30, 45]),
  answerTimesFor3Teams: jsonb("answer_times_for_3_teams").notNull().default([20, 40, 60]),
  answerTimesFor4Teams: jsonb("answer_times_for_4_teams").notNull().default([30, 60, 90]),
  
  // إعدادات وسائل المساعدة
  helpToolsEnabled: boolean("help_tools_enabled").notNull().default(true),
  onlyEnabledForTwoTeams: boolean("only_enabled_for_two_teams").notNull().default(true),
  skipQuestionEnabled: boolean("skip_question_enabled").notNull().default(true),
  pointDeductionEnabled: boolean("point_deduction_enabled").notNull().default(true),
  turnReverseEnabled: boolean("turn_reverse_enabled").notNull().default(true),
  
  // إعدادات عامة أخرى
  maxSubUsers: integer("max_sub_users").notNull().default(5),
  modalTitle: text("modal_title").notNull().default("إعدادات اللعبة"),
  pageDescription: text("page_description").notNull().default("اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!"),
  minQuestionsPerCategory: integer("min_questions_per_category").notNull().default(5),
  
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertGameSettingsSchema = createInsertSchema(gameSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGameSettingsSchema = createInsertSchema(gameSettings).omit({
  id: true,
  createdAt: true,
}).partial();

export type GameSettings = typeof gameSettings.$inferSelect;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;
export type UpdateGameSettings = z.infer<typeof updateGameSettingsSchema>;

// Site branding settings schema
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url").default("/assets/jaweb-logo.png"),
  appName: text("app_name").notNull().default("جاوب"),
  faviconUrl: text("favicon_url").default("/favicon.ico"),
  modalStyle: text("modal_style").notNull().default("default"), // تحكم بشكل المودالات
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
}).partial();

export type SiteSettings = typeof siteSettings.$inferSelect;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;

// Game session schema
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameName: text("game_name").notNull(),
  teams: jsonb("teams").notNull(),
  answerTimeFirst: integer("answer_time_first").notNull(),
  answerTimeSecond: integer("answer_time_second").notNull(),
  answerTimeThird: integer("answer_time_third"),
  answerTimeFourth: integer("answer_time_fourth"),
  selectedCategories: jsonb("selected_categories").notNull(),
  currentTeam: integer("current_team").default(0),
  questions: jsonb("questions").default('[]'),
  viewedQuestions: jsonb("viewed_questions").default('[]'),
  isCompleted: boolean("is_completed").default(false),
  winnerIndex: integer("winner_index"),
  completedAt: text("completed_at"),
  lastUpdated: text("last_updated").default(new Date().toISOString()),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const gameSessionSchema = z.object({
  gameName: z.string().min(1),
  teams: z.array(z.object({
    name: z.string().min(1)
  })),
  answerTimeFirst: z.number().int().positive(),
  answerTimeSecond: z.number().int().positive(),
  selectedCategories: z.array(z.number().int().positive())
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof gameSessionSchema>;

// تعريف جدول باقات الكروت
export const cardPackages = pgTable("card_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  price: numeric("price", { precision: 10, scale: 3 }).notNull(),
  paidCards: integer("paid_cards").notNull(),
  freeCards: integer("free_cards"),
  isActive: boolean("is_active").default(true).notNull(),
  badge: varchar("badge", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCardPackageSchema = createInsertSchema(cardPackages).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateCardPackageSchema = createInsertSchema(cardPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type CardPackage = typeof cardPackages.$inferSelect;
export type InsertCardPackage = z.infer<typeof insertCardPackageSchema>;
export type UpdateCardPackage = z.infer<typeof updateCardPackageSchema>;

// تعريف جدول مستويات المستخدمين
export const userLevels = pgTable("user_levels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // اسم المستوى: مبتدئ، هاوٍ، محترف، خبير، أسطورة، ذهبي، بلاتيني، ماسي
  badge: varchar("badge", { length: 10 }).notNull(), // رمز المستوى: 🏅 🥉 🥈 🥇 💎
  color: varchar("color", { length: 20 }).notNull(), // لون المستوى: #FFD700, #E5E4E2, etc
  minStars: integer("min_stars").notNull(), // الحد الأدنى من النجوم لهذا المستوى
  maxStars: integer("max_stars").notNull(), // الحد الأقصى من النجوم لهذا المستوى
  rewards: jsonb("rewards").default({}), // المكافآت المحتملة لهذا المستوى
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserLevelSchema = createInsertSchema(userLevels).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateUserLevelSchema = createInsertSchema(userLevels).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial();

export type UserLevel = typeof userLevels.$inferSelect;
export type InsertUserLevel = z.infer<typeof insertUserLevelSchema>;
export type UpdateUserLevel = z.infer<typeof updateUserLevelSchema>;

// تعريف جدول نجوم المستخدمين
export const userStars = pgTable("user_stars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stars: integer("stars").notNull().default(0), // عدد النجوم الإجمالي
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(), // آخر مرة تم فيها حساب النجوم
});

export const insertUserStarsSchema = createInsertSchema(userStars).omit({ 
  id: true,
  lastCalculated: true 
});

export const updateUserStarsSchema = createInsertSchema(userStars).omit({
  id: true
}).partial();

export type UserStars = typeof userStars.$inferSelect;
export type InsertUserStars = z.infer<typeof insertUserStarsSchema>;
export type UpdateUserStars = z.infer<typeof updateUserStarsSchema>;

// نماذج الفئات والفئات الفرعية والأسئلة

// جدول الفئات
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default("2023-01-01T00:00:00.000Z"),
  updatedAt: text("updated_at").notNull().default("2023-01-01T00:00:00.000Z"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;

// جدول الفئات الفرعية
export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"), // الأيقونة ليست إجبارية الآن
  parentId: integer("parent_id").notNull().references(() => categories.id),
  imageUrl: text("image_url").notNull(), // الصورة إجبارية
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default("2023-01-01T00:00:00.000Z"),
  updatedAt: text("updated_at").notNull().default("2023-01-01T00:00:00.000Z"),
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type UpdateSubcategory = z.infer<typeof updateSubcategorySchema>;

// جدول الفئات الرئيسية الجديد (معرف نصي)
export const main_categories = pgTable("main_categories", {
  code: varchar("code", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 32 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true)
});

// جدول الفئات الفرعية الجديد (رقم متسلسل لكل فئة رئيسية)
export const subcategories_v2 = pgTable("subcategories_v2", {
  main_category_code: varchar("main_category_code", { length: 32 }).notNull(),
  subcategory_id: integer("subcategory_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 32 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true)
},
  (table) => ({
    pk: [table.main_category_code, table.subcategory_id]
  })
);

// جدول الأسئلة بالنظام الجديد
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  answer: text("answer").notNull(),
  main_category_code: varchar("main_category_code", { length: 32 }).notNull().references(() => main_categories.code),
  subcategory_id: integer("subcategory_id").notNull(),
  difficulty: integer("difficulty").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  isActive: boolean("is_active").default(true),
  tags: text("tags"),
  usageCount: integer("usage_count").default(0),
  createdAt: text("created_at").notNull().default("2023-01-01T00:00:00.000Z"),
  updatedAt: text("updated_at").notNull().default("2023-01-01T00:00:00.000Z"),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const updateQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;

// جدول الأسئلة المبسط للإدارة
export const questions_simple = pgTable("questions_simple", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(), // نص السؤال
  correctAnswer: text("correct_answer").notNull(), // الإجابة الصحيحة
  wrongAnswers: jsonb("wrong_answers").notNull(), // الإجابات الخاطئة (مصفوفة)
  categoryId: integer("category_id"), // معرف الفئة (اختياري)
  subcategoryId: integer("subcategory_id"), // معرف الفئة الفرعية (اختياري)
  difficulty: text("difficulty").notNull().default("medium"), // مستوى الصعوبة: easy, medium, hard
  points: integer("points").notNull().default(10), // النقاط المكتسبة
  isActive: boolean("is_active").notNull().default(true), // هل السؤال نشط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuestionSimpleSchema = createInsertSchema(questions_simple).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateQuestionSimpleSchema = createInsertSchema(questions_simple).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type QuestionSimple = typeof questions_simple.$inferSelect;
export type InsertQuestionSimple = z.infer<typeof insertQuestionSimpleSchema>;
export type UpdateQuestionSimple = z.infer<typeof updateQuestionSimpleSchema>;
