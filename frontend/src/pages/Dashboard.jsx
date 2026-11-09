import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Files,
  FileCheck2,
  Clock,
  FolderTree,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsAPI, documentAPI } from '../api/client';
import CategoryBadge from '../components/CategoryBadge';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const CATEGORY_COLORS = {
  resume: '#10b981',
  invoice: '#3b82f6',
  research_paper: '#a855f7',
  academic_document: '#f59e0b',
  legal_document: '#f43f5e',
  report: '#6366f1',
  other: '#94a3b8',
};

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activity, setActivity] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, catRes, actRes, docsRes, logsRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getCategories(),
        analyticsAPI.getActivity(14),
        documentAPI.list({ page: 1, page_size: 5, sort_by: 'uploaded_at', sort_order: 'desc' }),
        analyticsAPI.getRecentLogs(6),
      ]);

      setOverview(overviewRes.data);
      setCategories(catRes.data);
      setActivity(actRes.data);
      setRecentDocs(docsRes.data.items || []);
      setRecentLogs(logsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not load live dashboard data. Ensure the backend server and MongoDB are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeleteLoading(true);
    try {
      await documentAPI.delete(docToDelete.id);
      setDocToDelete(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading real-time MongoDB analytics...</p>
        </div>
      </div>
    );
  }

  const chartData = categories.map((c) => ({
    name: c.category.replace('_', ' ').toUpperCase(),
    value: c.count,
    color: CATEGORY_COLORS[c.category] || '#94a3b8',
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time document ingestion metrics and NLP classification analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-100 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Files</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Documents</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.total_documents || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Stored securely in vault</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Classified by NLP</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.classified_documents || 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {overview?.total_documents
              ? `${Math.round(((overview?.classified_documents || 0) / overview.total_documents) * 100)}% automated`
              : '100% automated'}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Needs Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.needs_review || 0}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Confidence &lt; 40% or ambiguous
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Categories</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.total_categories || 7}</div>
          <div className="text-[11px] text-slate-400 mt-1">Trained SVM domains</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Breakdown Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Document Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Documents organized by category</p>
          </div>

          <div className="h-56 my-2 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">
                No documents uploaded yet. Upload your first document to view distribution.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 max-h-32 overflow-y-auto pr-1">
            {categories.slice(0, 4).map((c) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#94a3b8' }}
                  />
                  <span className="text-slate-600 capitalize">{c.category.replace('_', ' ')}</span>
                </div>
                <span className="font-semibold text-slate-800">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 14-Day Activity Area Chart */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upload Activity (Last 14 Days)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Frequency of incoming documents processed</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="h-64">
            {activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uploadColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uploadColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recent activity recorded. Upload a document to start telemetry tracking.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Documents Table & Activity Stream */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Documents Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recently Uploaded Documents</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest documents parsed by the classifier</p>
            </div>
            <Link
              to="/documents"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <span>View Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentDocs.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Document</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900 max-w-xs truncate">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="hover:text-indigo-600 transition-colors truncate block"
                        >
                          {doc.original_filename}
                        </Link>
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
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            title="Preview Content"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={documentAPI.downloadUrl(doc.id)}
                            download={doc.original_filename}
                            title="Download File"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setDocToDelete(doc)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
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
              <div className="p-12 text-center">
                <Files className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No documents in vault</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click 'Upload New Files' to start classifying.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Log Stream */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Audit Trail & Logs</h2>
            <p className="text-xs text-slate-400 mb-4">Latest document operations</p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-50 last:border-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 capitalize truncate">
                        {log.action.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {log.details?.filename || log.details?.category || 'Document record'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-8">
                  No activity logs recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Model: {overview?.model_version || '1.0.0-svm'}</span>
            <span className="text-emerald-600 font-medium">Auto-synced</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
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

