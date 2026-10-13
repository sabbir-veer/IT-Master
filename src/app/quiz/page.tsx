'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  AlertTriangle,
  Zap,
  Hourglass,
  HelpCircle,
  Timer,
  Target,
  Star,
  Flame,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import {
  Dataset,
  DatasetScanResult,
  Question,
  QuestionDifficulty,
} from '@/types/dataset';
import {
  ActiveQuizState,
  ConfidenceLevel,
  QuizConfig,
  QuizResult,
  TimerMode,
} from '@/types/quiz';
import {
  generateQuiz,
  filterQuestions,
  calculateTotalTimeLimit,
  formatDurationLabel,
  shuffleArray,
} from '@/lib/quiz-engine';
import { calculateQuizScore } from '@/lib/scoring';
import {
  saveAttempt,
  saveActiveQuiz,
  getActiveQuiz,
  clearActiveQuiz,
  saveLastResult,
  getMistakeVault,
  getBookmarks,
  isBookmarked,
  toggleBookmark,
} from '@/lib/storage';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';
import QuestionPalette from '@/components/QuestionPalette';
import SubmitModal from '@/components/SubmitModal';

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Datasets data from server
  const [datasetsData, setDatasetsData] = useState<DatasetScanResult | null>(null);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  // In-progress quiz resume prompt
  const [savedQuizState, setSavedQuizState] = useState<ActiveQuizState | null>(null);

  // Vault & Bookmark counts
  const [mistakeVaultCount, setMistakeVaultCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);

  // Setup form state
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | QuestionDifficulty>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedTimerMode, setSelectedTimerMode] = useState<TimerMode>('dataset_recommended');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentConfig, setCurrentConfig] = useState<QuizConfig | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, ConfidenceLevel>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalTimeLimitSeconds, setTotalTimeLimitSeconds] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Reference for stable timer callback
  const submitHandlerRef = useRef<(isTimeout?: boolean) => void>(() => {});

  // 1. Fetch datasets on mount
  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await fetch('/api/datasets');
        if (!res.ok) throw new Error('Failed to load datasets');
        const data: DatasetScanResult = await res.json();
        setDatasetsData(data);

        // Vault & bookmarks count
        const mistakes = getMistakeVault();
        setMistakeVaultCount(mistakes.length);
        const bms = getBookmarks();
        setBookmarksCount(bms.length);

        // Check query params
        const qDataset = searchParams.get('datasetId');
        const qTopic = searchParams.get('topic');
        const qMode = searchParams.get('mode');
        const qPreset = searchParams.get('preset');

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

        // Preset shortcuts via query params
        if (
          (qMode === 'mistakes' || qPreset === 'mistakes' || qPreset === 'mistake_vault') &&
          mistakes.length > 0
        ) {
          launchMistakeVaultDrill(mistakes);
          return;
        }

        if ((qMode === 'bookmarks' || qPreset === 'bookmarks') && bms.length > 0) {
          launchBookmarksDrill(bms);
          return;
        }

        if (
          qPreset === 'bb_ad_it' ||
          qPreset === 'bpsc_speed' ||
          qPreset === 'db_keys_mastery'
        ) {
          launchPreset(qPreset, data.datasets);
          return;
        }

        // Check for saved active quiz in localStorage
        const active = getActiveQuiz();
        if (active && active.questions && active.questions.length > 0) {
          setSavedQuizState(active);
        }
      } catch (err: unknown) {
        setDatasetError(err instanceof Error ? err.message : 'Error loading datasets');
      } finally {
        setLoadingDatasets(false);
      }
    }

    loadDatasets();
  }, [searchParams]);

  // Submit quiz logic
  const handleConfirmSubmit = (isTimeout = false) => {
    if (!currentConfig || currentQuestions.length === 0) return;

    // Determine dataset title
    let datasetTitle = currentConfig.presetName || 'Government IT Mock Test';
    if (!currentConfig.presetName) {
      if (currentConfig.datasetId !== 'all') {
        const match = datasetsData?.datasets.find((d) => d.dataset_id === currentConfig.datasetId);
        if (match) datasetTitle = match.title;
      } else if (currentConfig.subject !== 'all') {
        const subjMatch = datasetsData?.subjects.find((s) => s.key === currentConfig.subject);
        if (subjMatch) datasetTitle = `${subjMatch.title} Practice Test`;
      }
    }

    // Build topics map
    const topicsMap: Record<string, string> = {};
    if (datasetsData) {
      for (const ds of datasetsData.datasets) {
        Object.assign(topicsMap, ds.topics);
      }
    }

    const result: QuizResult = calculateQuizScore({
      questions: currentQuestions,
      userAnswers,
      flaggedQuestions,
      confidenceLevels,
      config: currentConfig,
      datasetTitle,
      topicsMap,
      completionTimeSeconds: elapsedSeconds,
      timeExpired: isTimeout,
    });

    // Save to storage
    saveAttempt(result);
    saveLastResult(result);
    clearActiveQuiz();

    // Update mistake count
    setMistakeVaultCount(getMistakeVault().length);

    setIsSubmitModalOpen(false);
    setQuizActive(false);

    // Navigate to results
    router.push(`/results?id=${result.id}`);
  };

  // Keep submitHandlerRef in sync
  useEffect(() => {
    submitHandlerRef.current = handleConfirmSubmit;
  });

  // 2. Timer effect for active quiz (countdown or stopwatch)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (quizActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prevElapsed) => {
          const nextElapsed = prevElapsed + 1;

          // If timed countdown mode
          if (currentConfig?.timerMode && currentConfig.timerMode !== 'untimed') {
            setRemainingSeconds((prevRem) => {
              if (prevRem <= 1) {
                // Time Expired! Trigger auto-submit
                setTimeout(() => {
                  submitHandlerRef.current(true);
                }, 10);
                return 0;
              }
              return prevRem - 1;
            });
          }

          // Periodically sync active quiz state to localStorage
          if (currentConfig && currentQuestions.length > 0) {
            saveActiveQuiz({
              config: currentConfig,
              questions: currentQuestions,
              userAnswers,
              flaggedQuestions,
              confidenceLevels,
              currentQuestionIndex,
              startTime: Date.now() - nextElapsed * 1000,
              elapsedSeconds: nextElapsed,
              remainingSeconds: currentConfig.timerMode !== 'untimed' ? remainingSeconds : undefined,
              totalTimeLimitSeconds,
            });
          }

          return nextElapsed;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizActive, currentConfig, currentQuestions, userAnswers, flaggedQuestions, confidenceLevels, currentQuestionIndex, remainingSeconds, totalTimeLimitSeconds]);

  // Available datasets filtered by selected subject
  const filteredDatasets = useMemo(() => {
    if (!datasetsData) return [];
    if (selectedSubject === 'all') return datasetsData.datasets;
    return datasetsData.datasets.filter((d) => d.subject === selectedSubject);
  }, [datasetsData, selectedSubject]);

  // Available topics for currently selected dataset(s)
  const availableTopics = useMemo(() => {
    if (!datasetsData) return [];
    const topicsMap = new Map<string, { key: string; label: string; count: number }>();

    let targetDatasets = datasetsData.datasets;
    if (selectedSubject !== 'all') {
      targetDatasets = targetDatasets.filter((d) => d.subject === selectedSubject);
    }
    if (selectedDatasetId !== 'all') {
      targetDatasets = targetDatasets.filter((d) => d.dataset_id === selectedDatasetId);
    }

    for (const ds of targetDatasets) {
      for (const [key, label] of Object.entries(ds.topics)) {
        const questionCount = ds.questions.filter((q) => q.topic === key).length;
        if (topicsMap.has(key)) {
          topicsMap.get(key)!.count += questionCount;
        } else {
          topicsMap.set(key, { key, label, count: questionCount });
        }
      }
    }

    return Array.from(topicsMap.values());
  }, [datasetsData, selectedSubject, selectedDatasetId]);

  // Real-time calculation of how many questions match current selection
  const matchingQuestions = useMemo(() => {
    if (!datasetsData) return [];
    const config: QuizConfig = {
      datasetId: selectedDatasetId,
      subject: selectedSubject,
      selectedTopics,
      difficulty: selectedDifficulty,
      questionCount,
    };
    const { matchedQuestions } = filterQuestions(datasetsData.datasets, config);
    return matchedQuestions;
  }, [datasetsData, selectedSubject, selectedDatasetId, selectedTopics, selectedDifficulty, questionCount]);

  const matchingQuestionsCount = matchingQuestions.length;

  // Real-time estimated duration for the 4 timer modes based on matching questions
  const estimatedTimes = useMemo(() => {
    const effectiveCount = Math.min(questionCount, Math.max(1, matchingQuestionsCount));
    const sampleQuestions = matchingQuestions.slice(0, effectiveCount);

    return {
      dataset_recommended: calculateTotalTimeLimit(sampleQuestions, 'dataset_recommended'),
      standard_exam: calculateTotalTimeLimit(sampleQuestions, 'standard_exam'),
      speed_drill: calculateTotalTimeLimit(sampleQuestions, 'speed_drill'),
      untimed: 0,
    };
  }, [matchingQuestions, questionCount, matchingQuestionsCount]);

  // Handle topic checkbox toggle
  const toggleTopic = (topicKey: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicKey) ? prev.filter((t) => t !== topicKey) : [...prev, topicKey]
    );
  };

  const selectAllTopics = () => {
    setSelectedTopics(availableTopics.map((t) => t.key));
  };

  const clearAllTopics = () => {
    setSelectedTopics([]);
  };

  // Launch a Preset Test
  const launchPreset = (
    presetType: 'bb_ad_it' | 'bpsc_speed' | 'db_keys_mastery',
    customDatasets?: Dataset[]
  ) => {
    const datasets = customDatasets || datasetsData?.datasets;
    if (!datasets || datasets.length === 0) return;

    if (presetType === 'bb_ad_it') {
      // Bangladesh Bank AD IT Mock: 20 Qs, All Subjects, 20 mins, Negative Marking ON
      setSelectedSubject('all');
      setSelectedDatasetId('all');
      setSelectedTopics([]);
      setSelectedDifficulty('all');
      setQuestionCount(20);
      setSelectedTimerMode('standard_exam');
      setNegativeMarking(true);

      const config: QuizConfig = {
        datasetId: 'all',
        subject: 'all',
        selectedTopics: [],
        difficulty: 'all',
        questionCount: 20,
        timerMode: 'standard_exam',
        negativeMarking: true,
        penaltyPerWrong: 0.25,
        presetName: 'Bangladesh Bank AD (IT) Mock Exam',
      };
      executeQuizStart(config, datasets);
    } else if (presetType === 'bpsc_speed') {
      // BPSC Speed Drill: 15 Qs, Speed Drill (45s/Q), Negative Marking ON
      setSelectedSubject('all');
      setSelectedDatasetId('all');
      setSelectedTopics([]);
      setSelectedDifficulty('all');
      setQuestionCount(15);
      setSelectedTimerMode('speed_drill');
      setNegativeMarking(true);

      const config: QuizConfig = {
        datasetId: 'all',
        subject: 'all',
        selectedTopics: [],
        difficulty: 'all',
        questionCount: 15,
        timerMode: 'speed_drill',
        negativeMarking: true,
        penaltyPerWrong: 0.25,
        presetName: 'BPSC IT Officer Speed Drill',
      };
      executeQuizStart(config, datasets);
    } else if (presetType === 'db_keys_mastery') {
      // Database Keys Mastery: All 30 Qs from db-keys.json
      const dbDataset = datasets.find((d) => d.dataset_id === 'dbms_database_keys_bd_it_prep');
      const count = dbDataset ? dbDataset.questions.length : 30;

      setSelectedSubject('database');
      setSelectedDatasetId('dbms_database_keys_bd_it_prep');
      setSelectedTopics([]);
      setSelectedDifficulty('all');
      setQuestionCount(count);
      setSelectedTimerMode('dataset_recommended');
      setNegativeMarking(false);

      const config: QuizConfig = {
        datasetId: 'dbms_database_keys_bd_it_prep',
        subject: 'database',
        selectedTopics: [],
        difficulty: 'all',
        questionCount: count,
        timerMode: 'dataset_recommended',
        negativeMarking: false,
        presetName: 'Database Keys Complete Mastery Test',
      };
      executeQuizStart(config, datasets);
    }
  };

  // Launch Mistake Vault drill
  const launchMistakeVaultDrill = (customList?: Question[]) => {
    const list = customList || getMistakeVault();
    if (list.length === 0) {
      alert('Your Mistake Vault is currently empty! Answer questions incorrectly to populate it.');
      return;
    }

    const shuffled = shuffleArray(list);
    const config: QuizConfig = {
      datasetId: 'all',
      subject: 'all',
      selectedTopics: [],
      difficulty: 'all',
      questionCount: shuffled.length,
      timerMode: 'dataset_recommended',
      negativeMarking,
      isMistakeDrill: true,
      presetName: `Mistake Vault Revision Drill (${shuffled.length} Qs)`,
    };

    const timeLimit = calculateTotalTimeLimit(shuffled, 'dataset_recommended');
    config.totalTimeLimitSeconds = timeLimit;

    const initialAnswers: Record<string, number | null> = {};
    for (const q of shuffled) {
      initialAnswers[q.id] = null;
    }

    setGenerationError(null);
    setCurrentQuestions(shuffled);
    setCurrentConfig(config);
    setUserAnswers(initialAnswers);
    setFlaggedQuestions({});
    setConfidenceLevels({});
    setCurrentQuestionIndex(0);
    setElapsedSeconds(0);
    setTotalTimeLimitSeconds(timeLimit);
    setRemainingSeconds(timeLimit);
    setQuizActive(true);
    setSavedQuizState(null);

    saveActiveQuiz({
      config,
      questions: shuffled,
      userAnswers: initialAnswers,
      currentQuestionIndex: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
      remainingSeconds: timeLimit,
      totalTimeLimitSeconds: timeLimit,
    });
  };

  // Launch Bookmarks drill
  const launchBookmarksDrill = (customList?: Question[]) => {
    const list = customList || getBookmarks();
    if (list.length === 0) {
      alert('You have no bookmarked questions yet! Click the star icon on any question to bookmark it.');
      return;
    }

    const shuffled = shuffleArray(list);
    const config: QuizConfig = {
      datasetId: 'all',
      subject: 'all',
      selectedTopics: [],
      difficulty: 'all',
      questionCount: shuffled.length,
      timerMode: 'dataset_recommended',
      negativeMarking,
      isBookmarkDrill: true,
      presetName: `Bookmarked Questions Drill (${shuffled.length} Qs)`,
    };

    const timeLimit = calculateTotalTimeLimit(shuffled, 'dataset_recommended');
    config.totalTimeLimitSeconds = timeLimit;

    const initialAnswers: Record<string, number | null> = {};
    for (const q of shuffled) {
      initialAnswers[q.id] = null;
    }

    setGenerationError(null);
    setCurrentQuestions(shuffled);
    setCurrentConfig(config);
    setUserAnswers(initialAnswers);
    setFlaggedQuestions({});
    setConfidenceLevels({});
    setCurrentQuestionIndex(0);
    setElapsedSeconds(0);
    setTotalTimeLimitSeconds(timeLimit);
    setRemainingSeconds(timeLimit);
    setQuizActive(true);
    setSavedQuizState(null);

    saveActiveQuiz({
      config,
      questions: shuffled,
      userAnswers: initialAnswers,
      currentQuestionIndex: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
      remainingSeconds: timeLimit,
      totalTimeLimitSeconds: timeLimit,
    });
  };

  // Generic Quiz Start Executor
  const executeQuizStart = (config: QuizConfig, customDatasets?: Dataset[]) => {
    const datasets = customDatasets || datasetsData?.datasets;
    if (!datasets || datasets.length === 0) return;

    const result = generateQuiz(datasets, config);
    if (!result.success || result.questions.length === 0) {
      setGenerationError(result.error || 'Failed to generate quiz');
      return;
    }

    const timeLimit = result.totalTimeLimitSeconds;
    config.totalTimeLimitSeconds = timeLimit;

    const initialAnswers: Record<string, number | null> = {};
    for (const q of result.questions) {
      initialAnswers[q.id] = null;
    }

    setGenerationError(null);
    setCurrentQuestions(result.questions);
    setCurrentConfig(config);
    setUserAnswers(initialAnswers);
    setFlaggedQuestions({});
    setConfidenceLevels({});
    setCurrentQuestionIndex(0);
    setElapsedSeconds(0);
    setTotalTimeLimitSeconds(timeLimit);
    setRemainingSeconds(timeLimit);
    setQuizActive(true);
    setSavedQuizState(null);

    saveActiveQuiz({
      config,
      questions: result.questions,
      userAnswers: initialAnswers,
      currentQuestionIndex: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
      remainingSeconds: timeLimit,
      totalTimeLimitSeconds: timeLimit,
    });
  };

  // Start configured quiz
  const handleStartQuiz = () => {
    const config: QuizConfig = {
      datasetId: selectedDatasetId,
      subject: selectedSubject,
      selectedTopics,
      difficulty: selectedDifficulty,
      questionCount,
      timerMode: selectedTimerMode,
      negativeMarking,
      penaltyPerWrong: 0.25,
    };
    executeQuizStart(config);
  };

  // Resume saved in-progress quiz
  const handleResumeSavedQuiz = () => {
    if (!savedQuizState) return;
    setCurrentQuestions(savedQuizState.questions);
    setCurrentConfig(savedQuizState.config);
    setUserAnswers(savedQuizState.userAnswers);
    setFlaggedQuestions(savedQuizState.flaggedQuestions || {});
    setConfidenceLevels(savedQuizState.confidenceLevels || {});
    setCurrentQuestionIndex(savedQuizState.currentQuestionIndex || 0);
    setElapsedSeconds(savedQuizState.elapsedSeconds || 0);
    setTotalTimeLimitSeconds(savedQuizState.totalTimeLimitSeconds || 0);
    setRemainingSeconds(savedQuizState.remainingSeconds ?? savedQuizState.totalTimeLimitSeconds ?? 0);
    setQuizActive(true);
    setSavedQuizState(null);
  };

  // Discard saved in-progress quiz
  const handleDiscardSavedQuiz = () => {
    clearActiveQuiz();
    setSavedQuizState(null);
  };

  // Answer selection
  const handleSelectOption = (optionIndex: number) => {
    const activeQuestion = currentQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const updated = {
      ...userAnswers,
      [activeQuestion.id]: optionIndex,
    };
    setUserAnswers(updated);

    if (currentConfig) {
      saveActiveQuiz({
        config: currentConfig,
        questions: currentQuestions,
        userAnswers: updated,
        flaggedQuestions,
        confidenceLevels,
        currentQuestionIndex,
        startTime: Date.now() - elapsedSeconds * 1000,
        elapsedSeconds,
        remainingSeconds,
        totalTimeLimitSeconds,
      });
    }
  };

  // Clear answer
  const handleClearOption = () => {
    const activeQuestion = currentQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const updated = {
      ...userAnswers,
      [activeQuestion.id]: null,
    };
    setUserAnswers(updated);
  };

  // Toggle Flag / Review
  const handleToggleFlag = () => {
    const activeQuestion = currentQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const updated = {
      ...flaggedQuestions,
      [activeQuestion.id]: !flaggedQuestions[activeQuestion.id],
    };
    setFlaggedQuestions(updated);

    if (currentConfig) {
      saveActiveQuiz({
        config: currentConfig,
        questions: currentQuestions,
        userAnswers,
        flaggedQuestions: updated,
        confidenceLevels,
        currentQuestionIndex,
        startTime: Date.now() - elapsedSeconds * 1000,
        elapsedSeconds,
        remainingSeconds,
        totalTimeLimitSeconds,
      });
    }
  };

  // Select Confidence Level
  const handleSelectConfidence = (level: ConfidenceLevel) => {
    const activeQuestion = currentQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const updated = {
      ...confidenceLevels,
      [activeQuestion.id]: level,
    };
    setConfidenceLevels(updated);

    if (currentConfig) {
      saveActiveQuiz({
        config: currentConfig,
        questions: currentQuestions,
        userAnswers,
        flaggedQuestions,
        confidenceLevels: updated,
        currentQuestionIndex,
        startTime: Date.now() - elapsedSeconds * 1000,
        elapsedSeconds,
        remainingSeconds,
        totalTimeLimitSeconds,
      });
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = () => {
    const activeQuestion = currentQuestions[currentQuestionIndex];
    if (!activeQuestion) return;
    toggleBookmark(activeQuestion);
    setBookmarksCount(getBookmarks().length);
  };

  // Question navigation (Free back-and-forth movement)
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate counts
  const totalQuestionsCount = currentQuestions.length;
  const answeredCount = Object.values(userAnswers).filter((v) => v !== null).length;
  const unansweredCount = totalQuestionsCount - answeredCount;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  // Active question item
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Lookup topic label
  const currentTopicLabel = useMemo(() => {
    if (!currentQuestion || !datasetsData) return '';
    for (const ds of datasetsData.datasets) {
      if (ds.topics[currentQuestion.topic]) {
        return ds.topics[currentQuestion.topic];
      }
    }
    return currentQuestion.topic.replace(/_/g, ' ');
  }, [currentQuestion, datasetsData]);

  // Loading State
  if (loadingDatasets) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-200">Loading Question Datasets...</h2>
        <p className="mt-1 text-xs text-slate-400">
          Scanning data folders and validating question schemas with Zod
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

  // ==========================================
  // VIEW A: LIVE QUIZ TAKING INTERFACE
  // ==========================================
  if (quizActive && currentQuestion) {
    const isTimed = currentConfig?.timerMode !== 'untimed' && totalTimeLimitSeconds > 0;
    const isUrgent = isTimed && remainingSeconds <= 30;
    const isWarning = isTimed && remainingSeconds <= 120 && remainingSeconds > 30;
    const currentIsBookmarked = isBookmarked(currentQuestion.id);

    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Control Bar: Subject/Test Title, Timer, Free Navigation Notice, Quit */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-3.5 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white sm:text-base">
                  {currentConfig?.presetName ||
                    (currentConfig?.datasetId === 'all'
                      ? 'IT Multi-Subject Mock Test'
                      : currentQuestion.dataset_title || 'Smart Practice Quiz')}
                </h1>
                {currentConfig?.negativeMarking && (
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                    -0.25 Negative Marking
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Free back-and-forth navigation • Flag questions to review before finishing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown or Elapsed Timer */}
            {isTimed ? (
              <div
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 border text-sm font-mono font-bold transition-all ${
                  isUrgent
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/50 animate-pulse'
                    : isWarning
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-emerald-400'
                }`}
                title="Time remaining until auto-submission"
              >
                {isUrgent ? (
                  <AlertTriangle className="h-4 w-4 text-rose-400 animate-bounce" />
                ) : (
                  <Clock className="h-4 w-4 text-emerald-400" />
                )}
                <span>{formatTimer(remainingSeconds)}</span>
                <span className="text-[10px] uppercase font-sans font-semibold text-slate-400">
                  {isUrgent ? 'Hurry!' : 'Left'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-1.5 border border-slate-800 text-sm font-mono font-bold text-emerald-400">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>{formatTimer(elapsedSeconds)}</span>
                <span className="text-[10px] uppercase font-sans font-semibold text-slate-400">
                  Elapsed
                </span>
              </div>
            )}

            {/* Pause / Quit button */}
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to pause/exit? Your current progress remains saved in localStorage.'
                  )
                ) {
                  setQuizActive(false);
                }
              }}
              className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Pause
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={totalQuestionsCount}
            answeredCount={answeredCount}
          />
        </div>

        {/* Main Quiz Layout: Question Card on left, Palette on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestionsCount}
              selectedOption={userAnswers[currentQuestion.id] ?? null}
              onSelectOption={handleSelectOption}
              onClearOption={handleClearOption}
              onPrevious={handlePreviousQuestion}
              onNext={handleNextQuestion}
              onSubmit={() => setIsSubmitModalOpen(true)}
              isFirst={currentQuestionIndex === 0}
              isLast={currentQuestionIndex === totalQuestionsCount - 1}
              topicLabel={currentTopicLabel}
              isFlagged={!!flaggedQuestions[currentQuestion.id]}
              onToggleFlag={handleToggleFlag}
              isBookmarked={currentIsBookmarked}
              onToggleBookmark={handleToggleBookmark}
              confidence={confidenceLevels[currentQuestion.id] || 'confident'}
              onSelectConfidence={handleSelectConfidence}
            />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <QuestionPalette
              questions={currentQuestions}
              currentIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              flaggedQuestions={flaggedQuestions}
              onSelectQuestion={(idx) => setCurrentQuestionIndex(idx)}
            />

            {/* Submit Quiz Card */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <h3 className="text-sm font-semibold text-white">Review & Submit</h3>
              <p className="mt-1 text-xs text-slate-400">
                You can freely navigate back to review or modify any marked answer.
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                <span>Answered Questions:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                <span>Unanswered Questions:</span>
                <span className={`font-bold ${unansweredCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {unansweredCount}
                </span>
              </div>
              {flaggedCount > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                  <span>Flagged for Review:</span>
                  <span className="font-bold text-amber-400">{flaggedCount}</span>
                </div>
              )}
              {isTimed && (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                  <span>Countdown Clock:</span>
                  <span className={`font-bold font-mono ${isUrgent ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatTimer(remainingSeconds)} left
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="mt-4 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                Submit & Calculate Score
              </button>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <SubmitModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirm={() => handleConfirmSubmit(false)}
          totalQuestions={totalQuestionsCount}
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          flaggedCount={flaggedCount}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW B: QUIZ SETUP / CONFIGURATION INTERFACE
  // ==========================================
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Resume saved quiz alert if exists */}
      {savedQuizState && (
        <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">In-Progress Quiz Found</h3>
                <p className="text-xs text-slate-300">
                  You have a saved quiz with {savedQuizState.questions.length} questions ({' '}
                  {Object.values(savedQuizState.userAnswers).filter((a) => a !== null).length}{' '}
                  answered).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResumeSavedQuiz}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow"
              >
                <Play className="h-3.5 w-3.5" /> Resume Quiz
              </button>
              <button
                type="button"
                onClick={handleDiscardSavedQuiz}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 mb-2">
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive Exam Configuration & Smart Drills</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Configure Your Smart Quiz
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Pick a 1-click preset below, or customize subjects, timer mode, and negative marking.
          </p>
        </div>

        <Link
          href={`/reading?datasetId=${selectedDatasetId}&subject=${selectedSubject}${
            selectedTopics.length > 0 ? `&topic=${selectedTopics[0]}` : ''
          }`}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-colors shrink-0 self-start sm:self-center"
        >
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span>Switch to Reading Mode &rarr;</span>
        </Link>
      </div>

      {/* 1-Click Smart Exam Presets & Vaults */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-emerald-400" />
            1-Click Smart Exam Presets
          </h2>
          <span className="text-[11px] text-slate-400">Instant test generation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Preset 1: BB AD IT */}
          <button
            type="button"
            onClick={() => launchPreset('bb_ad_it')}
            className="group flex flex-col justify-between rounded-xl p-3.5 text-left border border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 hover:bg-slate-850 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white group-hover:text-emerald-300">
                  Bangladesh Bank AD IT
                </span>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  20 Qs
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                20 mins &bull; All Subjects &bull; -0.25 Negative Marking
              </p>
            </div>
            <span className="mt-2 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              Start Exam &rarr;
            </span>
          </button>

          {/* Preset 2: BPSC Speed */}
          <button
            type="button"
            onClick={() => launchPreset('bpsc_speed')}
            className="group flex flex-col justify-between rounded-xl p-3.5 text-left border border-slate-800 bg-slate-900/90 hover:border-blue-500/50 hover:bg-slate-850 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white group-hover:text-blue-300">
                  BPSC IT Speed Drill
                </span>
                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                  15 Qs
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                11 mins (45s/Q) &bull; Rapid recall &bull; -0.25 Penalty
              </p>
            </div>
            <span className="mt-2 text-[10px] font-semibold text-blue-400 flex items-center gap-1">
              Start Drill &rarr;
            </span>
          </button>

          {/* Preset 3: Database Keys Mastery */}
          <button
            type="button"
            onClick={() => launchPreset('db_keys_mastery')}
            className="group flex flex-col justify-between rounded-xl p-3.5 text-left border border-slate-800 bg-slate-900/90 hover:border-purple-500/50 hover:bg-slate-850 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white group-hover:text-purple-300">
                  Database Keys Mastery
                </span>
                <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                  All 30 Qs
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Complete db-keys.json test &bull; Dynamic recommended timer
              </p>
            </div>
            <span className="mt-2 text-[10px] font-semibold text-purple-400 flex items-center gap-1">
              Start Test &rarr;
            </span>
          </button>
        </div>

        {/* Mistake Vault & Bookmarks shortcuts */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => launchMistakeVaultDrill()}
            disabled={mistakeVaultCount === 0}
            className="flex items-center justify-between rounded-xl p-3 text-left border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-rose-400" />
              <div>
                <span className="font-bold text-xs text-white">Mistake Vault Drill</span>
                <p className="text-[10px] text-rose-200">Re-attempt questions you missed in past quizzes</p>
              </div>
            </div>
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              {mistakeVaultCount} Missed Qs
            </span>
          </button>

          <button
            type="button"
            onClick={() => launchBookmarksDrill()}
            disabled={bookmarksCount === 0}
            className="flex items-center justify-between rounded-xl p-3 text-left border border-yellow-500/30 bg-yellow-950/20 hover:bg-yellow-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <div>
                <span className="font-bold text-xs text-white">Bookmarked Drill</span>
                <p className="text-[10px] text-yellow-200">Practice your starred high-yield questions</p>
              </div>
            </div>
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
              {bookmarksCount} Starred Qs
            </span>
          </button>
        </div>
      </div>

      {generationError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>{generationError}</div>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. Subject & Dataset Selection */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            1. Select Subject & Question Dataset
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Subject Area:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedDatasetId('all');
                  setSelectedTopics([]);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Subjects (Combined Mock Test)</option>
                {datasetsData?.subjects.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.title} ({s.totalQuestions} questions)
                  </option>
                ))}
              </select>
            </div>

            {/* Dataset Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Dataset / Topic File:
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setSelectedTopics([]);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
        </div>

        {/* 2. Topic Selection */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-400" />
                2. Select Topics ({selectedTopics.length === 0 ? 'All Topics' : `${selectedTopics.length} selected`})
              </h2>
              <p className="text-xs text-slate-400">
                Choose specific topics to practice, or leave empty to include all available topics.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllTopics}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllTopics}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
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
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
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

        {/* 3. Difficulty & Number of Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h2 className="text-base font-bold text-white mb-2">3. Difficulty Level</h2>
            <p className="text-xs text-slate-400 mb-4">
              Filter questions by question difficulty tier.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
                const isActive = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold uppercase tracking-wider border transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h2 className="text-base font-bold text-white mb-2">4. Number of Questions</h2>
            <p className="text-xs text-slate-400 mb-4">
              Select desired question count or choose all available.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {[5, 10, 15, 20, 25, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                    questionCount === num
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {num} Qs
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuestionCount(Math.max(1, matchingQuestionsCount))}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                  questionCount === matchingQuestionsCount
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                All ({matchingQuestionsCount})
              </button>
            </div>
          </div>
        </div>

        {/* 4. Flexible Exam Timer Mode Selection */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Timer className="h-4 w-4 text-emerald-400" />
              5. Exam Timer Mode (Countdown & Navigation)
            </h2>
            <p className="text-xs text-slate-400">
              In countdown modes, you can freely move back and forth to change answers before time runs out.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option A: Dataset Recommended */}
            <button
              type="button"
              onClick={() => setSelectedTimerMode('dataset_recommended')}
              className={`flex flex-col justify-between rounded-xl p-4 text-left border transition-all ${
                selectedTimerMode === 'dataset_recommended'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Dataset Recommended (Dynamic)
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                    {formatDurationLabel(estimatedTimes.dataset_recommended)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Calculates total exam time by summing individual allocated time per question (30s–60s each).
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-emerald-400">
                &bull; Question-weighted countdown cutoff
              </div>
            </button>

            {/* Option B: Standard Exam */}
            <button
              type="button"
              onClick={() => setSelectedTimerMode('standard_exam')}
              className={`flex flex-col justify-between rounded-xl p-4 text-left border transition-all ${
                selectedTimerMode === 'standard_exam'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">
                      Standard Exam Pace (60s / Q)
                    </span>
                  </div>
                  <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                    {formatDurationLabel(estimatedTimes.standard_exam)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Exactly 1 minute per question. Matches Bangladesh Bank AD (IT) & BPSC prelim exam pacing.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-blue-400">
                &bull; 60 seconds per question countdown
              </div>
            </button>

            {/* Option C: Speed Drill */}
            <button
              type="button"
              onClick={() => setSelectedTimerMode('speed_drill')}
              className={`flex flex-col justify-between rounded-xl p-4 text-left border transition-all ${
                selectedTimerMode === 'speed_drill'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      Speed Practice Drill (45s / Q)
                    </span>
                  </div>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                    {formatDurationLabel(estimatedTimes.speed_drill)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Fast-paced drill at 45 seconds per question to build quick recall and exam time-management under pressure.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-amber-400">
                &bull; Rapid 45s countdown drill
              </div>
            </button>

            {/* Option D: Untimed Practice */}
            <button
              type="button"
              onClick={() => setSelectedTimerMode('untimed')}
              className={`flex flex-col justify-between rounded-xl p-4 text-left border transition-all ${
                selectedTimerMode === 'untimed'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hourglass className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">
                      Untimed Practice Mode
                    </span>
                  </div>
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                    Stopwatch
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Self-paced study with an upward stopwatch. No cutoff limit; perfect for deep study and taking notes.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-purple-400">
                &bull; No time limit cutoff
              </div>
            </button>
          </div>
        </div>

        {/* 5. Negative Marking Simulator */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <h2 className="text-base font-bold text-white">
                  Negative Marking Simulator (-0.25 Mark)
                </h2>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/20">
                  Govt Standard
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 max-w-xl leading-relaxed">
                Simulates real Bangladesh Bank and BPSC preliminary scoring: <strong>-0.25 marks deducted</strong> for each wrong answer, while skipped questions have no penalty.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNegativeMarking(!negativeMarking)}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold border transition-all shrink-0 ${
                negativeMarking
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <div className={`h-3 w-3 rounded-full ${negativeMarking ? 'bg-rose-400' : 'bg-slate-600'}`} />
              {negativeMarking ? 'Enabled (-0.25 Active)' : 'Disabled (Standard 0)'}
            </button>
          </div>
        </div>

        {/* Real-time Summary & Launch Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">Quiz Generation Summary:</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                  {matchingQuestionsCount} Questions Match Filter
                </span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                  Timer: {formatDurationLabel(estimatedTimes[selectedTimerMode])}
                </span>
                {negativeMarking && (
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/20">
                    -0.25 Penalty
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {questionCount > matchingQuestionsCount
                  ? `Notice: You requested ${questionCount} questions, but only ${matchingQuestionsCount} match. Quiz will include all ${matchingQuestionsCount} questions.`
                  : `Quiz will randomly select and shuffle ${questionCount} questions without duplicates.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={matchingQuestionsCount === 0}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Generate & Start Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-200">Loading Quiz Setup...</h2>
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
