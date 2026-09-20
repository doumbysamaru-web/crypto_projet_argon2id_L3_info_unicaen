import { useCallback, useEffect, useRef, useState } from 'react';

/** Wall-clock time a full playthrough takes at 1x speed, regardless of step count. */
const BASE_DURATION_MS = 18000;

export function usePlayback(totalSteps: number) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setStepIndex((i) => Math.min(i, Math.max(0, totalSteps - 1)));
  }, [totalSteps]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const lastIndex = Math.max(1, totalSteps - 1);
    const startTime = performance.now();
    const startStep = stepIndex;
    const remainingSteps = lastIndex - startStep;
    const remainingDuration = remainingSteps <= 0
      ? 0
      : (BASE_DURATION_MS * (remainingSteps / lastIndex)) / speed;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = remainingDuration <= 0 ? 1 : Math.min(1, elapsed / remainingDuration);
      setStepIndex(Math.min(lastIndex, Math.round(startStep + progress * remainingSteps)));
      if (progress >= 1) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // Deliberately excludes stepIndex: this effect owns advancing it while playing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, totalSteps]);

  const play = useCallback(() => {
    if (totalSteps <= 1) return;
    setStepIndex((i) => (i >= totalSteps - 1 ? 0 : i));
    setIsPlaying(true);
  }, [totalSteps]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((i) => Math.min(totalSteps - 1, i + 1));
  }, [totalSteps]);

  const stepBack = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setStepIndex(0);
  }, []);

  const goTo = useCallback((index: number) => {
    setIsPlaying(false);
    setStepIndex(Math.max(0, Math.min(totalSteps - 1, index)));
  }, [totalSteps]);

  return {
    stepIndex, isPlaying, speed, setSpeed, play, pause, stepForward, stepBack, reset, goTo,
  };
}
