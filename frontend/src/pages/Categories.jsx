import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { categoryAPI } from '../api/client';
import CategoryBadge from '../components/CategoryBadge';

const CATEGORY_META = {
  resume: {
    title: 'Resume & CV',
    desc: 'Candidate resumes, professional profiles, job application documents, curriculum vitae, engineering portfolios.',
    color: 'from-emerald-500 to-teal-600',
    border: 'hover:border-emerald-300',
  },
  invoice: {
    title: 'Invoice & Billing',
    desc: 'Commercial tax invoices, billing statements, purchase orders, fee disbursements, vendor receipts.',
    color: 'from-blue-500 to-indigo-600',
    border: 'hover:border-blue-300',
  },
  research_paper: {
    title: 'Research Paper',
    desc: 'Peer-reviewed scientific abstracts, experimental methodologies, literature reviews, theorem proofs, references.',
    color: 'from-purple-500 to-violet-600',
    border: 'hover:border-purple-300',
  },
  academic_document: {
    title: 'Academic Document',
    desc: 'University course syllabi, student transcripts, semester exam papers, laboratory guides, thesis proposals.',
    color: 'from-amber-500 to-orange-600',
    border: 'hover:border-amber-300',
  },
  legal_document: {
    title: 'Legal Document',
    desc: 'Non-disclosure agreements (NDAs), master services agreements (MSAs), leases, bylaws, power of attorney.',
    color: 'from-rose-500 to-red-600',
    border: 'hover:border-rose-300',
  },
  report: {
    title: 'Report',
    desc: 'Quarterly financial earnings reports, ESG sustainability filings, IT security audits, workforce analytics.',
    color: 'from-indigo-500 to-blue-600',
    border: 'hover:border-indigo-300',
  },
  other: {
    title: 'Other / Unknown',
    desc: 'User guides, manuals, recipes, personal journals, announcements, general miscellaneous documents.',
    color: 'from-slate-500 to-slate-700',
    border: 'hover:border-slate-300',
  },
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('resume');
  const [catDocs, setCatDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryAPI.list();
        setCategories(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (!selectedCat) return;
    const fetchCatDocs = async () => {
      setDocsLoading(true);
      try {
        const res = await categoryAPI.getCategoryDocs(selectedCat);
        setCatDocs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchCatDocs();
  }, [selectedCat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading categories from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Category Explorer</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Browse document distributions and inspect files organized by the NLP classification model.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((c) => {
          const meta = CATEGORY_META[c.name] || CATEGORY_META.other;
          const isSelected = selectedCat === c.name;
          return (
            <div
              key={c.name}
              onClick={() => setSelectedCat(c.name)}
              className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-md'
                  : `border-slate-200/80 ${meta.border} hover:bg-slate-50/50`
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-3 h-3 rounded-full bg-gradient-to-tr ${meta.color}`} />
                <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                  {c.count} docs
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{meta.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                {meta.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Category Details & Recent Files List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Category Archive
              </span>
              <span className="text-xs text-slate-400">•</span>
              <CategoryBadge category={selectedCat} size="sm" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1 capitalize">
              {CATEGORY_META[selectedCat]?.title || selectedCat}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {CATEGORY_META[selectedCat]?.desc}
            </p>
          </div>

          <Link
            to={`/documents?category=${selectedCat}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Open in Document Library</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Recent Documents in this Category
          </h3>

          {docsLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
          ) : catDocs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {catDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {doc.original_filename}
                      </Link>
                      <div className="text-[11px] text-slate-400">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No documents currently categorized under{' '}
              <span className="font-semibold">{CATEGORY_META[selectedCat]?.title}</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

