import React from 'react';
import { Question } from '@/types/dataset';
import { Flag } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<string, number | null>;
  flaggedQuestions?: Record<string, boolean>;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionPalette({
  questions,
  currentIndex,
  userAnswers,
  flaggedQuestions = {},
  onSelectQuestion,
}: QuestionPaletteProps) {
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Question Palette</h3>
        <span className="text-xs text-slate-400">
          {Object.values(userAnswers).filter((v) => v !== null).length} / {questions.length} answered
        </span>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {questions.map((q, idx) => {
          const isAnswered = userAnswers[q.id] !== null && userAnswers[q.id] !== undefined;
          const isCurrent = idx === currentIndex;
          const isFlagged = !!flaggedQuestions[q.id];

          let btnClass = 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border-slate-700/60';

          if (isAnswered) {
            btnClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
          }

          if (isCurrent) {
            btnClass += ' ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 font-bold';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-medium transition-all ${btnClass}`}
              title={`Jump to Question ${idx + 1}${isFlagged ? ' (Flagged for review)' : ''}`}
            >
              {idx + 1}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3.5 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-800 border border-slate-700" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative h-2.5 w-2.5 rounded-sm bg-slate-800 border border-slate-700">
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          <span>Flagged ({flaggedCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm ring-2 ring-emerald-400 bg-slate-800" />
          <span>Current</span>
        </div>
      </div>
    </div>
  );
}
