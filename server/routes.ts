import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gameSessionSchema, updateGameSettingsSchema } from "@shared/schema";
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

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
