import {
  OverallAnalytics,
  SubjectAccuracyStat,
  TopicAccuracyStat,
  TrendDataPoint,
} from '@/types/analytics';
import { QuizResult } from '@/types/quiz';

export function calculateAnalytics(
  attempts: QuizResult[],
  topicsMap: Record<string, string> = {}
): OverallAnalytics {
  if (!attempts || attempts.length === 0) {
    return {
      totalQuizzes: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalUnanswered: 0,
      overallAccuracy: 0,
      averageScorePercentage: 0,
      bestScorePercentage: 0,
      totalTimeSpentSeconds: 0,
      hasEnoughData: false,
      topicStats: [],
      subjectStats: [],
      weakTopics: [],
      trends: [],
      recentAttempts: [],
      totalPenaltyDeducted: 0,
      netScoreAverage: 0,
      totalConfidentAnswers: 0,
      confidentCorrectCount: 0,
      confidentAccuracy: 0,
      totalGuesses: 0,
      luckyGuessesCount: 0,
      guessAccuracy: 0,
    };
  }

  const totalQuizzes = attempts.length;
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnanswered = 0;
  let totalScorePercentageSum = 0;
  let totalNetScorePercentageSum = 0;
  let bestScorePercentage = 0;
  let totalTimeSpentSeconds = 0;
  let totalPenaltyDeducted = 0;
  let totalConfidentAnswers = 0;
  let confidentCorrectCount = 0;
  let totalGuesses = 0;
  let luckyGuessesCount = 0;

  // Topic aggregations: topicKey -> { correct, incorrect, unanswered, label, subject }
  const topicAgg = new Map<
    string,
    {
      topicKey: string;
      topicLabel: string;
      subject?: string;
      correct: number;
      incorrect: number;
      unanswered: number;
    }
  >();

  // Subject aggregations: subjectKey -> { correct, incorrect, unanswered, title }
  const subjectAgg = new Map<
    string,
    {
      subjectKey: string;
      subjectTitle: string;
      correct: number;
      incorrect: number;
      unanswered: number;
    }
  >();

  for (const attempt of attempts) {
    totalQuestionsAnswered += attempt.totalQuestions;
    totalCorrect += attempt.correctAnswers;
    totalIncorrect += attempt.incorrectAnswers;
    totalUnanswered += attempt.unansweredCount;
    totalScorePercentageSum += attempt.scorePercentage;
    totalNetScorePercentageSum += attempt.netScorePercentage !== undefined ? attempt.netScorePercentage : attempt.scorePercentage;
    totalTimeSpentSeconds += attempt.completionTimeSeconds || 0;
    if (attempt.penaltyDeducted) {
      totalPenaltyDeducted += attempt.penaltyDeducted;
    }
    if (attempt.luckyGuessesCount) {
      luckyGuessesCount += attempt.luckyGuessesCount;
    }

    if (attempt.scorePercentage > bestScorePercentage) {
      bestScorePercentage = attempt.scorePercentage;
    }

    // Process individual answers for granular topic & subject tracking
    for (const ans of attempt.answers || []) {
      // Track confidence & guesses
      if (ans.confidence === 'confident' && ans.selectedOption !== null) {
        totalConfidentAnswers += 1;
        if (ans.isCorrect) {
          confidentCorrectCount += 1;
        }
      } else if (ans.confidence === 'guess' && ans.selectedOption !== null) {
        totalGuesses += 1;
      }
      const tKey = ans.topic || 'general';
      const tLabel =
        ans.topicLabel || topicsMap[tKey] || tKey.replace(/_/g, ' ');
      const sKey = ans.subject || attempt.subject || 'general';
      const sTitle =
        sKey.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      // Topic aggregation
      if (!topicAgg.has(tKey)) {
        topicAgg.set(tKey, {
          topicKey: tKey,
          topicLabel: tLabel,
          subject: sKey,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
        });
      }
      const tStat = topicAgg.get(tKey)!;
      if (ans.isCorrect) {
        tStat.correct += 1;
      } else if (ans.selectedOption === null) {
        tStat.unanswered += 1;
      } else {
        tStat.incorrect += 1;
      }

      // Subject aggregation
      if (!subjectAgg.has(sKey)) {
        subjectAgg.set(sKey, {
          subjectKey: sKey,
          subjectTitle: sTitle,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
        });
      }
      const sStat = subjectAgg.get(sKey)!;
      if (ans.isCorrect) {
        sStat.correct += 1;
      } else if (ans.selectedOption === null) {
        sStat.unanswered += 1;
      } else {
        sStat.incorrect += 1;
      }
    }
  }

  const overallAccuracy =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
      : 0;

  const averageScorePercentage =
    totalQuizzes > 0 ? Math.round(totalScorePercentageSum / totalQuizzes) : 0;

  // Format Topic Stats
  const topicStats: TopicAccuracyStat[] = Array.from(topicAgg.values()).map(
    (item) => {
      const answered = item.correct + item.incorrect + item.unanswered;
      const accuracy = answered > 0 ? Math.round((item.correct / answered) * 100) : 0;
      // Weak topic definition: low accuracy (< 60%) or high incorrect count
      const isWeakTopic = (accuracy < 60 && answered >= 1) || item.incorrect >= 2;

      return {
        topicKey: item.topicKey,
        topicLabel: item.topicLabel,
        subject: item.subject,
        totalAnswered: answered,
        correctCount: item.correct,
        incorrectCount: item.incorrect,
        accuracyPercentage: accuracy,
        isWeakTopic,
      };
    }
  );

  // Sort topic stats: weak first, then by total answered descending
  topicStats.sort((a, b) => {
    if (a.isWeakTopic && !b.isWeakTopic) return -1;
    if (!a.isWeakTopic && b.isWeakTopic) return 1;
    return a.accuracyPercentage - b.accuracyPercentage;
  });

  const weakTopics = topicStats.filter((t) => t.isWeakTopic);

  // Format Subject Stats
  const subjectStats: SubjectAccuracyStat[] = Array.from(
    subjectAgg.values()
  ).map((item) => {
    const answered = item.correct + item.incorrect + item.unanswered;
    const accuracy = answered > 0 ? Math.round((item.correct / answered) * 100) : 0;
    return {
      subjectKey: item.subjectKey,
      subjectTitle: item.subjectTitle,
      totalAnswered: answered,
      correctCount: item.correct,
      incorrectCount: item.incorrect,
      accuracyPercentage: accuracy,
    };
  });

  // Performance trends (chronological, oldest to newest)
  const sortedChronological = [...attempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const trends: TrendDataPoint[] = sortedChronological.map((att, idx) => {
    const dateObj = new Date(att.completedAt);
    const dateLabel = isNaN(dateObj.getTime())
      ? `Quiz ${idx + 1}`
      : dateObj.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        });

    return {
      attemptId: att.id,
      dateLabel: `${dateLabel} (#${idx + 1})`,
      quizTitle: att.datasetTitle || 'Quiz',
      scorePercentage: att.scorePercentage,
      correctCount: att.correctAnswers,
      totalQuestions: att.totalQuestions,
      completionTimeSeconds: att.completionTimeSeconds,
    };
  });

  const confidentAccuracy =
    totalConfidentAnswers > 0
      ? Math.round((confidentCorrectCount / totalConfidentAnswers) * 100)
      : 0;

  const guessAccuracy =
    totalGuesses > 0
      ? Math.round((luckyGuessesCount / totalGuesses) * 100)
      : 0;

  const netScoreAverage =
    totalQuizzes > 0 ? Math.round(totalNetScorePercentageSum / totalQuizzes) : 0;

  // Recent attempts (newest first)
  const recentAttempts = [...attempts].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return {
    totalQuizzes,
    totalQuestionsAnswered,
    totalCorrect,
    totalIncorrect,
    totalUnanswered,
    overallAccuracy,
    averageScorePercentage,
    bestScorePercentage,
    totalTimeSpentSeconds,
    hasEnoughData: totalQuizzes > 0,
    topicStats,
    subjectStats,
    weakTopics,
    trends,
    recentAttempts,
    totalPenaltyDeducted: Math.round(totalPenaltyDeducted * 100) / 100,
    netScoreAverage,
    totalConfidentAnswers,
    confidentCorrectCount,
    confidentAccuracy,
    totalGuesses,
    luckyGuessesCount,
    guessAccuracy,
  };
}
