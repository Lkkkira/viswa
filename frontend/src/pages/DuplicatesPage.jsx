import React, { useState, useEffect } from 'react';
import { Copy, HardDrive, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchJobDuplicates, updateJobPlan } from '../services/api';
import { formatBytes } from '../components/CategoryCard';

export default function DuplicatesPage({ jobId, activeJob }) {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (jobId) {
      setLoading(true);
      fetchJobDuplicates(jobId)
        .then((data) => {
          setDuplicateGroups(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [jobId]);

  const handleToggleFileSelection = async (groupIndex, fileId, currentSelected) => {
    const newSelected = !currentSelected;
    
    // Update local state optimistically
    const updatedGroups = [...duplicateGroups];
    const group = updatedGroups[groupIndex];
    const file = group.files.find((f) => f.id === fileId);
    if (file) {
      file.is_selected_duplicate = newSelected;
    }
    setDuplicateGroups(updatedGroups);

    // Sync with backend API
    setSaving(true);
    try {
      await updateJobPlan(jobId, [{ file_id: fileId, is_selected_duplicate: newSelected }]);
      setSaving(false);
    } catch {
      setSaving(false);
    }
  };

  const totalGroups = duplicateGroups.length;
  const totalDuplicateCopies = duplicateGroups.reduce((acc, g) => acc + (g.count - 1), 0);
  const totalSavings = duplicateGroups.reduce((acc, g) => acc + g.potential_savings, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Summary Header Box */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-[#E1EEF8] shadow-xs">
            <Copy className="w-7 h-7 text-[#4F35B9]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Exact Duplicates Detection</h2>
            <p className="text-xs text-[#6B7C96] mt-0.5">Files grouped by matching SHA-256 binary hash</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-[#E1EEF8]">
          <div className="text-center pr-4 border-r border-[#E1EEF8]">
            <span className="text-xs text-[#6B7C96] block">Duplicate Groups</span>
            <span className="text-lg font-extrabold text-[#1B2A4A]">{totalGroups}</span>
          </div>
          <div className="text-center pr-4 border-r border-[#E1EEF8]">
            <span className="text-xs text-[#6B7C96] block">Duplicate Copies</span>
            <span className="text-lg font-extrabold text-amber-600">{totalDuplicateCopies}</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-[#6B7C96] block">Recoverable Storage</span>
            <span className="text-lg font-extrabold text-[#4F35B9]">{formatBytes(totalSavings)}</span>
          </div>
        </div>
      </div>

      {/* Duplicate Groups List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#6B7C96] animate-pulse">Scanning SHA-256 duplicate groups...</div>
      ) : duplicateGroups.length > 0 ? (
        <div className="space-y-4">
          {duplicateGroups.map((group, idx) => (
            <div key={group.duplicate_group_id} className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E1EEF8]">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#E0ECF8] text-[#4F35B9] font-bold text-xs">
                    Group #{idx + 1}
                  </span>
                  <span className="font-mono text-[11px] text-[#6B7C96]">SHA-256: {group.sha256_hash}</span>
                </div>
                <div className="text-xs font-semibold text-[#1B2A4A]">
                  {group.count} copies • <span className="text-[#4F35B9] font-bold">Save {formatBytes(group.potential_savings)}</span>
                </div>
              </div>

              <div className="space-y-2">
                {group.files.map((file, fIdx) => (
                  <div
                    key={file.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      file.is_selected_duplicate
                        ? 'bg-white border-[#E1EEF8]'
                        : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={file.is_selected_duplicate}
                        onChange={() => handleToggleFileSelection(idx, file.id, file.is_selected_duplicate)}
                        className="rounded text-[#4F35B9] focus:ring-[#4F35B9] w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-[#1B2A4A] block">{file.filename}</span>
                        <span className="font-mono text-[11px] text-[#6B7C96]">{file.original_path}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {fIdx === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Primary Copy
                        </span>
                      )}
                      <span className="font-mono text-slate-500">{formatBytes(file.file_size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-12 text-center text-xs text-[#6B7C96]">
          No duplicate files detected in this workspace!
        </div>
      )}
    </div>
  );
}
