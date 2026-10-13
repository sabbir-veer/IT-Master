import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  accentColor?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose';
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  accentColor = 'emerald',
}: StatCardProps) {
  const colors = colorMap[accentColor];

  return (
    <div className="glass-card-interactive rounded-2xl p-5 border border-slate-800">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-400">{title}</span>
          <span className="mt-1 text-2xl font-bold tracking-tight text-white">
            {value}
          </span>
          {subtitle && (
            <span className="mt-1 text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${colors.bg} ${colors.text} border ${colors.border}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}
