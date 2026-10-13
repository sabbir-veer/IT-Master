import { describe, it, expect } from 'vitest';
import { calculateQuizScore } from '@/lib/scoring';
import { Question } from '@/types/dataset';

const mockQuestions: Question[] = [
  {
    id: 'Q1',
    topic: 'keys',
    question: 'Q1',
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
  },
  {
    id: 'Q2',
    topic: 'keys',
    question: 'Q2',
    options: ['A', 'B', 'C', 'D'],
    answer: 1,
  },
  {
    id: 'Q3',
    topic: 'keys',
    question: 'Q3',
    options: ['A', 'B', 'C', 'D'],
    answer: 2,
  },
  {
    id: 'Q4',
    topic: 'keys',
    question: 'Q4',
    options: ['A', 'B', 'C', 'D'],
    answer: 3,
  },
];

describe('Scoring Logic', () => {
  it('correctly calculates 100% score when all answers are correct', () => {
    const userAnswers = {
      Q1: 0,
      Q2: 1,
      Q3: 2,
      Q4: 3,
    };

    const result = calculateQuizScore({
      questions: mockQuestions,
      userAnswers,
      config: {
        datasetId: 'db1',
        subject: 'database',
        selectedTopics: [],
        difficulty: 'all',
        questionCount: 4,
      },
      datasetTitle: 'Test Database',
      completionTimeSeconds: 45,
    });

    expect(result.correctAnswers).toBe(4);
    expect(result.incorrectAnswers).toBe(0);
    expect(result.unansweredCount).toBe(0);
    expect(result.scorePercentage).toBe(100);
    expect(result.completionTimeSeconds).toBe(45);
  });

  it('correctly handles partial, incorrect, and unanswered questions', () => {
    const userAnswers = {
      Q1: 0, // correct
      Q2: 0, // incorrect (correct is 1)
      Q3: null, // unanswered
      // Q4 is omitted -> unanswered
    };

    const result = calculateQuizScore({
      questions: mockQuestions,
      userAnswers,
      config: {
        datasetId: 'db1',
        subject: 'database',
        selectedTopics: [],
        difficulty: 'all',
        questionCount: 4,
      },
      datasetTitle: 'Test Database',
      completionTimeSeconds: 80,
    });

    expect(result.correctAnswers).toBe(1);
    expect(result.incorrectAnswers).toBe(1);
    expect(result.unansweredCount).toBe(2);
    expect(result.scorePercentage).toBe(25); // 1 / 4 * 100
    expect(result.answers).toHaveLength(4);
    expect(result.answers[0].isCorrect).toBe(true);
    expect(result.answers[1].isCorrect).toBe(false);
    expect(result.answers[2].selectedOption).toBeNull();
    expect(result.answers[3].selectedOption).toBeNull();
  });
});
