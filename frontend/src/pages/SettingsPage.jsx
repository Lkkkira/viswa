import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Check, Shield } from 'lucide-react';
import { fetchSettings, saveSettings } from '../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    category_rules: {
      Documents: ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.csv', '.pptx', '.md'],
      Images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
      Audio: ['.mp3', '.wav', '.aac', '.flac', '.ogg'],
      Videos: ['.mp4', '.mkv', '.avi', '.mov', '.webm'],
      Code: ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.sql'],
      Archives: ['.zip', '.tar', '.gz', '.7z'],
    },
    naming_convention: '{category}/{filename}',
    max_upload_size_mb: 500,
    max_file_count: 5000,
    auto_remove_duplicates: false,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  }, []);

  const handleExtensionChange = (category, valueStr) => {
    const extList = valueStr.split(',').map((e) => e.trim()).filter(Boolean);
    setSettings((prev) => ({
      ...prev,
      category_rules: {
        ...prev.category_rules,
        [category]: extList,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E1EEF8]">
            <Settings className="w-6 h-6 text-[#4F35B9]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Preferences & Category Rules</h2>
            <p className="text-xs text-[#6B7C96] mt-0.5">Customize categorization extensions and organization settings</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#4F35B9] hover:bg-[#3E269B] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Category Mappings */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#1B2A4A]">Category File Extensions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.category_rules).map(([cat, exts]) => (
            <div key={cat} className="bg-white p-4 rounded-xl border border-[#E1EEF8] space-y-1.5">
              <span className="text-xs font-bold text-[#1B2A4A]">{cat}</span>
              <input
                type="text"
                value={exts.join(', ')}
                onChange={(e) => handleExtensionChange(cat, e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#D5E4F3] rounded-lg text-xs font-mono text-[#4F35B9] focus:outline-none focus:border-[#4F35B9]"
              />
              <span className="text-[10px] text-[#6B7C96]">Comma-separated extension list (e.g. .pdf, .docx)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety & Limits Configuration */}
      <div className="bg-[#F0F6FB] border border-[#DCE8F5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#20BCE5]" />
          <h3 className="text-base font-bold text-[#1B2A4A]">Archive Limits & Safety</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E1EEF8]">
            <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Max Upload Size (MB)</label>
            <input
              type="number"
              value={settings.max_upload_size_mb}
              onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value) || 500 })}
              className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#D5E4F3] rounded-lg text-xs font-bold text-[#1B2A4A]"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E1EEF8]">
            <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Max File Count Limit</label>
            <input
              type="number"
              value={settings.max_file_count}
              onChange={(e) => setSettings({ ...settings, max_file_count: parseInt(e.target.value) || 5000 })}
              className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#D5E4F3] rounded-lg text-xs font-bold text-[#1B2A4A]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
