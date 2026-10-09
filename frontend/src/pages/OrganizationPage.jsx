import React, { useState, useEffect } from 'react';
import { FolderKanban, ArrowRight, Edit2, Check, AlertTriangle, Play, RefreshCw, Folder } from 'lucide-react';
import { fetchJobPlan, updateJobPlan, organizeJob } from '../services/api';

export default function OrganizationPage({ jobId, activeJob, onOrganizedSuccess }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jobId) {
      setLoading(true);
      fetchJobPlan(jobId)
        .then((data) => {
          setActions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [jobId]);

  const handleStartEdit = (act) => {
    setEditingId(act.file_id);
    setEditValue(act.proposed_path);
  };

  const handleSaveEdit = async (act) => {
    if (!editValue || editValue === act.proposed_path) {
      setEditingId(null);
      return;
    }

    try {
      const updated = await updateJobPlan(jobId, [{ file_id: act.file_id, user_override_path: editValue }]);
      setActions(updated);
      setEditingId(null);
    } catch (err) {
      setError('Failed to update destination path');
    }
  };

  const handleOrganizeNow = async () => {
    setOrganizing(true);
    setError(null);
    try {
      const resultJob = await organizeJob(jobId);
      setOrganizing(false);
      onOrganizedSuccess(resultJob);
    } catch (err) {
      setOrganizing(false);
      setError(err.message || 'Failed to apply organization plan.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-[#E1EEF8]">
            <FolderKanban className="w-7 h-7 text-[#4F35B9]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Proposed Directory Structure & Plan</h2>
            <p className="text-xs text-[#6B7C96] mt-0.5">
              Review and customize proposed destination paths before applying changes.
            </p>
          </div>
        </div>

        <button
          onClick={handleOrganizeNow}
          disabled={organizing || actions.length === 0}
          className="bg-[#4F35B9] hover:bg-[#3E269B] text-white px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          {organizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Organizing Workspace...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Approve Plan & Organize</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Plan Table */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#E4EFF8] border-b border-[#D5E5F4] flex items-center justify-between">
          <span className="text-xs font-bold text-[#1B2A4A]">Organization Plan Manifest ({actions.length} items)</span>
          <span className="text-[11px] text-[#6B7C96]">Click edit icon to override any target path</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#6B7C96] animate-pulse">Generating plan manifest...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1B2A4A]">
              <thead className="bg-white text-[#53647E] font-bold border-b border-[#E1EEF8]">
                <tr>
                  <th className="py-3 px-4">Original Path</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Proposed Target Path</th>
                  <th className="py-3 px-4">Collision / Warning</th>
                  <th className="py-3 px-4 text-right">Edit Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1EEF8] bg-white">
                {actions.map((act) => (
                  <tr key={act.id} className="hover:bg-[#F0F6FB] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#6B7C96] truncate max-w-xs">
                      {act.original_path}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          act.action === 'skip'
                            ? 'bg-slate-100 text-slate-600'
                            : act.action === 'rename'
                            ? 'bg-purple-50 text-[#4F35B9] border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {act.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-[#4F35B9] max-w-md">
                      {editingId === act.file_id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-2 py-1 bg-white border border-[#4F35B9] rounded text-xs text-[#1B2A4A] focus:outline-none w-full"
                          />
                          <button
                            onClick={() => handleSaveEdit(act)}
                            className="p-1 rounded bg-[#4F35B9] text-white hover:bg-[#3E269B]"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>{act.proposed_path}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {act.conflict_flag && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Collision Avoided
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStartEdit(act)}
                        className="p-1.5 rounded-lg bg-[#F0F6FB] hover:bg-[#E0ECF8] text-[#4F35B9] transition-colors"
                        title="Edit Proposed Path"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
