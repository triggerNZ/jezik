import type { Exercise, Topic } from '@/types/models';

export const topic: Topic = {
  id: 'smalltalk-1',
  courseId: 'hr-from-en',
  title: 'Small talk',
  order: 2,
  exerciseIds: ['ex2-1', 'ex2-2', 'ex2-3', 'ex2-4', 'ex2-5'],
};

export const exercises: Exercise[] = [
  {
    id: 'ex2-1',
    topicId: 'smalltalk-1',
    type: 'multiple_choice',
    prompt: 'Please',
    promptLanguage: 'en',
    answerLanguage: 'hr',
    correctAnswer: 'Molim',
    distractors: ['Hvala', 'Da', 'Ne'],
  },
  {
    id: 'ex2-2',
    topicId: 'smalltalk-1',
    type: 'multiple_choice',
    prompt: 'Oprosti',
    promptLanguage: 'hr',
    answerLanguage: 'en',
    correctAnswer: 'Sorry',
    distractors: ['Thanks', 'Yes', 'No'],
  },
  {
    id: 'ex2-3',
    topicId: 'smalltalk-1',
    type: 'match_pairs',
    sourceLanguage: 'en',
    targetLanguage: 'hr',
    pairs: [
      { source: 'Yes', target: 'Da' },
      { source: 'No', target: 'Ne' },
      { source: 'Sorry', target: 'Oprosti' },
      { source: 'Nice to meet you', target: 'Drago mi je' },
    ],
  },
  {
    id: 'ex2-4',
    topicId: 'smalltalk-1',
    type: 'tile_translation',
    prompt: 'How are you?',
    promptLanguage: 'en',
    answerLanguage: 'hr',
    correctAnswers: [['Kako', 'si']],
    distractorTiles: ['sam', 'Ja', 'se'],
  },
  {
    id: 'ex2-5',
    topicId: 'smalltalk-1',
    type: 'tile_translation',
    prompt: 'I am well',
    promptLanguage: 'en',
    answerLanguage: 'hr',
    correctAnswers: [
      ['Dobro', 'sam'],
      ['Ja', 'sam', 'dobro'],
    ],
    distractorTiles: ['je', 'si'],
  },
];
