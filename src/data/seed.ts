import type { Lesson } from '../types';

export const lessonOne: Lesson = {
  id: 'lesson-01',
  moduleId: 'basic-1',
  number: 1,
  title: 'Verbs & Foods',
  theory: [
    "Lesson 1 introduces the verbs 'To Eat' and 'To Drink'.",
    "Structure: I eat (Eu como) / You drink (Você bebe).",
    "Negative: I do not eat (Eu não como).",
    "Interrogative: Do you eat? (Você come?)"
  ],
  vocabulary: [
    { en: 'Meat', pt: 'Carne', category: 'food' },
    { en: 'Fish', pt: 'Peixe', category: 'food' },
    { en: 'Chicken', pt: 'Frango', category: 'food' },
    { en: 'Apple', pt: 'Maçã', category: 'food' },
    { en: 'Bread', pt: 'Pão', category: 'food' },
    { en: 'Coffee', pt: 'Café', category: 'drink' },
    { en: 'Water', pt: 'Água', category: 'drink' },
    { en: 'Soda', pt: 'Refrigerante', category: 'drink' }
  ],
  exercises: [
    {
      id: 'ex-1',
      type: 'translation',
      question: 'Traduza: Eu bebo café',
      correctAnswer: 'I drink coffee'
    },
    {
      id: 'ex-2',
      type: 'translation',
      question: 'Traduza: Você come pão',
      correctAnswer: 'You eat bread'
    },
    {
      id: 'ex-3',
      type: 'multiple_choice',
      question: 'Qual a negativa de "I eat apple"?',
      correctAnswer: 'I do not eat apple',
      options: ['I no eat apple', 'I do not eat apple', 'I not eat apple']
    }
  ]
};