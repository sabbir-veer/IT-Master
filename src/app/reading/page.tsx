'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Filter,
  Layers,
  CheckSquare,
  Square,
  Search,
  Sparkles,
  Zap,
  RotateCcw,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Compass,
  ArrowUp,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ListOrdered,
} from 'lucide-react';
import {
  Dataset,
  DatasetScanResult,
  Question,
  QuestionDifficulty,
} from '@/types/dataset';
import { filterQuestions } from '@/lib/quiz-engine';
import { getBookmarks, isBookmarked, toggleBookmark } from '@/lib/storage';
import ReadingQuestionCard from '@/components/ReadingQuestionCard';
import Pagination from '@/components/Pagination';

function ReadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Datasets from API
  const [datasetsData, setDatasetsData] = useState<DatasetScanResult | null>(null);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  // Filter form state
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | QuestionDifficulty>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reading view state
  const [isReadingModeEntered, setIsReadingModeEntered] = useState<boolean>(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [alwaysShowAnswer, setAlwaysShowAnswer] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Bookmark tracking
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [jumpModalOpen, setJumpModalOpen] = useState<boolean>(false);

  const questionsContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch datasets & read URL params on mount
  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await fetch('/api/datasets');
        if (!res.ok) throw new Error('Failed to load datasets');
        const data: DatasetScanResult = await res.json();
        setDatasetsData(data);

        // Load initial bookmarks
        const bms = getBookmarks();
        setBookmarkIds(new Set(bms.map((b) => b.id)));

        // Read query parameters
        const qDataset = searchParams.get('datasetId');
        const qTopic = searchParams.get('topic');
        const qSubject = searchParams.get('subject');
        const qDiff = searchParams.get('difficulty');
        const qEntered = searchParams.get('entered');

        if (qSubject && data.subjects.some((s) => s.key === qSubject)) {
          setSelectedSubject(qSubject);
        }

        if (qDataset && data.datasets.some((d) => d.dataset_id === qDataset)) {
          setSelectedDatasetId(qDataset);
          const found = data.datasets.find((d) => d.dataset_id === qDataset);
          if (found && found.subject) {
            setSelectedSubject(found.subject);
          }
        }

        if (qTopic) {
          setSelectedTopics([qTopic]);
        }

        if (qDiff && ['easy', 'medium', 'hard'].includes(qDiff)) {
          setSelectedDifficulty(qDiff as QuestionDifficulty);
        }

        // If query parameters specify a dataset or topic, stay in entered reading mode
        // Otherwise, show the filtration view first if datasetId wasn't passed
        if (!qDataset && !qTopic && qEntered !== 'true') {
          setIsReadingModeEntered(false);
          setIsFilterPanelOpen(true);
        }
      } catch (err: unknown) {
        setDatasetError(err instanceof Error ? err.message : 'Error loading datasets');
      } finally {
        setLoadingDatasets(false);
      }
    }

    loadDatasets();
  }, [searchParams]);

  // Update bookmarks set when toggled
  const handleToggleBookmark = (question: Question) => {
    toggleBookmark(question);
    const updated = getBookmarks();
    setBookmarkIds(new Set(updated.map((b) => b.id)));
  };

  // Available datasets filtered by selected subject
  const filteredDatasets = useMemo(() => {
    if (!datasetsData) return [];
    if (selectedSubject === 'all') return datasetsData.datasets;
    return datasetsData.datasets.filter((d) => d.subject === selectedSubject);
  }, [datasetsData, selectedSubject]);

  // Aggregate available topics based on selected subject & dataset
  const availableTopics = useMemo(() => {
    if (!datasetsData) return [];
    let targetDatasets = datasetsData.datasets;

    if (selectedSubject !== 'all') {
      targetDatasets = targetDatasets.filter((d) => d.subject === selectedSubject);
    }
    if (selectedDatasetId !== 'all') {
      targetDatasets = targetDatasets.filter((d) => d.dataset_id === selectedDatasetId);
    }

    const map = new Map<string, { label: string; count: number }>();
    for (const ds of targetDatasets) {
      for (const [key, label] of Object.entries(ds.topics)) {
        const questionCount = ds.questions.filter((q) => q.topic === key).length;
        if (map.has(key)) {
          const prev = map.get(key)!;
          map.set(key, { label, count: prev.count + questionCount });
        } else {
          map.set(key, { label, count: questionCount });
        }
      }
    }

    return Array.from(map.entries()).map(([key, info]) => ({
      key,
      label: info.label,
      count: info.count,
    }));
  }, [datasetsData, selectedSubject, selectedDatasetId]);

  // Extract all matched questions sequentially preserving original dataset order
  const { sequentialQuestions, topicsMap } = useMemo(() => {
    if (!datasetsData) return { sequentialQuestions: [], topicsMap: {} };

    const { matchedQuestions, topicsMap } = filterQuestions(datasetsData.datasets, {
      subject: selectedSubject,
      datasetId: selectedDatasetId,
      selectedTopics,
      difficulty: selectedDifficulty,
      questionCount: 999999, // retrieve all matching questions
    });

    // Apply optional search filter across question text, options, and tags
    let filtered = matchedQuestions;
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(qLower) ||
          q.options.some((opt) => opt.toLowerCase().includes(qLower)) ||
          (q.explanation && q.explanation.toLowerCase().includes(qLower)) ||
          (q.tags && q.tags.some((tag) => tag.toLowerCase().includes(qLower))) ||
          q.topic.toLowerCase().includes(qLower)
      );
    }

    return { sequentialQuestions: filtered, topicsMap };
  }, [datasetsData, selectedSubject, selectedDatasetId, selectedTopics, selectedDifficulty, searchQuery]);

  // Pagination calculation
  const totalQuestions = sequentialQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));

  // Reset page to 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Slice questions for current page
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sequentialQuestions.slice(startIndex, startIndex + pageSize);
  }, [sequentialQuestions, currentPage, pageSize]);

  // Topic selection helpers
  const toggleTopic = (topicKey: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicKey) ? prev.filter((t) => t !== topicKey) : [...prev, topicKey]
    );
    setCurrentPage(1);
  };

  const selectAllTopics = () => {
    setSelectedTopics(availableTopics.map((t) => t.key));
    setCurrentPage(1);
  };

  const clearAllTopics = () => {
    setSelectedTopics([]);
    setCurrentPage(1);
  };

  // Page change handler with smooth scroll to top of questions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (questionsContainerRef.current) {
      questionsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Jump to specific question
  const handleJumpToQuestion = (qIndex: number) => {
    const targetPage = Math.floor(qIndex / pageSize) + 1;
    setCurrentPage(targetPage);
    setJumpModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`question-${qIndex + 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Active dataset title for header
  const activeDatasetTitle = useMemo(() => {
    if (selectedDatasetId !== 'all') {
      const found = datasetsData?.datasets.find((d) => d.dataset_id === selectedDatasetId);
      if (found) return found.title;
    }
    if (selectedSubject !== 'all') {
      const sub = datasetsData?.subjects.find((s) => s.key === selectedSubject);
      if (sub) return sub.title;
    }
    return 'All IT Topics & Datasets';
  }, [datasetsData, selectedDatasetId, selectedSubject]);

  // Loading State
  if (loadingDatasets) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-200">Loading Reading Mode Datasets...</h2>
        <p className="mt-1 text-xs text-slate-400">
          Scanning data folders and arranging sequential question syllabus
        </p>
      </div>
    );
  }

  // Error State
  if (datasetError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="glass-card rounded-2xl p-8 text-center border border-rose-500/30">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
          <h2 className="text-xl font-bold text-white">Dataset Loading Error</h2>
          <p className="mt-2 text-sm text-rose-200">{datasetError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 mb-3">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Sequential Study & Revision Mode</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Dataset{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Reading Mode
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Study questions sequentially in syllabus order with explanations immediately visible.
              Filter by subject, dataset, or specific topics, bookmark tricky questions, or test yourself at your own pace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Quick Switch to Exam Mode with currently selected parameters */}
            <Link
              href={`/quiz?datasetId=${selectedDatasetId}&subject=${selectedSubject}${
                selectedTopics.length > 0 ? `&topic=${selectedTopics[0]}` : ''
              }`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-850 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              Launch Exam Mode
            </Link>

            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isFilterPanelOpen
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750'
              }`}
            >
              <Filter className="h-4 w-4" />
              {isFilterPanelOpen ? 'Hide Filters' : 'Filter Topics'}
              {isFilterPanelOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTERATION SECTION (Appears both as setup and collapsible in reading view) */}
      {/* ========================================================================= */}
      {(!isReadingModeEntered || isFilterPanelOpen) && (
        <div className="mb-8 space-y-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Filter Datasets & Select Topics for Reading
              </h2>
            </div>
            {isReadingModeEntered && (
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Close Filters &times;
              </button>
            )}
          </div>

          {/* 1. Subject Area & Dataset Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. Subject Area:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedDatasetId('all');
                  setSelectedTopics([]);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Subjects (Full IT Syllabus)</option>
                {datasetsData?.subjects.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.title} ({s.totalQuestions} questions)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                2. Dataset / Topic File:
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setSelectedTopics([]);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">
                  All Available Datasets in Scope ({filteredDatasets.length})
                </option>
                {filteredDatasets.map((d) => (
                  <option key={d.dataset_id} value={d.dataset_id}>
                    {d.title} ({d.questions.length} questions)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Topic Multi-Select */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  3. Select Topics ({selectedTopics.length === 0 ? 'All Topics' : `${selectedTopics.length} selected`}):
                </label>
                <span className="text-[11px] text-slate-400">
                  Select specific topics or include all available topics in sequence.
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllTopics}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllTopics}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {availableTopics.map((t) => {
                const isChecked = selectedTopics.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleTopic(t.key)}
                    className={`flex items-center justify-between gap-2 rounded-xl p-3 text-left border text-xs transition-all ${
                      isChecked
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-medium ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-500 shrink-0" />
                      )}
                      <span className="truncate">{t.label}</span>
                    </div>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 shrink-0">
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Difficulty Level & Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                4. Difficulty Level:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
                  const isActive = selectedDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        setSelectedDifficulty(diff);
                        setCurrentPage(1);
                      }}
                      className={`rounded-xl py-2 px-2 text-xs font-bold uppercase tracking-wider border transition-all text-center ${
                        isActive
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                5. Search Questions / Keywords:
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by question, answer, tag or keyword..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action bar: Enter Reading Mode button */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">Matching Questions:</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                {sequentialQuestions.length} Questions
              </span>
              {selectedTopics.length > 0 && (
                <span className="text-slate-400">({selectedTopics.length} topics selected)</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsReadingModeEntered(true);
                  setIsFilterPanelOpen(false);
                  setCurrentPage(1);
                }}
                disabled={sequentialQuestions.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <BookOpen className="h-4 w-4" />
                Enter Reading Mode ({sequentialQuestions.length} Qs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* READING MODE CONTENT & SEQUENTIAL QUESTIONS VIEW */}
      {/* ========================================================================= */}
      <div ref={questionsContainerRef}>
        {/* Sticky/Top Controls Bar for Reading Mode */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:px-6 backdrop-blur-md shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ListOrdered className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white sm:text-base">
                {activeDatasetTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span>{totalQuestions} Questions Total</span>
                <span>&bull;</span>
                <span>Sequential Order</span>
                {selectedDifficulty !== 'all' && (
                  <>
                    <span>&bull;</span>
                    <span className="uppercase text-emerald-400">{selectedDifficulty}</span>
                  </>
                )}
                {searchQuery && (
                  <>
                    <span>&bull;</span>
                    <span className="text-amber-400">Filtered: &quot;{searchQuery}&quot;</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick study toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Always Show Answer vs Self-Test Switch */}
            <button
              type="button"
              onClick={() => setAlwaysShowAnswer(!alwaysShowAnswer)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                alwaysShowAnswer
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle whether answers and explanations appear automatically or require clicking"
            >
              {alwaysShowAnswer ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Answers Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                  <span>Self-Test Mode</span>
                </>
              )}
            </button>

            {/* Quick Question Jump Grid Button */}
            <button
              type="button"
              onClick={() => setJumpModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-750 hover:text-white transition-colors"
              title="Open Question Palette to jump to any question"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-400" />
              <span>Palette Jump</span>
            </button>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-750 hover:text-white transition-colors"
            >
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Adjust Topics</span>
            </button>
          </div>
        </div>

        {/* Top Pagination Control (when dataset has questions) */}
        {totalQuestions > 0 && totalPages > 1 && (
          <div className="mb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalQuestions}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}

        {/* Sequential Question List */}
        {paginatedQuestions.length > 0 ? (
          <div className="space-y-6">
            {paginatedQuestions.map((question, idx) => {
              // Global sequential index (1-based)
              const globalIndex = (currentPage - 1) * pageSize + idx + 1;
              const topicLabel = topicsMap[question.topic] || question.topic.replace(/_/g, ' ');
              const bookmarked = bookmarkIds.has(question.id);

              return (
                <ReadingQuestionCard
                  key={question.id || `${globalIndex}-${question.topic}`}
                  question={question}
                  index={globalIndex}
                  topicLabel={topicLabel}
                  alwaysShowAnswer={alwaysShowAnswer}
                  isBookmarked={bookmarked}
                  onToggleBookmark={() => handleToggleBookmark(question)}
                />
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 my-8">
            <HelpCircle className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-200">No Questions Match Filter</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              No questions found with the current combination of subject, dataset, selected topics, or search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('all');
                setSelectedDatasetId('all');
                setSelectedTopics([]);
                setSelectedDifficulty('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset All Filters
            </button>
          </div>
        )}

        {/* Bottom Pagination Control */}
        {totalQuestions > 0 && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalQuestions}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK QUESTION JUMP PALETTE MODAL */}
      {/* ========================================================================= */}
      {jumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-2xl rounded-3xl border border-slate-800 p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Quick Question Jump Palette ({totalQuestions} Questions)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJumpModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Click any question number below to immediately jump to its page and position.
              Starred questions are highlighted in yellow.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {sequentialQuestions.map((q, qIdx) => {
                const isBookmarkedQ = bookmarkIds.has(q.id);
                const qPage = Math.floor(qIdx / pageSize) + 1;
                const isCurrentPage = qPage === currentPage;

                return (
                  <button
                    key={q.id || qIdx}
                    type="button"
                    onClick={() => handleJumpToQuestion(qIdx)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2 text-xs font-bold transition-all border ${
                      isBookmarkedQ
                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                        : isCurrentPage
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>#{qIdx + 1}</span>
                    {isBookmarkedQ && (
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Current Page
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Starred
                </span>
              </div>
              <button
                type="button"
                onClick={() => setJumpModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-200">Loading Reading Mode...</h2>
        </div>
      }
    >
      <ReadingPageContent />
    </Suspense>
  );
}
