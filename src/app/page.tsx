'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  BarChart3,
  Award,
  ArrowRight,
  Database,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  RotateCcw,
  Star,
  Zap,
  ShieldAlert,
  Target,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { DatasetScanResult } from '@/types/dataset';
import { OverallAnalytics } from '@/types/analytics';
import { getAttempts, getLastResult, getMistakeVault, getBookmarks } from '@/lib/storage';
import { calculateAnalytics } from '@/lib/analytics';

export default function HomePage() {
  const [datasetsData, setDatasetsData] = useState<DatasetScanResult | null>(null);
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [mistakeVaultCount, setMistakeVaultCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/datasets');
        if (!res.ok) {
          throw new Error('Failed to load question datasets');
        }
        const data: DatasetScanResult = await res.json();
        setDatasetsData(data);

        // Load local storage analytics
        const attempts = getAttempts();
        const stats = calculateAnalytics(attempts);
        setAnalytics(stats);

        // Load vault and bookmark counts
        setMistakeVaultCount(getMistakeVault().length);
        setBookmarksCount(getBookmarks().length);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize app';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const lastResult = typeof window !== 'undefined' ? getLastResult() : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Target: Bangladesh Bank AD (IT) & BPSC IT Officer</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Master Bangladesh Government{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              IT Job Exams
            </span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
            Practice topic-wise smart quizzes generated from specialized syllabus datasets.
            Featuring negative marking simulation, mistake vault spaced repetition, and in-depth performance analytics.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              Custom Quiz Setup
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-750 hover:text-white"
            >
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              Performance Analytics
            </Link>

            {mistakeVaultCount > 0 && (
              <Link
                href="/quiz?mode=mistakes"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-900/60"
              >
                <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                Review {mistakeVaultCount} Missed Questions
              </Link>
            )}

            {bookmarksCount > 0 && (
              <Link
                href="/quiz?mode=bookmarks"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-900/60"
              >
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                Practice {bookmarksCount} Starred
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner if invalid files or load failed */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Warning if invalid datasets found during scan */}
      {datasetsData?.invalidFiles && datasetsData.invalidFiles.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
            <AlertTriangle className="h-4 w-4" />
            Dataset validation notice:
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {datasetsData.invalidFiles.map((inv, idx) => (
              <li key={idx}>
                <strong>{inv.filePath}:</strong> {inv.errors.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1-Click Official Exam Simulation Presets */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              1-Click Exam Presets & Rapid Drills
            </h2>
            <p className="text-xs text-slate-400">
              Curated tests matching Bangladesh Bank AD (IT) and BPSC IT Officer recruitment patterns.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Preset 1: BB AD IT */}
          <div className="glass-card-interactive flex flex-col justify-between rounded-2xl p-6 border border-slate-800 bg-slate-900/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldAlert className="h-20 w-20 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                  Govt Standard
                </span>
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  -0.25 Negative Marking
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Bangladesh Bank AD (IT) Mock
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Full syllabus cross-topic simulation. 20 Questions, 20-minute countdown exam timer, standard -0.25 penalty per incorrect answer.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  20 Questions
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  20 Min Timer
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  All Topics
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/quiz?preset=bb_ad_it"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:scale-[1.01]"
              >
                <Zap className="h-3.5 w-3.5" /> Launch BB AD Mock Exam
              </Link>
            </div>
          </div>

          {/* Preset 2: BPSC Speed Drill */}
          <div className="glass-card-interactive flex flex-col justify-between rounded-2xl p-6 border border-slate-800 bg-slate-900/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="h-20 w-20 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/30">
                  Speed Drill
                </span>
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  -0.25 Negative Marking
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                BPSC IT Officer Speed Sprint
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                High-pressure 45 seconds/question sprint drill. Train speed and accuracy under countdown timer constraints.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  15 Questions
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  45s / Question
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  Speed Focused
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/quiz?preset=bpsc_speed"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-400 hover:scale-[1.01]"
              >
                <Clock className="h-3.5 w-3.5" /> Launch Speed Sprint
              </Link>
            </div>
          </div>

          {/* Preset 3: DBMS Key Mastery */}
          <div className="glass-card-interactive flex flex-col justify-between rounded-2xl p-6 border border-slate-800 bg-slate-900/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Database className="h-20 w-20 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400 ring-1 ring-blue-500/30">
                  Topic Mastery
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  High-Yield Core
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                Database Keys Complete Mastery
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                All 30 high-frequency database questions covering Super Keys, Candidate Keys, Primary Keys, Foreign Keys, and Referential Integrity.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  30 Questions
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  Recommended Time
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 border border-slate-800">
                  Full Coverage
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/quiz?preset=db_keys_mastery"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-blue-400 hover:scale-[1.01]"
              >
                <Database className="h-3.5 w-3.5" /> Launch Database Test
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Revision Hub: Mistake Vault & Bookmarks */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
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
                {mistakeVaultCount > 0 ? `${mistakeVaultCount} Pending` : 'Clean Slate'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Every question you miss across quizzes is automatically preserved here. Retaking this drill and answering correctly automatically removes them from your vault.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-rose-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {mistakeVaultCount > 0
                ? `${mistakeVaultCount} question${mistakeVaultCount === 1 ? '' : 's'} to resolve`
                : 'No pending mistakes!'}
            </span>
            {mistakeVaultCount > 0 ? (
              <Link
                href="/quiz?mode=mistakes"
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Practice Mistakes Now
              </Link>
            ) : (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Cleared
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
                    Quick Revision
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 ring-1 ring-amber-500/30">
                {bookmarksCount} Starred
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Star tricky or high-frequency conceptual questions during any quiz or review to compile a targeted revision bank before your official exam date.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-amber-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {bookmarksCount > 0
                ? `${bookmarksCount} question${bookmarksCount === 1 ? '' : 's'} saved`
                : 'Click the star icon on any question to bookmark'}
            </span>
            {bookmarksCount > 0 ? (
              <Link
                href="/quiz?mode=bookmarks"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                <Star className="h-3.5 w-3.5 fill-slate-950" /> Practice Starred
              </Link>
            ) : (
              <Link
                href="/quiz"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                Start Quiz to Star Questions &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary Metrics */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-400" />
            Your Preparation Summary
          </h2>
          {analytics && analytics.hasEnoughData && (
            <Link
              href="/analytics"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Detailed Breakdown &rarr;
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Quizzes Attempted"
            value={analytics?.totalQuizzes || 0}
            subtitle={
              analytics?.hasEnoughData
                ? `${analytics.totalQuestionsAnswered} total questions answered`
                : 'No quizzes attempted yet'
            }
            icon={BookOpen}
            accentColor="emerald"
            badge={analytics?.hasEnoughData ? 'Active Candidate' : 'Start Today'}
          />

          <StatCard
            title="Overall Accuracy"
            value={analytics?.hasEnoughData ? `${analytics.overallAccuracy}%` : '0%'}
            subtitle={
              analytics?.hasEnoughData
                ? `${analytics.totalCorrect} correct answers`
                : 'Complete a quiz to measure'
            }
            icon={CheckCircle2}
            accentColor="blue"
          />

          <StatCard
            title="Average Score"
            value={
              analytics?.hasEnoughData
                ? `${analytics.averageScorePercentage}%`
                : '0%'
            }
            subtitle={
              analytics?.hasEnoughData
                ? `Best score: ${analytics.bestScorePercentage}%`
                : 'Benchmark your knowledge'
            }
            icon={BarChart3}
            accentColor="indigo"
          />

          <StatCard
            title="Last Quiz Score"
            value={lastResult ? `${lastResult.scorePercentage}%` : 'None'}
            subtitle={
              lastResult
                ? `${lastResult.correctAnswers}/${lastResult.totalQuestions} correct (${lastResult.datasetTitle})`
                : 'Take your first test'
            }
            icon={Clock}
            accentColor="amber"
            badge={lastResult ? 'Recent Attempt' : undefined}
          />
        </div>
      </div>

      {/* Available Question Datasets & Subjects */}
      <div className="mt-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-emerald-400" />
              Available Subjects & Topic Datasets
            </h2>
            <p className="text-xs text-slate-400">
              The engine automatically detects all JSON datasets added inside the{' '}
              <code className="text-emerald-400 font-mono">data/</code> directory.
            </p>
          </div>
          <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-300 border border-slate-800">
            Total Available Questions:{' '}
            <strong className="text-emerald-400">
              {datasetsData?.totalQuestions || 0}
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse"
              />
            ))}
          </div>
        ) : datasetsData?.summaries && datasetsData.summaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {datasetsData.summaries.map((ds) => (
              <div
                key={ds.dataset_id}
                className="glass-card-interactive flex flex-col justify-between rounded-2xl p-6 border border-slate-800"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                      {ds.subjectTitle}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {ds.totalQuestions} Questions
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-white">{ds.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    File: <span className="font-mono text-slate-300">{ds.filePath}</span>
                  </p>

                  {/* Topics list preview */}
                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Included Topics ({Object.keys(ds.topics).length}):
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {Object.entries(ds.topics).map(([key, label]) => (
                        <span
                          key={key}
                          className="rounded bg-slate-900/90 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-800"
                        >
                          {label} ({ds.topicCounts[key] || 0})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-4">
                  <Link
                    href={`/quiz?datasetId=${ds.dataset_id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800/90 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 hover:text-slate-950"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Practice This Dataset
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center border border-slate-800">
            <Database className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-slate-300">No Datasets Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please ensure your JSON question files are placed inside the{' '}
              <code className="text-emerald-400 font-mono">data/</code> directory.
            </p>
          </div>
        )}
      </div>

      {/* Government IT Exam Structure Overview */}
      <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          Target IT Job Syllabus Coverage
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          This system is optimized for Bangladesh Bank, BPSC, ministries, and state bank IT Officer exams.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">
              Database Systems (DBMS)
            </span>
            <p className="text-slate-400 leading-relaxed">
              Super Keys, Candidate Keys, Primary Keys, Foreign Keys, Referential Integrity, Normalization (1NF to BCNF), Indexing, SQL Queries.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
            <span className="font-bold text-blue-400 block mb-1">
              Computer Networks
            </span>
            <p className="text-slate-400 leading-relaxed">
              OSI & TCP/IP layers, Subnetting (CIDR), Routing protocols, DNS, DHCP, SSL/TLS, Network Security, Packet Flow.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">
              Software Engineering & OOP
            </span>
            <p className="text-slate-400 leading-relaxed">
              SDLC, Agile/Scrum, Design Patterns, OOP Principles (Polymorphism, Encapsulation), Unit Testing, Clean Code.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">
              Computer Architecture & OS
            </span>
            <p className="text-slate-400 leading-relaxed">
              CPU pipelining, Cache memory, Virtual memory & paging, Process scheduling, Deadlocks, Semaphore & Synchronization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
