import React, { useState } from 'react';
import { Download, CheckCircle2, RotateCcw, FolderCheck, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { getDownloadUrl, restoreJob } from '../services/api';
import { formatBytes } from '../components/CategoryCard';

export default function ResultsPage({ activeJob, onRestoreSuccess, onNavigate }) {
  const [restoring, setRestoring] = useState(false);

  if (!activeJob || activeJob.status !== 'organized') {
    return (
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-12 text-center text-[#6B7C96] space-y-4">
        <FolderCheck className="w-12 h-12 text-[#4F35B9] mx-auto opacity-50" />
        <h3 className="text-lg font-bold text-[#1B2A4A]">No Completed Organization Job Found</h3>
        <p className="text-xs">Please upload a ZIP archive and apply the organization plan first.</p>
        <button
          onClick={() => onNavigate('upload')}
          className="px-5 py-2.5 bg-[#4F35B9] text-white font-semibold text-xs rounded-xl hover:bg-[#3E269B] transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getDownloadUrl(activeJob.id);
    link.download = `organized_${activeJob.source_filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = async () => {
    if (!window.confirm('Are you sure you want to restore workspace state? This will discard the generated output ZIP so you can re-organize.')) {
      return;
    }
    setRestoring(true);
    try {
      const restored = await restoreJob(activeJob.id);
      setRestoring(false);
      onRestoreSuccess(restored);
      onNavigate('organization');
    } catch {
      setRestoring(false);
    }
  };

  const downloadUrl = getDownloadUrl(activeJob.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Transformation Success Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#4F35B9] rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white/90">
              Transformation Complete
            </span>
            <h2 className="text-2xl font-extrabold mt-1 tracking-tight">Workspace Successfully Organized!</h2>
            <p className="text-xs text-white/80 mt-1">
              FilePilot cleanly categorized {activeJob.total_files} files into structured directories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore State</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-white text-emerald-800 hover:bg-emerald-50 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download Organized ZIP</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-5 text-center">
          <span className="text-xs text-[#6B7C96] block font-medium">Processed Files</span>
          <span className="text-2xl font-extrabold text-[#1B2A4A] mt-1 block">{activeJob.total_files}</span>
        </div>

        <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-5 text-center">
          <span className="text-xs text-[#6B7C96] block font-medium">Categories Structured</span>
          <span className="text-2xl font-extrabold text-[#4F35B9] mt-1 block">
            {Object.keys(activeJob.categories_summary || {}).length}
          </span>
        </div>

        <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-5 text-center">
          <span className="text-xs text-[#6B7C96] block font-medium">Duplicate Savings</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            {formatBytes(activeJob.duplicate_savings)}
          </span>
        </div>
      </div>

      {/* Structured Category Directories Card */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-[#1B2A4A] mb-4">Generated Folder Structure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(activeJob.categories_summary || {}).map(([cat, count]) => (
            <div key={cat} className="bg-white p-4 rounded-xl border border-[#E1EEF8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderCheck className="w-5 h-5 text-[#20BCE5]" />
                <span className="font-bold text-[#1B2A4A] text-xs">{cat}/</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E0ECF8] text-[#4F35B9]">
                {count} files
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
