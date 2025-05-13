import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import LeaderboardModal from './LeaderboardModal';
import UserStatus from './UserStatus';

export default function UserTrophyStats() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-center items-center gap-5 mb-6">
        <div className="w-full md:w-auto flex justify-center">
          <LeaderboardModal />
        </div>
        <UserStatus />
      </div>
    </div>
  );
}