import { QuizResult } from './quiz';

export interface TopicAccuracyStat {
  topicKey: string;
  topicLabel: string;
  subject?: string;
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  isWeakTopic: boolean;
}

export interface SubjectAccuracyStat {
  subjectKey: string;
  subjectTitle: string;
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
}

export interface TrendDataPoint {
  attemptId: string;
  dateLabel: string;
  quizTitle: string;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  completionTimeSeconds: number;
}

export interface OverallAnalytics {
  totalQuizzes: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  overallAccuracy: number; // percentage
  averageScorePercentage: number;
  bestScorePercentage: number;
  totalTimeSpentSeconds: number;
  hasEnoughData: boolean;
  topicStats: TopicAccuracyStat[];
  subjectStats: SubjectAccuracyStat[];
  weakTopics: TopicAccuracyStat[];
  trends: TrendDataPoint[];
  recentAttempts: QuizResult[];
  // Negative marking simulation stats
  totalPenaltyDeducted: number;
  netScoreAverage: number;
  // Guess & Confidence stats
  totalConfidentAnswers: number;
  confidentCorrectCount: number;
  confidentAccuracy: number;
  totalGuesses: number;
  luckyGuessesCount: number;
  guessAccuracy: number;
}
