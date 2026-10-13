import { z } from 'zod';
import { Dataset } from '@/types/dataset';

export const QuestionDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const QuestionSchema = z
  .object({
    id: z.string().min(1, 'Question ID cannot be empty'),
    topic: z.string().min(1, 'Topic cannot be empty'),
    question: z.string().min(1, 'Question text cannot be empty'),
    options: z.array(z.string().min(1, 'Option text cannot be empty')).min(2, 'At least 2 options are required'),
    answer: z.number().int().min(0, 'Answer index must be non-negative'),
    explanation: z.string().optional().default(''),
    difficulty: QuestionDifficultySchema.optional().default('medium'),
    tags: z.array(z.string()).optional().default([]),
    time_seconds: z.number().positive().optional().default(60),
    dataset_id: z.string().optional(),
    dataset_title: z.string().optional(),
    subject: z.string().optional(),
  })
  .refine(
    (data) => data.answer < data.options.length,
    {
      message: 'Answer index is out of bounds for options length',
      path: ['answer'],
    }
  );

export const DatasetSchema = z.object({
  dataset_id: z.string().min(1, 'dataset_id cannot be empty'),
  title: z.string().min(1, 'title cannot be empty'),
  description: z.string().optional(),
  subject: z.string().optional(),
  subjectTitle: z.string().optional(),
  filePath: z.string().optional(),
  topics: z
    .record(z.string(), z.string())
    .refine((topics) => Object.keys(topics).length > 0, 'At least one topic must be defined'),
  questions: z.array(QuestionSchema).min(1, 'At least one question is required'),
});

export type ValidatedQuestion = z.infer<typeof QuestionSchema>;
export type ValidatedDataset = z.infer<typeof DatasetSchema>;

export interface ValidationResult {
  success: boolean;
  data?: Dataset;
  errors: string[];
}

export function validateDataset(data: unknown): ValidationResult {
  const result = DatasetSchema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data as Dataset,
      errors: [],
    };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
  );
  return {
    success: false,
    errors,
  };
}
