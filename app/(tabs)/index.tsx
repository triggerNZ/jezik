import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ExerciseRenderer } from '@/components/exercises/exercise-renderer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { exercises, lessons } from '@/data/seed';
import type { Exercise } from '@/types/models';

type Status = 'answering' | 'correct' | 'incorrect' | 'done';

export default function HomeScreen() {
  const lesson = lessons[0];
  const lessonExercises: Exercise[] = lesson.exerciseIds.map(
    (id) => exercises.find((e) => e.id === id)!,
  );

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>('answering');

  const exercise = lessonExercises[index];

  const onAnswered = (correct: boolean) => {
    setStatus(correct ? 'correct' : 'incorrect');
  };

  const next = () => {
    if (index + 1 >= lessonExercises.length) {
      setStatus('done');
    } else {
      setIndex(index + 1);
      setStatus('answering');
    }
  };

  if (status === 'done') {
    return (
      <ThemedView style={styles.doneRoot}>
        <ThemedText type="title">Lesson complete</ThemedText>
        <Pressable
          onPress={() => {
            setIndex(0);
            setStatus('answering');
          }}
          style={styles.next}>
          <ThemedText>Restart</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText style={styles.progress}>
          {lesson.title} — {index + 1} / {lessonExercises.length}
        </ThemedText>

        <ExerciseRenderer key={exercise.id} exercise={exercise} onAnswered={onAnswered} />

        {status !== 'answering' && (
          <Pressable
            onPress={next}
            style={[
              styles.next,
              status === 'correct' ? styles.nextCorrect : styles.nextIncorrect,
            ]}>
            <ThemedText style={styles.nextText}>
              {status === 'correct' ? 'Correct — Next' : 'Incorrect — Next'}
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 64, paddingBottom: 32 },
  progress: { textAlign: 'center', marginBottom: 8, opacity: 0.7 },
  doneRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  next: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextCorrect: { backgroundColor: '#4ade80' },
  nextIncorrect: { backgroundColor: '#f87171' },
  nextText: { color: '#0b1020', fontWeight: '600' },
});
