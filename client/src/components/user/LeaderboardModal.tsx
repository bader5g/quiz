import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface LeaderboardItem {
  id: number;
  username: string;
  level: string;
  stars: number;
  badge: string;
}

export default function LeaderboardModal() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="bg-purple-100 px-3 py-1 rounded-full cursor-pointer hover:bg-purple-200 transition-colors">
          <span className="text-purple-800 font-bold whitespace-nowrap flex items-center">
            <Trophy className="h-4 w-4 text-amber-500 mr-1.5" />
            المتصدرون
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-amber-500" />
            <span>قائمة المتصدرين</span>
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            // Skeleton loader
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((item, index) => (
                <div key={item.id} className="flex items-center p-2 rounded-md bg-gray-50 border">
                  <div className="flex-shrink-0 w-8 text-center font-semibold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-grow">
                    <span className="text-lg">{item.badge}</span>
                    <span className="font-medium truncate">{item.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="gap-1">
                      <span>⭐</span>
                      <span>{item.stars}</span>
                    </Badge>
                    <Badge 
                      className="text-xs" 
                      style={{ backgroundColor: getLevelColor(item.level) }}
                    >
                      {item.level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات متاحة حالياً
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get color based on level
function getLevelColor(level: string): string {
  const colors: {[key: string]: string} = {
    'مبتدئ': '#4caf50',
    'هاوٍ': '#2196f3',
    'محترف': '#9c27b0',
    'خبير': '#f44336',
    'أسطورة': '#ff9800'
  };
  
  return colors[level] || '#6b7280'; // Default gray color
}