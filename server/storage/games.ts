// دوال إدارة جلسات الألعاب (games)
import { db } from '../db';
import { gameSessions } from '@shared/schema';

export async function createGameSession(userId: number, session: any) {
  // ... تنفيذ إنشاء جلسة لعبة ...
}

export async function getUserGameSessions(userId: number) {
  // ... تنفيذ جلب جميع جلسات المستخدم ...
}

export async function getGameSession(id: number) {
  // ... تنفيذ جلب جلسة لعبة واحدة ...
}

export async function getGameById(id: number) {
  // ... تنفيذ جلب تفاصيل لعبة ...
}

export async function updateGameTeams(gameId: number, teams: any[]) {
  // ... تنفيذ تحديث فرق اللعبة ...
}

export async function updateGameCurrentTeam(gameId: number, teamIndex: number) {
  // ... تنفيذ تحديث الفريق الحالي ...
}

export async function updateGameQuestions(gameId: number, questions: any[]) {
  // ... تنفيذ تحديث الأسئلة ...
}

export async function updateGameViewedQuestions(gameId: number, viewedQuestionIds: any[]) {
  // ... تنفيذ تحديث الأسئلة المعروضة ...
}

export async function endGame(gameId: number, winnerIndex: number) {
  // ... تنفيذ إنهاء اللعبة ...
}

export async function saveGameState(gameId: number) {
  // ... تنفيذ حفظ حالة اللعبة ...
}

// دوال إدارة الألعاب (game sessions) لنظام التخزين المؤقت
export function createGameSessionMem(gameSessionsMap: Map<number, any>, idRef: { value: number }, userId: number, session: any) {
  const id = idRef.value++;
  const newSession = {
    id,
    userId,
    gameName: session.gameName,
    teams: session.teams,
    answerTimeFirst: session.answerTimeFirst,
    answerTimeSecond: session.answerTimeSecond,
    answerTimeThird: null,
    answerTimeFourth: null,
    selectedCategories: session.selectedCategories,
    currentTeam: 0,
    questions: [],
    viewedQuestions: [],
    isCompleted: false,
    winnerIndex: null,
    completedAt: null,
    lastUpdated: null,
    createdAt: new Date().toISOString()
  };
  gameSessionsMap.set(id, newSession);
  return newSession;
}

export function getUserGameSessionsMem(gameSessionsMap: Map<number, any>, userId: number) {
  return Array.from(gameSessionsMap.values()).filter(session => session.userId === userId);
}

export function getGameSessionMem(gameSessionsMap: Map<number, any>, id: number) {
  return gameSessionsMap.get(id);
}

export function getGameByIdMem(gameSessionsMap: Map<number, any>, id: number) {
  return getGameSessionMem(gameSessionsMap, id);
}

export function updateGameTeamsMem(gameSessionsMap: Map<number, any>, gameId: number, teams: any[]) {
  const game = getGameSessionMem(gameSessionsMap, gameId);
  if (game) {
    const updatedGame = { ...game, teams: JSON.parse(JSON.stringify(teams)) };
    gameSessionsMap.set(gameId, updatedGame);
  }
}

export function updateGameCurrentTeamMem(gameSessionsMap: Map<number, any>, gameId: number, teamIndex: number) {
  const game = getGameSessionMem(gameSessionsMap, gameId);
  if (game) {
    const updatedGame = { ...game, currentTeamIndex: teamIndex };
    gameSessionsMap.set(gameId, updatedGame);
  }
}

export function updateGameQuestionsMem(gameSessionsMap: Map<number, any>, gameId: number, questions: any[]) {
  const game = getGameSessionMem(gameSessionsMap, gameId);
  if (game) {
    const currentViewedQuestions = Array.isArray(game.viewedQuestions) ? game.viewedQuestions : [];
    questions.forEach((q: any) => {
      if (q.isAnswered) {
        const questionKey = `${q.categoryId}-${q.difficulty}-${q.teamIndex}-${q.questionId}`;
        if (!currentViewedQuestions.some((aq: any) => aq === questionKey)) {
          currentViewedQuestions.push(questionKey);
        }
      }
    });
    const updatedGame = { ...game, viewedQuestions: currentViewedQuestions };
    gameSessionsMap.set(gameId, updatedGame);
  }
}

export function updateGameViewedQuestionsMem(gameSessionsMap: Map<number, any>, gameId: number, viewedQuestionIds: any[]) {
  const game = getGameSessionMem(gameSessionsMap, gameId);
  if (game) {
    const updatedGame = { ...game, viewedQuestionIds };
    gameSessionsMap.set(gameId, updatedGame);
  }
}

export function endGameMem(gameSessionsMap: Map<number, any>, gameId: number, winnerIndex: number) {
  const game = getGameSessionMem(gameSessionsMap, gameId);
  if (game) {
    const updatedGame = { ...game, isCompleted: true, winnerIndex };
    gameSessionsMap.set(gameId, updatedGame);
  }
}

export function saveGameStateMem(gameSessionsMap: Map<number, any>, gameId: number) {
  const game = getGameSessionMem(gameSessionsMap, gameId);
  if (game) {
    const updatedGame = { ...game, isSaved: true };
    gameSessionsMap.set(gameId, updatedGame);
  }
}
