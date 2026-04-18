import { shuffle } from '@/lib/shuffle';
import type {
  BoxLevel,
  Exercise,
  ExerciseProgress,
  Lesson,
  UserProgress,
} from '@/types/models';

export const REVIEW_CAP = 5;

// box → sessions until next due.
// Low boxes repeat every session so newly-introduced material gets
// mixed into the very next lesson's review pool, not two sessions out.
export const INTERVALS: Record<BoxLevel, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
};

export function composeSession(
  lessonId: string,
  progress: UserProgress,
  allExercises: Exercise[],
  allLessons: Lesson[],
): Exercise[] {
  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) return [];

  const byId = new Map(allExercises.map((e) => [e.id, e]));

  const newExercises: Exercise[] = lesson.exerciseIds
    .filter((id) => !progress.exercises[id])
    .map((id) => byId.get(id))
    .filter((e): e is Exercise => e != null);

  const reviewCandidates = Object.entries(progress.exercises)
    .filter(([id, state]) => {
      const ex = byId.get(id);
      if (!ex) return false;
      if (ex.lessonId === lessonId) return false;
      return state.nextDueSession <= progress.sessionCount;
    })
    .sort(([, a], [, b]) => a.box - b.box || a.nextDueSession - b.nextDueSession)
    .slice(0, REVIEW_CAP)
    .map(([id]) => byId.get(id))
    .filter((e): e is Exercise => e != null);

  return shuffle([...newExercises, ...reviewCandidates]);
}

export interface AnswerOutcome {
  progress: UserProgress;
  requeue: boolean;
}

export function applyAnswer(
  progress: UserProgress,
  exerciseId: string,
  correct: boolean,
  failedThisSession: boolean,
): AnswerOutcome {
  const prev = progress.exercises[exerciseId];
  const session = progress.sessionCount;

  let nextBox: BoxLevel;
  let requeue = false;

  if (!correct) {
    nextBox = 1;
    requeue = true;
  } else if (failedThisSession) {
    nextBox = 1;
  } else {
    const startBox: BoxLevel = prev?.box ?? 1;
    nextBox = Math.min(5, startBox + 1) as BoxLevel;
  }

  const next: ExerciseProgress = {
    box: nextBox,
    nextDueSession: session + INTERVALS[nextBox],
    firstSeenSession: prev?.firstSeenSession ?? session,
  };

  return {
    progress: {
      ...progress,
      exercises: { ...progress.exercises, [exerciseId]: next },
    },
    requeue,
  };
}

export function isLessonComplete(
  lesson: Lesson,
  progress: UserProgress,
): boolean {
  return lesson.exerciseIds.every((id) => progress.exercises[id] != null);
}

export function introducedCount(lesson: Lesson, progress: UserProgress): number {
  return lesson.exerciseIds.filter((id) => progress.exercises[id] != null).length;
}
