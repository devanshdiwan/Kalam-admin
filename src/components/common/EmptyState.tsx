import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 my-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
        <Icon size={28} />
      </div>
      <h4 className="text-base font-bold text-slate-200">{title}</h4>
      <p className="text-sm text-slate-400 max-w-md mt-1 mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
