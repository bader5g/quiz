import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
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
  defaultFirstAnswerTime: integer("default_first_answer_time").notNull().default(30),
  defaultSecondAnswerTime: integer("default_second_answer_time").notNull().default(15),
  allowedFirstAnswerTimes: jsonb("allowed_first_answer_times").notNull().default([15, 30, 45, 60]),
  allowedSecondAnswerTimes: jsonb("allowed_second_answer_times").notNull().default([10, 15, 20, 30]),
  modalTitle: text("modal_title").notNull().default("إعدادات اللعبة"),
  pageDescription: text("page_description").notNull().default("اختبر معلوماتك ونافس أصدقاءك في أجواء جماعية مشوقة!"),
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
  selectedCategories: jsonb("selected_categories").notNull(),
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
