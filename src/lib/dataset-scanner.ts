import fs from 'node:fs/promises';
import path from 'node:path';
import {
  Dataset,
  DatasetScanResult,
  DatasetSummary,
  Question,
  QuestionDifficulty,
  SubjectSummary,
} from '@/types/dataset';
import { validateDataset } from '@/validation/dataset.schema';

const KNOWN_SUBJECT_TITLES: Record<string, string> = {
  database: 'Database Management Systems',
  dbms: 'Database Management Systems',
  networking: 'Computer Networks & Security',
  swe: 'Software Engineering',
  software_engineering: 'Software Engineering',
  computer_architecture: 'Computer Architecture & Org.',
  coa: 'Computer Architecture',
  os: 'Operating Systems',
  operating_systems: 'Operating Systems',
  dsa: 'Data Structures & Algorithms',
  algorithms: 'Data Structures & Algorithms',
  web: 'Web Development & Technologies',
  bangladesh_affairs: 'General Knowledge & IT GK',
};

function formatSubjectTitle(folderName: string): string {
  const normalized = folderName.toLowerCase().trim();
  if (KNOWN_SUBJECT_TITLES[normalized]) {
    return KNOWN_SUBJECT_TITLES[normalized];
  }
  return folderName
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getJsonFilesRecursively(dir: string, baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await getJsonFilesRecursively(fullPath, baseDir);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function scanDatasets(customDataDir?: string): Promise<DatasetScanResult> {
  const dataDir = customDataDir || path.join(process.cwd(), 'data');

  try {
    await fs.access(dataDir);
  } catch {
    return {
      datasets: [],
      summaries: [],
      subjects: [],
      totalQuestions: 0,
      invalidFiles: [
        {
          filePath: dataDir,
          errors: ['Data directory does not exist or is not readable'],
        },
      ],
    };
  }

  const jsonFiles = await getJsonFilesRecursively(dataDir, dataDir);
  const datasets: Dataset[] = [];
  const invalidFiles: { filePath: string; errors: string[] }[] = [];

  for (const filePath of jsonFiles) {
    const relPath = path.relative(dataDir, filePath);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const validation = validateDataset(parsed);

      if (!validation.success || !validation.data) {
        invalidFiles.push({
          filePath: relPath,
          errors: validation.errors,
        });
        continue;
      }

      const parentDirName = path.dirname(relPath).split(path.sep)[0] || 'general';
      const subjectKey = parentDirName === '.' ? 'general' : parentDirName;
      const subjectTitle = formatSubjectTitle(subjectKey);

      const dataset: Dataset = {
        ...validation.data,
        subject: subjectKey,
        subjectTitle,
        filePath: relPath,
        questions: validation.data.questions.map((q) => ({
          ...q,
          dataset_id: validation.data?.dataset_id,
          dataset_title: validation.data?.title,
          subject: subjectKey,
        })),
      };

      datasets.push(dataset);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      invalidFiles.push({
        filePath: relPath,
        errors: [`JSON parse or read error: ${errorMsg}`],
      });
    }
  }

  // Generate summaries
  const summaries: DatasetSummary[] = datasets.map((dataset) => {
    const topicCounts: Record<string, number> = {};
    const difficultyCounts: Record<QuestionDifficulty, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    for (const q of dataset.questions) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      const diff = (q.difficulty || 'medium') as QuestionDifficulty;
      if (difficultyCounts[diff] !== undefined) {
        difficultyCounts[diff] += 1;
      }
    }

    return {
      dataset_id: dataset.dataset_id,
      title: dataset.title,
      subject: dataset.subject || 'general',
      subjectTitle: dataset.subjectTitle || 'General',
      filePath: dataset.filePath || '',
      totalQuestions: dataset.questions.length,
      topics: dataset.topics,
      topicCounts,
      difficultyCounts,
    };
  });

  // Group by subjects
  const subjectMap = new Map<string, SubjectSummary>();
  for (const summary of summaries) {
    const sKey = summary.subject;
    if (!subjectMap.has(sKey)) {
      subjectMap.set(sKey, {
        key: sKey,
        title: summary.subjectTitle,
        datasetCount: 0,
        totalQuestions: 0,
        datasets: [],
      });
    }
    const subj = subjectMap.get(sKey)!;
    subj.datasetCount += 1;
    subj.totalQuestions += summary.totalQuestions;
    subj.datasets.push(summary);
  }

  const subjects = Array.from(subjectMap.values());
  const totalQuestions = datasets.reduce((acc, d) => acc + d.questions.length, 0);

  return {
    datasets,
    summaries,
    subjects,
    totalQuestions,
    invalidFiles,
  };
}

export async function getDatasetById(
  id: string,
  customDataDir?: string
): Promise<Dataset | null> {
  const result = await scanDatasets(customDataDir);
  return result.datasets.find((d) => d.dataset_id === id) || null;
}
