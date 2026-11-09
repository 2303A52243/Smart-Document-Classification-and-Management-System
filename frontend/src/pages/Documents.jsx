import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  UploadCloud,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { documentAPI, categoryAPI } from '../api/client';
import CategoryBadge from '../components/CategoryBadge';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import CategoryModal from '../components/CategoryModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'resume', label: 'Resume' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'research_paper', label: 'Research Paper' },
  { id: 'academic_document', label: 'Academic Doc' },
  { id: 'legal_document', label: 'Legal Document' },
  { id: 'report', label: 'Report' },
  { id: 'other', label: 'Other' },
];

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('uploaded_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [categoryModalDoc, setCategoryModalDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await documentAPI.list({
        page,
        page_size: pageSize,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setDocuments(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch documents. Ensure backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, categoryFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleCategoryChange = async (newCat, notes) => {
    if (!categoryModalDoc) return;
    try {
      await documentAPI.updateCategory(categoryModalDoc.id, newCat, notes);
      setCategoryModalDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to update category.');
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeleteLoading(true);
    try {
      await documentAPI.delete(docToDelete.id);
      setDocToDelete(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Document Library</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, preview, and manage classified documents in your personal vault.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-100 transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search filenames or extracted text content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="uploaded_at-desc">Newest First</option>
              <option value="uploaded_at-asc">Oldest First</option>
              <option value="original_filename-asc">Filename (A-Z)</option>
              <option value="original_filename-desc">Filename (Z-A)</option>
              <option value="file_size-desc">Size (Largest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading documents from MongoDB...</p>
            </div>
          ) : documents.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Document Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Words</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900 max-w-xs truncate">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <Link
                          to={`/documents/${doc.id}`}
                          className="hover:text-indigo-600 transition-colors truncate block"
                          title={doc.original_filename}
                        >
                          {doc.original_filename}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge
                        category={doc.effective_category}
                        score={doc.classification_score}
                        needsReview={doc.needs_review}
                        isCorrected={!!doc.manually_corrected_category}
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {doc.word_count || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          title="Preview Text"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoryModalDoc(doc)}
                          title="Correct Category"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={documentAPI.downloadUrl(doc.id)}
                          download={doc.original_filename}
                          title="Download File"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          title="Delete Document"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No documents found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery || categoryFilter !== 'all'
                  ? 'No documents match your current filter criteria.'
                  : 'Your document vault is currently empty.'}
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload First Document</span>
              </Link>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {total > pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, total)} of {total} documents
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />

      <CategoryModal
        isOpen={!!categoryModalDoc}
        onClose={() => setCategoryModalDoc(null)}
        currentCategory={categoryModalDoc?.effective_category}
        documentTitle={categoryModalDoc?.original_filename}
        onSave={handleCategoryChange}
      />

      <DeleteConfirmModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDelete}
        documentTitle={docToDelete?.original_filename}
        loading={deleteLoading}
      />
    </div>
  );
}
