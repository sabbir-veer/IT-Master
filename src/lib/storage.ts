import { ActiveQuizState, QuizResult } from '@/types/quiz';
import { Question } from '@/types/dataset';

const STORAGE_KEYS = {
  ATTEMPTS: 'bd_it_quiz_attempts_v1',
  ACTIVE_QUIZ: 'bd_it_active_quiz_v1',
  LAST_RESULT: 'bd_it_last_result_v1',
  MISTAKE_VAULT: 'bd_it_mistake_vault_v1',
  BOOKMARKS: 'bd_it_bookmarks_v1',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// ==========================================
// QUIZ ATTEMPTS & RESULTS
// ==========================================

export function saveAttempt(result: QuizResult): void {
  if (!isBrowser()) return;
  try {
    const existing = getAttempts();
    const updated = [result, ...existing];
    window.localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(updated));
    // Also store as latest result for /results page display
    saveLastResult(result);
  } catch (error) {
    console.error('Failed to save quiz attempt to localStorage:', error);
  }
}

export function getAttempts(): QuizResult[] {
  if (!isBrowser()) return [];
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!data) return [];
    return JSON.parse(data) as QuizResult[];
  } catch (error) {
    console.error('Failed to parse quiz attempts from localStorage:', error);
    return [];
  }
}

export function getAttemptById(id: string): QuizResult | null {
  const attempts = getAttempts();
  return attempts.find((a) => a.id === id) || null;
}

export function deleteAttempt(id: string): void {
  if (!isBrowser()) return;
  try {
    const existing = getAttempts();
    const updated = existing.filter((a) => a.id !== id);
    window.localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete quiz attempt:', error);
  }
}

export function clearAllAttempts(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
  } catch (error) {
    console.error('Failed to clear quiz attempts:', error);
  }
}

export function saveActiveQuiz(state: ActiveQuizState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.ACTIVE_QUIZ, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save active quiz state:', error);
  }
}

export function getActiveQuiz(): ActiveQuizState | null {
  if (!isBrowser()) return null;
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_QUIZ);
    if (!data) return null;
    return JSON.parse(data) as ActiveQuizState;
  } catch (error) {
    console.error('Failed to get active quiz state:', error);
    return null;
  }
}

export function clearActiveQuiz(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_QUIZ);
  } catch (error) {
    console.error('Failed to clear active quiz state:', error);
  }
}

export function saveLastResult(result: QuizResult): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.LAST_RESULT, JSON.stringify(result));
  } catch (error) {
    console.error('Failed to save last quiz result:', error);
  }
}

export function getLastResult(): QuizResult | null {
  if (!isBrowser()) return null;
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.LAST_RESULT);
    if (!data) return null;
    return JSON.parse(data) as QuizResult;
  } catch (error) {
    console.error('Failed to get last quiz result:', error);
    return null;
  }
}

// ==========================================
// SMART MISTAKE VAULT (REVISION MODE)
// ==========================================

export function getMistakeVault(): Question[] {
  if (!isBrowser()) return [];
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.MISTAKE_VAULT);
    if (!data) return [];
    return JSON.parse(data) as Question[];
  } catch (error) {
    console.error('Failed to get mistake vault:', error);
    return [];
  }
}

export function addMistakesToVault(questions: Question[]): void {
  if (!isBrowser() || questions.length === 0) return;
  try {
    const existing = getMistakeVault();
    const map = new Map<string, Question>();
    // Insert existing
    for (const q of existing) {
      map.set(q.id, q);
    }
    // Add new mistakes (or update)
    for (const q of questions) {
      map.set(q.id, q);
    }
    window.localStorage.setItem(
      STORAGE_KEYS.MISTAKE_VAULT,
      JSON.stringify(Array.from(map.values()))
    );
  } catch (error) {
    console.error('Failed to add mistakes to vault:', error);
  }
}

export function removeMistakesFromVault(questionIds: string[]): void {
  if (!isBrowser() || questionIds.length === 0) return;
  try {
    const existing = getMistakeVault();
    const toRemove = new Set(questionIds);
    const updated = existing.filter((q) => !toRemove.has(q.id));
    window.localStorage.setItem(STORAGE_KEYS.MISTAKE_VAULT, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove resolved questions from mistake vault:', error);
  }
}

export function clearMistakeVault(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.MISTAKE_VAULT);
  } catch (error) {
    console.error('Failed to clear mistake vault:', error);
  }
}

// ==========================================
// QUESTION BOOKMARKS / STARRED
// ==========================================

export function getBookmarks(): Question[] {
  if (!isBrowser()) return [];
  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!data) return [];
    return JSON.parse(data) as Question[];
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    return [];
  }
}

export function isBookmarked(questionId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((q) => q.id === questionId);
}

export function toggleBookmark(question: Question): boolean {
  if (!isBrowser()) return false;
  try {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((q) => q.id === question.id);
    let updated: Question[];
    let nowBookmarked: boolean;

    if (exists) {
      updated = bookmarks.filter((q) => q.id !== question.id);
      nowBookmarked = false;
    } else {
      updated = [question, ...bookmarks];
      nowBookmarked = true;
    }

    window.localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return nowBookmarked;
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return false;
  }
}

export function clearBookmarks(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
  } catch (error) {
    console.error('Failed to clear bookmarks:', error);
  }
}
