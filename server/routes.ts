import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
