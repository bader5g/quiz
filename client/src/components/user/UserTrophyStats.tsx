import { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface UserStats {
  trophies: number;
  medals: number;
  rank: number;
  stars: number;
  totalGames: number;
  winRate: number;
}

export default function UserTrophyStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axios.get<UserStats>('/api/user-stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-8 mb-3 rounded-full" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      icon: <Trophy className="h-7 w-7 text-amber-500" />,
      value: stats.trophies,
      label: 'كأس',
      bg: 'bg-amber-50',
    },
    {
      icon: <Medal className="h-7 w-7 text-blue-500" />,
      value: stats.medals,
      label: 'ميدالية',
      bg: 'bg-blue-50',
    },
    {
      icon: <Award className="h-7 w-7 text-purple-500" />,
      value: stats.rank,
      label: 'المركز',
      bg: 'bg-purple-50',
    },
    {
      icon: <Star className="h-7 w-7 text-yellow-500" />,
      value: stats.stars,
      label: 'نجمة',
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
      {statItems.map((item, index) => (
        <Card key={index} className={`${item.bg} border-none shadow-sm`}>
          <CardContent className="p-6">
            <div className="mb-3">{item.icon}</div>
            <div className="text-2xl font-bold mb-1">{item.value}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
