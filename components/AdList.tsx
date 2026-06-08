"use client";

import type { MediaAsset } from "@/lib/types/mediaAsset";

interface AdListProps {
  advertisements: MediaAsset[];
  onEdit: (ad: MediaAsset) => void;
  onDelete: (ad: MediaAsset) => void;
}

export default function AdList({
  advertisements,
  onEdit,
  onDelete,
}: AdListProps) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatSize = (mb: number) => {
    if (mb === 0) return "—";
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  if (advertisements.length === 0) {
    return (
      <div className="p-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p
          className="font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          لا توجد إعلانات
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ابدأ بإضافة إعلان جديد
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-dark">
        <thead>
          <tr>
            <th>الإعلان</th>
            <th>الوصف</th>
            <th>الصورة</th>
            <th>الحجم</th>
            <th>النوع</th>
            <th>التاريخ</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {advertisements.map((ad, i) => (
            <tr
              key={ad.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <td>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {ad.name}
                </p>
              </td>
              <td>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {ad.description || "—"}
                </p>
              </td>
              <td>
                {ad.url && ad.type === "Image" ? (
                  <img
                    src={ad.url}
                    alt={ad.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    style={{
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : ad.type === "Video" ? (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(168,85,247,0.15)",
                      border: "1px solid rgba(168,85,247,0.25)",
                    }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#c084fc" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </td>
              <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {formatSize(ad.fileSizeMb)}
              </td>
              <td>
                <span
                  className={`badge ${ad.type === "Image" ? "badge-blue" : "badge-purple"}`}
                >
                  {ad.type === "Image" ? "صورة" : "فيديو"}
                </span>
              </td>
              <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {formatDate(ad.createdAtUtc)}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(ad)}
                    className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-slate-100 font-medium text-xs transition-all duration-200 active:scale-[0.97] select-none inline-flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(ad)}
                    className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-medium text-xs transition-all duration-200 active:scale-[0.97] select-none inline-flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
