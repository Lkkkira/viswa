import React, { useState, useEffect } from 'react';
import { X, FileText, Image as ImageIcon, Copy, Hash, Folder, HardDrive, Check } from 'lucide-react';
import { formatBytes } from './CategoryCard';
import { fetchFileContent } from '../services/api';

export default function FilePreviewModal({ file, jobId, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (file && jobId) {
      setLoading(true);
      fetchFileContent(jobId, file.id)
        .then((res) => {
          setContent(res);
          setLoading(false);
        })
        .catch(() => {
          setContent({ type: 'text', data: 'Preview unavailable for this file.' });
          setLoading(false);
        });
    }
  }, [file, jobId]);

  if (!file) return null;

  const copyHash = () => {
    if (file.sha256_hash) {
      navigator.clipboard.writeText(file.sha256_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#F0F6FB] border border-[#D5E4F3] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-[#E1EEF8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F2FA] rounded-xl flex items-center justify-center border border-[#D5E4F3]">
              <FileText className="w-5 h-5 text-[#20BCE5]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base truncate max-w-md">{file.filename}</h3>
              <p className="text-xs text-[#6B7C96]">{file.category} • {formatBytes(file.file_size)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F6FB] hover:bg-[#E0ECF8] flex items-center justify-center text-[#6B7C96] hover:text-[#1B2A4A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#E1EEF8]">
              <span className="text-[#6B7C96] block mb-1 font-medium">Original Path</span>
              <span className="font-mono text-[#1B2A4A] break-all">{file.original_path}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E1EEF8]">
              <span className="text-[#6B7C96] block mb-1 font-medium">Proposed Path</span>
              <span className="font-mono text-[#4F35B9] font-semibold break-all">
                {file.proposed_path || `${file.category}/${file.filename}`}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E1EEF8]">
              <span className="text-[#6B7C96] block mb-1 font-medium">Detected Type</span>
              <span className="text-[#1B2A4A]">{file.mime_type || file.extension}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E1EEF8] flex items-center justify-between">
              <div>
                <span className="text-[#6B7C96] block mb-1 font-medium">SHA-256 Hash</span>
                <span className="font-mono text-[10px] text-[#1B2A4A] block truncate max-w-[180px]">
                  {file.sha256_hash}
                </span>
              </div>
              <button
                onClick={copyHash}
                className="p-1.5 rounded-lg bg-[#F0F6FB] hover:bg-[#E0ECF8] text-[#4F35B9] transition-colors"
                title="Copy Hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Duplicate Banner if duplicate */}
          {file.is_duplicate && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
              <span className="font-medium">⚠️ Duplicate file copy detected in hash group {file.duplicate_group_id}</span>
              <span className="font-bold px-2 py-0.5 rounded bg-amber-100">Duplicate</span>
            </div>
          )}

          {/* File Content Preview */}
          <div className="bg-white rounded-2xl border border-[#E1EEF8] p-4">
            <h4 className="text-xs font-bold text-[#6B7C96] uppercase tracking-wider mb-3">Safe Preview</h4>
            {loading ? (
              <div className="py-8 text-center text-xs text-[#6B7C96] animate-pulse">Loading preview...</div>
            ) : content?.type === 'image' ? (
              <div className="flex justify-center p-2 bg-[#F8FAFC] rounded-xl border border-slate-100">
                <img src={content.data} alt={file.filename} className="max-h-64 object-contain rounded-lg" />
              </div>
            ) : content?.type === 'text' ? (
              <pre className="bg-[#FAFBFD] p-3 rounded-xl border border-[#E8F0F8] font-mono text-xs text-slate-800 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                {content.data}
              </pre>
            ) : (
              <div className="text-center py-6 text-xs text-[#6B7C96]">
                Binary preview not supported for extension <span className="font-semibold">{file.extension}</span>.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3 border-t border-[#E1EEF8] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#E0ECF8] hover:bg-[#D2E3F3] text-[#1B2A4A] rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
