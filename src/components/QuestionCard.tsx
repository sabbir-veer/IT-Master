import React from 'react';
import { Question } from '@/types/dataset';
import { ConfidenceLevel } from '@/types/quiz';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  Tag,
  Flag,
  Star,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (optionIndex: number) => void;
  onClearOption: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirst: boolean;
  isLast: boolean;
  topicLabel?: string;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  confidence?: ConfidenceLevel;
  onSelectConfidence?: (level: ConfidenceLevel) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onClearOption,
  onPrevious,
  onNext,
  onSubmit,
  isFirst,
  isLast,
  topicLabel,
  isFlagged = false,
  onToggleFlag,
  isBookmarked = false,
  onToggleBookmark,
  confidence = 'confident',
  onSelectConfidence,
}: QuestionCardProps) {
  const difficultyBadgeColors = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const difficulty = question.difficulty || 'medium';

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl shadow-black/20">
      {/* Top Meta & Action Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            {topicLabel || question.topic.replace(/_/g, ' ')}
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border ${
              difficultyBadgeColors[difficulty] || difficultyBadgeColors.medium
            }`}
          >
            {difficulty}
          </span>
          {question.dataset_title && (
            <span className="hidden rounded-md bg-slate-800/80 px-2 py-1 text-xs text-slate-400 sm:inline-block">
              {question.dataset_title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Flag / Review Button */}
          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all border ${
                isFlagged
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
              title={isFlagged ? 'Remove review flag' : 'Flag this question for review'}
            >
              <Flag className={`h-3.5 w-3.5 ${isFlagged ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>
          )}

          {/* Bookmark Button */}
          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all border ${
                isBookmarked
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-yellow-300'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
            >
              <Star className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>
          )}

          <div className="text-xs font-medium text-slate-400 pl-2">
            Question <span className="font-bold text-white">{questionNumber}</span> of{' '}
            <span className="font-bold text-white">{totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold leading-relaxed text-slate-100 sm:text-xl md:text-2xl">
          {question.question}
        </h2>

        {/* Tags if available */}
        {question.tags && question.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <Tag className="h-3 w-3 text-slate-500" />
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-800/80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((optionText, idx) => {
          const isSelected = selectedOption === idx;
          const letter = OPTION_LETTERS[idx] || String(idx + 1);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectOption(idx)}
              className={`group flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all ${
                isSelected
                  ? 'bg-emerald-500/15 border-2 border-emerald-400 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700 hover:text-white'
              }`}
            >
              {/* Option Letter Icon */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-emerald-400 text-slate-950 font-extrabold shadow'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                }`}
              >
                {letter}
              </div>

              {/* Option Content */}
              <div className="pt-1 text-sm font-medium leading-relaxed sm:text-base">
                {optionText}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confidence Level Selector (appears when an answer is marked) */}
      {selectedOption !== null && onSelectConfidence && (
        <div className="mt-5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium">Confidence Level:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectConfidence('confident')}
              className={`px-3 py-1 rounded-lg font-medium transition-all border ${
                confidence === 'confident'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              🎯 Confident
            </button>
            <button
              type="button"
              onClick={() => onSelectConfidence('guess')}
              className={`px-3 py-1 rounded-lg font-medium transition-all border ${
                confidence === 'guess'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              🤔 Educated Guess
            </button>
          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-850 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {selectedOption !== null && (
            <button
              type="button"
              onClick={onClearOption}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
              title="Clear selected answer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLast ? (
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              Finish & Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
