import React from 'react';
import { History, Download, Trash2, CheckCircle2, Clock, Play } from 'lucide-react';
import { getDownloadUrl, deleteJob } from '../services/api';
import { formatBytes } from '../components/CategoryCard';

export default function HistoryPage({ jobs, onSelectJob, onRefreshJobs }) {
  const handleDelete = async (jobId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this job workspace and its temporary files?')) return;
    try {
      await deleteJob(jobId);
      onRefreshJobs();
    } catch {
      alert('Failed to delete job');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E1EEF8]">
            <History className="w-6 h-6 text-[#4F35B9]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Activity History</h2>
            <p className="text-xs text-[#6B7C96] mt-0.5">Review previous upload & organization jobs</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-white border border-[#E1EEF8] rounded-full text-[#4F35B9]">
          {jobs.length} total jobs
        </span>
      </div>

      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1B2A4A]">
            <thead className="bg-[#E4EFF8] text-[#53647E] font-bold border-b border-[#D5E5F4]">
              <tr>
                <th className="py-3.5 px-4">Archive Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Files</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Duplicates</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EEF8] bg-white">
              {jobs.length > 0 ? (
                jobs.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => onSelectJob(j)}
                    className="hover:bg-[#F0F6FB] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#1B2A4A]">{j.source_filename}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          j.status === 'organized'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-[#4F35B9] border border-indigo-200'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{j.total_files}</td>
                    <td className="py-3.5 px-4 font-mono">{formatBytes(j.total_size)}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-600">{j.duplicate_count}</td>
                    <td className="py-3.5 px-4 text-[#6B7C96]">{new Date(j.created_at).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {j.status === 'organized' && (
                          <a
                            href={getDownloadUrl(j.id)}
                            download
                            className="p-1.5 rounded-lg bg-[#E0ECF8] hover:bg-[#D2E3F3] text-[#4F35B9] transition-colors"
                            title="Download Output ZIP"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={(e) => handleDelete(j.id, e)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#6B7C96]">
                    No historical jobs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
