import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import axios from 'axios';

interface GameSettings {
  minTeams: number;
  maxTeams: number;
  maxGameNameLength: number;
  maxTeamNameLength: number;
  defaultFirstAnswerTime: number;
  defaultSecondAnswerTime: number;
  modalTitle: string;
}

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
}

interface GameSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: CategoryChild[];
}

export function GameSettingsModal({
  open,
  onOpenChange,
  selectedCategories
}: GameSettingsModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [gameName, setGameName] = useState('لعبتي الجديدة');
  const [teamCount, setTeamCount] = useState('2');
  const [teamNames, setTeamNames] = useState<string[]>(['الفريق الأول', 'الفريق الثاني', 'الفريق الثالث', 'الفريق الرابع']);
  const [answerTimeFirst, setAnswerTimeFirst] = useState('30');
  const [answerTimeSecond, setAnswerTimeSecond] = useState('15');

  // Fetch game settings
  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try {
          const response = await axios.get('/api/game-settings');
          setSettings(response.data);
          setAnswerTimeFirst(response.data.defaultFirstAnswerTime.toString());
          setAnswerTimeSecond(response.data.defaultSecondAnswerTime.toString());
        } catch (error) {
          console.error('Error fetching game settings:', error);
          toast({
            title: "خطأ",
            description: "فشل في تحميل إعدادات اللعبة",
            variant: "destructive"
          });
        }
      };
      
      fetchSettings();
    }
  }, [open, toast]);

  // Handle form submission
  const handleStartGame = async () => {
    if (!settings) return;
    
    // Validate
    if (!gameName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للعبة",
        variant: "destructive"
      });
      return;
    }
    
    if (gameName.length > settings.maxGameNameLength) {
      toast({
        title: "خطأ",
        description: `يجب أن لا يتجاوز اسم اللعبة ${settings.maxGameNameLength} حرفاً`,
        variant: "destructive"
      });
      return;
    }
    
    const numTeams = parseInt(teamCount, 10);
    const teamList = [];
    
    for (let i = 0; i < numTeams; i++) {
      const name = teamNames[i]?.trim();
      if (!name) {
        toast({
          title: "خطأ",
          description: `يرجى إدخال اسم للفريق ${i + 1}`,
          variant: "destructive"
        });
        return;
      }
      
      if (name.length > settings.maxTeamNameLength) {
        toast({
          title: "خطأ",
          description: `يجب أن لا يتجاوز اسم الفريق ${settings.maxTeamNameLength} حرفاً`,
          variant: "destructive"
        });
        return;
      }
      
      teamList.push({ name });
    }
    
    const timeFirst = parseInt(answerTimeFirst, 10);
    if (isNaN(timeFirst) || timeFirst <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وقت صحيح للإجابة الأولى",
        variant: "destructive"
      });
      return;
    }
    
    const timeSecond = parseInt(answerTimeSecond, 10);
    if (isNaN(timeSecond) || timeSecond <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وقت صحيح للإجابة الثانية",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create game session
      const gameData = {
        gameName,
        teams: teamList,
        answerTimeFirst: timeFirst,
        answerTimeSecond: timeSecond,
        selectedCategories: selectedCategories.map(cat => cat.id)
      };
      
      const response = await axios.post('/api/game-sessions', gameData);
      
      // Store game session in localStorage for easy access
      localStorage.setItem('currentGameSession', JSON.stringify({
        id: response.data.id,
        ...gameData
      }));
      
      toast({
        title: "تم إنشاء اللعبة",
        description: "جاري الانتقال إلى صفحة اللعب"
      });
      
      // Navigate to the play page
      navigate('/play');
    } catch (error) {
      console.error('Error creating game session:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء اللعبة، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle team count change
  const handleTeamCountChange = (value: string) => {
    setTeamCount(value);
  };
  
  // Handle team name change
  const handleTeamNameChange = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };
  
  if (!settings) {
    return null;
  }
  
  const teamOptions = [];
  for (let i = settings.minTeams; i <= settings.maxTeams; i++) {
    teamOptions.push(
      <SelectItem key={i} value={i.toString()}>{i} فرق</SelectItem>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-4">
            {settings.modalTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Game Name */}
          <div className="space-y-2">
            <Label htmlFor="gameName">اسم اللعبة</Label>
            <Input
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="أدخل اسماً للعبة"
              maxLength={settings.maxGameNameLength}
            />
            <p className="text-xs text-muted-foreground">
              الحد الأقصى: {settings.maxGameNameLength} حرف
            </p>
          </div>
          
          {/* Team Count */}
          <div className="space-y-2">
            <Label htmlFor="teamCount">عدد الفرق</Label>
            <Select value={teamCount} onValueChange={handleTeamCountChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر عدد الفرق" />
              </SelectTrigger>
              <SelectContent>
                {teamOptions}
              </SelectContent>
            </Select>
          </div>
          
          {/* Team Names */}
          <div className="space-y-3">
            <Label>أسماء الفرق</Label>
            {Array.from({ length: parseInt(teamCount, 10) }).map((_, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`team-${index}`} className="text-sm">
                  الفريق {index + 1}
                </Label>
                <Input
                  id={`team-${index}`}
                  value={teamNames[index] || ''}
                  onChange={(e) => handleTeamNameChange(index, e.target.value)}
                  placeholder={`اسم الفريق ${index + 1}`}
                  maxLength={settings.maxTeamNameLength}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              الحد الأقصى لاسم الفريق: {settings.maxTeamNameLength} حرف
            </p>
          </div>
          
          {/* Answer Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="answerTimeFirst">وقت الإجابة الأولى (ثانية)</Label>
              <Input
                id="answerTimeFirst"
                type="number"
                value={answerTimeFirst}
                onChange={(e) => setAnswerTimeFirst(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answerTimeSecond">وقت الإجابة الثانية (ثانية)</Label>
              <Input
                id="answerTimeSecond"
                type="number"
                value={answerTimeSecond}
                onChange={(e) => setAnswerTimeSecond(e.target.value)}
                min="1"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            رجوع
          </Button>
          <Button
            onClick={handleStartGame}
            disabled={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'ابدأ اللعبة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}