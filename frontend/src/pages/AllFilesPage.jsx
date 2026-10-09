import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import { formatBytes } from '../components/CategoryCard';

export default function AllFilesPage({ files, onFileSelect, activeCategoryFilter }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(activeCategoryFilter || 'All');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [sortField, setSortField] = useState('filename');
  const [sortAsc, setSortAsc] = useState(true);

  const categories = ['All', 'Documents', 'Images', 'Audio', 'Videos', 'Code', 'Archives', 'Others'];

  // Filter files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.filename.toLowerCase().includes(search.toLowerCase()) ||
                          f.original_path.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesDuplicates = !duplicatesOnly || f.is_duplicate;
    return matchesSearch && matchesCategory && matchesDuplicates;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter Bar */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#4F35B9] text-white shadow-xs'
                  : 'bg-white text-[#53647E] hover:bg-[#E0ECF8] border border-[#E1EEF8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Duplicates Toggle & Search */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#1B2A4A] cursor-pointer">
            <input
              type="checkbox"
              checked={duplicatesOnly}
              onChange={(e) => setDuplicatesOnly(e.target.checked)}
              className="rounded text-[#4F35B9] focus:ring-[#4F35B9]"
            />
            <span>Duplicates Only</span>
          </label>

          <div className="relative">
            <input
              type="text"
              placeholder="Search table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-8 pr-3 py-1.5 bg-white rounded-xl text-xs text-[#1B2A4A] border border-[#D5E4F3] focus:outline-none focus:ring-2 focus:ring-[#4F35B9]/20"
            />
            <Search className="w-3.5 h-3.5 text-[#8EA1B9] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1B2A4A]">
            <thead className="bg-[#E4EFF8] text-[#53647E] font-bold border-b border-[#D5E5F4]">
              <tr>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('filename')}>
                  <div className="flex items-center gap-1">
                    <span>Filename</span>
                    <ArrowUpDown className="w-3 h-3 text-[#8EA1B9]" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-[#8EA1B9]" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('file_size')}>
                  <div className="flex items-center gap-1">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3 text-[#8EA1B9]" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Original Relative Path</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EEF8] bg-white">
              {sortedFiles.length > 0 ? (
                sortedFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-[#F0F6FB] transition-colors group">
                    <td className="py-3 px-4 font-semibold text-[#1B2A4A]">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#20BCE5] shrink-0" />
                        <span className="truncate max-w-xs">{f.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0ECF8] text-[#4F35B9]">
                        {f.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{formatBytes(f.file_size)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#6B7C96] truncate max-w-xs">
                      {f.original_path}
                    </td>
                    <td className="py-3 px-4">
                      {f.is_duplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Unique
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onFileSelect(f)}
                        className="p-1.5 rounded-lg bg-[#F0F6FB] hover:bg-[#E0ECF8] text-[#4F35B9] transition-colors"
                        title="Inspect File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#6B7C96]">
                    No files matching filter criteria.
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
