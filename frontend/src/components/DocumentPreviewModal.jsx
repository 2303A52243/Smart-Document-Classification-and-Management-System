import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import { documentAPI } from '../api/client';

export default function DocumentPreviewModal({ isOpen, onClose, doc }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !doc) return null;

  const handleCopyText = () => {
    if (doc.extracted_text) {
      navigator.clipboard.writeText(doc.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPdf = doc.file_type === 'pdf';
  const previewUrl = documentAPI.previewUrl(doc.id);
  const downloadUrl = documentAPI.downloadUrl(doc.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col z-10 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {doc.original_filename}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <CategoryBadge
                  category={doc.effective_category}
                  score={doc.classification_score}
                  needsReview={doc.needs_review}
                  isCorrected={!!doc.manually_corrected_category}
                  size="sm"
                />
                <span className="text-[11px] text-slate-400">
                  {(doc.file_size / 1024).toFixed(1)} KB • {doc.word_count || 0} words
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={doc.original_filename}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* If PDF, show option to view inline */}
          {isPdf && (
            <div className="mb-4">
              <iframe
                src={previewUrl}
                title="PDF Preview"
                className="w-full h-80 border border-slate-200 rounded-xl"
              />
            </div>
          )}

          {/* Extracted Text Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Extracted NLP Text Content
              </div>
              {doc.extracted_text && (
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto selection:bg-indigo-100">
              {doc.extracted_text || doc.text_preview || 'No text extracted.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Model: {doc.model_version || '1.0.0-tfidf-svm-calibrated'}</span>
          <span>Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

