'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Trash2,
  Layers,
  ArrowRight,
  ExternalLink,
  Target,
  RotateCcw,
  Star,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import { OverallAnalytics } from '@/types/analytics';
import { QuizResult } from '@/types/quiz';
import {
  getAttempts,
  deleteAttempt,
  clearAllAttempts,
  getMistakeVault,
  clearMistakeVault,
  getBookmarks,
  clearBookmarks,
} from '@/lib/storage';
import { calculateAnalytics } from '@/lib/analytics';

export default function AnalyticsPage() {
  const [attempts, setAttempts] = useState<QuizResult[]>([]);
  const [mistakeVaultCount, setMistakeVaultCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const stored = getAttempts();
    setAttempts(stored);
    setMistakeVaultCount(getMistakeVault().length);
    setBookmarksCount(getBookmarks().length);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const analytics: OverallAnalytics = useMemo(() => {
    return calculateAnalytics(attempts);
  }, [attempts]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz attempt record?')) {
      deleteAttempt(id);
      loadData();
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'Warning: This will permanently delete all your quiz attempt history from localStorage. Are you sure?'
      )
    ) {
      clearAllAttempts();
      loadData();
    }
  };

  const handleClearMistakes = () => {
    if (confirm('Are you sure you want to clear your Mistake Vault?')) {
      clearMistakeVault();
      setMistakeVaultCount(0);
    }
  };

  const handleClearBookmarks = () => {
    if (confirm('Are you sure you want to clear all bookmarked questions?')) {
      clearBookmarks();
      setBookmarksCount(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-200">Loading Analytics...</h2>
      </div>
    );
  }

  // Empty state handling when no attempts exist
  if (!analytics.hasEnoughData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="glass-card rounded-3xl p-10 border border-slate-800">
          <BarChart3 className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h1 className="text-2xl font-bold text-white">No Attempt History Available</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            There is not enough attempt history to calculate meaningful analytics yet. Complete quizzes to unlock accuracy stats, topic performance breakdown, and weak-area diagnosis.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              <Sparkles className="h-4 w-4" /> Take Your First Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 mb-2">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Progress Tracking & Performance Analysis</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Quiz Analytics & History
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Insights calculated from all completed quizzes saved in browser storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
          >
            <Sparkles className="h-4 w-4" /> Take Another Quiz
          </Link>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-rose-400"
            title="Clear all quiz attempt history"
          >
            <Trash2 className="h-4 w-4" /> Clear History
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Quizzes Attempted"
          value={analytics.totalQuizzes}
          subtitle={`${analytics.totalQuestionsAnswered} total questions answered`}
          icon={BookOpen}
          accentColor="emerald"
        />

        <StatCard
          title="Overall Accuracy"
          value={`${analytics.overallAccuracy}%`}
          subtitle={`${analytics.totalCorrect} correct / ${analytics.totalIncorrect} incorrect`}
          icon={CheckCircle2}
          accentColor="blue"
        />

        <StatCard
          title="Average Score"
          value={`${analytics.averageScorePercentage}%`}
          subtitle={
            analytics.totalPenaltyDeducted > 0
              ? `Net Avg: ${analytics.netScoreAverage}% (Best: ${analytics.bestScorePercentage}%)`
              : `Highest score: ${analytics.bestScorePercentage}%`
          }
          icon={TrendingUp}
          accentColor="indigo"
        />

        <StatCard
          title="Total Practice Time"
          value={formatTime(analytics.totalTimeSpentSeconds)}
          subtitle="Cumulative time spent answering"
          icon={Clock}
          accentColor="amber"
        />
      </div>

      {/* Smart Revision Hub: Mistake Vault & Bookmarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Mistake Vault Card */}
        <div className="glass-card rounded-2xl p-6 border border-rose-500/20 bg-rose-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Smart Mistake Vault</h3>
                  <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">
                    Spaced Repetition
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                  mistakeVaultCount > 0
                    ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {mistakeVaultCount > 0 ? `${mistakeVaultCount} Pending` : 'Vault Empty'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Auto-saves every question you missed. Retesting and answering correctly automatically removes them from this vault.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-rose-500/20 flex items-center justify-between">
            {mistakeVaultCount > 0 ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <Link
                  href="/quiz?mode=mistakes"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Practice {mistakeVaultCount} Mistakes
                </Link>
                <button
                  type="button"
                  onClick={handleClearMistakes}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                  title="Clear all mistakes"
                >
                  Clear Vault
                </button>
              </div>
            ) : (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> No pending mistakes to practice!
              </span>
            )}
          </div>
        </div>

        {/* Bookmarked Questions Card */}
        <div className="glass-card rounded-2xl p-6 border border-amber-500/20 bg-amber-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400/20" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Important Question Bookmarks</h3>
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                    Targeted Revision
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 ring-1 ring-amber-500/30">
                {bookmarksCount} Starred
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Curated bank of high-yield questions you marked with the star button during quizzes and solution reviews.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-amber-500/20 flex items-center justify-between">
            {bookmarksCount > 0 ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <Link
                  href="/quiz?mode=bookmarks"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  <Star className="h-3.5 w-3.5 fill-slate-950" /> Practice {bookmarksCount} Starred
                </Link>
                <button
                  type="button"
                  onClick={handleClearBookmarks}
                  className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                  title="Clear all bookmarks"
                >
                  Clear Starred
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Star key questions during exams to build your revision set
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostics: Negative Marking Impact & Guess Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Negative Marking Impact */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Negative Marking Simulator Impact</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Bangladesh Bank and BPSC IT Officer exams deduct 0.25 marks per wrong answer. Here is how penalties affect your scores:
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Total Penalties Incurred
              </span>
              <span className="text-lg font-bold text-rose-400">
                {analytics.totalPenaltyDeducted > 0
                  ? `-${analytics.totalPenaltyDeducted.toFixed(2)} pts`
                  : '0.00 pts'}
              </span>
            </div>

            <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Net Score Average
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {analytics.netScoreAverage}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                vs Gross: {analytics.averageScorePercentage}%
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
            💡 <strong>Exam Strategy Tip:</strong> Unanswered questions receive 0 deduction. If you have zero confidence, skipping protects your merit position compared to wild guessing.
          </div>
        </div>

        {/* Guess Analysis & Confidence */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Confidence & Guess Analysis</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Separates genuine mastery from lucky guesses when answering questions under pressure.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Confident Accuracy
              </span>
              <span className="text-lg font-bold text-blue-400">
                {analytics.totalConfidentAnswers > 0
                  ? `${analytics.confidentAccuracy}%`
                  : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {analytics.confidentCorrectCount} of {analytics.totalConfidentAnswers} confident correct
              </span>
            </div>

            <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Lucky Guesses Count
              </span>
              <span className="text-lg font-bold text-purple-400">
                {analytics.luckyGuessesCount}
              </span>
              <span className="text-[10px] text-slate-500 block">
                out of {analytics.totalGuesses} guesses
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-500/10 p-3 border border-indigo-500/20 text-xs text-indigo-300/90 leading-relaxed">
            🎯 <strong>Insight:</strong> Lucky guesses artificially inflate practice scores. Identify topics where you guessed and review their conceptual explanations.
          </div>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="mb-8">
        <TrendChart trends={analytics.trends} />
      </div>

      {/* Weak Topics Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-400" />
              Identified Weak Topics
            </h2>
            <p className="text-xs text-slate-400">
              Topics with accuracy below 60% or repeated incorrect answers requiring targeted revision.
            </p>
          </div>
        </div>

        {analytics.weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.weakTopics.map((wt) => (
              <div
                key={wt.topicKey}
                className="glass-card flex flex-col justify-between rounded-2xl p-5 border border-rose-500/20 bg-rose-950/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                      {wt.topicLabel}
                    </span>
                    <span className="text-xs font-bold text-rose-400">
                      {wt.accuracyPercentage}% Accuracy
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-300">
                    You answered <strong className="text-emerald-400">{wt.correctCount}</strong> correctly
                    and missed <strong className="text-rose-400">{wt.incorrectCount}</strong> questions in this topic.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Priority for Next Exam</span>
                  <Link
                    href={`/quiz?topic=${wt.topicKey}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors"
                  >
                    Practice This Topic <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center border border-emerald-500/20 bg-emerald-950/10">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-emerald-300">No Weak Topics Detected</h3>
            <p className="mt-1 text-xs text-slate-400">
              All your attempted topics maintain 60%+ accuracy. Keep up the high standard!
            </p>
          </div>
        )}
      </div>

      {/* Topic-Wise Accuracy Breakdown */}
      <div className="mb-8 glass-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          Complete Topic-Wise Accuracy Breakdown
        </h2>

        <div className="space-y-4">
          {analytics.topicStats.map((stat) => (
            <div key={stat.topicKey} className="rounded-xl bg-slate-900/60 p-4 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-200">
                    {stat.topicLabel}
                  </span>
                  {stat.isWeakTopic && (
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                      Needs Practice
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  <strong className="text-white">{stat.correctCount}</strong> / {stat.totalAnswered} Correct (
                  <span
                    className={
                      stat.accuracyPercentage >= 80
                        ? 'text-emerald-400 font-bold'
                        : stat.accuracyPercentage >= 60
                        ? 'text-blue-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {stat.accuracyPercentage}%
                  </span>
                  )
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    stat.accuracyPercentage >= 80
                      ? 'bg-emerald-400'
                      : stat.accuracyPercentage >= 60
                      ? 'bg-blue-400'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${stat.accuracyPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Quiz Attempt History */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          Individual Quiz Attempt History ({attempts.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Exam / Dataset</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Correct / Total</th>
                <th className="py-3 px-4">Penalty / Net</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {analytics.recentAttempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                    {new Date(attempt.completedAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                    {attempt.datasetTitle}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                        attempt.scorePercentage >= 80
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : attempt.scorePercentage >= 60
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {attempt.scorePercentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                    {attempt.correctAnswers} / {attempt.totalQuestions}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {attempt.negativeMarking ? (
                      <div className="flex flex-col text-[11px]">
                        <span className="font-semibold text-rose-400">
                          {attempt.penaltyDeducted && attempt.penaltyDeducted > 0
                            ? `-${attempt.penaltyDeducted.toFixed(2)} pts`
                            : '0 penalty'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Net: {attempt.netScorePercentage ?? attempt.scorePercentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Untracked</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                    {formatTime(attempt.completionTimeSeconds)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/results?id=${attempt.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        <ExternalLink className="h-3 w-3" /> Review
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(attempt.id)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                        title="Delete this record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
