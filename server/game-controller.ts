import { Request, Response } from "express";
import { storage } from "./storage";
import { GameSession } from "@shared/schema";
import * as util from 'util'; // إضافة util للطباعة المتقدمة

function parseSelectedCategories(rawCategories: any): number[] {
  let selectedCategories: number[] = [];
  try {
    if (typeof rawCategories === 'string') {
      // دعم تنسيقات {1,2,3} أو [1,2,3] أو JSON
      const match = rawCategories.match(/^\{(.+)\}$/) || rawCategories.match(/^\[(.+)\]$/);
      if (match) {
        selectedCategories = match[1].split(',').map(x => Number(x.trim()));
      } else {
        selectedCategories = JSON.parse(rawCategories);
      }
    } else if (Array.isArray(rawCategories)) {
      selectedCategories = rawCategories.map(Number);
    } else if (rawCategories && typeof rawCategories === 'object') {
      selectedCategories = Object.values(rawCategories).filter(v => typeof v === 'number' || !isNaN(Number(v))).map(Number);
    }
    selectedCategories = selectedCategories.map((id: any) => Number(id)).filter((id: any) => !isNaN(id));
  } catch {
    selectedCategories = [];
  }
  return selectedCategories;
}

function getSelectedCategoriesCompat(game: any) {
  return game.selected_categories !== undefined
    ? game.selected_categories
    : game.selectedCategories;
}

export async function getGameDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }
    let teams = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch {
      teams = [];
    }
    console.log('selectedCategories (raw):', getSelectedCategoriesCompat(game));
    let selectedCategories: number[] = parseSelectedCategories(getSelectedCategoriesCompat(game));
    console.log('selectedCategories (parsed):', selectedCategories);
    console.log('selectedCategories (from DB):', game.selectedCategories, '=> parsed:', selectedCategories);
    const generatedQuestions = await generateGameQuestions(game, selectedCategories, teams);
    const answerTimes = [
      game.answerTimeFirst || 30,
      game.answerTimeSecond || 15,
    ];
    const categoriesWithDetails = await Promise.all(
      selectedCategories.map(async (catId: number) => {
        const cat = await storage.getCategoryById(catId);
        let isActive = true;
        let availableQuestions = 0;
        if (cat) {
          isActive = cat.isActive !== undefined ? cat.isActive : true;
          const questions = await storage.getQuestionsByCategory(catId);
          availableQuestions = Array.isArray(questions) ? questions.filter((q: any) => q.isActive !== false).length : 0;
        }
        return {
          id: catId,
          name: cat ? cat.name : await getCategoryName(catId),
          icon: cat ? cat.icon : await getCategoryIcon(catId),
          imageUrl: cat ? cat.imageUrl : undefined,
          isActive,
          availableQuestions,
        };
      })
    );
    const gameDetails = {
      id: game.id,
      name: game.gameName,
      teams: teams.map((team: any, index: number) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
      })),
      categories: categoriesWithDetails,
      questions: generatedQuestions,
      currentTeamIndex: 0,
      answerTimes,
    };
    res.status(200).json(gameDetails);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء محاولة جلب تفاصيل اللعبة" });
  }
}

export async function getQuestionDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const questionId = parseInt(req.params.questionId);
    // استخراج المعاملات من query parameters
    const requestedDifficulty = parseInt(req.query.difficulty as string) || 1;
    const requestedCategoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    const game = await storage.getGameById(gameId);
    console.log("game object in getQuestionDetails:", game, "requested difficulty:", requestedDifficulty, "requested categoryId:", requestedCategoryId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }
    // استخراج الفئات المختارة بنفس منطق موحد
    let selectedCategories: number[] = parseSelectedCategories(getSelectedCategoriesCompat(game));
    const targetCategoryId = requestedCategoryId || (selectedCategories.length > 0 ? selectedCategories[0] : 1);
    // الحصول على الأسئلة المعروضة مسبقاً لاستثنائها
    let excludedQuestionIds: number[] = [];
    try {
      if (game.viewedQuestions) {
        const viewedQuestionsArray = typeof game.viewedQuestions === 'string' ? 
          JSON.parse(game.viewedQuestions) : 
          (Array.isArray(game.viewedQuestions) ? game.viewedQuestions : []);
        excludedQuestionIds = viewedQuestionsArray.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
      }
    } catch (e) {
      console.error("Error parsing viewedQuestions:", e);
      excludedQuestionIds = [];
    }
    // جلب سؤال حقيقي من قاعدة البيانات
    const dbQuestion = await storage.getRandomQuestionByCategoryAndDifficulty(
      targetCategoryId, 
      requestedDifficulty, 
      excludedQuestionIds
    );
    if (!dbQuestion) {
      console.error(`No question found for category ${targetCategoryId}, difficulty ${requestedDifficulty}`);
      return res.status(404).json({ 
        error: "لا توجد أسئلة متاحة في هذه الفئة ومستوى الصعوبة المحدد. يرجى إضافة أسئلة من لوحة الإدارة أولاً." 
      });
    }
    // إنشاء بيانات السؤال الحقيقي
    const question = {
      id: dbQuestion.id,
      text: dbQuestion.text,
      answer: dbQuestion.answer,
      difficulty: dbQuestion.difficulty,
      categoryId: dbQuestion.categoryId,
      categoryName: await getCategoryName(dbQuestion.categoryId),
      categoryIcon: await getCategoryIcon(dbQuestion.categoryId),
      ...(dbQuestion.imageUrl && {
        mediaType: "image" as const,
        imageUrl: dbQuestion.imageUrl,
      }),
      ...(dbQuestion.videoUrl && {
        mediaType: "video" as const,
        videoUrl: dbQuestion.videoUrl,
      }),
    };
    // معالجة teams بشكل آمن
    let teams = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      console.error("Error parsing teams:", e);
      teams = [];
    }
    // جلب answerTimes بشكل صحيح
    const answerTimes = [
      game.answerTimeFirst,
      game.answerTimeSecond,
      game.answerTimeThird,
      game.answerTimeFourth,
    ].filter(Boolean);
    res.status(200).json({
      question,
      teams: teams.map((team: any, index: number) => ({
        id: index,
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
      })),
      firstAnswerTime: game.answerTimeFirst,
      secondAnswerTime: game.answerTimeSecond,
      answerTimes, // هنا ستجد المصفوفة الصحيحة
      gameId: game.id,
    });
  } catch (error) {
    console.error("Error fetching question details:", error);
    res.status(500).json({ error: "حدث خطأ أثناء محاولة جلب تفاصيل السؤال" });
  }
}

export async function markQuestionViewed(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { questionId, categoryId, difficulty } = req.body;

    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }    // تحليل البيانات المحفوظة
    let viewedQuestionsArray: string[] = [];
    try {
      if (game.viewedQuestions) {
        viewedQuestionsArray = typeof game.viewedQuestions === 'string' ? 
          JSON.parse(game.viewedQuestions) : 
          (Array.isArray(game.viewedQuestions) ? game.viewedQuestions : []);
      }
    } catch (e) {
      console.error("Error parsing viewedQuestions:", e);
      viewedQuestionsArray = [];
    }

    const viewedQuestionIds = new Set(viewedQuestionsArray);
    viewedQuestionIds.add(questionId.toString());

    const answeredQuestions = new Set(viewedQuestionsArray);
    answeredQuestions.add(`${categoryId}-${difficulty}-*-${questionId}`);

    // توحيد استخراج الفئات المختارة
    const selectedCategories = parseSelectedCategories(getSelectedCategoriesCompat(game));
    // توحيد استخراج الفرق
    let teams = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      teams = [];
    }

    const updatedGame = {
      ...game,
      viewedQuestionIds: Array.from(viewedQuestionIds),
      answeredQuestions: Array.from(answeredQuestions),
    };

    await storage.updateGameQuestions(
      gameId,
      await generateGameQuestions(updatedGame, selectedCategories, teams),
    );

    await storage.updateGameViewedQuestions(
      gameId,
      Array.from(viewedQuestionIds),
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking question as viewed:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث حالة السؤال" });
  }
}

export async function submitAnswer(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { questionId, teamIndex, categoryId, difficulty, isCorrect } =
      req.body;

    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    // معالجة teams بشكل آمن
    let teams = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      console.error("Error parsing teams:", e);
      teams = [];
    }

    if (
      !Array.isArray(teams) ||
      typeof teamIndex !== "number" ||
      teamIndex < 0 ||
      teamIndex >= teams.length
    ) {
      return res.status(400).json({ error: "مؤشر الفريق غير صالح" });
    }

    const pointsToAdd = typeof difficulty === "number" ? difficulty : 1;

    const updatedTeams = [...teams];
    if (isCorrect) {
      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        score: (updatedTeams[teamIndex].score || 0) + pointsToAdd,
      };
    }

    const questionKey = `${categoryId}-${difficulty}-${teamIndex}-${questionId}`;
      await storage.updateGameTeams(gameId, updatedTeams);

    res.status(200).json({ success: true, teams: updatedTeams });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ error: "حدث خطأ أثناء محاولة تسجيل الإجابة" });
  }
}

export async function endGame(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    // معالجة teams بشكل آمن
    let teams: any[] = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      console.error("Error parsing teams:", e);
      teams = [];
    }

    let winnerIndex = 0;
    let highestScore = 0;

    teams.forEach((team: any, index: number) => {
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

export async function getGameResults(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    // معالجة teams بشكل آمن
    let teams: any[] = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      console.error("Error parsing teams:", e);
      teams = [];
    }

    // معالجة selectedCategories بشكل موحد
    let selectedCategories: number[] = parseSelectedCategories(getSelectedCategoriesCompat(game));

    let winnerIndex = 0;
    let highestScore = 0;

    teams.forEach((team: any, index: number) => {
      if (team.score > highestScore) {
        highestScore = team.score;
        winnerIndex = index;
      }
    });

    // جلب معلومات الفئات من قاعدة البيانات
    const categoriesWithDetails = await Promise.all(
      selectedCategories.map(async (catId: number) => ({
        id: catId,
        name: await getCategoryName(catId),
        icon: await getCategoryIcon(catId),
      }))
    );

    const gameResult = {
      id: game.id,
      name: game.gameName,
      teams: teams.map((team: any, index: number) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
        isWinner: index === winnerIndex,
      })),
      categories: categoriesWithDetails,
      questions: await generateGameQuestions(game, selectedCategories, teams),
      date: new Date().toISOString(),
      winningTeam: teams[winnerIndex]?.name || "غير محدد",
    };

    res.status(200).json(gameResult);
  } catch (error) {
    console.error("Error fetching game results:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب نتائج اللعبة" });
  }
}

export async function saveGameState(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    await storage.saveGameState(gameId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving game state:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ حالة اللعبة" });
  }
}

export async function updateCurrentTeam(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { teamIndex } = req.body;

    if (teamIndex === undefined) {
      return res.status(400).json({ error: "يرجى تحديد مؤشر الفريق الحالي" });
    }

    await storage.updateGameCurrentTeam(gameId, teamIndex);
    res.sendStatus(200);
  } catch (error) {
    console.error("خطأ في تحديث الفريق الحالي:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث الفريق الحالي" });
  }
}

// دالة مساعدة لتوحيد منطق تحويل selectedCategories
async function generateGameQuestions(game: any, selectedCategories?: number[], teams?: any[]) {
  const questions = [];
  let idCounter = 1;
  // تهيئة مجموعات الأسئلة المجاب عليها والمعروضة
  let viewedQuestions = new Set<string>();
  try {
    // حاول تحليل الأسئلة المعروضة من البيانات المخزنة
    if (game.viewedQuestions) {
      if (typeof game.viewedQuestions === 'string') {
        viewedQuestions = new Set(JSON.parse(game.viewedQuestions));
      } else if (Array.isArray(game.viewedQuestions)) {
        viewedQuestions = new Set(game.viewedQuestions);
      }
    }
  } catch (e) {
    console.error("Error parsing viewedQuestions:", e);
    viewedQuestions = new Set();
  }
  // استخدام البيانات المُمررة كمعاملات أو تحليل البيانات الخام
  let parsedSelectedCategories: number[] = selectedCategories || [];
  let parsedTeams: any[] = teams || [];

  if (!selectedCategories) {
    parsedSelectedCategories = parseSelectedCategories(getSelectedCategoriesCompat(game));
  }

  if (!teams) {
    try {
      parsedTeams = typeof game.teams === 'string' ? 
        JSON.parse(game.teams) : 
        (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      console.error("Error parsing teams for questions:", e);
      parsedTeams = [];
    }
  }

  console.log(`Generating questions for ${parsedSelectedCategories.length} categories and ${parsedTeams.length} teams`);
    // إنشاء أسئلة لكل فئة ولكل فريق ولكل مستوى صعوبة مع جلب الأسئلة الحقيقية من قاعدة البيانات
  for (const categoryId of parsedSelectedCategories) {
    for (let teamIndex = 0; teamIndex < parsedTeams.length; teamIndex++) {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        const currentId = idCounter;
        const questionKey = `${categoryId}-${difficulty}-${teamIndex}`;
        const isViewed = viewedQuestions.has(questionKey) || 
                         viewedQuestions.has(currentId.toString()) || 
                         viewedQuestions.has(`${currentId}`);
        let realQuestion = null;
        try {
          realQuestion = await storage.getRandomQuestionByCategoryAndDifficulty(
            categoryId, 
            difficulty, 
            []
          );
        } catch (error) {
          console.error(`Error fetching question for category ${categoryId}, difficulty ${difficulty}:`, error);
        }
        questions.push({
          id: idCounter++,
          questionId: currentId,
          categoryId,
          teamIndex,
          difficulty,
          isAnswered: isViewed,
          realQuestion: realQuestion ? {
            id: realQuestion.id,
            text: realQuestion.text,
            answer: realQuestion.answer,
            imageUrl: realQuestion.imageUrl,
            videoUrl: realQuestion.videoUrl,
            tags: realQuestion.tags
          } : null
        });
      }
    }
  }
  return questions;
}

async function getCategoryName(categoryId: number): Promise<string> {
  try {
    const category = await storage.getCategoryById(categoryId);
    return category ? category.name : `فئة ${categoryId}`;
  } catch (error) {
    console.error(`Error getting category name for ID ${categoryId}:`, error);
    return `فئة ${categoryId}`;
  }
}

async function getCategoryIcon(categoryId: number): Promise<string> {
  try {
    const category = await storage.getCategoryById(categoryId);
    return category ? (category.icon || "📋") : "📋";
  } catch (error) {
    console.error(`Error getting category icon for ID ${categoryId}:`, error);
    return "📋";
  }
}

function getTeamColor(teamIndex: number): string {
  const teamColors = ["#2563EB", "#DC2626", "#16A34A", "#9333EA"];
  return teamColors[teamIndex % teamColors.length];
}
