import { Request, Response } from "express";
import { storage } from "./storage";
import { GameSession } from "@shared/schema";

export async function getGameDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);

    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    const gameDetails = {
      id: game.id,
      name: game.gameName,
      teams: game.teams.map((team, index) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
      })),
      categories: game.selectedCategories.map((catId) => ({
        id: catId,
        name: getCategoryName(catId),
        icon: getCategoryIcon(catId),
      })),
      questions: generateGameQuestions(game),
      currentTeamIndex: game.currentTeamIndex || 0,
    };

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

export async function submitAnswer(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { questionId, teamId, categoryId, difficulty, isCorrect, points } = req.body;

    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "اللعبة غير موجودة" });
    }

    const updatedTeams = [...game.teams];
    if (isCorrect && teamId !== undefined) {
      updatedTeams[teamId] = {
        ...updatedTeams[teamId],
        score: (updatedTeams[teamId].score || 0) + points,
      };
    }

    // Formato correcto: categoría-dificultad-equipo-questionId
    const questionKey = `${categoryId}-${difficulty}-${teamId}-${questionId}`;
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

    res.status(200).json({ success: true });
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

function generateGameQuestions(game: any) {
  const questions = [];
  const answeredQuestions = game.answeredQuestions || [];
  let idCounter = 1;

  for (const categoryId of game.selectedCategories) {
    for (let teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        const currentId = idCounter;
        
        // Verificar si este tipo de pregunta ya ha sido respondida
        // Comprobamos todos los formatos posibles de las claves
        const isAnswered = answeredQuestions.some(key => {
          // Nueva forma (con questionId)
          const matchesNewFormat = key === `${categoryId}-${difficulty}-${teamIndex}-${currentId}`;
          
          // Formato antiguo (sin questionId)
          const matchesOldFormat = key === `${categoryId}-${difficulty}-${teamIndex}`;
          
          // Formato que coincide con categoría, dificultad y equipo, independiente del ID de pregunta
          const matchesPartial = key.startsWith(`${categoryId}-${difficulty}-${teamIndex}-`);
          
          return matchesNewFormat || matchesOldFormat || matchesPartial;
        });
        
        questions.push({
          id: idCounter++,
          questionId: currentId,
          categoryId,
          teamIndex,
          difficulty,
          isAnswered: isAnswered
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
