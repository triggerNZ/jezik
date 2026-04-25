import type { Course, Exercise, Topic } from '@/types/models';
import {
  topic as eatingDrinking,
  exercises as eatingDrinkingExercises,
} from './topics/eating-drinking';
import {
  topic as greetings,
  exercises as greetingsExercises,
} from './topics/greetings';
import {
  topic as smallTalk,
  exercises as smallTalkExercises,
} from './topics/small-talk';

export const courses: Course[] = [
  {
    id: 'hr-from-en',
    sourceLanguage: 'en',
    targetLanguage: 'hr',
    title: 'Croatian for English speakers',
  },
];

export const topics: Topic[] = [greetings, smallTalk, eatingDrinking];

export const exercises: Exercise[] = [
  ...greetingsExercises,
  ...smallTalkExercises,
  ...eatingDrinkingExercises,
];
