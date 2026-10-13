import React from 'react';
import { TrendDataPoint } from '@/types/analytics';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface TrendChartProps {
  trends: TrendDataPoint[];
}

export default function TrendChart({ trends }: TrendChartProps) {
  if (!trends || trends.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-8 text-center border border-slate-800">
        <AlertCircle className="h-8 w-8 text-slate-500 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Attempt History Yet</h4>
        <p className="mt-1 text-xs text-slate-500">
          Complete your first quiz to begin tracking performance trends.
        </p>
      </div>
    );
  }

  if (trends.length < 2) {
    return (
      <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-8 text-center border border-slate-800">
        <TrendingUp className="h-8 w-8 text-emerald-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-200">1 Quiz Completed</h4>
        <p className="mt-1 text-xs text-slate-400">
          Score: <span className="font-bold text-emerald-400">{trends[0].scorePercentage}%</span> on {trends[0].quizTitle}.
          Complete at least 2 quizzes to visualize your progress curve.
        </p>
      </div>
    );
  }

  // Calculate coordinates for SVG polyline
  const height = 180;
  const paddingX = 40;
  const paddingY = 30;
  const chartHeight = height - paddingY * 2;

  const points = trends.map((t, idx) => {
    const x = paddingX + (idx / (trends.length - 1)) * (500 - paddingX * 2);
    const y = height - paddingY - (t.scorePercentage / 100) * chartHeight;
    return { x, y, score: t.scorePercentage, label: t.dateLabel, title: t.quizTitle };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Compute average
  const avg = Math.round(
    trends.reduce((sum, t) => sum + t.scorePercentage, 0) / trends.length
  );
  const avgY = height - paddingY - (avg / 100) * chartHeight;

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Score Performance Trend</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Score %
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-0.5 w-3 bg-indigo-400 border-dashed" /> Avg ({avg}%)
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 500 180"
          className="w-full min-w-[340px] overflow-visible"
        >
          {/* Background grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - paddingY - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={500 - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="end"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Average Line */}
          <line
            x1={paddingX}
            y1={avgY}
            x2={500 - paddingX}
            y2={avgY}
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Trend Area Gradient & Line */}
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Fill under line */}
          <polygon
            points={`${points[0].x},${height - paddingY} ${polylinePoints} ${
              points[points.length - 1].x
            },${height - paddingY}`}
            fill="url(#scoreGradient)"
          />

          {/* Polyline */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#090f1f"
                stroke="#10b981"
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-125"
              />
              <text
                x={p.x}
                y={p.y - 10}
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.score}%
              </text>
              <text
                x={p.x}
                y={height - 12}
                fill="#94a3b8"
                fontSize="8"
                textAnchor="middle"
              >
                #{idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
