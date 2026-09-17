"use client";

import type { DisplayTarget } from "@/lib/browser/windowManagement";

interface ScreenDisplayPickerProps {
  displays: DisplayTarget[];
  loading: boolean;
  error: string | null;
  onSelect: (display: DisplayTarget) => void;
}

export default function ScreenDisplayPicker({
  displays,
  loading,
  error,
  onSelect,
}: ScreenDisplayPickerProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="screen-display-picker-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-white/15 bg-slate-900 p-5 shadow-2xl">
        <h1 id="screen-display-picker-title" className="text-lg font-bold text-white">
          اختر شاشة الكمبيوتر
        </h1>

        {error && (
          <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-28 items-center justify-center gap-3 text-sm text-slate-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            جارٍ تحميل الشاشات المتصلة...
          </div>
        ) : (
          <div className="mt-4 grid max-h-[60vh] gap-2 overflow-y-auto">
            {displays.map((display) => (
              <button
                key={display.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(display);
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-md border border-white/15 px-4 py-3 text-right transition-colors hover:border-indigo-400 hover:bg-indigo-500/10"
              >
                <span
                  className="grid h-9 w-12 shrink-0 place-items-center rounded border border-indigo-400 text-sm font-bold text-indigo-300"
                  aria-hidden="true"
                >
                  {display.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">
                    شاشة الكمبيوتر {display.number}
                    {display.isPrimary ? " (الرئيسية)" : ""}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {display.label} · {display.width} × {display.height}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
