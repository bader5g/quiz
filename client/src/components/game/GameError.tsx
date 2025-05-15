import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface GameErrorProps {
  error: string;
  onBackToMyGames: () => void;
}

export function GameError({ error, onBackToMyGames }: GameErrorProps) {
  return (
    <div dir="rtl" className="p-8">
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <div className="mt-4 flex justify-center">
        <Button onClick={onBackToMyGames}>العودة إلى ألعابي</Button>
      </div>
    </div>
  );
}