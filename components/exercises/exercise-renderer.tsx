import type { Exercise } from '@/types/models';

import { MatchPairs } from './match-pairs';
import { MultipleChoice } from './multiple-choice';
import { TileTranslation } from './tile-translation';

type Props = {
  exercise: Exercise;
  onAnswered: (correct: boolean) => void;
};

export function ExerciseRenderer({ exercise, onAnswered }: Props) {
  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoice exercise={exercise} onAnswered={onAnswered} />;
    case 'match_pairs':
      return <MatchPairs exercise={exercise} onAnswered={onAnswered} />;
    case 'tile_translation':
      return <TileTranslation exercise={exercise} onAnswered={onAnswered} />;
  }
}
