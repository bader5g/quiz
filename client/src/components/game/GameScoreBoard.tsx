import React from 'react';
import { Award, Minus, Plus, Repeat, User, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface GameTeam {
  name: string;
  score: number;
  color: string;
}

interface GameScoreBoardProps {
  teams: GameTeam[];
  currentTeamIndex: number;
  onUpdateScore: (teamIndex: number, change: number) => void;
}

export function GameScoreBoard({ teams, currentTeamIndex, onUpdateScore }: GameScoreBoardProps) {
  return (
    <>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800">
        <Award className="h-6 w-6 text-indigo-600" />
        <span>النتائج الحالية</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {teams.map((team, index) => {
          const isCurrentTeam = index === currentTeamIndex;
          
          return (
            <Card 
              key={index} 
              className={cn(
                "shadow-sm transition-all duration-200 bg-white rounded-lg overflow-hidden",
                isCurrentTeam ? "ring-2 ring-offset-1 ring-indigo-400" : ""
              )}
              style={{ 
                borderColor: team.color, 
                borderWidth: '2px'
              }}
            >
              {/* رأس البطاقة - اسم الفريق */}
              <div 
                className="py-2 px-3 text-center border-b font-bold text-white text-sm"
                style={{ backgroundColor: team.color }}
              >
                {team.name}
              </div>
              
              {/* محتوى البطاقة - النقاط وأزرار التحكم */}
              <div className="p-3 flex flex-col gap-2">
                {/* عرض النقاط مع أزرار الزيادة والنقصان */}
                <div className="flex items-center justify-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="p-0 h-6 w-6 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => onUpdateScore(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>زيادة نقطة واحدة</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Badge 
                    className="mx-1 px-3 py-1 text-lg" 
                    style={{ backgroundColor: team.color }}
                  >
                    {team.score}
                  </Badge>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="p-0 h-6 w-6 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => onUpdateScore(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>نقص نقطة واحدة</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* أزرار وسائل المساعدة */}
                <div className="flex flex-wrap gap-1 justify-center w-full border-t pt-2 mt-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-1 rounded-md flex items-center gap-1 border-indigo-100 hover:bg-indigo-50"
                        >
                          <Minus className="h-3 w-3 text-indigo-600" />
                          <span className="text-xs">خصم</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>خصم نقاط من الفريق</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-1 rounded-md flex items-center gap-1 border-indigo-100 hover:bg-indigo-50"
                        >
                          <Repeat className="h-3 w-3 text-indigo-600" />
                          <span className="text-xs">عكس</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>عكس الدور إلى الفريق الآخر</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-1 rounded-md flex items-center gap-1 border-indigo-100 hover:bg-indigo-50"
                        >
                          <UserX className="h-3 w-3 text-indigo-600" />
                          <span className="text-xs">تخطي</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>تخطي دور هذا الفريق</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}