import React from 'react';
import { cn } from "../../lib/utils";

interface BarLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  height?: number;
  color?: string;
}

export const BarLoader = React.forwardRef<HTMLDivElement, BarLoaderProps>(
  ({ className, progress, height = 4, color = '#3b82f6', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full bg-gray-200 rounded-full overflow-hidden', className)}
      style={{ height: `${height}px` }}
      {...props}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, backgroundColor: color }}
      ></div>
    </div>
  )
);

BarLoader.displayName = 'BarLoader';
