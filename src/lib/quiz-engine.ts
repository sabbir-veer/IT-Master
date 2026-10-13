import { Dataset, Question } from '@/types/dataset';
import { QuizConfig, TimerMode } from '@/types/quiz';

export interface QuizGenerationResult {
  success: boolean;
  questions: Question[];
  totalAvailable: number;
  requestedCount: number;
  totalTimeLimitSeconds: number;
  warning?: string;
  error?: string;
}

/**
 * Modern Fisher-Yates (Knuth) unbiased shuffle.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculates total allocated exam time in seconds according to selected TimerMode.
 * - 'dataset_recommended': Sum of question time_seconds (defaults to 60s if not set)
 * - 'standard_exam': Exactly 60s per question (Bangladesh Bank AD IT / BPSC style)
 * - 'speed_drill': Fast pace 45s per question
 * - 'untimed': 0 (no cutoff)
 */
export function calculateTotalTimeLimit(
  questions: Question[],
  mode: TimerMode = 'dataset_recommended'
): number {
  if (mode === 'untimed') return 0;
  if (mode === 'standard_exam') {
    return questions.length * 60;
  }
  if (mode === 'speed_drill') {
    return questions.length * 45;
  }
  // dataset_recommended: sum of each question's time_seconds (fallback 60)
  return questions.reduce((sum, q) => sum + (q.time_seconds && q.time_seconds > 0 ? q.time_seconds : 60), 0);
}

/**
 * Format seconds into a friendly human-readable duration (e.g. "7m 30s" or "10 mins").
 */
export function formatDurationLabel(seconds: number): string {
  if (seconds <= 0) return 'Untimed';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }
  return `${mins}m ${secs}s`;
}

/**
 * Filter pool of questions based on config (subject, dataset, topics, difficulty).
 */
export function filterQuestions(
  allDatasets: Dataset[],
  config: QuizConfig
): { matchedQuestions: Question[]; topicsMap: Record<string, string> } {
  const topicsMap: Record<string, string> = {};

  // 1. Filter datasets by subject and datasetId
  let relevantDatasets = allDatasets;
  if (config.subject && config.subject !== 'all') {
    relevantDatasets = relevantDatasets.filter((d) => d.subject === config.subject);
  }
  if (config.datasetId && config.datasetId !== 'all') {
    relevantDatasets = relevantDatasets.filter((d) => d.dataset_id === config.datasetId);
  }

  // Populate topicsMap for all relevant datasets
  for (const ds of relevantDatasets) {
    Object.assign(topicsMap, ds.topics);
  }

  // 2. Extract questions and apply topic & difficulty filters
  const pool: Question[] = [];
  const seenIds = new Set<string>();

  for (const ds of relevantDatasets) {
    for (const q of ds.questions) {
      // Ensure question has dataset context
      const questionItem: Question = {
        ...q,
        dataset_id: q.dataset_id || ds.dataset_id,
        dataset_title: q.dataset_title || ds.title,
        subject: q.subject || ds.subject,
      };

      // Topic filter: if config.selectedTopics is non-empty, must match
      if (
        config.selectedTopics &&
        config.selectedTopics.length > 0 &&
        !config.selectedTopics.includes(questionItem.topic)
      ) {
        continue;
      }

      // Difficulty filter: if not 'all', must match
      if (
        config.difficulty &&
        config.difficulty !== 'all' &&
        questionItem.difficulty !== config.difficulty
      ) {
        continue;
      }

      // Prevent duplicates across datasets if same ID exists
      if (!seenIds.has(questionItem.id)) {
        seenIds.add(questionItem.id);
        pool.push(questionItem);
      }
    }
  }

  return { matchedQuestions: pool, topicsMap };
}

/**
 * Generate a quiz from datasets and config.
 */
export function generateQuiz(
  allDatasets: Dataset[],
  config: QuizConfig
): QuizGenerationResult {
  const { matchedQuestions } = filterQuestions(allDatasets, config);

  if (matchedQuestions.length === 0) {
    return {
      success: false,
      questions: [],
      totalAvailable: 0,
      requestedCount: config.questionCount,
      totalTimeLimitSeconds: 0,
      error:
        'No questions match your selected criteria. Try selecting more topics or changing the difficulty filter.',
    };
  }

  // Randomize the order of matching questions
  const shuffled = shuffleArray(matchedQuestions);

  // Take requested count or maximum available
  const countToTake = Math.min(config.questionCount, shuffled.length);
  const selectedQuestions = shuffled.slice(0, countToTake);

  const timerMode = config.timerMode || 'dataset_recommended';
  const totalTimeLimitSeconds = calculateTotalTimeLimit(selectedQuestions, timerMode);

  let warning: string | undefined;
  if (config.questionCount > shuffled.length) {
    warning = `Only ${shuffled.length} questions match your filter. The quiz has been generated with all ${shuffled.length} available questions.`;
  }

  return {
    success: true,
    questions: selectedQuestions,
    totalAvailable: shuffled.length,
    requestedCount: config.questionCount,
    totalTimeLimitSeconds,
    warning,
  };
}
