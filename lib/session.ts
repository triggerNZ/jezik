import { shuffle } from '@/lib/shuffle';
import type {
  BoxLevel,
  Exercise,
  ExerciseProgress,
  Topic,
  UserProgress,
} from '@/types/models';

export const NEW_SLICE_SIZE = 5;
export const REVIEW_CAP = 5;

// box → sessions until next due.
// Low boxes repeat every session so newly-introduced material gets
// mixed into the very next session's review pool, not two sessions out.
export const INTERVALS: Record<BoxLevel, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
};

export function composeSession(
  topicId: string,
  progress: UserProgress,
  allExercises: Exercise[],
  allTopics: Topic[],
): Exercise[] {
  const topic = allTopics.find((t) => t.id === topicId);
  if (!topic) return [];

  const byId = new Map(allExercises.map((e) => [e.id, e]));

  const newExercises: Exercise[] = topic.exerciseIds
    .filter((id) => !progress.exercises[id])
    .slice(0, NEW_SLICE_SIZE)
    .map((id) => byId.get(id))
    .filter((e): e is Exercise => e != null);

  const reviewCandidates = Object.entries(progress.exercises)
    .filter(([id, state]) => {
      const ex = byId.get(id);
      if (!ex) return false;
      if (ex.topicId === topicId) return false;
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

export function isTopicComplete(
  topic: Topic,
  progress: UserProgress,
): boolean {
  return topic.exerciseIds.every((id) => progress.exercises[id] != null);
}

export function introducedCount(topic: Topic, progress: UserProgress): number {
  return topic.exerciseIds.filter((id) => progress.exercises[id] != null).length;
}
