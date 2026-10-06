import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/80 rounded-md ${className}`} />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex gap-4 border-b border-slate-800 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-slate-800" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 border-b border-slate-800/40">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1 bg-slate-800/50" />
          ))}
        </div>
      ))}
    </div>
  );
};
