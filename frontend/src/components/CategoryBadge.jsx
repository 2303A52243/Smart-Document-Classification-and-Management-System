import React from 'react';
import { AlertCircle } from 'lucide-react';

const CATEGORY_STYLES = {
  resume: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Resume',
  },
  invoice: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Invoice',
  },
  research_paper: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    label: 'Research Paper',
  },
  academic_document: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Academic Doc',
  },
  legal_document: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Legal Document',
  },
  report: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    label: 'Report',
  },
  other: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Other',
  },
};

export default function CategoryBadge({
  category,
  score = null,
  needsReview = false,
  isCorrected = false,
  size = 'md',
}) {
  const normKey = (category || 'other').toLowerCase();
  const config = CATEGORY_STYLES[normKey] || CATEGORY_STYLES.other;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1 text-sm'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
        {score !== null && score !== undefined && (
          <span className="opacity-70 text-[10px] font-mono ml-0.5">
            {Math.round(score * 100)}%
          </span>
        )}
      </span>

      {isCorrected && (
        <span
          title="Manually corrected category"
          className="text-[10px] bg-sky-100 text-sky-800 font-medium px-1.5 py-0.5 rounded border border-sky-200"
        >
          Edited
        </span>
      )}

      {needsReview && (
        <span
          title="Low confidence / ambiguous classification requires review"
          className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 font-medium px-1.5 py-0.5 rounded border border-amber-200"
        >
          <AlertCircle className="w-3 h-3 text-amber-600" />
          Review
        </span>
      )}
    </div>
  );
}
