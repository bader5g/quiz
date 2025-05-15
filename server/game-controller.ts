import { Request, Response } from 'express';
import { storage } from './storage';
import { GameSession } from '@shared/schema';

// جلب تفاصيل اللعبة
export async function getGameDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = await storage.getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'اللعبة غير موجودة' });
    }

    // تنظيم البيانات المطلوبة للواجهة
    const gameDetails = {
      id: game.id,
      name: game.gameName,
      teams: game.teams.map((team, index) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
      })),
      categories: game.selectedCategories.map(catId => ({
        id: catId,
        name: getCategoryName(catId),
        icon: getCategoryIcon(catId),
      })),
      questions: generateGameQuestions(game),
      currentTeamIndex: game.currentTeamIndex || 0,
    };

    res.status(200).json(gameDetails);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة جلب تفاصيل اللعبة' });
  }
}

// جلب تفاصيل السؤال
export async function getQuestionDetails(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const questionId = parseInt(req.params.questionId);
    
    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'اللعبة غير موجودة' });
    }

    // محاكاة جلب السؤال من قاعدة البيانات
    const question = {
      id: questionId,
      text: `من هو مؤلف كتاب "ألف ليلة وليلة"؟`,
      answer: `مجموعة من المؤلفين على مدى قرون عديدة`,
      difficulty: Math.ceil(Math.random() * 3) as 1 | 2 | 3,
      categoryId: game.selectedCategories[0],
      categoryName: getCategoryName(game.selectedCategories[0]),
      categoryIcon: getCategoryIcon(game.selectedCategories[0]),
      hints: [
        {
          text: "هذا العمل الأدبي تم تجميعه خلال العصر الذهبي للحضارة الإسلامية",
          type: "historical",
          pointReduction: 1
        },
        {
          text: "يتكون من مجموعة قصص متداخلة مرتبطة بالراوية الرئيسية شهرزاد",
          type: "cultural",
          pointReduction: 1
        },
        {
          text: "تمت ترجمته إلى العديد من اللغات وأثر في الأدب العالمي بشكل كبير",
          type: "linguistic",
          pointReduction: 2
        }
      ]
    };

    // إرجاع تفاصيل السؤال
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
    console.error('Error fetching question details:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة جلب تفاصيل السؤال' });
  }
}

// تسجيل إجابة
export async function submitAnswer(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { questionId, teamId, isCorrect, points } = req.body;
    
    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'اللعبة غير موجودة' });
    }

    // تحديث حالة السؤال وإضافة النقاط للفريق
    const updatedTeams = [...game.teams];
    if (isCorrect && teamId !== undefined) {
      updatedTeams[teamId] = {
        ...updatedTeams[teamId],
        score: (updatedTeams[teamId].score || 0) + points
      };
    }

    // حفظ التحديثات للعبة
    await storage.updateGameTeams(gameId, updatedTeams);

    // تحديث الدور للفريق التالي
    const nextTeamIndex = (game.currentTeamIndex + 1) % game.teams.length;
    await storage.updateGameCurrentTeam(gameId, nextTeamIndex);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة تسجيل الإجابة' });
  }
}

// إنهاء اللعبة
export async function endGame(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    
    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'اللعبة غير موجودة' });
    }

    // تحديد الفريق الفائز
    let winnerIndex = 0;
    let highestScore = 0;
    
    game.teams.forEach((team, index) => {
      if (team.score > highestScore) {
        highestScore = team.score;
        winnerIndex = index;
      }
    });

    // تحديث حالة اللعبة
    await storage.endGame(gameId, winnerIndex);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة إنهاء اللعبة' });
  }
}

// حفظ حالة اللعبة
export async function saveGameState(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    
    // تحديث حالة اللعبة
    await storage.saveGameState(gameId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving game state:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة حفظ حالة اللعبة' });
  }
}

// جلب نتائج اللعبة
export async function getGameResults(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    
    const game = await storage.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'اللعبة غير موجودة' });
    }

    // تحديد الفريق الفائز
    let winnerIndex = 0;
    let highestScore = 0;
    
    game.teams.forEach((team, index) => {
      if (team.score > highestScore) {
        highestScore = team.score;
        winnerIndex = index;
      }
    });

    // تنظيم البيانات المطلوبة للواجهة
    const gameResult = {
      id: game.id,
      name: game.gameName,
      teams: game.teams.map((team, index) => ({
        name: team.name,
        score: team.score || 0,
        color: getTeamColor(index),
        isWinner: index === winnerIndex,
      })),
      categories: game.selectedCategories.map(catId => ({
        id: catId,
        name: getCategoryName(catId),
        icon: getCategoryIcon(catId),
      })),
      questions: generateGameQuestionResults(game),
      date: new Date().toISOString(),
      winningTeam: game.teams[winnerIndex].name,
    };

    res.status(200).json(gameResult);
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة جلب نتائج اللعبة' });
  }
}

// وظائف مساعدة
// -------------

// الحصول على اسم الفئة
function getCategoryName(categoryId: number): string {
  // قائمة أسماء الفئات للتطوير فقط
  const categoryNames: { [key: number]: string } = {
    1: 'علوم',
    2: 'تاريخ',
    3: 'جغرافيا',
    4: 'رياضيات',
    5: 'فن وثقافة',
    6: 'رياضة',
    7: 'ترفيه',
    8: 'أدب',
    9: 'تقنية',
    10: 'دين',
    11: 'حيوانات',
    12: 'طعام',
    13: 'سينما',
    14: 'موسيقى',
  };
  
  return categoryNames[categoryId] || `فئة ${categoryId}`;
}

// الحصول على أيقونة الفئة
function getCategoryIcon(categoryId: number): string {
  // قائمة أيقونات الفئات للتطوير فقط
  const categoryIcons: { [key: number]: string } = {
    1: '🔬',
    2: '📜',
    3: '🌍',
    4: '🔢',
    5: '🎭',
    6: '⚽',
    7: '🎮',
    8: '📚',
    9: '💻',
    10: '☪️',
    11: '🐘',
    12: '🍔',
    13: '🎬',
    14: '🎵',
  };
  
  return categoryIcons[categoryId] || '📋';
}

// الحصول على لون الفريق
function getTeamColor(teamIndex: number): string {
  // ألوان الفرق
  const teamColors = [
    '#2563EB', // أزرق
    '#DC2626', // أحمر
    '#16A34A', // أخضر
    '#9333EA', // بنفسجي
  ];
  
  return teamColors[teamIndex % teamColors.length];
}

// إنشاء أسئلة اللعبة
function generateGameQuestions(game: any) {
  const questions = [];
  const questionIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"];
  let questionCounter = 1;
  
  // إنشاء 3 أسئلة لكل فريق لكل فئة
  for (let catIndex = 0; catIndex < game.selectedCategories.length; catIndex++) {
    const categoryId = game.selectedCategories[catIndex];
    
    for (let teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        const id = questionIds.shift() || `q${questionCounter++}`;
        questions.push({
          id: questionCounter,
          difficulty: difficulty as 1 | 2 | 3,
          teamIndex,
          categoryId,
          isAnswered: false,
          questionId: parseInt(id.substring(1))
        });
      }
    }
  }
  
  return questions;
}

// إنشاء نتائج أسئلة اللعبة
function generateGameQuestionResults(game: any) {
  const questions = [];
  const questionTexts = [
    "ما هي أكبر دولة في العالم من حيث المساحة؟",
    "من هو مخترع المصباح الكهربائي؟",
    "كم عدد أضلاع المسدس؟",
    "ما هي عاصمة اليابان؟",
    "من هو مؤلف كتاب الحرب والسلام؟",
    "ما هو العنصر الأكثر وفرة في القشرة الأرضية؟",
    "من هو أول رائد فضاء يمشي على سطح القمر؟",
    "ما هي أطول سلسلة جبال في العالم؟",
    "من هو مؤسس شركة مايكروسوفت؟"
  ];
  
  const questionAnswers = [
    "روسيا",
    "توماس إديسون",
    "ستة أضلاع",
    "طوكيو",
    "ليو تولستوي",
    "الأكسجين",
    "نيل أرمسترونج",
    "جبال الأنديز",
    "بيل غيتس"
  ];
  
  // إنشاء نتائج أسئلة عشوائية للعبة
  for (let i = 0; i < 9; i++) {
    const questionId = i + 1;
    const teamIndex = Math.floor(i / 3);
    const isCorrect = Math.random() > 0.3; // 70% احتمالية الإجابة الصحيحة
    
    questions.push({
      id: questionId,
      difficulty: Math.ceil(Math.random() * 3),
      categoryId: game.selectedCategories[questionId % game.selectedCategories.length],
      teamName: game.teams[teamIndex].name,
      teamColor: getTeamColor(teamIndex),
      question: questionTexts[i % questionTexts.length],
      answer: questionAnswers[i % questionAnswers.length],
      isCorrect,
      points: isCorrect ? Math.ceil(Math.random() * 3) : 0
    });
  }
  
  return questions;
}