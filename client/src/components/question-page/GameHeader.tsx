import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronRight } from "lucide-react";

interface GameHeaderProps {
  gameName?: string;
  logoUrl?: string;
  currentTeam?: {
    name: string;
    color: string;
  };
  onBackClick: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameName,
  logoUrl,
  currentTeam,
  onBackClick,
}) => {
  return (
    <header className="bg-white shadow-sm py-2 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-center font-semibold text-lg">
          {gameName || "جاوب"}
        </div>
        <div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="شعار الموقع"
              className="h-8 object-contain"
            />
          )}
        </div>
      </div>
      <div className="container mx-auto mt-2 flex justify-center">
        {currentTeam && (
          <Badge
            variant="outline"
            className="bg-white flex items-center gap-1 py-2 px-4 border-2"
            style={{ borderColor: currentTeam.color || "#ccc" }}
          >
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: currentTeam.color || "#ccc" }}
            />
            <span>الدور: {currentTeam.name || "غير محدد"}</span>
          </Badge>
        )}
      </div>
    </header>
  );
};
