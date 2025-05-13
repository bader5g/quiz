import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

// Type for leaderboard item
interface LeaderboardItem {
  id: number;
  username: string;
  level: string;
  stars: number;
  badge: string;
}

export default function LeaderboardModal() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!open) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get<LeaderboardItem[]>('/api/leaderboard');
        setLeaderboard(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('فشل في تحميل قائمة المتصدرين');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  // Function to get row background color based on position
  const getRowStyle = (position: number) => {
    switch (position) {
      case 0: return 'bg-amber-50';
      case 1: return 'bg-gray-50';
      case 2: return 'bg-amber-50/30';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50"
        >
          <Trophy size={16} className="text-amber-500" />
          <span>المتصدرين</span>
          <span className="text-lg">🏆</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center mb-4 flex items-center justify-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            <span>لوحة المتصدرين</span>
            <Trophy size={20} className="text-amber-500" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-hidden rounded-md border">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-right font-medium">المركز</th>
                  <th className="p-2 text-right font-medium">المستخدم</th>
                  <th className="p-2 text-right font-medium">المستوى</th>
                  <th className="p-2 text-right font-medium">النجوم</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`border-b hover:bg-muted/50 transition-colors ${getRowStyle(index)}`}
                  >
                    <td className="p-2 text-right">
                      <span className="font-bold">{index + 1}</span>
                      <span className="mr-1 text-lg">{item.badge}</span>
                    </td>
                    <td className="p-2 text-right font-medium">{item.username}</td>
                    <td className="p-2 text-right">{item.level}</td>
                    <td className="p-2 text-right font-medium">{item.stars}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}