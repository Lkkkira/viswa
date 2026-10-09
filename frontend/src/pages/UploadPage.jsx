import React, { useState } from 'react';
import { Upload, FileArchive, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { uploadZip, scanJob } from '../services/api';
import { formatBytes } from '../components/CategoryCard';

export default function UploadPage({ onJobCreated, onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Only .zip archive files are supported.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Only .zip archive files are supported.');
      }
    }
  };

  const startUploadAndScan = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setProgress(20);

    try {
      // 1. Upload archive
      const job = await uploadZip(selectedFile);
      setProgress(60);
      setUploading(false);
      setScanning(true);

      // 2. Scan archive
      const scannedJob = await scanJob(job.id);
      setProgress(100);
      setScanning(false);

      onJobCreated(scannedJob);
      onNavigate('organization');
    } catch (err) {
      setUploading(false);
      setScanning(false);
      setError(err.message || 'Failed to process archive.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">Upload Files & Archive</h2>
        <p className="text-xs text-[#6B7C96] mb-6">
          Upload a ZIP archive to analyze file categories, detect exact duplicates, and generate a deterministic organization plan.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-[#20BCE5]/60 hover:border-[#4F35B9] bg-white rounded-2xl p-10 text-center transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4 shadow-xs"
        >
          <div className="w-16 h-16 bg-[#E0ECF8] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-[#4F35B9]" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#1B2A4A]">Drag & drop your ZIP archive here</h3>
            <p className="text-xs text-[#6B7C96] mt-1">Supports archives up to 500 MB and 5,000 files</p>
          </div>

          <label className="inline-flex items-center gap-2 bg-[#20BCE5] hover:bg-[#19a7cd] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
            <FileArchive className="w-4 h-4" />
            <span>Browse Files</span>
            <input type="file" accept=".zip" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        {/* Selected File Card & Actions */}
        {selectedFile && (
          <div className="mt-6 bg-white border border-[#E1EEF8] rounded-2xl p-5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E0ECF8] rounded-xl flex items-center justify-center">
                <FileArchive className="w-6 h-6 text-[#20BCE5]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1B2A4A] text-sm">{selectedFile.name}</h4>
                <p className="text-xs text-[#6B7C96]">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>

            <button
              onClick={startUploadAndScan}
              disabled={uploading || scanning}
              className="bg-[#4F35B9] hover:bg-[#3E269B] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <span>{uploading ? 'Uploading...' : scanning ? 'Scanning Files...' : 'Start Scanning'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {(uploading || scanning) && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-[#1B2A4A] font-semibold">
              <span>{uploading ? 'Uploading ZIP archive...' : 'Scanning contents & computing SHA-256 hashes...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-[#E0ECF8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#20BCE5] to-[#4F35B9] transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Safety & Security Guarantee Box */}
      <div className="bg-[#E4EFF8] border border-[#D5E5F4] rounded-2xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-[#4F35B9] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-[#1B2A4A]">FilePilot Safety & Privacy Principles</h4>
          <p className="text-xs text-[#6B7C96] mt-1 leading-relaxed">
            Your original archive remains untouched throughout the process. All extraction occurs within an isolated job workspace. FilePilot never executes uploaded code, never sends your data to external servers, and never overwrites files automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
