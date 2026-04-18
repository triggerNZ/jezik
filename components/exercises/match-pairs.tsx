import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { shuffle } from '@/lib/shuffle';
import type { MatchPairsExercise } from '@/types/models';

type Props = {
  exercise: MatchPairsExercise;
  onAnswered: (correct: boolean) => void;
};

type Side = 'source' | 'target';
type Tile = { id: string; text: string; side: Side };

export function MatchPairs({ exercise, onAnswered }: Props) {
  const tiles = useMemo<Tile[]>(
    () =>
      shuffle([
        ...exercise.pairs.map((p, i) => ({ id: `s-${i}`, text: p.source, side: 'source' as const })),
        ...exercise.pairs.map((p, i) => ({ id: `t-${i}`, text: p.target, side: 'target' as const })),
      ]),
    [exercise],
  );

  const [selected, setSelected] = useState<Tile | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<Set<string>>(new Set());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPair = (a: Tile, b: Tile) => {
    const src = a.side === 'source' ? a : b;
    const tgt = a.side === 'target' ? a : b;
    return exercise.pairs.some((p) => p.source === src.text && p.target === tgt.text);
  };

  const handleTap = (t: Tile) => {
    if (matched.has(t.id)) return;

    if (!selected || selected.side === t.side) {
      setSelected(t);
      return;
    }

    if (isPair(selected, t)) {
      const next = new Set(matched);
      next.add(selected.id);
      next.add(t.id);
      setMatched(next);
      setSelected(null);
      if (next.size === exercise.pairs.length * 2) {
        onAnswered(true);
      }
    } else {
      const flash = new Set<string>([selected.id, t.id]);
      setWrongFlash(flash);
      setSelected(null);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setWrongFlash(new Set()), 700);
    }
  };

  const tileStyle = (t: Tile) => {
    if (wrongFlash.has(t.id)) return [styles.tile, styles.tileWrong];
    if (matched.has(t.id)) return [styles.tile, styles.tileMatched];
    if (selected?.id === t.id) return [styles.tile, styles.tileSelected];
    return styles.tile;
  };

  const tileTextStyle = (t: Tile) =>
    matched.has(t.id) ? styles.tileMatchedText : undefined;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Match pairs</ThemedText>
      <View style={styles.grid}>
        {tiles.map((t, i) => (
          <Pressable
            key={t.id}
            onPress={() => handleTap(t)}
            style={[tileStyle(t), { marginTop: i % 3 === 0 ? 0 : 8 }]}>
            <ThemedText style={tileTextStyle(t)}>{t.text}</ThemedText>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
  },
  tile: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tileSelected: { backgroundColor: '#a5b4fc', borderColor: '#6366f1' },
  tileMatched: { backgroundColor: '#a7f3d0', borderColor: '#34d399' },
  tileMatchedText: { opacity: 0.5 },
  tileWrong: { backgroundColor: '#fca5a5', borderColor: '#ef4444' },
});
