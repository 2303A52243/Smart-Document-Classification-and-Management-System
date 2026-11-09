import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  FolderTree,
  Search,
  Brain,
  FileCheck2,
  Lock,
  Layers,
  Database,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">SmartDoc NLP</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#categories" className="hover:text-slate-900 transition-colors">Categories</a>
            <a href="#tech-stack" className="hover:text-slate-900 transition-colors">Architecture</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span>Linear SVM & Calibrated Probabilities</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none mb-6">
            Organize Documents <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
              Intelligently with AI
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Upload, classify, search, and manage your documents using Natural Language Processing.
            Automatic text extraction from PDF, DOCX, and TXT with transparent confidence scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
            >
              <span>Start Classifying Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              <span>Explore Demo Workspace</span>
            </Link>
          </div>

          {/* Hero Feature Badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <FileCheck2 className="w-5 h-5 text-indigo-600 mb-2" />
              <div className="text-xs font-bold text-slate-900">PyMuPDF & docx</div>
              <div className="text-[11px] text-slate-500">Vector text extraction</div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <Cpu className="w-5 h-5 text-blue-600 mb-2" />
              <div className="text-xs font-bold text-slate-900">TF-IDF + Linear SVM</div>
              <div className="text-[11px] text-slate-500">Fast local ML inference</div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <Database className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="text-xs font-bold text-slate-900">MongoDB Storage</div>
              <div className="text-[11px] text-slate-500">Metadata, logs & indexing</div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <Lock className="w-5 h-5 text-purple-600 mb-2" />
              <div className="text-xs font-bold text-slate-900">JWT & Bcrypt</div>
              <div className="text-[11px] text-slate-500">Isolated per-user vault</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Step-by-Step Architecture</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">How Document Intelligence Works</h3>
            <p className="text-sm text-slate-600 mt-2">
              Every document follows an end-to-end verified pipeline from binary upload to database indexing.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Secure Ingestion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepts PDF, DOCX, or TXT. Validates file size, calculates SHA-256 hash, and saves with UUID filename to prevent traversal attacks.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Text Extraction</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                PyMuPDF parses PDF vector text; python-docx extracts paragraph and table runs. Checks for empty text or scanned documents.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">NLP & Classification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unicode NFKD cleaning, tokenization, TF-IDF n-gram vectorization, and inference via Calibrated Linear SVM for probability estimation.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                04
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Vault & Management</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stores document metadata in MongoDB with user-level isolation. Allows full-text search, preview, download, and manual category corrections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Trained Document Domains</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">7 Initial Document Classes</h3>
            <p className="text-sm text-slate-600 mt-2">
              Our model is trained to recognize distinctive textual signatures across key enterprise document types.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Resume', desc: 'Work history, skills, education, projects, contact profiles' },
              { title: 'Invoice', desc: 'Bill-to addresses, line items, taxes, payment due dates, totals' },
              { title: 'Research Paper', desc: 'Abstracts, methodology, citations, theorem proofs, literature reviews' },
              { title: 'Academic Document', desc: 'Course syllabus, university transcripts, exam papers, lecture notes' },
              { title: 'Legal Document', desc: 'NDAs, service agreements, governing law clauses, real estate leases' },
              { title: 'Report', desc: 'Quarterly financial reports, ESG sustainability reviews, audit findings' },
              { title: 'Other / Unknown', desc: 'General memos, recipes, manuals, guides, unclassified content' },
            ].map((cat, idx) => (
              <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-900">{cat.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section id="tech-stack" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Powered by Modern Full-Stack & Machine Learning Technologies
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-semibold text-slate-700">
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">React 18 + Vite</span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">Tailwind CSS v4</span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">FastAPI (Python 3.12)</span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">scikit-learn & LinearSVC</span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">MongoDB 8 + Motor</span>
            <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">PyMuPDF (fitz)</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-white">Smart Document Classification System</span> • Academic Year 2026–2027
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Swagger API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
