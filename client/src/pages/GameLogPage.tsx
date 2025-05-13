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
import { CalendarIcon, ArrowLeft, Users } from 'lucide-react';
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
  winningTeam: string | null;
  timestamp: string;
}

interface GameLog {
  id: string;
  name: string;
  categories: GameCategory[];
  createdAt: string;
  teams: GameTeam[];
  playCount: number;
  rounds: GameRound[];
}

export default function GameLogPage() {
  const [, params] = useRoute('/game-log/:id');
  const gameId = params?.id;
  const [gameLog, setGameLog] = useState<GameLog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGameLog = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        const response = await axios.get<GameLog>(`/api/game-log/${gameId}`);
        setGameLog(response.data);
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>جولات اللعبة</span>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-normal">
                    {gameLog.rounds.length} جولة
                  </Badge>
                </CardTitle>
                <CardDescription>سجل تفصيلي لجميع الجولات والأسئلة والإجابات الصحيحة</CardDescription>
              </CardHeader>
              <CardContent>
                {gameLog.rounds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الجولة</TableHead>
                          <TableHead className="text-right">الفئة</TableHead>
                          <TableHead className="text-right">السؤال</TableHead>
                          <TableHead className="text-right">الإجابة الصحيحة</TableHead>
                          <TableHead className="text-right">الفريق الفائز</TableHead>
                          <TableHead className="text-right">الوقت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameLog.rounds.map((round) => (
                          <TableRow key={round.id}>
                            <TableCell className="font-medium">{round.roundNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                <span className="mr-1">{round.category.icon}</span>
                                {round.category.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{round.question}</TableCell>
                            <TableCell>{round.correctAnswer}</TableCell>
                            <TableCell>
                              {round.winningTeam ? (
                                <span className="text-green-600 font-semibold">{round.winningTeam}</span>
                              ) : (
                                <span className="text-gray-500 text-sm">لا يوجد فائز</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatTimestamp(round.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    لا توجد جولات مسجلة لهذه اللعبة
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">معلومات اللعبة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">تاريخ الإنشاء:</span>
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
                    {new Date(gameLog.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">عدد مرات اللعب:</span>
                  <Badge variant="outline" className="font-normal">
                    {gameLog.playCount} مرة
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">عدد الفرق:</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-violet-500" />
                    {gameLog.teams.length} فريق
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 font-semibold block mb-2">الفئات:</span>
                  <div className="flex flex-wrap gap-1">
                    {gameLog.categories.map((category) => (
                      <Badge key={category.id} className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                        <span className="mr-1">{category.icon}</span>
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">نتائج الفرق</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gameLog.teams.map((team, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{team.name}</span>
                      <Badge className={`${
                        index === 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                        index === 1 ? 'bg-slate-100 text-slate-800 border-slate-200' : 
                        index === 2 ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                        'bg-gray-100 text-gray-800 border-gray-200'
                      } border hover:bg-opacity-80`}>
                        {team.score} نقطة
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}