import React, { useState, useEffect } from 'react';
import { QuizQuestionAnswer } from '@/types/quiz';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Star,
  Flag,
  Sparkles,
} from 'lucide-react';
import { isBookmarked, toggleBookmark } from '@/lib/storage';
import { Question } from '@/types/dataset';

interface ReviewCardProps {
  answer: QuizQuestionAnswer;
  index: number;
  negativeMarking?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ReviewCard({ answer, index, negativeMarking = false }: ReviewCardProps) {
  const isUnanswered = answer.selectedOption === null;
  const isCorrect = answer.isCorrect;
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(answer.questionId));
  }, [answer.questionId]);

  const handleToggleBookmark = () => {
    const questionObj: Question = {
      id: answer.questionId,
      topic: answer.topic,
      question: answer.questionText,
      options: answer.options,
      answer: answer.correctOption,
      explanation: answer.explanation,
      difficulty: answer.difficulty,
      dataset_id: answer.datasetId,
      dataset_title: answer.datasetTitle,
      subject: answer.subject,
    };
    const nextState = toggleBookmark(questionObj);
    setBookmarked(nextState);
  };

  return (
    <div
      className={`glass-card rounded-2xl p-6 border transition-all ${
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-950/10'
          : isUnanswered
          ? 'border-slate-700 bg-slate-900/40'
          : 'border-rose-500/30 bg-rose-950/10'
      }`}
    >
      {/* Top Header Badge */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-white">
            {index + 1}
          </span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-300">
            {answer.topicLabel || answer.topic.replace(/_/g, ' ')}
          </span>
          {answer.datasetTitle && (
            <span className="hidden rounded bg-slate-850 px-2 py-0.5 text-[11px] text-slate-400 sm:inline-block">
              {answer.datasetTitle}
            </span>
          )}
          {answer.isFlagged && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
              <Flag className="h-3 w-3 fill-amber-400 text-amber-400" /> Flagged
            </span>
          )}
        </div>

        {/* Status & Bookmark Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg border transition-all ${
              bookmarked
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-yellow-300'
            }`}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark this question for revision'}
          >
            <Star className={`h-4 w-4 ${bookmarked ? 'fill-yellow-400' : ''}`} />
          </button>

          {answer.isLuckyGuess ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Lucky Guess (+1)
            </span>
          ) : isCorrect ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Correct (+1)
            </span>
          ) : isUnanswered ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Skipped (0)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/30">
              <XCircle className="h-3.5 w-3.5" />
              Incorrect {negativeMarking ? '(-0.25)' : '(0)'}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h3 className="mb-5 text-base font-medium leading-relaxed text-slate-100 sm:text-lg">
        {answer.questionText}
      </h3>

      {/* Options List */}
      <div className="space-y-2.5">
        {answer.options.map((opt, optIdx) => {
          const isUserPick = answer.selectedOption === optIdx;
          const isTheCorrectOption = answer.correctOption === optIdx;
          const letter = OPTION_LETTERS[optIdx] || String(optIdx + 1);

          let optionStyle =
            'bg-slate-900/60 border-slate-800/80 text-slate-300';
          let badgeText = null;

          if (isTheCorrectOption) {
            optionStyle =
              'bg-emerald-500/20 border-emerald-500/60 text-white font-medium ring-1 ring-emerald-500/30';
            badgeText = (
              <span className="rounded bg-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                Correct Answer
              </span>
            );
          } else if (isUserPick && !isCorrect) {
            optionStyle =
              'bg-rose-500/20 border-rose-500/60 text-rose-100 ring-1 ring-rose-500/30';
            badgeText = (
              <span className="rounded bg-rose-500/30 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                Your Answer (Incorrect)
              </span>
            );
          }

          return (
            <div
              key={optIdx}
              className={`flex items-start justify-between gap-3 rounded-xl p-3.5 border text-sm ${optionStyle}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    isTheCorrectOption
                      ? 'bg-emerald-500 text-slate-950'
                      : isUserPick && !isCorrect
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {letter}
                </span>
                <span className="pt-0.5 leading-relaxed">{opt}</span>
              </div>
              {badgeText && <div className="shrink-0 pt-0.5">{badgeText}</div>}
            </div>
          );
        })}
      </div>

      {/* Explanation Box */}
      {answer.explanation && (
        <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <HelpCircle className="h-4 w-4" />
            Exam Explanation & Concept Insight
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
            {answer.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
