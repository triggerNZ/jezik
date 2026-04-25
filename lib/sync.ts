import { supabase } from '@/lib/supabase';
import type { ExerciseProgress, UserProgress } from '@/types/models';

// Shape of rows in public.exercise_progress.
interface ExerciseProgressRow {
  user_id: string;
  exercise_id: string;
  box: number;
  next_due_session: number;
  first_seen_session: number;
  updated_at: string;
}

interface CompletedTopicIdRow {
  topic_id: string;
}

export async function pullProgress(userId: string): Promise<UserProgress> {
  const [progressRes, completedRes, sessionsRes] = await Promise.all([
    supabase
      .from('exercise_progress')
      .select('exercise_id, box, next_due_session, first_seen_session')
      .eq('user_id', userId),
    supabase.from('completed_topics').select('topic_id').eq('user_id', userId),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  if (progressRes.error) throw progressRes.error;
  if (completedRes.error) throw completedRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const exercises: Record<string, ExerciseProgress> = {};
  for (const row of progressRes.data ?? []) {
    exercises[row.exercise_id] = {
      box: row.box as ExerciseProgress['box'],
      nextDueSession: row.next_due_session,
      firstSeenSession: row.first_seen_session,
    };
  }

  return {
    sessionCount: sessionsRes.count ?? 0,
    exercises,
    completedTopicIds: (completedRes.data ?? []).map((r: CompletedTopicIdRow) => r.topic_id),
  };
}

export async function upsertExerciseState(
  userId: string,
  exerciseId: string,
  state: ExerciseProgress,
): Promise<void> {
  const row: ExerciseProgressRow = {
    user_id: userId,
    exercise_id: exerciseId,
    box: state.box,
    next_due_session: state.nextDueSession,
    first_seen_session: state.firstSeenSession,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('exercise_progress')
    .upsert(row, { onConflict: 'user_id,exercise_id' });
  if (error) throw error;
}

export async function recordAttempt(
  userId: string,
  exerciseId: string,
  correct: boolean,
  sessionId: string | null,
): Promise<void> {
  const { error } = await supabase.from('exercise_attempts').insert({
    user_id: userId,
    exercise_id: exerciseId,
    correct,
    session_id: sessionId,
  });
  if (error) throw error;
}

export async function openSession(
  userId: string,
  topicId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    id: sessionId,
    user_id: userId,
    topic_id: topicId,
  });
  if (error) throw error;
}

export async function closeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function upsertCompletedTopic(
  userId: string,
  topicId: string,
): Promise<void> {
  const { error } = await supabase
    .from('completed_topics')
    .upsert({ user_id: userId, topic_id: topicId }, { onConflict: 'user_id,topic_id' });
  if (error) throw error;
}
