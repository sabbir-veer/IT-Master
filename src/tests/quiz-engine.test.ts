import { describe, it, expect } from 'vitest';
import {
  generateQuiz,
  shuffleArray,
  filterQuestions,
  calculateTotalTimeLimit,
  formatDurationLabel,
} from '@/lib/quiz-engine';
import { Dataset, Question } from '@/types/dataset';

const mockQuestions: Question[] = [
  {
    id: 'Q1',
    topic: 'keys',
    question: 'Question 1',
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    difficulty: 'easy',
    time_seconds: 30,
  },
  {
    id: 'Q2',
    topic: 'keys',
    question: 'Question 2',
    options: ['A', 'B', 'C', 'D'],
    answer: 1,
    difficulty: 'medium',
    time_seconds: 45,
  },
  {
    id: 'Q3',
    topic: 'indexing',
    question: 'Question 3',
    options: ['A', 'B', 'C', 'D'],
    answer: 2,
    difficulty: 'hard',
    time_seconds: 60,
  },
  {
    id: 'Q4',
    topic: 'indexing',
    question: 'Question 4',
    options: ['A', 'B', 'C', 'D'],
    answer: 3,
    difficulty: 'easy',
    time_seconds: 45,
  },
  {
    id: 'Q5',
    topic: 'normalization',
    question: 'Question 5',
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    difficulty: 'medium',
    // time_seconds omitted (should fallback to 60)
  },
];

const mockDataset: Dataset = {
  dataset_id: 'db_mock',
  title: 'Mock Database',
  subject: 'database',
  topics: {
    keys: 'Keys',
    indexing: 'Indexing',
    normalization: 'Normalization',
  },
  questions: mockQuestions,
};

describe('Quiz Engine', () => {
  it('shuffles arrays without modifying element set', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(input);
    expect(shuffled).toHaveLength(input.length);
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(input);
  });

  it('filters questions by topic correctly', () => {
    const { matchedQuestions } = filterQuestions([mockDataset], {
      datasetId: 'db_mock',
      subject: 'database',
      selectedTopics: ['keys'],
      difficulty: 'all',
      questionCount: 5,
    });
    expect(matchedQuestions).toHaveLength(2);
    expect(matchedQuestions.every((q) => q.topic === 'keys')).toBe(true);
  });

  it('filters questions by difficulty correctly', () => {
    const { matchedQuestions } = filterQuestions([mockDataset], {
      datasetId: 'all',
      subject: 'all',
      selectedTopics: [],
      difficulty: 'easy',
      questionCount: 5,
    });
    expect(matchedQuestions).toHaveLength(2);
    expect(matchedQuestions.every((q) => q.difficulty === 'easy')).toBe(true);
  });

  it('generates random quiz with exact requested count without duplicates', () => {
    const result = generateQuiz([mockDataset], {
      datasetId: 'all',
      subject: 'all',
      selectedTopics: [],
      difficulty: 'all',
      questionCount: 3,
    });

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(3);
    const ids = result.questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('gracefully handles insufficient question counts with a warning', () => {
    const result = generateQuiz([mockDataset], {
      datasetId: 'all',
      subject: 'all',
      selectedTopics: ['normalization'],
      difficulty: 'all',
      questionCount: 10, // Only 1 exists
    });

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(1);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('Only 1 questions match');
  });

  it('gracefully handles 0 matching questions with an error message', () => {
    const result = generateQuiz([mockDataset], {
      datasetId: 'all',
      subject: 'all',
      selectedTopics: ['normalization'],
      difficulty: 'hard', // normalization only has medium
      questionCount: 5,
    });

    expect(result.success).toBe(false);
    expect(result.questions).toHaveLength(0);
    expect(result.error).toBeDefined();
  });

  it('calculates total time limit based on dataset recommended time_seconds', () => {
    // Q1(30) + Q2(45) + Q3(60) + Q4(45) + Q5(fallback 60) = 240 seconds
    const totalTime = calculateTotalTimeLimit(mockQuestions, 'dataset_recommended');
    expect(totalTime).toBe(240); // 4 minutes
    expect(formatDurationLabel(totalTime)).toBe('4 mins');
  });

  it('calculates total time limit for standard exam mode (60s/Q)', () => {
    const totalTime = calculateTotalTimeLimit(mockQuestions, 'standard_exam');
    expect(totalTime).toBe(5 * 60); // 300 seconds (5 mins)
    expect(formatDurationLabel(totalTime)).toBe('5 mins');
  });

  it('calculates total time limit for speed drill mode (45s/Q)', () => {
    const totalTime = calculateTotalTimeLimit(mockQuestions, 'speed_drill');
    expect(totalTime).toBe(5 * 45); // 225 seconds = 3m 45s
    expect(formatDurationLabel(totalTime)).toBe('3m 45s');
  });

  it('returns 0 for untimed mode', () => {
    const totalTime = calculateTotalTimeLimit(mockQuestions, 'untimed');
    expect(totalTime).toBe(0);
    expect(formatDurationLabel(totalTime)).toBe('Untimed');
  });
});
