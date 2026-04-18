import type { Exercise } from '@/types/models';

export function correctAnswerText(ex: Exercise): string | null {
  switch (ex.type) {
    case 'multiple_choice':
      return ex.correctAnswer;
    case 'tile_translation':
      return ex.correctAnswers[0].join(' ');
    case 'match_pairs':
      return null;
  }
}
