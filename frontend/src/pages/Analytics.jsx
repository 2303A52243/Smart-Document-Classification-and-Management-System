import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Brain,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { analyticsAPI } from '../api/client';

const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#f43f5e', '#6366f1', '#94a3b8'];

export default function Analytics() {
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, metRes] = await Promise.all([
            analyticsAPI.getCategories(),
            analyticsAPI.getMetrics(),
          ]);
        setCategories(catRes.data);
        setMetrics(metRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load complete analytics metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading model evaluation metrics...</p>
        </div>
      </div>
    );
  }

  const barData = categories.map((c) => ({
    name: c.category.replace('_', ' '),
    count: c.count,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Analytics & NLP Model Metrics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real database ingestion volume and empirical scikit-learn test evaluation metrics.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Synthetic Dataset Academic Disclaimer */}
      {metrics?.disclaimer && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Academic Evaluation Disclosure: </span>
            {metrics.disclaimer}
          </div>
        </div>
      )}

      {/* Top Level ML Performance KPIs */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Test Accuracy</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {(metrics.accuracy * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Held-out test split (N={metrics.test_samples})
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Macro F1-Score</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {(metrics.f1_macro * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Balanced across all 7 classes</div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Macro Precision</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {(metrics.precision_macro * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Precision averaged per class</div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Macro Recall</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {(metrics.recall_macro * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">True positive detection rate</div>
          </div>
        </div>
      )}

      {/* Charts Section: Distribution & Volume */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Documents per Category</h2>
              <p className="text-xs text-slate-400">Total volume stored in MongoDB collections</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No documents uploaded yet to chart.
              </div>
            )}
          </div>
        </div>

        {/* Training Dataset Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Training Dataset Balance</h2>
              <p className="text-xs text-slate-400">
                Dataset split: {metrics?.train_samples || 0} train, {metrics?.test_samples || 0} test
              </p>
            </div>
            <Brain className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {metrics?.dataset_distribution &&
                Object.entries(metrics.dataset_distribution).map(([cat, count]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 capitalize">
                        {cat.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-slate-500">{count} samples</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${Math.round((count / (metrics.total_samples || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Per-Category Detailed Evaluation Table */}
      {metrics?.per_category && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Per-Category Evaluation Metrics</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Precision, recall, and F1-score evaluated on held-out test data
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Document Class</th>
                  <th className="py-3 px-4">Precision</th>
                  <th className="py-3 px-4">Recall</th>
                  <th className="py-3 px-4">F1-Score</th>
                  <th className="py-3 px-4">Test Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {Object.entries(metrics.per_category).map(([cat, scores]) => (
                  <tr key={cat} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-5 font-sans font-medium text-slate-900 capitalize">
                      {cat.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600">
                      {(scores.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-blue-600">
                      {(scores.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600">
                      {(scores.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{scores.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confusion Matrix Visualization */}
      {metrics?.confusion_matrix && metrics?.categories && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Confusion Matrix (Held-out Test Set)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rows represent true labeled categories; columns represent predicted categories
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse text-xs text-center mx-auto">
              <thead>
                <tr>
                  <th className="p-2 text-slate-400 text-[10px] uppercase font-semibold">True \ Pred</th>
                  {metrics.categories.map((c) => (
                    <th
                      key={c}
                      className="p-2 text-[10px] uppercase font-semibold text-slate-600 max-w-[80px] truncate"
                      title={c}
                    >
                      {c.substring(0, 4)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.confusion_matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 font-medium text-left text-slate-700 capitalize text-[11px]">
                      {metrics.categories[rIdx]?.replace('_', ' ')}
                    </td>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`w-12 h-10 p-2 font-mono text-xs border border-white font-semibold ${rIdx === cIdx
                            ? val > 0
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-400'
                            : val > 0
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-50 text-slate-300'
                          }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

