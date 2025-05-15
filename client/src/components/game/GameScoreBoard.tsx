import React from 'react';
import { Award, ChevronDown, ChevronUp, Minus, Repeat, User, UserX } from 'lucide-react';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {teams.map((team, index) => {
          const isCurrentTeam = index === currentTeamIndex;
          
          return (
            <Card 
              key={index} 
              className={cn(
                "shadow-md transition-all duration-200 bg-white rounded-xl",
                isCurrentTeam ? "ring-2 ring-offset-2 ring-indigo-300" : ""
              )}
              style={{ 
                borderColor: team.color, 
                borderWidth: '2px'
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2" style={{ borderColor: team.color }}>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base truncate flex-1">{team.name}</span>
                  
                  {/* عرض النقاط مع أزرار الزيادة والنقصان */}
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-6 w-6 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => onUpdateScore(index, 1)}
                          >
                            <ChevronUp className="h-4 w-4" />
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
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-6 w-6 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => onUpdateScore(index, -1)}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>نقص نقطة واحدة</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardTitle>
              </CardHeader>
              
              {teams.length === 2 && (
                <CardFooter className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-2 justify-center w-full">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 rounded-full flex items-center gap-1 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Minus className="h-3 w-3 text-indigo-600" />
                            <span className="hidden sm:inline">خصم</span>
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
                            className="text-xs h-8 rounded-full flex items-center gap-1 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Repeat className="h-3 w-3 text-indigo-600" />
                            <span className="hidden sm:inline">عكس</span>
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
                            className="text-xs h-8 rounded-full flex items-center gap-1 border-indigo-200 hover:bg-indigo-50"
                          >
                            <UserX className="h-3 w-3 text-indigo-600" />
                            <span className="hidden sm:inline">تخطي</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>تخطي دور هذا الفريق</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}