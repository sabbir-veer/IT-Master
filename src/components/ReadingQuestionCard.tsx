'use client';

import React, { useState } from 'react';
import { Question } from '@/types/dataset';
import {
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Tag,
  BookOpen,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface ReadingQuestionCardProps {
  question: Question;
  index: number; // 1-based sequential number
  topicLabel?: string;
  alwaysShowAnswer?: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ReadingQuestionCard({
  question,
  index,
  topicLabel,
  alwaysShowAnswer = true,
  isBookmarked,
  onToggleBookmark,
}: ReadingQuestionCardProps) {
  // If self-test mode is enabled (alwaysShowAnswer = false), track whether user revealed it or clicked an option
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const difficultyBadgeColors = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const difficulty = question.difficulty || 'medium';
  const isAnswerVisible = alwaysShowAnswer || revealed;

  const handleSelectOption = (optIdx: number) => {
    if (alwaysShowAnswer) return; // Answer already revealed in reading mode
    setSelectedOption(optIdx);
    setRevealed(true);
  };

  return (
    <div
      id={`question-${index}`}
      className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-800 transition-all hover:border-slate-700/80 shadow-lg shadow-black/20"
    >
      {/* Header bar: Question Number, Topic Badge, Difficulty, Dataset Name, Bookmark Button */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Question Sequence Number */}
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-black text-emerald-300 ring-1 ring-emerald-500/40">
            {index}
          </span>

          {/* Topic Badge */}
          <span className="rounded-md bg-slate-800/90 px-2.5 py-1 text-xs font-semibold text-slate-200 border border-slate-700/60">
            {topicLabel || question.topic.replace(/_/g, ' ')}
          </span>

          {/* Difficulty Tier */}
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${
              difficultyBadgeColors[difficulty] || difficultyBadgeColors.medium
            }`}
          >
            {difficulty}
          </span>

          {/* Dataset Title */}
          {question.dataset_title && (
            <span className="hidden rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-400 sm:inline-block border border-slate-800">
              {question.dataset_title}
            </span>
          )}
        </div>

        {/* Action icons: Reveal answer toggle (if in self-test) & Bookmark */}
        <div className="flex items-center gap-2">
          {!alwaysShowAnswer && (
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {revealed ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                  <span>Hide Answer</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Reveal Answer</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleBookmark}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              isBookmarked
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-sm shadow-yellow-950'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-yellow-300'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question for revision'}
          >
            <Star
              className={`h-3.5 w-3.5 ${
                isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {isBookmarked ? 'Starred' : 'Star'}
            </span>
          </button>
        </div>
      </div>

      {/* Question Prompt */}
      <h3 className="mb-5 text-base font-medium leading-relaxed text-slate-100 sm:text-lg">
        {question.question}
      </h3>

      {/* Options List */}
      <div className="space-y-2.5">
        {question.options.map((optionText, optIdx) => {
          const letter = OPTION_LETTERS[optIdx] || String(optIdx + 1);
          const isCorrect = question.answer === optIdx;
          const isUserPick = selectedOption === optIdx;

          let optionStyle =
            'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';
          let letterStyle =
            'bg-slate-800 border-slate-700 text-slate-400';

          if (isAnswerVisible) {
            if (isCorrect) {
              optionStyle =
                'border-emerald-500/60 bg-emerald-500/15 text-white font-medium ring-1 ring-emerald-500/30';
              letterStyle =
                'bg-emerald-500 text-slate-950 font-black border-emerald-400';
            } else if (!alwaysShowAnswer && isUserPick && !isCorrect) {
              optionStyle =
                'border-rose-500/60 bg-rose-500/15 text-rose-100 ring-1 ring-rose-500/30';
              letterStyle =
                'bg-rose-500 text-white font-bold border-rose-400';
            }
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={alwaysShowAnswer}
              onClick={() => handleSelectOption(optIdx)}
              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${optionStyle} ${
                !alwaysShowAnswer && !revealed ? 'cursor-pointer active:scale-[0.99]' : ''
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${letterStyle}`}
              >
                {letter}
              </span>

              <div className="flex-1 pt-0.5 leading-snug">
                <span>{optionText}</span>
              </div>

              {isAnswerVisible && isCorrect && (
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Correct Answer</span>
                </span>
              )}

              {isAnswerVisible && !alwaysShowAnswer && isUserPick && !isCorrect && (
                <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300 ring-1 ring-rose-500/40 shrink-0">
                  <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Your Pick</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Box */}
      {isAnswerVisible && question.explanation && (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-300 sm:text-sm">
          <div className="mb-1.5 flex items-center gap-2 font-bold text-emerald-400">
            <BookOpen className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Explanation & Concept Rationale</span>
          </div>
          <p className="text-slate-300 pl-6">{question.explanation}</p>
        </div>
      )}

      {/* Tags if available */}
      {question.tags && question.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2 text-xs text-slate-400">
          <Tag className="h-3 w-3 text-slate-500" />
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-900/90 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
