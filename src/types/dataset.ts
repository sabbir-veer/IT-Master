export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: number; // 0-based index of the correct option
  explanation?: string;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  time_seconds?: number;
  // Optional metadata populated when scanning across multiple datasets
  dataset_id?: string;
  dataset_title?: string;
  subject?: string;
}

export interface Dataset {
  dataset_id: string;
  title: string;
  description?: string;
  subject?: string; // e.g. "database", "networking", "swe"
  subjectTitle?: string; // e.g. "Database", "Networking", "Software Engineering"
  filePath?: string; // relative to data/ e.g. "database/db-keys.json"
  topics: Record<string, string>; // topicKey -> topicDisplayLabel
  questions: Question[];
}

export interface TopicInfo {
  key: string;
  label: string;
  questionCount: number;
  datasetId: string;
  datasetTitle: string;
  subject: string;
}

export interface DatasetSummary {
  dataset_id: string;
  title: string;
  subject: string;
  subjectTitle: string;
  filePath: string;
  totalQuestions: number;
  topics: Record<string, string>;
  topicCounts: Record<string, number>;
  difficultyCounts: Record<QuestionDifficulty, number>;
}

export interface SubjectSummary {
  key: string;
  title: string;
  datasetCount: number;
  totalQuestions: number;
  datasets: DatasetSummary[];
}

export interface DatasetScanResult {
  datasets: Dataset[];
  summaries: DatasetSummary[];
  subjects: SubjectSummary[];
  totalQuestions: number;
  invalidFiles: { filePath: string; errors: string[] }[];
}
