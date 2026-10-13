import { Question, QuestionDifficulty } from './dataset';

export type TimerMode =
  | 'dataset_recommended'
  | 'standard_exam'
  | 'speed_drill'
  | 'untimed';

export type ConfidenceLevel = 'confident' | 'guess';

export interface QuizConfig {
  datasetId: string; // 'all' or specific dataset_id
  subject: string; // 'all' or specific subject like 'database', 'networking'
  selectedTopics: string[]; // empty means all topics within scope
  difficulty: 'all' | QuestionDifficulty;
  questionCount: number;
  timerMode?: TimerMode;
  totalTimeLimitSeconds?: number; // total allocated seconds if countdown, or 0 if untimed
  negativeMarking?: boolean; // enable -0.25 penalty per incorrect answer
  penaltyPerWrong?: number; // default 0.25
  presetName?: string;
  isMistakeDrill?: boolean;
  isBookmarkDrill?: boolean;
}

export interface QuizQuestionAnswer {
  questionId: string;
  selectedOption: number | null; // null if skipped/unanswered
  correctOption: number;
  isCorrect: boolean;
  topic: string;
  topicLabel?: string;
  datasetId?: string;
  datasetTitle?: string;
  subject?: string;
  explanation?: string;
  questionText: string;
  options: string[];
  difficulty?: QuestionDifficulty;
  isFlagged?: boolean;
  confidence?: ConfidenceLevel;
  isLuckyGuess?: boolean;
  isBookmarked?: boolean;
}

export interface QuizResult {
  id: string; // unique attempt ID
  datasetId: string;
  datasetTitle: string;
  subject: string;
  selectedTopics: string[];
  difficulty: 'all' | QuestionDifficulty;
  timerMode?: TimerMode;
  totalTimeLimitSeconds?: number;
  timeExpired?: boolean;
  negativeMarking?: boolean;
  penaltyPerWrong?: number;
  penaltyDeducted?: number;
  grossScore?: number;
  netScore?: number;
  netScorePercentage?: number;
  luckyGuessesCount?: number;
  flaggedCount?: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  scorePercentage: number;
  completionTimeSeconds: number;
  completedAt: string; // ISO string
  answers: QuizQuestionAnswer[];
}

export interface ActiveQuizState {
  config: QuizConfig;
  questions: Question[];
  userAnswers: Record<string, number | null>; // questionId -> selectedOption index
  flaggedQuestions?: Record<string, boolean>; // questionId -> isFlagged
  confidenceLevels?: Record<string, ConfidenceLevel>; // questionId -> confidence
  currentQuestionIndex: number;
  startTime: number; // timestamp in ms
  elapsedSeconds: number;
  remainingSeconds?: number;
  totalTimeLimitSeconds?: number;
}
