import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.DATABASE_URL || "jaweb-session-secret", // استخدام DATABASE_URL كسر للجلسة بشكل مؤقت
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'user_sessions'
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // تسجيل المستخدم
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // تسجيل الدخول
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      try {
        // استدعاء بيانات المستخدم الإضافية من قاعدة البيانات
        const userId = user.id;
        
        // جلب ألعاب المستخدم للحصول على آخر لعبة وإجمالي الألعاب
        const userGames = await storage.getUserGameSessions(userId);
        const gamesPlayed = userGames.length;
        const lastPlayed = gamesPlayed > 0 ? userGames[0].createdAt : null;
        
        // إنشاء كائن بيانات المستخدم المتكامل
        const fullUserData = {
          ...user,
          gameStats: {
            gamesPlayed,
            lastPlayed
          },
          // تحديث البيانات الافتراضية إذا كانت موجودة في الكائن الأصلي
          freeCards: user.freeCards || 5,
          paidCards: user.paidCards || 0,
          stars: user.stars || 0,
          level: user.level || "مبتدئ",
          levelBadge: user.levelBadge || "🌟",
          levelColor: user.levelColor || "#A9A9A9"
        };
        
        req.login(user, (err) => {
          if (err) return next(err);
          // إرجاع البيانات المتكاملة للمستخدم
          return res.json(fullUserData);
        });
      } catch (error) {
        console.error("خطأ في الحصول على بيانات المستخدم الكاملة:", error);
        req.login(user, (err) => {
          if (err) return next(err);
          // في حالة حدوث خطأ، إرجاع بيانات المستخدم الأساسية
          return res.json(user);
        });
      }
    })(req, res, next);
  });

  // تسجيل الخروج
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  // الحصول على بيانات المستخدم الحالي
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    
    try {
      const userId = req.user.id;

      // جلب ألعاب المستخدم للحصول على آخر لعبة وإجمالي الألعاب
      const userGames = await storage.getUserGameSessions(userId);
      const gamesPlayed = userGames.length;
      const lastPlayed = gamesPlayed > 0 ? userGames[0].createdAt : null;
      
      // المستخدمون المرتبطون (يمكن إضافة منطق خاص بهم)
      // هنا نفترض أن هناك منطق آخر لجلب المستخدمين المرتبطين
      const linkedUsers = [];
      
      // إنشاء كائن بيانات المستخدم المتكامل
      const fullUserData = {
        ...req.user,
        gameStats: {
          gamesPlayed,
          lastPlayed,
          totalGames: gamesPlayed,
          lastGameDate: lastPlayed
        },
        // استخدام القيم الموجودة أو القيم الافتراضية
        freeCards: req.user.freeCards || 5,
        paidCards: req.user.paidCards || 0,
        totalCards: (req.user.freeCards || 5) + (req.user.paidCards || 0),
        stars: req.user.stars || 0,
        level: req.user.level || "مبتدئ",
        levelBadge: req.user.levelBadge || "🌟",
        levelColor: req.user.levelColor || "#A9A9A9",
        linkedUsers
      };
      
      res.json(fullUserData);
    } catch (error) {
      console.error("خطأ في جلب بيانات المستخدم الكاملة:", error);
      // في حالة الخطأ، قم بإعادة بيانات المستخدم الأساسية
      res.json(req.user);
    }
  });
}