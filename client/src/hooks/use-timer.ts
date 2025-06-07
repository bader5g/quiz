import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";

interface UseTimerProps {
  initialTime: number;
  onTimeExpired: () => void;
  teamName?: string;
}

export function useTimer({
  initialTime,
  onTimeExpired,
  teamName,
}: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize or reset timer
  const startTimer = useCallback(() => {
    setTimeLeft(initialTime);
    setTimerRunning(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerRunning(false);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialTime, onTimeExpired]);

  // Reset timer with same time
  const resetTimer = useCallback(
    (showToast = false) => {
      setTimeLeft(initialTime);
      
      if (showToast && teamName) {
        toast({
          title: "تم تجديد الوقت",
          description: `تم إعادة ضبط المؤقت للفريق: ${teamName}`,
        });
      } else if (showToast) {
        toast({
          title: "تم تجديد الوقت",
          description: "تم تجديد المؤقت",
        });
      }

      setTimerRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setTimerRunning(false);
            onTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialTime, onTimeExpired, toast, teamName]
  );

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    timeLeft,
    timerRunning,
    startTimer,
    resetTimer,
    stopTimer,
  };
}
