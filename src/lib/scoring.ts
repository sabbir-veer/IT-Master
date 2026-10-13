import { Question } from '@/types/dataset';
import { ConfidenceLevel, QuizConfig, QuizQuestionAnswer, QuizResult } from '@/types/quiz';
import { addMistakesToVault, removeMistakesFromVault } from './storage';

export function calculateQuizScore(params: {
  questions: Question[];
  userAnswers: Record<string, number | null>;
  flaggedQuestions?: Record<string, boolean>;
  confidenceLevels?: Record<string, ConfidenceLevel>;
  config: QuizConfig;
  datasetTitle: string;
  topicsMap?: Record<string, string>;
  completionTimeSeconds: number;
  timeExpired?: boolean;
}): QuizResult {
  const {
    questions,
    userAnswers,
    flaggedQuestions = {},
    confidenceLevels = {},
    config,
    datasetTitle,
    topicsMap = {},
    completionTimeSeconds,
    timeExpired = false,
  } = params;

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const newlyMissedQuestions: Question[] = [];
  const correctlyAnsweredIds: string[] = [];

  const answers: QuizQuestionAnswer[] = questions.map((q) => {
    const selectedOption = userAnswers[q.id] ?? null;
    const isUnanswered = selectedOption === null;
    const isCorrect = !isUnanswered && selectedOption === q.answer;
    const isFlagged = !!flaggedQuestions[q.id];
    const confidence = confidenceLevels[q.id];
    const isLuckyGuess = confidence === 'guess' && isCorrect;

    if (isUnanswered) {
      unansweredCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
      correctlyAnsweredIds.push(q.id);
    } else {
      incorrectCount += 1;
      newlyMissedQuestions.push(q);
    }

    const topicLabel = topicsMap[q.topic] || q.topic.replace(/_/g, ' ');

    return {
      questionId: q.id,
      selectedOption,
      correctOption: q.answer,
      isCorrect,
      topic: q.topic,
      topicLabel,
      datasetId: q.dataset_id || config.datasetId,
      datasetTitle: q.dataset_title || datasetTitle,
      subject: q.subject || config.subject,
      explanation: q.explanation || '',
      questionText: q.question,
      options: q.options,
      difficulty: q.difficulty,
      isFlagged,
      confidence,
      isLuckyGuess,
    };
  });

  // Automatically update the Mistake Vault:
  // 1. Remove questions the candidate has successfully answered correctly
  if (correctlyAnsweredIds.length > 0) {
    removeMistakesFromVault(correctlyAnsweredIds);
  }
  // 2. Add newly missed questions to the vault for targeted revision
  if (newlyMissedQuestions.length > 0) {
    addMistakesToVault(newlyMissedQuestions);
  }

  const totalQuestions = questions.length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Negative Marking calculations
  const negativeMarking = !!config.negativeMarking;
  const penaltyPerWrong = config.penaltyPerWrong ?? 0.25;
  const grossScore = correctCount;
  const penaltyDeducted = negativeMarking
    ? Math.round(incorrectCount * penaltyPerWrong * 100) / 100
    : 0;
  const netScore = negativeMarking
    ? Math.max(0, Math.round((grossScore - penaltyDeducted) * 100) / 100)
    : grossScore;
  const netScorePercentage =
    totalQuestions > 0 ? Math.max(0, Math.round((netScore / totalQuestions) * 100)) : 0;

  const luckyGuessesCount = answers.filter((a) => a.isLuckyGuess).length;
  const flaggedCount = answers.filter((a) => a.isFlagged).length;

  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: attemptId,
    datasetId: config.datasetId,
    datasetTitle,
    subject: config.subject,
    selectedTopics: config.selectedTopics,
    difficulty: config.difficulty,
    timerMode: config.timerMode,
    totalTimeLimitSeconds: config.totalTimeLimitSeconds,
    timeExpired,
    negativeMarking,
    penaltyPerWrong,
    penaltyDeducted,
    grossScore,
    netScore,
    netScorePercentage,
    luckyGuessesCount,
    flaggedCount,
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unansweredCount,
    scorePercentage,
    completionTimeSeconds: Math.max(1, Math.round(completionTimeSeconds)),
    completedAt: new Date().toISOString(),
    answers,
  };
}
