import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { shuffle } from '@/lib/shuffle';
import type { MultipleChoiceExercise } from '@/types/models';

type Props = {
  exercise: MultipleChoiceExercise;
  onAnswered: (correct: boolean) => void;
};

export function MultipleChoice({ exercise, onAnswered }: Props) {
  const options = useMemo(
    () => shuffle([exercise.correctAnswer, ...exercise.distractors]),
    [exercise],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (selected == null) return;
    setSubmitted(true);
    onAnswered(selected === exercise.correctAnswer);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Translate</ThemedText>
      <ThemedText type="title" style={styles.prompt}>
        {exercise.prompt}
      </ThemedText>

      <View style={styles.options}>
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = opt === exercise.correctAnswer;
          const bg = submitted
            ? isCorrect
              ? '#4ade80'
              : isSelected
                ? '#f87171'
                : 'transparent'
            : isSelected
              ? '#a5b4fc'
              : 'transparent';
          return (
            <Pressable
              key={opt}
              onPress={() => !submitted && setSelected(opt)}
              style={[styles.option, { backgroundColor: bg }]}>
              <ThemedText>{opt}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {!submitted && (
        <Pressable
          onPress={submit}
          disabled={!selected}
          style={[styles.check, !selected && styles.checkDisabled]}>
          <ThemedText>Check</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16 },
  prompt: { marginVertical: 8 },
  options: { gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    padding: 12,
  },
  check: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  checkDisabled: { opacity: 0.4 },
});
