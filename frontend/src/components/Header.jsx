import React from 'react';
import { Search, Sparkles } from 'lucide-react';

export default function Header({ title, subtitle, searchQuery, setSearchQuery, activeJob }) {
  return (
    <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#E1EEF8]">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">{title}</h1>
        <p className="text-sm text-[#6B7C96] mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {activeJob && (
          <div className="hidden sm:flex items-center gap-2 bg-[#E3EFF9] border border-[#CDE1F3] px-3 py-1.5 rounded-full text-xs text-[#4F35B9] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#20BCE5]" />
            <span>Active Job: <strong className="text-[#1B2A4A]">{activeJob.source_filename}</strong></span>
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-64 pl-9 pr-4 py-2 bg-white rounded-full text-sm text-[#1B2A4A] placeholder-[#8EA1B9] border border-[#D5E4F3] focus:outline-none focus:ring-2 focus:ring-[#4F35B9]/20 focus:border-[#4F35B9] transition-all shadow-xs"
          />
          <Search className="w-4 h-4 text-[#8EA1B9] absolute left-3 top-2.5" />
        </div>
      </div>
    </header>
  );
}
