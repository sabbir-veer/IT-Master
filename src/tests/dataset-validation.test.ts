import { describe, it, expect } from 'vitest';
import { validateDataset } from '@/validation/dataset.schema';
import dbKeysData from '../../data/database/db-keys.json';

describe('Dataset Validation Schema', () => {
  it('successfully validates existing data/database/db-keys.json', () => {
    const result = validateDataset(dbKeysData);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toBeDefined();
    expect(result.data?.dataset_id).toBe('dbms_database_keys_bd_it_prep');
    expect(result.data?.questions.length).toBeGreaterThan(0);
  });

  it('rejects dataset missing required dataset_id', () => {
    const invalid = {
      title: 'Missing ID',
      topics: { k1: 'Topic 1' },
      questions: [
        {
          id: 'Q1',
          topic: 'k1',
          question: 'What is 1+1?',
          options: ['1', '2', '3', '4'],
          answer: 1,
        },
      ],
    };
    const result = validateDataset(invalid);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('dataset_id'))).toBe(true);
  });

  it('rejects question with out-of-bounds answer index', () => {
    const invalid = {
      dataset_id: 'test_ds',
      title: 'Invalid Answer Index',
      topics: { k1: 'Topic 1' },
      questions: [
        {
          id: 'Q1',
          topic: 'k1',
          question: 'Sample question?',
          options: ['Option A', 'Option B'],
          answer: 5, // out of bounds (options length is 2)
        },
      ],
    };
    const result = validateDataset(invalid);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('answer') || e.includes('bounds'))).toBe(true);
  });

  it('rejects dataset with empty topics record', () => {
    const invalid = {
      dataset_id: 'test_ds',
      title: 'Empty Topics',
      topics: {},
      questions: [
        {
          id: 'Q1',
          topic: 'k1',
          question: 'Sample question?',
          options: ['A', 'B'],
          answer: 0,
        },
      ],
    };
    const result = validateDataset(invalid);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('topic'))).toBe(true);
  });

  it('rejects dataset with empty questions list', () => {
    const invalid = {
      dataset_id: 'test_ds',
      title: 'No Questions',
      topics: { k1: 'Topic 1' },
      questions: [],
    };
    const result = validateDataset(invalid);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('question'))).toBe(true);
  });
});
