import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { applyAnswer } from '@/lib/session';
import type { UserProgress } from '@/types/models';

const STORAGE_KEY = 'jezik.progress';

const EMPTY: UserProgress = {
  sessionCount: 0,
  exercises: {},
  completedLessonIds: [],
};

interface ProgressContextValue {
  progress: UserProgress;
  loading: boolean;
  startSession: () => number;
  recordAnswer: (exerciseId: string, correct: boolean, failedThisSession: boolean) => boolean;
  markLessonComplete: (lessonId: string) => void;
  reset: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(EMPTY);
  const [loading, setLoading] = useState(true);
  const latest = useRef(progress);
  latest.current = progress;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as UserProgress;
            setProgress({ ...EMPTY, ...parsed });
          } catch {
            setProgress(EMPTY);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: UserProgress) => {
    latest.current = next;
    setProgress(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const startSession = useCallback(() => {
    const next = { ...latest.current, sessionCount: latest.current.sessionCount + 1 };
    persist(next);
    return next.sessionCount;
  }, [persist]);

  const recordAnswer = useCallback(
    (exerciseId: string, correct: boolean, failedThisSession: boolean) => {
      const outcome = applyAnswer(latest.current, exerciseId, correct, failedThisSession);
      persist(outcome.progress);
      return outcome.requeue;
    },
    [persist],
  );

  const markLessonComplete = useCallback(
    (lessonId: string) => {
      if (latest.current.completedLessonIds.includes(lessonId)) return;
      persist({
        ...latest.current,
        completedLessonIds: [...latest.current.completedLessonIds, lessonId],
      });
    },
    [persist],
  );

  const reset = useCallback(async () => {
    persist(EMPTY);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [persist]);

  return (
    <ProgressContext.Provider
      value={{ progress, loading, startSession, recordAnswer, markLessonComplete, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
