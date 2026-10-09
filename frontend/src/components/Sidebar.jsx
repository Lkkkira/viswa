import React from 'react';
import {
  LayoutGrid,
  Upload,
  Files,
  Copy,
  FolderKanban,
  BarChart3,
  History,
  Settings,
  User,
  FolderOpen
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, activeJob }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'upload', label: 'Upload Files', icon: Upload },
    { id: 'files', label: 'All Files', icon: Files },
    { id: 'duplicates', label: 'Duplicates', icon: Copy, badge: activeJob?.duplicate_count },
    { id: 'organization', label: 'Organization', icon: FolderKanban },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#F0F6FB] border-r border-[#D2E3F3] flex flex-col h-full rounded-l-3xl p-6 select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mb-2 border border-[#E1EEF8]">
          <FolderOpen className="w-7 h-7 text-[#20BCE5]" />
        </div>
        <h1 className="text-xl font-bold text-[#1B2A4A] tracking-tight">FilePilot</h1>
      </div>

      {/* Workspace Identity Badge */}
      <div className="flex flex-col items-center bg-[#E4EFF8] rounded-2xl p-4 mb-6 border border-[#D5E5F4]">
        <div className="w-12 h-12 bg-[#CBE4F7] rounded-full flex items-center justify-center mb-2">
          <User className="w-6 h-6 text-[#4F35B9]" />
        </div>
        <span className="font-semibold text-sm text-[#1B2A4A]">My Workspace</span>
        <span className="text-xs text-[#6B7C96]">
          {activeJob ? activeJob.source_filename : 'Local files'}
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#E0ECF8] text-[#4F35B9] font-semibold shadow-xs'
                  : 'text-[#53647E] hover:bg-[#E8F2FA] hover:text-[#1B2A4A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#4F35B9]' : 'text-[#6B7C96]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-[#4F35B9] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-[#D5E5F4] text-center text-xs text-[#6B7C96] font-medium">
        FilePilot v1.0
      </div>
    </aside>
  );
}
