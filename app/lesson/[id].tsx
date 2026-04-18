import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseRenderer } from '@/components/exercises/exercise-renderer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { exercises, lessons } from '@/data/seed';
import { correctAnswerText } from '@/lib/correct-answer-text';
import type { Exercise } from '@/types/models';

type Status = 'answering' | 'correct' | 'incorrect' | 'done';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const lesson = lessons.find((l) => l.id === id);

  if (!lesson) {
    return (
      <ThemedView style={styles.doneRoot}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <ThemedText type="title">Lesson not found</ThemedText>
        <Pressable onPress={() => router.back()} style={[styles.next, styles.nextCorrect]}>
          <ThemedText style={styles.nextText}>Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const lessonExercises: Exercise[] = lesson.exerciseIds.map(
    (eid) => exercises.find((e) => e.id === eid)!,
  );

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>('answering');

  const exercise = lessonExercises[index];
  const total = lessonExercises.length;
  const answered = status === 'correct' || status === 'incorrect';
  const progress = ((index + (answered ? 1 : 0)) / total) * 100;

  const onAnswered = (correct: boolean) => {
    setStatus(correct ? 'correct' : 'incorrect');
  };

  const next = () => {
    if (index + 1 >= total) {
      setStatus('done');
    } else {
      setIndex(index + 1);
      setStatus('answering');
    }
  };

  if (status === 'done') {
    return (
      <ThemedView style={styles.doneRoot}>
        <Stack.Screen options={{ title: lesson.title }} />
        <ThemedText type="title">Lesson complete</ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.next, styles.nextCorrect]}>
          <ThemedText style={styles.nextText}>Back to lessons</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const correctText = status === 'incorrect' ? correctAnswerText(exercise) : null;

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ title: lesson.title }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <ThemedText style={styles.lessonTitle}>{lesson.title}</ThemedText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ExerciseRenderer key={exercise.id} exercise={exercise} onAnswered={onAnswered} />

        {status === 'incorrect' && correctText && (
          <View style={styles.banner}>
            <ThemedText style={styles.bannerLabel}>Correct answer</ThemedText>
            <ThemedText style={styles.bannerAnswer}>{correctText}</ThemedText>
          </View>
        )}

        {answered && (
          <Pressable
            onPress={next}
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
  lessonTitle: { fontSize: 13, opacity: 0.6 },
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
