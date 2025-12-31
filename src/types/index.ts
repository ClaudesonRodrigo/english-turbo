export type ExerciseType = 'translation' | 'multiple_choice' | 'complete';

export interface VocabularyItem {
  en: string;
  pt: string;
  category?: string;
}

export interface QuizQuestion {
  id: string;
  type: ExerciseType;
  question: string;
  correctAnswer: string;
  options?: string[];
}

// O erro diz que esta linha abaixo não existe ou não tem o 'export'
export interface Lesson {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  theory: string[];
  vocabulary: VocabularyItem[];
  exercises: QuizQuestion[];
}