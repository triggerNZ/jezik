// ISO 639-1, e.g. 'en', 'es', 'hr'
export type LanguageCode = string;

export interface Language {
  code: LanguageCode;
  name: string;
}

export interface Course {
  id: string;
  // what the learner already knows
  sourceLanguage: LanguageCode;
  // what they're learning
  targetLanguage: LanguageCode;
  title: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  exerciseIds: string[];
}

export type Exercise =
  | MultipleChoiceExercise
  | MatchPairsExercise
  | TileTranslationExercise;

interface BaseExercise {
  id: string;
  lessonId: string;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  prompt: string;
  promptLanguage: LanguageCode;
  answerLanguage: LanguageCode;
  correctAnswer: string;
  distractors: string[];
}

export interface MatchPairsExercise extends BaseExercise {
  type: 'match_pairs';
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  pairs: { source: string; target: string }[];
}

export interface TileTranslationExercise extends BaseExercise {
  type: 'tile_translation';
  prompt: string;
  promptLanguage: LanguageCode;
  answerLanguage: LanguageCode;
  // One or more valid orderings. User's tile sequence must exactly equal one of them.
  // The tile pool is derived: for each tile, take the max occurrences across any single
  // answer, then add distractorTiles.
  correctAnswers: string[][];
  distractorTiles: string[];
}

export type BoxLevel = 1 | 2 | 3 | 4 | 5;

export interface ExerciseProgress {
  box: BoxLevel;
  // session number at which this exercise becomes eligible for review
  nextDueSession: number;
  firstSeenSession: number;
}

export interface UserProgress {
  sessionCount: number;
  exercises: Record<string, ExerciseProgress>;
  completedLessonIds: string[];
}
