import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { courses, lessons } from '@/data/seed';
import { useProgress } from '@/lib/progress';
import { introducedCount, isLessonComplete } from '@/lib/session';

export default function HomeScreen() {
  const { progress, loading } = useProgress();
  const course = courses[0];
  const courseLessons = lessons
    .filter((l) => l.courseId === course.id)
    .sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <ThemedView style={styles.loadingRoot}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <ThemedText style={styles.courseLabel}>Course</ThemedText>
          <ThemedText type="title">{course.title}</ThemedText>
        </View>

        <View style={styles.list}>
          {courseLessons.map((lesson) => {
            const total = lesson.exerciseIds.length;
            const seen = introducedCount(lesson, progress);
            const complete = isLessonComplete(lesson, progress);
            const subtitle = complete
              ? 'Complete — review'
              : seen > 0
                ? `In progress (${seen}/${total})`
                : `${total} exercises`;
            return (
              <Link key={lesson.id} href={`/lesson/${lesson.id}`} asChild>
                <Pressable style={styles.card}>
                  <View style={[styles.cardOrder, complete && styles.cardOrderDone]}>
                    <ThemedText style={styles.cardOrderText}>
                      {complete ? '✓' : lesson.order}
                    </ThemedText>
                  </View>
                  <View style={styles.cardBody}>
                    <ThemedText type="defaultSemiBold">{lesson.title}</ThemedText>
                    <ThemedText style={styles.cardMeta}>{subtitle}</ThemedText>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingTop: 64, paddingBottom: 32, paddingHorizontal: 16, gap: 16 },
  header: { gap: 4, marginBottom: 8 },
  courseLabel: { fontSize: 13, opacity: 0.6 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cardOrder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOrderDone: { backgroundColor: '#22c55e' },
  cardOrderText: { color: '#fff', fontWeight: '700' },
  cardBody: { flex: 1, gap: 2 },
  cardMeta: { fontSize: 13, opacity: 0.6 },
});
