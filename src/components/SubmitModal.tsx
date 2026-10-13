import React from 'react';
import { AlertCircle, CheckCircle2, X, Send, Flag } from 'lucide-react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount?: number;
}

export default function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount = 0,
}: SubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ready to Submit Quiz?</h3>
              <p className="text-xs text-slate-400">Review your status before finalizing.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats summary */}
        <div className="my-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
            <span className="block text-xl font-bold text-white">{totalQuestions}</span>
            <span className="text-[11px] text-slate-400">Total</span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
            <span className="block text-xl font-bold text-emerald-400">{answeredCount}</span>
            <span className="text-[11px] text-emerald-300">Answered</span>
          </div>
          <div
            className={`rounded-xl p-3 border ${
              unansweredCount > 0
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <span
              className={`block text-xl font-bold ${
                unansweredCount > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {unansweredCount}
            </span>
            <span
              className={`text-[11px] ${
                unansweredCount > 0 ? 'text-rose-300' : 'text-slate-400'
              }`}
            >
              Unanswered
            </span>
          </div>
        </div>

        {/* Flagged warning if any */}
        {flaggedCount > 0 && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300 border border-amber-500/30">
            <Flag className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />
            <div>
              You have <strong className="underline">{flaggedCount} question{flaggedCount > 1 ? 's' : ''}</strong> marked for review.
            </div>
          </div>
        )}

        {/* Warning if unanswered */}
        {unansweredCount > 0 && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/30">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="font-semibold">Notice:</strong> You have{' '}
              <strong className="underline">{unansweredCount} unanswered</strong> question{unansweredCount > 1 ? 's' : ''}.
              Unanswered questions will be scored as 0.
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-750 hover:text-white"
          >
            Review Answers
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
          >
            <Send className="h-4 w-4" />
            Submit Now
          </button>
        </div>
      </div>
    </div>
  );
}
