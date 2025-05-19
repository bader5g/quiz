// إذا كنت تستخدم TypeScript أضف في الأعلى:
// import type { Request, Response } from "express";
import { storage } from "./storage";

// جلب تفاصيل اللعبة
export async function getGameDetails(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }
    
    // تجهيز البيانات بالتنسيق الذي تتوقعه واجهة المستخدم
    const teamColors = [
      "#FF5733", // أحمر برتقالي
      "#33A8FF", // أزرق
      "#33FF57", // أخضر
      "#D433FF", // أرجواني
      "#FFDA33", // أصفر
      "#FF33A8", // وردي
    ];
    
    // تنسيق الفرق بإضافة لون لكل فريق والنقاط إذا لم تكن موجودة
    const formattedTeams = Array.isArray(game.teams) 
      ? game.teams.map((team, index) => ({
          name: team.name,
          score: team.score || 0,
          color: teamColors[index % teamColors.length]
        }))
      : [];
    
    // تحويل فئات الأسئلة إلى تنسيق مناسب
    const formattedCategories = Array.isArray(game.selectedCategories) 
      ? game.selectedCategories.map(categoryId => ({
          id: categoryId,
          name: getCategoryName(categoryId),
          icon: getCategoryIcon(categoryId)
        }))
      : [];
    
    // إنشاء مصفوفة الأسئلة (فارغة مبدئياً)
    const formattedQuestions = [];
    
    // إعداد الاستجابة بالتنسيق المتوقع
    const formattedGame = {
      id: game.id,
      name: game.gameName,
      teams: formattedTeams,
      categories: formattedCategories,
      questions: formattedQuestions,
      currentTeamIndex: game.currentTeamIndex || 0,
      viewedQuestionIds: game.viewedQuestionIds || []
    };
    
    res.status(200).json(formattedGame);
  } catch (error) {
    console.error("Error getting game details:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب تفاصيل اللعبة" });
  }
}

// جلب تفاصيل السؤال
export async function getQuestionDetails(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    const questionId = parseInt(req.params.questionId);

    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    // منطق جلب السؤال (يمكنك تعديله حسب هيكل بياناتك)
    const isImageQuestion = false; // عدل حسب الحاجة
    const isVideoQuestion = false; // عدل حسب الحاجة

    const question = {
      id: questionId,
      text: "نص السؤال هنا",
      answer: "الإجابة الصحيحة هنا",
      difficulty: 1,
      categoryId: game.selectedCategories[0],
      categoryName: getCategoryName(game.selectedCategories[0]),
      categoryIcon: getCategoryIcon(game.selectedCategories[0]),
      ...(isImageQuestion && {
        mediaType: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?q=80&w=1000&auto=format&fit=crop",
      }),
      ...(isVideoQuestion && {
        mediaType: "video",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      }),
    };

    res.status(200).json({
      question,
      teams: game.teams.map((team, index) => ({
        id: index,
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
      })),
      firstAnswerTime: game.answerTimeFirst,
      secondAnswerTime: game.answerTimeSecond,
      gameId: game.id,
    });
  } catch (error) {
    console.error("Error fetching question details:", error);
    res.status(500).json({ error: "حدث خطأ أثناء محاولة جلب تفاصيل السؤال" });
  }
}

// تعيين السؤال كـ "تم عرضه"
export async function markQuestionViewed(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { questionId, categoryId, difficulty } = req.body;

    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    const viewedQuestionIds = new Set(game.viewedQuestionIds || []);
    viewedQuestionIds.add(questionId.toString());

    const answeredQuestions = new Set(game.answeredQuestions || []);
    answeredQuestions.add(`${categoryId}-${difficulty}-*-${questionId}`);

    const updatedGame = {
      ...game,
      viewedQuestionIds: Array.from(viewedQuestionIds),
      answeredQuestions: Array.from(answeredQuestions),
    };

    await storage.updateGameQuestions(
      gameId,
      generateGameQuestions(updatedGame),
    );
    await storage.updateGameViewedQuestions(
      gameId,
      Array.from(viewedQuestionIds),
    );

    console.log(
      `تم تعطيل السؤال رقم ${questionId} من الفئة ${categoryId} بصعوبة ${difficulty} - الأسئلة المعروضة: ${Array.from(viewedQuestionIds).join(",")}`,
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking question as viewed:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث حالة السؤال" });
  }
}

// دالة تسجيل الإجابة واحتساب النقاط (المعدلة)
export async function submitAnswer(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    // استخراج البيانات من الطلب
    const { questionId, teamIndex, difficulty, isCorrect } = req.body;
    console.log("بيانات الإجابة المستلمة:", req.body);

    // جلب بيانات اللعبة
    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    // التحقق من أن الفرق هي مصفوفة صالحة
    if (!Array.isArray(game.teams)) {
      console.error("خطأ: الفرق ليست مصفوفة", game.teams);
      return res.status(500).json({ error: "بنية اللعبة غير صالحة" });
    }

    // نسخة عميقة من فرق اللعبة لتجنب تعديل البيانات الأصلية
    const updatedTeams = JSON.parse(JSON.stringify(game.teams));
    
    // تحديد عدد النقاط المراد إضافتها (يساوي مستوى صعوبة السؤال)
    const pointsToAdd = typeof difficulty === "number" ? difficulty : 1;

    // إضافة النقاط للفريق المحدد إذا كانت الإجابة صحيحة
    if (isCorrect && typeof teamIndex === "number" && teamIndex >= 0 && teamIndex < updatedTeams.length) {
      // طباعة معلومات توضيحية
      console.log(`إضافة ${pointsToAdd} نقطة للفريق رقم ${teamIndex} (${updatedTeams[teamIndex].name})`);
      
      // التأكد من وجود قيمة أولية للنقاط
      if (typeof updatedTeams[teamIndex].score !== 'number') {
        updatedTeams[teamIndex].score = 0;
      }
      
      // إضافة النقاط
      updatedTeams[teamIndex].score += pointsToAdd;
      
      // طباعة النتيجة النهائية
      console.log(`نقاط الفريق ${updatedTeams[teamIndex].name} بعد الإضافة: ${updatedTeams[teamIndex].score}`);
    } else {
      console.log(`عدم إضافة نقاط - إجابة خاطئة أو بيانات غير صالحة`);
    }

    // تخزين معلومات السؤال المجاب
    const categoryId = req.body.categoryId || 0;
    const questionKey = `${categoryId}-${difficulty}-${teamIndex}-${questionId}`;
    
    try {
      // تحديث فرق اللعبة في قاعدة البيانات
      console.log("تحديث نقاط الفرق:", updatedTeams);
      await storage.updateGameTeams(gameId, updatedTeams);
      
      // محاولة تحديث سجل الأسئلة المجابة إذا كانت الوظيفة متوفرة
      try {
        const answeredQuestions = new Set(game.answeredQuestions || []);
        answeredQuestions.add(questionKey);
        
        if (typeof storage.updateGameQuestions === 'function') {
          await storage.updateGameQuestions(
            gameId,
            Array.from(answeredQuestions)
          );
        }
      } catch (questionError) {
        console.log("تحذير: لا يمكن تحديث سجل الأسئلة المجابة", questionError);
        // استمرار التنفيذ رغم الخطأ
      }
      
      // إرجاع استجابة نجاح مع الفرق المحدثة لتحديث واجهة المستخدم مباشرة
      res.status(200).json({ 
        success: true,
        teams: updatedTeams,
        message: isCorrect ? `تم إضافة ${pointsToAdd} نقطة للفريق ${teamIndex}` : "لم تتم إضافة نقاط"
      });
      
    } catch (storageError) {
      console.error("خطأ في تحديث بيانات اللعبة:", storageError);
      res.status(500).json({ error: "حدث خطأ أثناء حفظ النقاط" });
    }
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ error: "حدث خطأ أثناء محاولة تسجيل الإجابة" });
  }
}

// إنهاء اللعبة
export async function endGame(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    let winnerIndex = 0;
    let highestScore = 0;

    game.teams.forEach((team, index) => {
      if (team.score > highestScore) {
        highestScore = team.score;
        winnerIndex = index;
      }
    });

    await storage.endGame(gameId, winnerIndex);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error ending game:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إنهاء اللعبة" });
  }
}

// جلب نتائج اللعبة
export async function getGameResults(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    let winnerIndex = 0;
    let highestScore = 0;

    game.teams.forEach((team, index) => {
      if (team.score > highestScore) {
        highestScore = team.score;
        winnerIndex = index;
      }
    });

    const gameResult = {
      id: game.id,
      name: game.gameName,
      teams: game.teams.map((team, index) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
        isWinner: index === winnerIndex,
      })),
      categories: game.selectedCategories.map((catId) => ({
        id: catId,
        name: getCategoryName(catId),
        icon: getCategoryIcon(catId),
      })),
      questions: generateGameQuestions(game),
      date: new Date().toISOString(),
      winningTeam: game.teams[winnerIndex].name,
    };

    res.status(200).json(gameResult);
  } catch (error) {
    console.error("Error fetching game results:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب نتائج اللعبة" });
  }
}

// حفظ حالة اللعبة
export async function saveGameState(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    await storage.saveGameState(gameId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving game state:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ حالة اللعبة" });
  }
}

// تحديث الفريق الحالي في اللعبة
export async function updateCurrentTeam(req, res) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { teamIndex } = req.body;

    if (teamIndex === undefined) {
      return res.status(400).json({ error: "يرجى تحديد مؤشر الفريق الحالي" });
    }

    await storage.updateGameCurrentTeam(gameId, teamIndex);
    console.log(
      `تم تحديث الفريق الحالي للعبة ${gameId} إلى الفريق رقم ${teamIndex}`,
    );
    res.sendStatus(200);
  } catch (error) {
    console.error("خطأ في تحديث الفريق الحالي:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث الفريق الحالي" });
  }
}

// دوال مساعدة (يمكنك نقلها لملف آخر إذا أردت)
function generateGameQuestions(game) {
  const questions = [];
  const answeredQuestions = new Set(game.answeredQuestions || []);
  const viewedQuestionIds = new Set(game.viewedQuestionIds || []);
  let idCounter = 1;

  for (const categoryId of game.selectedCategories) {
    for (let teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        const currentId = idCounter;

        const isAnsweredByKey = Array.from(answeredQuestions).some((key) => {
          const matchesNewFormat =
            key === `${categoryId}-${difficulty}-${teamIndex}-${currentId}`;
          const matchesOldFormat =
            key === `${categoryId}-${difficulty}-${teamIndex}`;
          const matchesWildcard =
            key === `${categoryId}-*-${teamIndex}-${currentId}`;
          const matchesPartial = key.startsWith(
            `${categoryId}-${difficulty}-${teamIndex}`,
          );
          return (
            matchesNewFormat ||
            matchesOldFormat ||
            matchesWildcard ||
            matchesPartial
          );
        });

        const isViewedQuestion = viewedQuestionIds.has(currentId.toString());

        questions.push({
          id: idCounter++,
          questionId: currentId,
          categoryId,
          teamIndex,
          difficulty,
          isAnswered: isAnsweredByKey || isViewedQuestion,
        });
      }
    }
  }

  return questions;
}

function getCategoryName(categoryId) {
  const categoryNames = {
    1: "علوم",
    2: "تاريخ",
    3: "جغرافيا",
    4: "رياضيات",
    5: "فن وثقافة",
    6: "رياضة",
    7: "ترفيه",
    8: "أدب",
    9: "تقنية",
    10: "دين",
    11: "حيوانات",
    12: "طعام",
    13: "سينما",
    14: "موسيقى",
    21: "تاريخ",
    22: "جغرافيا",
    23: "حيوانات",
    24: "طعام",
    33: "علوم",
  };
  return categoryNames[categoryId] || `فئة ${categoryId}`;
}

function getCategoryIcon(categoryId) {
  const categoryIcons = {
    1: "🔬",
    2: "📜",
    3: "🌍",
    4: "🔢",
    5: "🎭",
    6: "⚽",
    7: "🎮",
    8: "📚",
    9: "💻",
    10: "☪️",
    11: "🐘",
    12: "🍔",
    13: "🎬",
    14: "🎵",
    21: "📜",
    22: "🌍",
    23: "🐘",
    24: "🍔",
    33: "🔬",
  };
  return categoryIcons[categoryId] || "📋";
}

function getTeamColor(teamIndex) {
  const teamColors = ["#2563EB", "#DC2626", "#16A34A", "#9333EA"];
  return teamColors[teamIndex % teamColors.length];
}
