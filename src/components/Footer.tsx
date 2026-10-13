import React from 'react';
import { Database, ShieldCheck, Cpu, Code2, Network } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-200">GovTechPrep</span>
            <span>•</span>
            <span className="text-slate-400">Bangladesh IT Officer Job Preparation</span>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-slate-300 ring-1 ring-slate-800">
              <Database className="h-3 w-3 text-emerald-400" /> Database
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-slate-300 ring-1 ring-slate-800">
              <Network className="h-3 w-3 text-blue-400" /> Networking
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-slate-300 ring-1 ring-slate-800">
              <Code2 className="h-3 w-3 text-purple-400" /> SWE
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-slate-300 ring-1 ring-slate-800">
              <Cpu className="h-3 w-3 text-amber-400" /> Architecture
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Local Offline Storage & Dynamic Datasets</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
