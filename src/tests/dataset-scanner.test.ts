import { describe, it, expect } from 'vitest';
import { scanDatasets } from '@/lib/dataset-scanner';
import { generateQuiz } from '@/lib/quiz-engine';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Dataset Scanner (Dynamic multi-folder discovery)', () => {
  it('scans the data directory and detects db-keys.json under database folder', async () => {
    const result = await scanDatasets();

    expect(result.datasets.length).toBeGreaterThanOrEqual(1);
    const dbKeys = result.datasets.find((d) => d.dataset_id === 'dbms_database_keys_bd_it_prep');
    expect(dbKeys).toBeDefined();
    expect(dbKeys?.subject).toBe('database');
    expect(dbKeys?.subjectTitle).toBe('Database Management Systems');
    expect(dbKeys?.questions.length).toBe(30);

    // Subject summary
    const dbSubject = result.subjects.find((s) => s.key === 'database');
    expect(dbSubject).toBeDefined();
    expect(dbSubject?.datasets.length).toBeGreaterThanOrEqual(1);
    expect(result.totalQuestions).toBeGreaterThanOrEqual(30);
    expect(result.invalidFiles).toEqual([]);
  });

  it('automatically discovers newly added subject folders and topic json files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'govtech-test-'));

    try {
      // 1. Create database folder with 2 topic files
      const dbDir = path.join(tempDir, 'database');
      await fs.mkdir(dbDir, { recursive: true });

      const dbFile1 = {
        dataset_id: 'db_keys',
        title: 'Database Keys',
        topics: { super_key: 'Super Key' },
        questions: [
          {
            id: 'DB1',
            topic: 'super_key',
            question: 'What is a super key?',
            options: ['Option 1', 'Option 2'],
            answer: 0,
          },
        ],
      };
      await fs.writeFile(path.join(dbDir, 'db-keys.json'), JSON.stringify(dbFile1));

      const dbFile2 = {
        dataset_id: 'db_norm',
        title: 'Normalization',
        topics: { '3nf': 'Third Normal Form' },
        questions: [
          {
            id: 'DB2',
            topic: '3nf',
            question: 'What is 3NF?',
            options: ['Option 1', 'Option 2'],
            answer: 1,
          },
        ],
      };
      await fs.writeFile(path.join(dbDir, 'normalization.json'), JSON.stringify(dbFile2));

      // 2. Create networking folder with topic file
      const netDir = path.join(tempDir, 'networking');
      await fs.mkdir(netDir, { recursive: true });

      const netFile = {
        dataset_id: 'net_osi',
        title: 'OSI Reference Model',
        topics: { transport: 'Transport Layer' },
        questions: [
          {
            id: 'NET1',
            topic: 'transport',
            question: 'What protocol runs on Transport layer?',
            options: ['TCP', 'IP'],
            answer: 0,
          },
        ],
      };
      await fs.writeFile(path.join(netDir, 'osi.json'), JSON.stringify(netFile));

      // 3. Create swe folder
      const sweDir = path.join(tempDir, 'swe');
      await fs.mkdir(sweDir, { recursive: true });

      const sweFile = {
        dataset_id: 'swe_design',
        title: 'Design Patterns',
        topics: { singleton: 'Singleton Pattern' },
        questions: [
          {
            id: 'SWE1',
            topic: 'singleton',
            question: 'Singleton ensures what?',
            options: ['One instance', 'Multiple instances'],
            answer: 0,
          },
        ],
      };
      await fs.writeFile(path.join(sweDir, 'patterns.json'), JSON.stringify(sweFile));

      // Run scan on the multi-folder directory
      const result = await scanDatasets(tempDir);

      expect(result.datasets).toHaveLength(4);
      expect(result.subjects).toHaveLength(3);
      expect(result.totalQuestions).toBe(4);

      const subjectsMap = new Map(result.subjects.map((s) => [s.key, s]));
      expect(subjectsMap.has('database')).toBe(true);
      expect(subjectsMap.get('database')?.datasetCount).toBe(2);
      expect(subjectsMap.has('networking')).toBe(true);
      expect(subjectsMap.has('swe')).toBe(true);

      // Verify cross-subject quiz generation works across all 4 datasets
      const quiz = generateQuiz(result.datasets, {
        datasetId: 'all',
        subject: 'all',
        selectedTopics: [],
        difficulty: 'all',
        questionCount: 4,
      });

      expect(quiz.success).toBe(true);
      expect(quiz.questions).toHaveLength(4);
      const questionIds = quiz.questions.map((q) => q.id);
      expect(questionIds).toContain('DB1');
      expect(questionIds).toContain('DB2');
      expect(questionIds).toContain('NET1');
      expect(questionIds).toContain('SWE1');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
