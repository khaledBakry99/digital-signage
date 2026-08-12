"use client";

import { useTheme } from "@/lib/context/ThemeContext";

interface MediaSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MediaSearchInput({ value, onChange, placeholder = "ابحث باستخدام اسم الإعلان..." }: MediaSearchInputProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const searchInputClass = isLightTheme
    ? "w-full h-12 pr-12 pl-6 rounded-2xl bg-gradient-to-r from-[#f9f0ff]/90 via-[#f1f5ff]/90 to-[#eafafe]/90 border border-[#dcd6ff]/70 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-200 focus:ring-2 focus:ring-violet-100/60 transition-all duration-300 shadow-[inset_0_2px_14px_rgba(148,163,184,0.2)]"
    : "w-full h-12 pr-12 pl-6 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50 transition-all duration-300 group-hover:bg-black/30";

  const iconColor = isLightTheme ? "text-slate-400" : "text-white/30";

  return (
    <div className="relative group w-full">
      <input
        type="text"
        className={searchInputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div
        className={`absolute right-4 top-1/2 -translate-y-1/2 ${iconColor} group-hover:text-indigo-400 transition-colors duration-300 pointer-events-none`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {value && (
        <button
          onClick={() => onChange("")}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
            isLightTheme
              ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              : "text-white/40 hover:text-white/70 hover:bg-white/10"
          }`}
          title="مسح البحث"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
