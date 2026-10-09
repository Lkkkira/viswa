import React from 'react';
import { PieChart, Upload, ArrowRight } from 'lucide-react';
import { formatBytes } from './CategoryCard';

export default function StorageCard({ activeJob, onUploadClick, onOrganizeClick }) {
  const totalFiles = activeJob?.total_files || 0;
  const totalSize = activeJob?.total_size || 0;
  const dupSavings = activeJob?.duplicate_savings || 0;

  return (
    <div className="bg-gradient-to-r from-[#4F35B9] via-[#432C9E] to-[#382387] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden my-6">
      {/* Background ambient glow circle */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#20BCE5]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-[#20BCE5]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/90">Storage Overview</h2>
              <p className="text-xs text-white/70">Track your file collection</p>
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {activeJob ? `${formatBytes(totalSize)} Scanned` : 'Analyze your files'}
          </h3>
          <p className="text-xs text-white/80 max-w-md mt-1 leading-relaxed">
            {activeJob
              ? `Workspace archive contains ${totalFiles} total files. Found ${activeJob.duplicate_count} duplicate copies with ${formatBytes(dupSavings)} potential storage savings.`
              : 'Upload a ZIP archive to calculate real file counts, exact duplicates, and storage breakdown.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!activeJob ? (
            <button
              onClick={onUploadClick}
              className="bg-[#20BCE5] hover:bg-[#19a7cd] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          ) : (
            <>
              <button
                onClick={onUploadClick}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New
              </button>
              <button
                onClick={onOrganizeClick}
                className="bg-[#20BCE5] hover:bg-[#19a7cd] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>{activeJob.status === 'organized' ? 'View Results' : 'Organize Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
