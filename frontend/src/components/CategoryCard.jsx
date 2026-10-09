import React from 'react';
import { FileText, Image, Music, Video, Code, Archive, Folder } from 'lucide-react';

const iconMap = {
  Documents: FileText,
  Images: Image,
  Audio: Music,
  Videos: Video,
  Code: Code,
  Archives: Archive,
  Others: Folder,
};

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function CategoryCard({ category, count, size, onClick }) {
  const Icon = iconMap[category] || Folder;

  return (
    <div
      onClick={onClick}
      className="bg-[#F0F6FB] border border-[#DCE8F5] hover:border-[#20BCE5] hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#E1EEF8] group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5 text-[#20BCE5]" />
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E0ECF8] text-[#4F35B9]">
          {formatBytes(size)}
        </span>
      </div>

      <div>
        <h3 className="text-base font-bold text-[#1B2A4A] group-hover:text-[#4F35B9] transition-colors">
          {category}
        </h3>
        <p className="text-xs text-[#6B7C96] mt-1 font-medium">
          {count} {count === 1 ? 'file' : 'files'}
        </p>
      </div>
    </div>
  );
}
