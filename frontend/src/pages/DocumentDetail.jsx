import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Trash2,
  Edit3,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
  Eye,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { documentAPI } from '../api/client';
import CategoryBadge from '../components/CategoryBadge';
import CategoryModal from '../components/CategoryModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reclassifying, setReclassifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await documentAPI.getById(id);
      setDoc(res.data);
    } catch (err) {
      console.error(err);
      setError('Document not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const handleCopyText = () => {
    if (doc?.extracted_text) {
      navigator.clipboard.writeText(doc.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReclassify = async () => {
    setReclassifying(true);
    setSuccessMsg('');
    try {
      const res = await documentAPI.reclassify(id);
      setSuccessMsg(`Document reclassified as "${res.data.new_category.toUpperCase()}" with ${Math.round((res.data.confidence_score || 0) * 100)}% confidence.`);
      fetchDoc();
    } catch (err) {
      console.error(err);
      setError('Failed to reclassify document.');
    } finally {
      setReclassifying(false);
    }
  };

  const handleCategorySave = async (newCat, notes) => {
    try {
      await documentAPI.updateCategory(id, newCat, notes);
      setSuccessMsg(`Category manually corrected to "${newCat.toUpperCase()}".`);
      fetchDoc();
    } catch (err) {
      console.error(err);
      setError('Failed to update category.');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await documentAPI.delete(id);
      navigate('/documents');
    } catch (err) {
      console.error(err);
      setError('Failed to delete document.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading document details...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">{error || 'Document not found'}</h2>
        <Link
          to="/documents"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Library</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button and title bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate max-w-lg">
              {doc.original_filename}
            </h1>
            <div className="text-[11px] text-slate-400">
              ID: <span className="font-mono text-slate-600">{doc.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={documentAPI.downloadUrl(doc.id)}
            download={doc.original_filename}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-700 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Category</span>
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Classification Inspector & Metadata */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Classification Decision & Alternative Rankings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Classification Result Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  NLP Classifier Decision
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <CategoryBadge
                    category={doc.effective_category}
                    score={doc.classification_score}
                    needsReview={doc.needs_review}
                    isCorrected={!!doc.manually_corrected_category}
                    size="lg"
                  />
                  {doc.manually_corrected_category && (
                    <span className="text-xs text-slate-400">
                      (Originally predicted: <span className="font-semibold">{doc.predicted_category}</span>)
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleReclassify}
                disabled={reclassifying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reclassifying ? 'animate-spin' : ''}`} />
                <span>{reclassifying ? 'Classifying...' : 'Re-run NLP'}</span>
              </button>
            </div>

            {/* Confidence Progress Meter */}
            {doc.classification_score !== null && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Calibrated Confidence Score</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {Math.round(doc.classification_score * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      doc.classification_score >= 0.70
                        ? 'bg-emerald-500'
                        : doc.classification_score >= 0.40
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.round(doc.classification_score * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Review Policy Alert if needed */}
            {doc.needs_review && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold">Review Recommended: </span>
                  The model confidence is below threshold (&lt;40%) or the margin between the top two categories was close. You can verify or manually adjust the category using "Edit Category" above.
                </div>
              </div>
            )}

            {/* Top Alternative Classes */}
            {doc.alternatives && doc.alternatives.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Top Alternative Candidate Classes
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {doc.alternatives.map(([cat, score], idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="font-semibold text-slate-800 capitalize truncate">
                        {cat.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {Math.round(score * 100)}% probability
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Extracted Text Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Extracted Document Text</h3>
                <p className="text-xs text-slate-400">
                  Cleaned textual features supplied to TF-IDF vectorizer
                </p>
              </div>

              {doc.extracted_text && (
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
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

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto selection:bg-indigo-100">
              {doc.extracted_text || 'No readable text content available for this document.'}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Document Metadata
            </h3>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Format</span>
                <span className="font-semibold text-slate-800 uppercase">{doc.file_type}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">File Size</span>
                <span className="font-mono text-slate-800">
                  {(doc.file_size / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Extracted Words</span>
                <span className="font-mono text-slate-800">{doc.word_count || 0}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Extraction Status</span>
                <span className="font-semibold text-emerald-600 capitalize">
                  {doc.extraction_status}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Model Version</span>
                <span className="font-mono text-slate-700 text-[11px]">{doc.model_version}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Uploaded At</span>
                <span className="text-slate-700 text-[11px]">
                  {new Date(doc.uploaded_at).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-700 text-[11px]">
                  {new Date(doc.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick In-Browser Viewer Action */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 text-xs text-indigo-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>In-Browser Viewer</span>
            </div>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              Open the document in a dedicated browser tab to inspect layout, fonts, and vector elements.
            </p>
            <a
              href={documentAPI.previewUrl(doc.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-700 text-xs"
            >
              <span>Launch Inline Viewer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        currentCategory={doc.effective_category}
        documentTitle={doc.original_filename}
        onSave={handleCategorySave}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        documentTitle={doc.original_filename}
        loading={deleteLoading}
      />
    </div>
  );
}

