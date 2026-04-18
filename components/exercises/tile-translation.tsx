import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { shuffle } from '@/lib/shuffle';
import type { TileTranslationExercise } from '@/types/models';

type Props = {
  exercise: TileTranslationExercise;
  onAnswered: (correct: boolean) => void;
};

type Tile = { id: string; text: string };

export function TileTranslation({ exercise, onAnswered }: Props) {
  const tiles = useMemo<Tile[]>(() => {
    const maxCounts = new Map<string, number>();
    for (const ans of exercise.correctAnswers) {
      const counts = new Map<string, number>();
      for (const t of ans) counts.set(t, (counts.get(t) ?? 0) + 1);
      for (const [t, c] of counts) {
        maxCounts.set(t, Math.max(maxCounts.get(t) ?? 0, c));
      }
    }
    const pool: Tile[] = [];
    let idx = 0;
    for (const [t, c] of maxCounts) {
      for (let i = 0; i < c; i++) pool.push({ id: `c-${idx++}`, text: t });
    }
    exercise.distractorTiles.forEach((t, i) => pool.push({ id: `d-${i}`, text: t }));
    return shuffle(pool);
  }, [exercise]);

  const [selected, setSelected] = useState<Tile[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const available = tiles.filter((t) => !selected.some((s) => s.id === t.id));

  const addTile = (t: Tile) => {
    if (submitted) return;
    setSelected([...selected, t]);
  };
  const removeTile = (t: Tile) => {
    if (submitted) return;
    setSelected(selected.filter((s) => s.id !== t.id));
  };

  const submit = () => {
    const user = selected.map((t) => t.text);
    const correct = exercise.correctAnswers.some(
      (ans) => ans.length === user.length && ans.every((t, i) => t === user[i]),
    );
    setSubmitted(true);
    onAnswered(correct);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Translate</ThemedText>
      <ThemedText type="title" style={styles.prompt}>
        {exercise.prompt}
      </ThemedText>

      <View style={styles.selectedRow}>
        {selected.map((t) => (
          <Pressable key={t.id} onPress={() => removeTile(t)} style={styles.tileSelected}>
            <ThemedText style={styles.tileSelectedText}>{t.text}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.availableRow}>
        {available.map((t) => (
          <Pressable key={t.id} onPress={() => addTile(t)} style={styles.tileAvailable}>
            <ThemedText style={styles.tileAvailableText}>{t.text}</ThemedText>
          </Pressable>
        ))}
      </View>

      {!submitted && (
        <Pressable
          onPress={submit}
          disabled={selected.length === 0}
          style={[styles.check, selected.length === 0 && styles.checkDisabled]}>
          <ThemedText style={styles.checkText}>Check</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16 },
  prompt: { marginVertical: 8 },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    paddingBottom: 8,
  },
  availableRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tileSelected: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
  },
  tileSelectedText: { color: '#fff', fontWeight: '600' },
  tileAvailable: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  tileAvailableText: { color: '#3730a3' },
  check: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  checkDisabled: { opacity: 0.4 },
  checkText: { color: '#fff', fontWeight: '600' },
});
