import React from 'react';
import { DoorOpen, Flag, Gamepad2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GameHeaderProps {
  logoUrl?: string;
  appName?: string;
  gameName: string;
  currentTeam: {
    name: string;
    color: string;
  };
  onSaveAndExit: () => void;
  onEndGame: () => void;
  onSwitchTeam?: () => void; // وظيفة جديدة لتبديل الدور
}

export function GameHeader({ 
  logoUrl, 
  appName, 
  gameName, 
  currentTeam, 
  onSaveAndExit, 
  onEndGame,
  onSwitchTeam
}: GameHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-md">
      {/* الجزء الأيمن: الشعار والدور الحالي */}
      <div className="flex items-center gap-4">
        {logoUrl && (
          <div className="relative h-16 flex items-center">
            <img 
              src={logoUrl} 
              alt={appName || 'Game Logo'} 
              className="h-full object-contain"
            />
          </div>
        )}
        
        {/* الدور الحالي - بتصميم جديد مع زر تبديل الدور */}
        <div className="relative">
          <Badge 
            className="text-lg py-3 px-6 rounded-md shadow-md flex items-center gap-3 transition-colors duration-300 text-black border" 
            style={{ 
              backgroundColor: 'white',
              borderColor: currentTeam.color,
              borderWidth: '2px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            <Trophy className="h-6 w-6 text-gray-800" />
            <span className="font-extrabold">الدور الحالي: {currentTeam.name}</span>
            
            {/* زر تبديل الدور */}
            {onSwitchTeam && (
              <button 
                onClick={onSwitchTeam} 
                className="mr-2 p-1.5 rounded-full bg-white hover:bg-gray-100 transition-colors border border-gray-300 flex items-center justify-center"
                title="تبديل الدور للفريق التالي"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
            )}
          </Badge>
        </div>
      </div>

      {/* الجزء الأوسط: اسم اللعبة */}
      <div className="flex-grow flex justify-center items-center">
        <div className="animate-bounce">
          <Card className="border-2 border-indigo-200 max-w-xs shadow-md bg-gradient-to-r from-blue-500 to-sky-500">
            <CardContent className="py-2 px-4 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-white" />
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-100">
                {gameName}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* الجزء الأيسر: أزرار التحكم */}
      <div className="flex gap-3 items-center">
        <TooltipButton
          label="حفظ والخروج"
          description="حفظ حالة اللعبة والخروج"
          icon={<DoorOpen className="h-4 w-4 text-indigo-600" />}
          variant="outline"
          onClick={onSaveAndExit}
          className="border-2 border-indigo-200 shadow-md hover:bg-indigo-50 transition-colors"
        />
        
        <TooltipButton
          label="إنهاء اللعبة"
          description="إنهاء اللعبة واحتساب النتائج"
          icon={<Flag className="h-4 w-4" />}
          variant="destructive"
          onClick={onEndGame}
          className="bg-rose-600 hover:bg-rose-700 transition-colors"
        />
      </div>
    </div>
  );
}

interface TooltipButtonProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick: () => void;
  className?: string;
}

export function TooltipButton({ 
  label, 
  description, 
  icon, 
  variant = "default", 
  onClick, 
  className 
}: TooltipButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            onClick={onClick} 
            className={`flex items-center gap-2 rounded-lg shadow-md ${className || ''}`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}