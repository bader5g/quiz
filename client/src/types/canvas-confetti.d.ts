declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface CreateTypes {
    canvas: HTMLCanvasElement;
    confetti: (options?: ConfettiOptions) => Promise<any>;
    reset: () => void;
  }

  function canvasConfetti(options?: ConfettiOptions): Promise<any>;
  
  namespace canvasConfetti {
    export function create(
      canvas: HTMLCanvasElement,
      options?: { resize?: boolean; useWorker?: boolean }
    ): CreateTypes;
    export function reset(): void;
  }

  export = canvasConfetti;
}