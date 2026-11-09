import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { documentAPI } from '../api/client';
import CategoryBadge from '../components/CategoryBadge';

const MAX_SIZE_MB = 15;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTS = ['pdf', 'docx', 'txt'];

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFiles = (files) => {
    setError('');
    const valid = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop().toLowerCase();

      if (!ALLOWED_EXTS.includes(ext)) {
        setError(`File "${file.name}" has an unsupported format. Supported: .pdf, .docx, .txt`);
        return;
      }

      if (file.size > MAX_BYTES) {
        setError(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB size limit.`);
        return;
      }
      valid.push(file);
    }
    setSelectedFiles(valid);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError('');
    setUploadProgress(10);
    setResults([]);

    try {
      if (selectedFiles.length === 1) {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        const res = await documentAPI.upload(formData, (progress) => {
          setUploadProgress(progress);
        });
        setResults([res.data]);
      } else {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        const res = await documentAPI.uploadMultiple(formData, (progress) => {
          setUploadProgress(progress);
        });
        setResults(res.data.uploaded || []);
        if (res.data.errors && res.data.errors.length > 0) {
          setError(`Some files had errors: ${res.data.errors.map((e) => e.filename).join(', ')}`);
        }
      }
      setSelectedFiles([]);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Failed to upload and classify document. Check file contents.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Upload & Classify Documents</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload PDF, DOCX, or TXT. Our NLP engine will extract the text and classify it automatically.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/50'
            : 'border-slate-200 hover:border-indigo-400 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-indigo-100">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Drag and drop your digital documents here
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Select single or multiple files. Supported formats: <span className="font-semibold text-slate-700">PDF, DOCX, TXT</span> (Max {MAX_SIZE_MB}MB each)
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <span>Browse From Device</span>
        </button>
      </div>

      {/* Selected Files Preview List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Selected Files ({selectedFiles.length})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate max-w-md">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{file.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeSelectedFile(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium text-indigo-600">
                <span>Extracting text & running NLP classifier...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{uploading ? 'Processing Document...' : 'Run NLP Classification'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Classification Results Card */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Classification Complete</h2>
            </div>
            <Link
              to="/documents"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>Go to Document Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid gap-4">
            {results.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{doc.original_filename}</div>
                      <div className="text-[11px] text-slate-400">
                        {(doc.file_size / 1024).toFixed(1)} KB • {doc.word_count || 0} words extracted
                      </div>
                    </div>
                  </div>

                  <CategoryBadge
                    category={doc.effective_category}
                    score={doc.classification_score}
                    needsReview={doc.needs_review}
                    size="lg"
                  />
                </div>

                {doc.text_preview && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Text Extracted for Inference
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                      {doc.text_preview}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Status: <span className="text-emerald-600 font-semibold">{doc.processing_status}</span> •
                    Model: {doc.model_version}
                  </span>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>View Full Metadata & Options</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

