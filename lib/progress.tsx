import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';
import { applyAnswer } from '@/lib/session';
import * as sync from '@/lib/sync';
import type { UserProgress } from '@/types/models';

const STORAGE_KEY = 'jezik.progress';

const EMPTY: UserProgress = {
  sessionCount: 0,
  exercises: {},
  completedLessonIds: [],
};

interface StartSessionResult {
  sessionCount: number;
  sessionId: string;
}

interface ProgressContextValue {
  progress: UserProgress;
  loading: boolean;
  startSession: (lessonId: string) => StartSessionResult;
  endSession: () => void;
  recordAnswer: (exerciseId: string, correct: boolean, failedThisSession: boolean) => boolean;
  markLessonComplete: (lessonId: string) => void;
  reset: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function newUuid(): string {
  // Web + modern RN Hermes both have this. Native is out of scope for this cut.
  return globalThis.crypto.randomUUID();
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [progress, setProgress] = useState<UserProgress>(EMPTY);
  const [loading, setLoading] = useState(true);
  const latest = useRef(progress);
  latest.current = progress;

  // Current in-flight session id (null between lessons). Also mirrored to a ref so
  // recordAnswer can reach it without a re-render dependency.
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = currentSessionId;

  // Guards repeated server pulls on the same auth identity.
  const hydratedFor = useRef<string | null>(null);

  // 1. Hydrate local from AsyncStorage on mount (cheap, synchronous UX).
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            setProgress({ ...EMPTY, ...(JSON.parse(raw) as UserProgress) });
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

  // 2. On auth change: pull from server (replaces local), or clear on sign-out.
  useEffect(() => {
    if (userId && hydratedFor.current !== userId) {
      hydratedFor.current = userId;
      sync
        .pullProgress(userId)
        .then((server) => {
          latest.current = server;
          setProgress(server);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(server)).catch(() => {});
        })
        .catch(() => {});
    } else if (!userId && hydratedFor.current != null) {
      hydratedFor.current = null;
      latest.current = EMPTY;
      setProgress(EMPTY);
      setCurrentSessionId(null);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, [userId]);

  const persist = useCallback((next: UserProgress) => {
    latest.current = next;
    setProgress(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const startSession = useCallback(
    (lessonId: string): StartSessionResult => {
      const sessionId = newUuid();
      const nextCount = latest.current.sessionCount + 1;
      persist({ ...latest.current, sessionCount: nextCount });
      setCurrentSessionId(sessionId);
      sessionIdRef.current = sessionId;
      if (userId) {
        sync.openSession(userId, lessonId, sessionId).catch(() => {});
      }
      return { sessionCount: nextCount, sessionId };
    },
    [persist, userId],
  );

  const endSession = useCallback(() => {
    const id = sessionIdRef.current;
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    if (id && userId) {
      sync.closeSession(id).catch(() => {});
    }
  }, [userId]);

  const recordAnswer = useCallback(
    (exerciseId: string, correct: boolean, failedThisSession: boolean) => {
      const outcome = applyAnswer(latest.current, exerciseId, correct, failedThisSession);
      persist(outcome.progress);
      const sid = sessionIdRef.current;
      if (userId) {
        sync.recordAttempt(userId, exerciseId, correct, sid).catch(() => {});
        const state = outcome.progress.exercises[exerciseId];
        if (state) {
          sync.upsertExerciseState(userId, exerciseId, state).catch(() => {});
        }
      }
      return outcome.requeue;
    },
    [persist, userId],
  );

  const markLessonComplete = useCallback(
    (lessonId: string) => {
      if (latest.current.completedLessonIds.includes(lessonId)) return;
      persist({
        ...latest.current,
        completedLessonIds: [...latest.current.completedLessonIds, lessonId],
      });
      if (userId) {
        sync.upsertCompletedLesson(userId, lessonId).catch(() => {});
      }
    },
    [persist, userId],
  );

  const reset = useCallback(async () => {
    persist(EMPTY);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [persist]);

  return (
    <ProgressContext.Provider
      value={{ progress, loading, startSession, endSession, recordAnswer, markLessonComplete, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
