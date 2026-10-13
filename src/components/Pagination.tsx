'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (newSize: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const [jumpInput, setJumpInput] = useState('');

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
      setJumpInput('');
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-md shadow-xl sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Summary & Page Size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <span>
          Showing{' '}
          <strong className="text-emerald-400 font-bold">{startItem}</strong> -{' '}
          <strong className="text-emerald-400 font-bold">{endItem}</strong> of{' '}
          <strong className="text-white font-bold">{totalItems}</strong> questions
        </span>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Page size buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Per page:</span>
          {pageSizeOptions.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSizeChange(size)}
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
                pageSize === size
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageSizeChange(totalItems)}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
              pageSize >= totalItems
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Right: Navigation Controls (Prev, Page numbers, Next, Jump) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-slate-500 select-none"
                >
                  &hellip;
                </span>
              );
            }

            const pNum = page as number;
            const isActive = pNum === currentPage;

            return (
              <button
                key={pNum}
                type="button"
                onClick={() => onPageChange(pNum)}
                className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/40 shadow-sm'
                    : 'border border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {pNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>

        {/* Jump to Page Input if more than 3 pages */}
        {totalPages > 3 && (
          <form
            onSubmit={handleJumpSubmit}
            className="flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs"
          >
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="Page"
              className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-center text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
