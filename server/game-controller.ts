import { Request, Response } from "express";
import { storage } from "./storage";
import { GameSession } from "@shared/schema";

export async function getGameDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    console.log("Getting game details for ID:", gameId);
    
    const game = await storage.getGameById(gameId);
    console.log("Game data retrieved:", JSON.stringify(game, null, 2));

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    // تحويل البيانات المخزنة في قاعدة البيانات إلى الشكل المطلوب
    // التعامل مع البيانات المخزنة في حقول نصية JSON
    let teams = [];
    try {
      teams = typeof game.teams === 'string' ? JSON.parse(game.teams) : (Array.isArray(game.teams) ? game.teams : []);
    } catch (e) {
      console.error("Error parsing teams:", e);
      teams = [];
    }

    let selectedCategories = [];
    try {
      selectedCategories = typeof game.selectedCategories === 'string' ? 
        JSON.parse(game.selectedCategories) : 
        (Array.isArray(game.selectedCategories) ? game.selectedCategories : []);
    } catch (e) {
      console.error("Error parsing selectedCategories:", e);
      selectedCategories = [];
    }

    let questions = [];
    try {
      questions = typeof game.questions === 'string' ? 
        JSON.parse(game.questions) : 
        (Array.isArray(game.questions) ? game.questions : []);
    } catch (e) {
      console.error("Error parsing questions:", e);
      questions = [];
    }

    // جلب answerTimes بشكل صحيح
    const answerTimes = [
      game.answerTimeFirst || 30,
      game.answerTimeSecond || 15,
    ];

    const gameDetails = {
      id: game.id,
      name: game.gameName,
      teams: teams.map((team, index) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
      })),
      categories: selectedCategories.map((catId) => ({
        id: catId,
        name: getCategoryName(catId),
        icon: getCategoryIcon(catId),
      })),
      questions: questions.length > 0 ? questions : generateGameQuestions(game),
      currentTeamIndex: game.currentTeam || 0,
      answerTimes,
    };

    console.log("Sending game details:", JSON.stringify(gameDetails, null, 2));
    res.status(200).json(gameDetails);
  } catch (error) {
    console.error("Error fetching game details:", error);
    res.status(500).json({ error: "حدث خطأ أثناء محاولة جلب تفاصيل اللعبة" });
  }
}

export async function getQuestionDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const questionId = parseInt(req.params.questionId);

    const game = await storage.getGameById(gameId);
    console.log("game object in getQuestionDetails:", game);

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    const isImageQuestion = questionId % 3 === 1;
    const isVideoQuestion = questionId % 3 === 2;

    const question = {
      id: questionId,
      text: isImageQuestion
        ? `ما اسم هذا المعلم السياحي الشهير؟`
        : isVideoQuestion
          ? `ما اسم هذه الرقصة التقليدية؟`
          : `هذا هو السؤال رقم ${questionId} من الفئة ${getCategoryName(game.selectedCategories[0])}`,
      answer: isImageQuestion
        ? `برج إيفل`
        : isVideoQuestion
          ? `رقصة التنورة`
          : `هذه هي الإجابة للسؤال رقم ${questionId}`,
      difficulty: Math.ceil(Math.random() * 3) as 1 | 2 | 3,
      categoryId: game.selectedCategories[0],
      categoryName: getCategoryName(game.selectedCategories[0]),
      categoryIcon: getCategoryIcon(game.selectedCategories[0]),
      ...(isImageQuestion && {
        mediaType: "image" as const,
        imageUrl:
          "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?q=80&w=1000&auto=format&fit=crop",
      }),
      ...(isVideoQuestion && {
        mediaType: "video" as const,
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      }),
    };

    // جلب answerTimes بشكل صحيح
    const answerTimes =
      Array.isArray(game.answerTimes) && game.answerTimes.length > 0
        ? game.answerTimes
        : [
            game.answerTimeFirst,
            game.answerTimeSecond,
            game.answerTimeThird,
            game.answerTimeFourth,
          ].filter(Boolean);

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

    if (
      !Array.isArray(game.teams) ||
      typeof teamIndex !== "number" ||
      teamIndex < 0 ||
      teamIndex >= game.teams.length
    ) {
      return res.status(400).json({ error: "مؤشر الفريق غير صالح" });
    }

    const pointsToAdd = typeof difficulty === "number" ? difficulty : 1;

    const updatedTeams = [...game.teams];
    if (isCorrect) {
      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        score: (updatedTeams[teamIndex].score || 0) + pointsToAdd,
      };
    }

    const questionKey = `${categoryId}-${difficulty}-${teamIndex}-${questionId}`;
    const answeredQuestions = new Set(game.answeredQuestions || []);
    answeredQuestions.add(questionKey);

    const updatedGame = {
      ...game,
      answeredQuestions: Array.from(answeredQuestions),
      teams: updatedTeams,
    };

    await storage.updateGameTeams(gameId, updatedTeams);
    await storage.updateGameQuestions(
      gameId,
      generateGameQuestions(updatedGame),
    );

    const nextTeamIndex = (game.currentTeamIndex + 1) % game.teams.length;
    await storage.updateGameCurrentTeam(gameId, nextTeamIndex);

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

export async function getGameResults(req: Request, res: Response) {
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

function generateGameQuestions(game: any) {
  const questions = [];
  const answeredQuestions = new Set(game.answeredQuestions || []);
  const viewedQuestionIds = new Set(game.viewedQuestionIds || []);
  let idCounter = 1;

  for (const categoryId of game.selectedCategories) {
    for (let teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        const currentId = idCounter;

        const isAnsweredByKey = Array.from(answeredQuestions).some(
          (key: string) => {
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
          },
        );

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

function getCategoryName(categoryId: number): string {
  const categoryNames: { [key: number]: string } = {
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

function getCategoryIcon(categoryId: number): string {
  const categoryIcons: { [key: number]: string } = {
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

function getTeamColor(teamIndex: number): string {
  const teamColors = ["#2563EB", "#DC2626", "#16A34A", "#9333EA"];
  return teamColors[teamIndex % teamColors.length];
}
