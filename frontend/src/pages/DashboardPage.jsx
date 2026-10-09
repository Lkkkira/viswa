import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Code,
  Archive,
  Folder,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import CategoryCard, { formatBytes } from '../components/CategoryCard';
import StorageCard from '../components/StorageCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function DashboardPage({
  activeJob,
  files,
  jobs,
  onNavigate,
  onFileSelect,
}) {
  const categoriesSummary = activeJob?.categories_summary || {};
  
  // Build category list with real stats
  const categoriesList = ['Documents', 'Images', 'Audio', 'Videos', 'Code', 'Archives', 'Others'];

  const categoryCardsData = categoriesList.map((cat) => {
    const count = categoriesSummary[cat] || 0;
    const catFiles = files.filter((f) => f.category === cat);
    const size = catFiles.reduce((acc, f) => acc + (f.file_size || 0), 0);
    return { category: cat, count, size };
  });

  // Recharts Analytics data
  const chartData = categoryCardsData
    .filter((c) => c.count > 0)
    .map((c) => ({
      name: c.category,
      count: c.count,
      sizeMB: parseFloat(((c.size || 0) / (1024 * 1024)).toFixed(2)),
    }));

  const chartColors = ['#20BCE5', '#4F35B9', '#06B6D4', '#8B5CF6', '#3B82F6', '#EC4899', '#64748B'];

  // Recent files (first 5 files)
  const recentFiles = files.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Storage Overview Widget */}
      <StorageCard
        activeJob={activeJob}
        onUploadClick={() => onNavigate('upload')}
        onOrganizeClick={() => onNavigate('organization')}
      />

      {/* My Folders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B2A4A]">My Folders</h2>
            <p className="text-xs text-[#6B7C96]">Your files grouped by category</p>
          </div>
          <button
            onClick={() => onNavigate('files')}
            className="text-xs font-semibold text-[#4F35B9] hover:underline flex items-center gap-1"
          >
            <span>View All Files</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryCardsData.slice(0, 4).map((item) => (
            <CategoryCard
              key={item.category}
              category={item.category}
              count={item.count}
              size={item.size}
              onClick={() => onNavigate('files', { category: item.category })}
            />
          ))}
        </div>
      </div>

      {/* Grid Layout for Analytics & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Storage Analytics Chart */}
        <div className="lg:col-span-2 bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1B2A4A]">File Distribution & Storage</h3>
              <p className="text-xs text-[#6B7C96]">Breakdown by file count per category</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-[#4F35B9] font-medium hover:underline"
            >
              Full Analytics
            </button>
          </div>

          {chartData.length > 0 ? (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6B7C96" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7C96" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E1EEF8', fontSize: '12px' }}
                    formatter={(val, name) => [val, name === 'count' ? 'Files' : 'Size (MB)']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-[#6B7C96]">
              <FileCheck className="w-8 h-8 text-[#20BCE5] mb-2 opacity-50" />
              <span>No workspace scanned yet. Upload a ZIP to view real category analytics.</span>
            </div>
          )}
        </div>

        {/* Recent Files List */}
        <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1B2A4A]">Recent Files</h3>
              <button
                onClick={() => onNavigate('files')}
                className="text-xs text-[#4F35B9] font-medium hover:underline"
              >
                See all
              </button>
            </div>

            {recentFiles.length > 0 ? (
              <div className="space-y-2.5">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => onFileSelect(file)}
                    className="flex items-center justify-between p-3 bg-white hover:bg-[#E8F2FA] rounded-xl border border-[#E1EEF8] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-[#E0ECF8] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#20BCE5]" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-[#1B2A4A] group-hover:text-[#4F35B9] transition-colors block truncate">
                          {file.filename}
                        </span>
                        <span className="text-[10px] text-[#6B7C96]">{formatBytes(file.file_size)}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8EA1B9] group-hover:text-[#4F35B9] shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#6B7C96]">
                No recent files found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Jobs */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1B2A4A]">Recent Activity</h3>
            <p className="text-xs text-[#6B7C96]">Completed and ongoing file organization tasks</p>
          </div>
          <button
            onClick={() => onNavigate('activity')}
            className="text-xs text-[#4F35B9] font-semibold hover:underline"
          >
            View History
          </button>
        </div>

        {jobs.length > 0 ? (
          <div className="divide-y divide-[#E1EEF8] border border-[#E1EEF8] rounded-xl bg-white overflow-hidden">
            {jobs.slice(0, 3).map((j) => (
              <div key={j.id} className="p-4 flex items-center justify-between hover:bg-[#FAFDFZ] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E0ECF8] flex items-center justify-center">
                    {j.status === 'organized' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#4F35B9]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1B2A4A]">{j.source_filename}</h4>
                    <span className="text-[11px] text-[#6B7C96]">
                      {j.total_files} files • {formatBytes(j.total_size)} • {new Date(j.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                      j.status === 'organized'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-[#4F35B9] border border-indigo-200'
                    }`}
                  >
                    {j.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#6B7C96]">No job activity recorded yet.</div>
        )}
      </div>
    </div>
  );
}
