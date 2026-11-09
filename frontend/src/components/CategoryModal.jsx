import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const CATEGORIES = [
  { id: 'resume', label: 'Resume', desc: 'CVs, candidate portfolios, job applications' },
  { id: 'invoice', label: 'Invoice', desc: 'Billing receipts, vendor invoices, payment statements' },
  { id: 'research_paper', label: 'Research Paper', desc: 'Scientific papers, abstracts, methodologies, citations' },
  { id: 'academic_document', label: 'Academic Document', desc: 'Syllabus, transcripts, lecture notes, grade sheets' },
  { id: 'legal_document', label: 'Legal Document', desc: 'Contracts, NDAs, lease agreements, terms of service' },
  { id: 'report', label: 'Report', desc: 'Quarterly financial reports, audit reviews, assessments' },
  { id: 'other', label: 'Other', desc: 'General manuals, guides, miscellaneous text' },
];

export default function CategoryModal({
  isOpen,
  onClose,
  currentCategory,
  onSave,
  documentTitle,
}) {
  const [selected, setSelected] = useState(currentCategory || 'other');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(selected, notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Change Category</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                onClick={() => setSelected(cat.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selected === cat.id
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={selected === cat.id}
                  onChange={() => setSelected(cat.id)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-800">{cat.label}</div>
                  <div className="text-[11px] text-slate-500">{cat.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Correction Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Model confused academic CV with industry resume"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Apply Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

