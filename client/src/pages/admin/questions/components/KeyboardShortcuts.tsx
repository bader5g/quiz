// Keyboard Shortcuts Component
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";

const KeyboardShortcuts: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard Shortcuts</CardTitle>
        <CardDescription>
          Available keyboard shortcuts for efficient management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Create New Question</span>
            <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + N</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Search</span>
            <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + F</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Save</span>
            <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + S</kbd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyboardShortcuts;
