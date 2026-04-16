import type { Course, Exercise, Lesson } from '@/types/models';

export const courses: Course[] = [
  {
    id: 'hr-from-en',
    sourceLanguage: 'en',
    targetLanguage: 'hr',
    title: 'Croatian for English speakers',
  },
];

export const lessons: Lesson[] = [
  {
    id: 'greetings-1',
    courseId: 'hr-from-en',
    title: 'Greetings',
    order: 1,
    exerciseIds: ['ex-1', 'ex-2', 'ex-3', 'ex-4', 'ex-5'],
  },
];

export const exercises: Exercise[] = [
  {
    id: 'ex-1',
    lessonId: 'greetings-1',
    type: 'multiple_choice',
    prompt: 'Bok',
    promptLanguage: 'hr',
    answerLanguage: 'en',
    correctAnswer: 'Hi',
    distractors: ['Goodbye', 'Thanks', 'Please'],
  },
  {
    id: 'ex-2',
    lessonId: 'greetings-1',
    type: 'multiple_choice',
    prompt: 'Thank you',
    promptLanguage: 'en',
    answerLanguage: 'hr',
    correctAnswer: 'Hvala',
    distractors: ['Molim', 'Bok', 'Da'],
  },
  {
    id: 'ex-3',
    lessonId: 'greetings-1',
    type: 'match_pairs',
    sourceLanguage: 'en',
    targetLanguage: 'hr',
    pairs: [
      { source: 'Hello', target: 'Bok' },
      { source: 'Good morning', target: 'Dobro jutro' },
      { source: 'Good night', target: 'Laku noć' },
      { source: 'Goodbye', target: 'Doviđenja' },
    ],
  },
  {
    id: 'ex-4',
    lessonId: 'greetings-1',
    type: 'tile_translation',
    prompt: 'I am Tin',
    promptLanguage: 'en',
    answerLanguage: 'hr',
    correctAnswers: [['Ja', 'sam', 'Tin']],
    distractorTiles: ['si', 'je', 'smo'],
  },
  {
    id: 'ex-5',
    lessonId: 'greetings-1',
    type: 'tile_translation',
    prompt: 'My name is Ana',
    promptLanguage: 'en',
    answerLanguage: 'hr',
    correctAnswers: [
      ['Zovem', 'se', 'Ana'],
      ['Ja', 'se', 'zovem', 'Ana'],
    ],
    distractorTiles: ['sam', 'si'],
  },
];
