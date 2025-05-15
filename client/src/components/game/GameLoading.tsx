import React from 'react';
import { Loader2 } from 'lucide-react';

export function GameLoading() {
  return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
    </div>
  );
}