import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  answeredCount: number;
}

export default function ProgressBar({
  current,
  total,
  answeredCount,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const currentPercentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-300">
          Question <span className="text-emerald-400 font-bold">{current}</span> of {total}
        </span>
        <span className="flex items-center gap-2">
          <span>
            Answered: <strong className="text-white">{answeredCount}</strong>/{total}
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-semibold text-emerald-400">
            {percentage}%
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, currentPercentage)}%` }}
        />
      </div>
    </div>
  );
}
