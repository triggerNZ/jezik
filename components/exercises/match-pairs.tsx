import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { shuffle } from '@/lib/shuffle';
import type { MatchPairsExercise } from '@/types/models';

type Props = {
  exercise: MatchPairsExercise;
  onAnswered: (correct: boolean) => void;
};

type Side = 'left' | 'right';

export function MatchPairs({ exercise, onAnswered }: Props) {
  const left = useMemo(() => shuffle(exercise.pairs.map((p) => p.source)), [exercise]);
  const right = useMemo(() => shuffle(exercise.pairs.map((p) => p.target)), [exercise]);

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ side: Side; value: string } | null>(null);

  const handleTap = (side: Side, value: string) => {
    if (matched.has(value)) return;

    if (!selected || selected.side === side) {
      setSelected({ side, value });
      return;
    }

    const leftVal = side === 'left' ? value : selected.value;
    const rightVal = side === 'right' ? value : selected.value;
    const pair = exercise.pairs.find((p) => p.source === leftVal);

    if (pair && pair.target === rightVal) {
      const next = new Set(matched);
      next.add(leftVal);
      next.add(rightVal);
      setMatched(next);
      setSelected(null);
      if (next.size === exercise.pairs.length * 2) {
        onAnswered(true);
      }
    } else {
      setSelected(null);
    }
  };

  const cellStyle = (value: string) => {
    if (matched.has(value)) return [styles.cell, styles.cellMatched];
    if (selected?.value === value) return [styles.cell, styles.cellSelected];
    return styles.cell;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Match pairs</ThemedText>
      <View style={styles.columns}>
        <View style={styles.column}>
          {left.map((v) => (
            <Pressable key={v} onPress={() => handleTap('left', v)} style={cellStyle(v)}>
              <ThemedText>{v}</ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={styles.column}>
          {right.map((v) => (
            <Pressable key={v} onPress={() => handleTap('right', v)} style={cellStyle(v)}>
              <ThemedText>{v}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16 },
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 8 },
  cell: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cellSelected: { backgroundColor: '#a5b4fc' },
  cellMatched: { backgroundColor: '#4ade80', opacity: 0.5 },
});
