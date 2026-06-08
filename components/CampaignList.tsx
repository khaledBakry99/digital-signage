"use client";

import type { Campaign } from "@/lib/types/campaign";

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (id: number) => void;
}

export default function CampaignList({ campaigns, onEdit, onDelete }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="glass p-12 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
             style={{ background: "rgba(99, 102, 241, 0.1)" }}>
          <svg className="w-10 h-10" style={{ color: "#818cf8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          لا توجد حملات
        </p>
        <p style={{ color: "var(--text-muted)" }}>
          ابدأ بإنشاء حملة إعلانية جديدة
        </p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-dark">
          <thead>
            <tr>
              <th>اسم الحملة</th>
              <th>الإعلانات المرتبطة</th>
              <th>تاريخ البداية</th>
              <th>تاريخ النهاية</th>
              <th>الوقت اليومي</th>
              <th>أيام الأسبوع</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {campaign.name}
                      </p>
                      {campaign.description && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          {campaign.description.slice(0, 50)}
                          {campaign.description.length > 50 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {campaign.boysKidsMediaAssetId > 0 && (
                        <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>أولاد</span>
                      )}
                      {campaign.girlsKidsMediaAssetId > 0 && (
                        <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>بنات</span>
                      )}
                      {campaign.menMediaAssetId > 0 && (
                        <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>رجال</span>
                      )}
                      {campaign.womenMediaAssetId > 0 && (
                        <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>نساء</span>
                      )}
                      {campaign.defaultMediaAssetId > 0 && (
                        <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' }}>افتراضي</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {new Date(campaign.startsAtUtc).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {new Date(campaign.endsAtUtc).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      <div>{campaign.dayStartsAt.slice(0, 5)} - {campaign.dayEndsAt.slice(0, 5)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {campaign.daysOfWeek.slice(0, 3).map(day => (
                        <span
                          key={day}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: "rgba(99, 102, 241, 0.1)",
                            color: "#818cf8",
                          }}
                        >
                          {day.slice(0, 3)}
                        </span>
                      ))}
                      {campaign.daysOfWeek.length > 3 && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          +{campaign.daysOfWeek.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(campaign)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 cursor-pointer"
                          style={{
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                          }}
                        >
                          تعديل
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`هل تريد حذف الحملة "${campaign.name}"؟`)) {
                              onDelete(campaign.id);
                            }
                          }}
                          className="btn-danger"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
