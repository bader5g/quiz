import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarIcon, 
  ArrowLeft, 
  Users, 
  Eye, 
  Award, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';

interface GameCategory {
  id: number;
  name: string;
  icon: string;
}

interface GameTeam {
  name: string;
  score: number;
}

interface GameRound {
  id: string;
  roundNumber: number;
  category: GameCategory;
  question: string;
  correctAnswer: string;
  teamAnswered: string | null;
  isCorrect: boolean;
  points: number;
  timestamp: string;
}

interface GameSession {
  sessionId: string;
  createdAt: string;
  teams: GameTeam[];
  winningTeam: string | null;
  rounds: GameRound[];
}

interface GameLog {
  id: string;
  name: string;
  categories: GameCategory[];
  playCount: number;
  games: GameSession[];
}

// الواجهة الخلفية الحالية تستخدم هذا النموذج
interface LegacyGameLog {
  id: string;
  name: string;
  categories: GameCategory[];
  createdAt: string;
  teams: GameTeam[];
  playCount: number;
  rounds: {
    id: string;
    roundNumber: number;
    category: GameCategory;
    question: string;
    correctAnswer: string;
    winningTeam: string | null;
    timestamp: string;
  }[];
}

export default function GameLogPage() {
  const [, params] = useRoute('/game-log/:id');
  const gameId = params?.id;
  const [gameLog, setGameLog] = useState<GameLog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGameLog = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        const response = await axios.get<LegacyGameLog>(`/api/game-log/${gameId}`);
        const legacyData = response.data;
        
        // تحويل البيانات القادمة من الواجهة الخلفية إلى النموذج الجديد
        const adaptedData: GameLog = {
          id: legacyData.id,
          name: legacyData.name,
          categories: legacyData.categories || [],
          playCount: legacyData.playCount || 1,
          games: []
        };

        // إنشاء جلسة لعبة وحيدة استنادًا إلى البيانات الحالية
        if (legacyData.teams && legacyData.teams.length > 0) {
          // ترتيب الفرق حسب النقاط
          const sortedTeams = [...legacyData.teams].sort((a, b) => b.score - a.score);
          const winningTeam = sortedTeams[0].name;
          
          // تحويل بيانات الجولات
          const adaptedRounds: GameRound[] = (legacyData.rounds || []).map(round => ({
            id: round.id,
            roundNumber: round.roundNumber,
            category: round.category,
            question: round.question,
            correctAnswer: round.correctAnswer,
            teamAnswered: round.winningTeam,
            isCorrect: !!round.winningTeam,
            points: round.winningTeam ? 3 : 0, // افتراضي: 3 نقاط للإجابة الصحيحة
            timestamp: round.timestamp
          }));
          
          // إضافة الجلسة إلى القائمة
          adaptedData.games.push({
            sessionId: legacyData.id + "-session1",
            createdAt: legacyData.createdAt,
            teams: legacyData.teams,
            winningTeam: winningTeam,
            rounds: adaptedRounds
          });
        }
        
        setGameLog(adaptedData);
      } catch (err) {
        console.error('Error fetching game log:', err);
        setError('حدث خطأ أثناء تحميل سجل اللعبة');
        toast({
          title: "خطأ في التحميل",
          description: "تعذر تحميل سجل اللعبة",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGameLog();
  }, [gameId, toast]);

  const goBack = () => {
    window.history.back();
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'وقت غير صالح';
    }
  };
  
  const openSessionDetails = (session: GameSession) => {
    setSelectedSession(session);
    setModalOpen(true);
  };
  
  // مكون مودال تفاصيل جلسة اللعب
  const GameSessionDetailsModal = () => {
    if (!selectedSession) return null;
    
    return (
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl" dir="rtl" aria-describedby="game-details-description">
          <DialogHeader>
            <DialogTitle className="text-xl mb-2">تفاصيل اللعبة</DialogTitle>
            <p id="game-details-description" className="text-sm text-gray-500">
              تفاصيل جولات اللعبة والأسئلة والإجابات والنقاط
            </p>
            {selectedSession.winningTeam && (
              <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Award className="w-4 h-4 mr-1" />
                الفريق الفائز: {selectedSession.winningTeam}
              </div>
            )}
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {selectedSession.teams.map((team, idx) => (
                <Badge 
                  key={idx} 
                  className={`${
                    selectedSession.winningTeam === team.name 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {team.name}: {team.score} نقطة
                </Badge>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              <Clock className="w-4 h-4 inline mr-1" />
              {new Date(selectedSession.createdAt).toLocaleDateString('ar', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم السؤال</TableHead>
                  <TableHead className="text-right">السؤال</TableHead>
                  <TableHead className="text-right">الفريق الذي أجاب</TableHead>
                  <TableHead className="text-right">النتيجة</TableHead>
                  <TableHead className="text-right">النقاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSession.rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">{round.roundNumber}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="flex gap-1">
                        <span className="font-semibold">{round.category.icon}</span>
                        {round.question}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        الإجابة الصحيحة: {round.correctAnswer}
                      </div>
                    </TableCell>
                    <TableCell>{round.teamAnswered || 'لم يجب أحد'}</TableCell>
                    <TableCell>
                      {round.isCorrect ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> صحيحة
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" /> خاطئة
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {round.points > 0 ? `+${round.points}` : round.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setModalOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // حالة التحميل
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8" dir="rtl">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" className="mr-2" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 ml-1" />
              العودة
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card className="mb-2">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32 mb-2" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center border-b pb-3">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-28" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // حالة الخطأ
  if (error || !gameLog) {
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center" dir="rtl">
          <h1 className="text-3xl font-bold mb-4">سجل اللعبة</h1>
          <div className="bg-red-50 text-red-700 p-8 rounded-lg shadow max-w-3xl mx-auto">
            <p className="mb-4">{error || 'لم يتم العثور على معلومات اللعبة'}</p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={goBack} 
                variant="outline"
              >
                العودة
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // عرض سجل اللعبة
  return (
    <Layout>
      <div className="container mx-auto py-8" dir="rtl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 ml-1" />
            العودة
          </Button>
          <h1 className="text-2xl font-bold">سجل اللعبة: {gameLog.name}</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* معلومات اللعبة */}
          <Card className="mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>معلومات اللعبة</span>
                <Badge variant="outline" className="font-normal">
                  <span className="mr-1">{gameLog.playCount}</span>
                  مرة لعب
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {gameLog.categories.length > 0 ? (
                  gameLog.categories.map((category) => (
                    <Badge key={category.id} className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">لا توجد فئات</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* جدول مرات اللعب */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>سجل مرات اللعب</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameLog.games.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">الفريق الفائز</TableHead>
                        <TableHead className="text-right">الفرق المشاركة</TableHead>
                        <TableHead className="text-right">النتيجة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameLog.games.map((game, index) => {
                        // ترتيب الفرق حسب النقاط
                        const sortedTeams = [...game.teams].sort((a, b) => b.score - a.score);
                        
                        return (
                          <TableRow key={game.sessionId}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {game.winningTeam ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <Award className="w-3.5 h-3.5 mr-1" />
                                  {game.winningTeam}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-500">لا يوجد فائز</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {game.teams.map((team, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className={`${game.winningTeam === team.name ? 'border-green-500' : ''}`}
                                  >
                                    {team.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {sortedTeams.map((team, idx) => (
                                <div key={idx} className="whitespace-nowrap">
                                  {team.name}: <span className={game.winningTeam === team.name ? 'text-green-600 font-semibold' : ''}>{team.score}</span>
                                  {idx < sortedTeams.length - 1 && <span className="mx-1">|</span>}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>
                              {new Date(game.createdAt).toLocaleDateString('ar', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => openSessionDetails(game)}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                عرض التفاصيل
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  لا توجد جلسات لعب مسجلة
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* مودال تفاصيل جلسة اللعب */}
      <GameSessionDetailsModal />
    </Layout>
  );
}