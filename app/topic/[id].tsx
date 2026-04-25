import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseRenderer } from '@/components/exercises/exercise-renderer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { exercises as allExercises, topics } from '@/data/seed';
import { correctAnswerText } from '@/lib/correct-answer-text';
import { useProgress } from '@/lib/progress';
import { composeSession, isTopicComplete } from '@/lib/session';
import type { Exercise } from '@/types/models';

type Status = 'answering' | 'correct' | 'incorrect' | 'done';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress, loading, startSession, endSession, recordAnswer, markTopicComplete } = useProgress();

  const topic = topics.find((t) => t.id === id);

  const [queue, setQueue] = useState<Exercise[] | null>(null);
  const [failedSet, setFailedSet] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('answering');
  const [originalLen, setOriginalLen] = useState(0);
  const [answeredFirstTime, setAnsweredFirstTime] = useState(0);

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    if (loading || !topic) return;
    bootstrapped.current = true;
    const { sessionCount: nextCount } = startSession(topic.id);
    const bumped = { ...progress, sessionCount: nextCount };
    const composed = composeSession(topic.id, bumped, allExercises, topics);
    setQueue(composed);
    setOriginalLen(composed.length);
    setStatus(composed.length === 0 ? 'done' : 'answering');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, topic?.id]);

  if (!topic) {
    return (
      <ThemedView style={styles.doneRoot}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <ThemedText type="title">Topic not found</ThemedText>
        <Pressable onPress={() => router.back()} style={[styles.next, styles.nextCorrect]}>
          <ThemedText style={styles.nextText}>Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (loading || queue == null) {
    return (
      <ThemedView style={styles.doneRoot}>
        <Stack.Screen options={{ title: topic.title }} />
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  const exercise = queue[0];

  const onAnswered = (correct: boolean) => {
    if (!exercise) return;
    const alreadyFailed = failedSet.has(exercise.id);
    recordAnswer(exercise.id, correct, alreadyFailed);
    if (!alreadyFailed) setAnsweredFirstTime((n) => n + 1);
    if (!correct) {
      setFailedSet((prev) => {
        const next = new Set(prev);
        next.add(exercise.id);
        return next;
      });
    }
    setStatus(correct ? 'correct' : 'incorrect');
  };

  const advance = () => {
    if (queue.length === 0) return;
    const [current, ...rest] = queue;
    const wasCorrect = status === 'correct';
    const newQueue = wasCorrect ? rest : [...rest, current];
    if (newQueue.length === 0) {
      setQueue(newQueue);
      setStatus('done');
      if (isTopicComplete(topic, progress)) {
        markTopicComplete(topic.id);
      }
      endSession();
      return;
    }
    setQueue(newQueue);
    setStatus('answering');
  };

  if (status === 'done') {
    return (
      <ThemedView style={styles.doneRoot}>
        <Stack.Screen options={{ title: topic.title }} />
        <ThemedText type="title">Lesson complete</ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.next, styles.nextCorrect]}>
          <ThemedText style={styles.nextText}>Back to topics</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const progressPct = originalLen > 0 ? (answeredFirstTime / originalLen) * 100 : 0;
  const correctText = status === 'incorrect' && exercise ? correctAnswerText(exercise) : null;

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ title: topic.title }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <ThemedText style={styles.topicTitle}>
            {topic.title} · {queue.length} left
          </ThemedText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {exercise && (
          <ExerciseRenderer key={exercise.id + ':' + (originalLen - queue.length)} exercise={exercise} onAnswered={onAnswered} />
        )}

        {status === 'incorrect' && correctText && (
          <View style={styles.banner}>
            <ThemedText style={styles.bannerLabel}>Correct answer</ThemedText>
            <ThemedText style={styles.bannerAnswer}>{correctText}</ThemedText>
          </View>
        )}

        {(status === 'correct' || status === 'incorrect') && (
          <Pressable
            onPress={advance}
            style={[
              styles.next,
              status === 'correct' ? styles.nextCorrect : styles.nextIncorrect,
            ]}>
            <ThemedText style={styles.nextText}>
              {status === 'correct' ? 'Correct — Next' : 'Next'}
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 16, paddingBottom: 32 },
  header: { paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  topicTitle: { fontSize: 13, opacity: 0.6 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  doneRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 },
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  bannerLabel: { fontSize: 12, opacity: 0.7, marginBottom: 2 },
  bannerAnswer: { fontSize: 18, fontWeight: '600', color: '#7f1d1d' },
  next: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextCorrect: { backgroundColor: '#22c55e' },
  nextIncorrect: { backgroundColor: '#ef4444' },
  nextText: { color: '#fff', fontWeight: '600' },
});
