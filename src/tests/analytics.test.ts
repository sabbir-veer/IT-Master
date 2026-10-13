import { describe, it, expect } from 'vitest';
import { calculateAnalytics } from '@/lib/analytics';
import { QuizResult } from '@/types/quiz';

describe('Analytics Calculations', () => {
  it('returns empty stats structure when no attempts exist', () => {
    const stats = calculateAnalytics([]);
    expect(stats.totalQuizzes).toBe(0);
    expect(stats.totalQuestionsAnswered).toBe(0);
    expect(stats.overallAccuracy).toBe(0);
    expect(stats.averageScorePercentage).toBe(0);
    expect(stats.hasEnoughData).toBe(false);
    expect(stats.topicStats).toHaveLength(0);
    expect(stats.weakTopics).toHaveLength(0);
    expect(stats.trends).toHaveLength(0);
  });

  it('calculates metrics, trends, and weak topics accurately from attempts', () => {
    const attempt1: QuizResult = {
      id: 'att1',
      datasetId: 'dbms',
      datasetTitle: 'Database Keys',
      subject: 'database',
      selectedTopics: ['super_key', 'foreign_key'],
      difficulty: 'all',
      totalQuestions: 4,
      correctAnswers: 3,
      incorrectAnswers: 1,
      unansweredCount: 0,
      scorePercentage: 75,
      completionTimeSeconds: 60,
      completedAt: '2026-10-10T10:00:00Z',
      answers: [
        {
          questionId: 'Q1',
          selectedOption: 0,
          correctOption: 0,
          isCorrect: true,
          topic: 'super_key',
          questionText: 'Q1',
          options: ['A', 'B'],
        },
        {
          questionId: 'Q2',
          selectedOption: 1,
          correctOption: 1,
          isCorrect: true,
          topic: 'super_key',
          questionText: 'Q2',
          options: ['A', 'B'],
        },
        {
          questionId: 'Q3',
          selectedOption: 0,
          correctOption: 0,
          isCorrect: true,
          topic: 'foreign_key',
          questionText: 'Q3',
          options: ['A', 'B'],
        },
        {
          questionId: 'Q4',
          selectedOption: 0,
          correctOption: 1,
          isCorrect: false, // incorrect
          topic: 'foreign_key',
          questionText: 'Q4',
          options: ['A', 'B'],
        },
      ],
    };

    const attempt2: QuizResult = {
      id: 'att2',
      datasetId: 'dbms',
      datasetTitle: 'Database Keys',
      subject: 'database',
      selectedTopics: ['foreign_key'],
      difficulty: 'all',
      totalQuestions: 2,
      correctAnswers: 0,
      incorrectAnswers: 2,
      unansweredCount: 0,
      scorePercentage: 0,
      completionTimeSeconds: 40,
      completedAt: '2026-10-11T12:00:00Z',
      answers: [
        {
          questionId: 'Q5',
          selectedOption: 0,
          correctOption: 1,
          isCorrect: false, // incorrect
          topic: 'foreign_key',
          questionText: 'Q5',
          options: ['A', 'B'],
        },
        {
          questionId: 'Q6',
          selectedOption: 0,
          correctOption: 1,
          isCorrect: false, // incorrect
          topic: 'foreign_key',
          questionText: 'Q6',
          options: ['A', 'B'],
        },
      ],
    };

    const stats = calculateAnalytics([attempt1, attempt2]);

    expect(stats.totalQuizzes).toBe(2);
    expect(stats.totalQuestionsAnswered).toBe(6);
    expect(stats.totalCorrect).toBe(3);
    expect(stats.totalIncorrect).toBe(3);
    expect(stats.overallAccuracy).toBe(50); // 3 / 6 * 100
    expect(stats.averageScorePercentage).toBe(38); // (75 + 0) / 2 = 37.5 rounded -> 38
    expect(stats.bestScorePercentage).toBe(75);
    expect(stats.hasEnoughData).toBe(true);

    // Check trends
    expect(stats.trends).toHaveLength(2);
    expect(stats.trends[0].scorePercentage).toBe(75);
    expect(stats.trends[1].scorePercentage).toBe(0);

    // Check weak topics: foreign_key has 1 correct out of 4 (25% accuracy) -> should be flagged as weak topic!
    expect(stats.weakTopics.some((w) => w.topicKey === 'foreign_key')).toBe(true);
    const superKeyStat = stats.topicStats.find((t) => t.topicKey === 'super_key');
    expect(superKeyStat?.accuracyPercentage).toBe(100);
    expect(superKeyStat?.isWeakTopic).toBe(false);
  });
});
