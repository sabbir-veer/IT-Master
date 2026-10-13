'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  RotateCcw,
  Filter,
  ArrowRight,
  HelpCircle,
  Layers,
  Hourglass,
  Target,
  ShieldAlert,
} from 'lucide-react';
import { QuizResult } from '@/types/quiz';
import { getAttemptById, getLastResult, getMistakeVault } from '@/lib/storage';
import ReviewCard from '@/components/ReviewCard';

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'skipped'>('all');
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    const attemptId = searchParams.get('id');
    if (attemptId) {
      const found = getAttemptById(attemptId);
      if (found) {
        setResult(found);
      } else {
        setResult(getLastResult());
      }
    } else {
      setResult(getLastResult());
    }
    setVaultCount(getMistakeVault().length);
    setLoading(false);
  }, [searchParams]);

  // Topic breakdown within this quiz attempt
  const topicBreakdown = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { topic: string; label: string; total: number; correct: number }>();

    for (const a of result.answers) {
      const tKey = a.topic;
      const tLabel = a.topicLabel || tKey.replace(/_/g, ' ');

      if (!map.has(tKey)) {
        map.set(tKey, { topic: tKey, label: tLabel, total: 0, correct: 0 });
      }
      const item = map.get(tKey)!;
      item.total += 1;
      if (a.isCorrect) {
        item.correct += 1;
      }
    }

    return Array.from(map.values()).map((item) => ({
      ...item,
      accuracy: Math.round((item.correct / item.total) * 100),
    }));
  }, [result]);

  // Filtered answers for review
  const filteredAnswers = useMemo(() => {
    if (!result) return [];
    if (reviewFilter === 'all') return result.answers;
    if (reviewFilter === 'incorrect') {
      return result.answers.filter((a) => !a.isCorrect && a.selectedOption !== null);
    }
    if (reviewFilter === 'correct') {
      return result.answers.filter((a) => a.isCorrect);
    }
    if (reviewFilter === 'skipped') {
      return result.answers.filter((a) => a.selectedOption === null);
    }
    return result.answers;
  }, [result, reviewFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-200">Loading Quiz Results...</h2>
      </div>
    );
  }

  // Empty state if no attempts exist
  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="glass-card rounded-3xl p-10 border border-slate-800">
          <Award className="mx-auto h-14 w-14 text-slate-600 mb-3" />
          <h2 className="text-xl font-bold text-white">No Quiz Results Found</h2>
          <p className="mt-2 text-sm text-slate-400">
            You haven&apos;t completed any quizzes in this browser yet. Take a smart quiz to generate your first score and performance report.
          </p>
          <div className="mt-6">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-md hover:bg-emerald-400"
            >
              <Sparkles className="h-4 w-4" /> Start a Quiz Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Grade rating
  const isNegative = !!result.negativeMarking;
  const percentage = isNegative
    ? (result.netScorePercentage ?? result.scorePercentage)
    : result.scorePercentage;

  let gradeText = 'Needs Revision';
  let gradeBadgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  let gradeMessage =
    'Focus on the explanations below and review weak topics before your next practice test.';

  if (percentage >= 80) {
    gradeText = 'Outstanding Mastery';
    gradeBadgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    gradeMessage =
      'Excellent performance! You have strong command over these exam questions and key concepts.';
  } else if (percentage >= 60) {
    gradeText = 'Solid Progress';
    gradeBadgeColor = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    gradeMessage =
      'Good baseline understanding. Review the incorrect questions to push your accuracy above 80%.';
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${gradeBadgeColor}`}
              >
                <Award className="h-4 w-4" />
                {gradeText} ({percentage}%)
              </span>

              {isNegative && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-300 border border-rose-500/30">
                  <ShieldAlert className="h-3.5 w-3.5" /> Negative Marking Active (-0.25)
                </span>
              )}

              {result.timerMode && result.timerMode !== 'untimed' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                  <Clock className="h-3.5 w-3.5" />
                  {result.timerMode === 'dataset_recommended'
                    ? 'Question-Weighted Countdown'
                    : result.timerMode === 'speed_drill'
                    ? 'Speed Drill (45s/Q)'
                    : 'Standard Exam (60s/Q)'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  <Hourglass className="h-3.5 w-3.5" /> Untimed Practice
                </span>
              )}

              {result.timeExpired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 animate-pulse">
                  <AlertCircle className="h-3.5 w-3.5" /> Auto-Submitted (Time Out)
                </span>
              )}

              {result.luckyGuessesCount && result.luckyGuessesCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {result.luckyGuessesCount} Lucky Guess{result.luckyGuessesCount > 1 ? 'es' : ''}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Quiz Results & Score Review
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Exam: <strong className="text-white">{result.datasetTitle}</strong> • Completed{' '}
              {new Date(result.completedAt).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>

            <p className="mt-2 text-xs text-slate-400 max-w-xl">{gradeMessage}</p>
          </div>

          {/* Radial score card */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-950/80 p-6 border border-slate-800 shrink-0 w-full sm:w-auto">
            <span className="text-4xl sm:text-5xl font-black text-emerald-400">
              {percentage}%
            </span>
            <span className="mt-1 text-xs font-semibold text-slate-400">
              {isNegative ? (
                <>Net: <strong className="text-white">{result.netScore}</strong> / {result.totalQuestions}</>
              ) : (
                <>Score: {result.correctAnswers} / {result.totalQuestions}</>
              )}
            </span>
            {isNegative && (
              <span className="mt-1 text-[10px] text-slate-400">
                Gross: {result.correctAnswers} &bull; Penalty: -{result.penaltyDeducted}
              </span>
            )}
          </div>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-6">
          <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Correct</span>
            </div>
            <div className="mt-1 text-xl font-bold text-emerald-400">
              {result.correctAnswers}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <XCircle className="h-4 w-4 text-rose-400" />
              <span>Incorrect</span>
            </div>
            <div className="mt-1 text-xl font-bold text-rose-400">
              {result.incorrectAnswers}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Skipped</span>
            </div>
            <div className="mt-1 text-xl font-bold text-amber-400">
              {result.unansweredCount}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>Time Taken</span>
            </div>
            <div className="mt-1 text-xl font-bold text-blue-400">
              {formatTime(result.completionTimeSeconds)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
          >
            <RotateCcw className="h-4 w-4" /> Retake or New Quiz
          </Link>

          {result.incorrectAnswers > 0 && (
            <Link
              href="/quiz?mode=mistakes"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
            >
              <Target className="h-4 w-4 text-rose-400" />
              Practice Mistake Vault ({vaultCount} Qs)
            </Link>
          )}

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-750"
          >
            <BarChart3 className="h-4 w-4 text-emerald-400" /> View Analytics History
          </Link>
        </div>
      </div>

      {/* Topic Accuracy Breakdown in this test */}
      {topicBreakdown.length > 0 && (
        <div className="mb-10 glass-card rounded-2xl p-6 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            Topic-Wise Performance in This Quiz
          </h2>

          <div className="space-y-3">
            {topicBreakdown.map((t) => (
              <div key={t.topic} className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">{t.label}</span>
                  <span className="text-slate-400">
                    <strong className="text-emerald-400">{t.correct}</strong> / {t.total} ({t.accuracy}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      t.accuracy >= 80
                        ? 'bg-emerald-400'
                        : t.accuracy >= 60
                        ? 'bg-blue-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Review Section */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-400" />
              Detailed Answer & Explanation Review
            </h2>
            <p className="text-xs text-slate-400">
              Star high-yield questions to review later, examine lucky guesses, and learn concepts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                reviewFilter === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({result.answers.length})
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('incorrect')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-500/20 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Incorrect ({result.incorrectAnswers})
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('correct')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correct ({result.correctAnswers})
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('skipped')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                reviewFilter === 'skipped'
                  ? 'bg-slate-700 text-slate-200 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Skipped ({result.unansweredCount})
            </button>
          </div>
        </div>

        {/* Questions list */}
        {filteredAnswers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-xs text-slate-400">
            No questions match the current filter &apos;{reviewFilter}&apos;.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredAnswers.map((ans, idx) => (
              <ReviewCard
                key={ans.questionId}
                answer={ans}
                index={idx}
                negativeMarking={result.negativeMarking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-200">Loading Results...</h2>
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
