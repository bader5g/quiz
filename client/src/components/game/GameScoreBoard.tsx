import React from 'react';
import { Minus, Plus, Repeat, User, UserX } from 'lucide-react';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
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
              <div className="flex flex-col md:flex-row">
                {/* رأس البطاقة - اسم الفريق */}
                <div 
                  className="py-2 px-4 text-center font-bold text-white flex items-center justify-center md:w-1/4 md:border-r"
                  style={{ backgroundColor: team.color }}
                >
                  <span className="text-sm md:text-base">{team.name}</span>
                </div>
                
                {/* محتوى البطاقة - النقاط وأزرار التحكم */}
                <div className="p-3 flex flex-row md:w-3/4 items-center justify-between gap-2">
                  {/* عرض النقاط مع أزرار الزيادة والنقصان */}
                  <div className="flex items-center gap-1 mx-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="p-0 h-7 w-7 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => onUpdateScore(index, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>زيادة نقطة واحدة</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Badge 
                      className="mx-1 px-4 py-1 text-lg" 
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
                            className="p-0 h-7 w-7 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => onUpdateScore(index, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>نقص نقطة واحدة</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* أزرار وسائل المساعدة */}
                  <div className="flex gap-1 justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 px-2 rounded-md flex items-center gap-1 border-indigo-100 hover:bg-indigo-50"
                          >
                            <Minus className="h-3 w-3 text-indigo-600" />
                            <span className="hidden md:inline text-xs">خصم</span>
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
                            className="text-xs h-7 px-2 rounded-md flex items-center gap-1 border-indigo-100 hover:bg-indigo-50"
                          >
                            <Repeat className="h-3 w-3 text-indigo-600" />
                            <span className="hidden md:inline text-xs">عكس</span>
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
                            className="text-xs h-7 px-2 rounded-md flex items-center gap-1 border-indigo-100 hover:bg-indigo-50"
                          >
                            <UserX className="h-3 w-3 text-indigo-600" />
                            <span className="hidden md:inline text-xs">تخطي</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>تخطي دور هذا الفريق</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}