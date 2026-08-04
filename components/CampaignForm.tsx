"use client";

import { useState, FormEvent } from "react";
import type { Campaign, CampaignStatus, CreateCampaignInput, DayOfWeek } from "@/lib/types/campaign";
import { useMediaAssets } from "@/lib/hooks/useMediaAssets";

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const DAYS_ARABIC: Record<DayOfWeek, string> = {
  Sunday: 'الأحد',
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
};

type AllowedFormStatus = Extract<CampaignStatus, "Active" | "Paused" | "Completed">;

interface CampaignFormProps {
  campaign?: Campaign;
  onSubmit: (data: CreateCampaignInput) => void;
  onCancel?: () => void;
  clientId: number;
}

export default function CampaignForm({ campaign, onSubmit, onCancel, clientId }: CampaignFormProps) {
  const { mediaAssets, loading: mediaAssetsLoading } = useMediaAssets();

  const [name, setName] = useState(campaign?.name || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const ALLOWED_STATUSES: AllowedFormStatus[] = ['Active', 'Paused', 'Completed'];
  const initialStatus: AllowedFormStatus = (campaign?.status && ALLOWED_STATUSES.includes(campaign.status as AllowedFormStatus)
    ? (campaign.status as AllowedFormStatus)
    : 'Active');
  const [status, setStatus] = useState<AllowedFormStatus>(initialStatus);
  const [priority, setPriority] = useState(campaign?.priority || 1);
  const [startsAtUtc, setStartsAtUtc] = useState(
    campaign?.startsAtUtc ? new Date(campaign.startsAtUtc).toISOString().slice(0, 10) : ""
  );
  const [endsAtUtc, setEndsAtUtc] = useState(
    campaign?.endsAtUtc ? new Date(campaign.endsAtUtc).toISOString().slice(0, 10) : ""
  );
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(campaign?.daysOfWeek || []);
  const [dayStartsAt, setDayStartsAt] = useState(
    campaign?.dayStartsAt ? campaign.dayStartsAt.slice(0, 5) : "00:00"
  );
  const [dayEndsAt, setDayEndsAt] = useState(
    campaign?.dayEndsAt ? campaign.dayEndsAt.slice(0, 5) : "23:59"
  );
  const [boysKidsMediaAssetId, setBoysKidsMediaAssetId] = useState(campaign?.boysKidsMediaAssetId || 0);
  const [girlsKidsMediaAssetId, setGirlsKidsMediaAssetId] = useState(campaign?.girlsKidsMediaAssetId || 0);
  const [menMediaAssetId, setMenMediaAssetId] = useState(campaign?.menMediaAssetId || 0);
  const [womenMediaAssetId, setWomenMediaAssetId] = useState(campaign?.womenMediaAssetId || 0);
  const [defaultMediaAssetId, setDefaultMediaAssetId] = useState(campaign?.defaultMediaAssetId || 0);

  const handleDayToggle = (day: DayOfWeek) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getUtcDateWithCurrentTime = (dateStr: string): string => {
    try {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      const day = Number(dayStr);
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        throw new Error('Invalid date');
      }
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
    } catch {
      return new Date(dateStr).toISOString();
    }
  };

  const getIsoDateTimeFromTime = (timeStr: string): string => {
    try {
      const [hoursStr, minutesStr] = timeStr.split(':');
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        throw new Error('Invalid time');
      }
      return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0)).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const data: CreateCampaignInput = {
      clientId,
      name,
      description,
      status,
      startsAtUtc: getUtcDateWithCurrentTime(startsAtUtc),
      endsAtUtc: getUtcDateWithCurrentTime(endsAtUtc),
      priority,
      daysOfWeek,
      dayStartsAt: getIsoDateTimeFromTime(dayStartsAt),
      dayEndsAt: getIsoDateTimeFromTime(dayEndsAt),
      boysKidsMediaAssetId,
      girlsKidsMediaAssetId,
      menMediaAssetId,
      womenMediaAssetId,
      defaultMediaAssetId,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="glass p-6 space-y-5">
        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          المعلومات الأساسية
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            اسم الحملة *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-dark"
            placeholder="أدخل اسم الحملة"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            الوصف
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-dark"
            rows={3}
            placeholder="وصف الحملة..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              حالة الحملة *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AllowedFormStatus)}
              className="input-dark cursor-pointer"
              required
            >
              <option value="Active">نشطة</option>
              <option value="Paused">متوقفة مؤقتًا</option>
              <option value="Completed">مكتملة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              أولوية الحملة * <span className="text-xs font-normal opacity-70">(الرقم الأكبر يُعرض أولاً)</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="input-dark cursor-pointer"
              required
            >
              {Array.from({ length: 40 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Schedule */}
      <div className="glass p-6 space-y-5">
        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          الجدولة
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              تاريخ البداية *
            </label>
            <input
              type="date"
              value={startsAtUtc}
              onChange={(e) => setStartsAtUtc(e.target.value)}
              className="input-dark cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              تاريخ النهاية *
            </label>
            <input
              type="date"
              value={endsAtUtc}
              onChange={(e) => setEndsAtUtc(e.target.value)}
              className="input-dark cursor-pointer"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
            أيام الأسبوع
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className="rounded-xl py-3 text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  background: daysOfWeek.includes(day)
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))"
                    : "var(--bg-secondary)",
                  color: daysOfWeek.includes(day) ? "#818cf8" : "var(--text-muted)",
                  border: `1.5px solid ${daysOfWeek.includes(day) ? "rgba(99, 102, 241, 0.4)" : "var(--border)"}`,
                }}
              >
                {DAYS_ARABIC[day]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              وقت البداية اليومي
            </label>
            <input
              type="time"
              value={dayStartsAt}
              onChange={(e) => setDayStartsAt(e.target.value)}
              className="input-dark cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              وقت النهاية اليومي
            </label>
            <input
              type="time"
              value={dayEndsAt}
              onChange={(e) => setDayEndsAt(e.target.value)}
              className="input-dark cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Media Assets */}
      <div className="glass p-6 space-y-5">
        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          الإعلانات المرتبطة
        </h3>

        {mediaAssetsLoading ? (
          <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
            جاري تحميل الإعلانات...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                إعلان الأولاد
              </label>
              <select
                value={boysKidsMediaAssetId}
                onChange={(e) => setBoysKidsMediaAssetId(Number(e.target.value))}
                className="input-dark cursor-pointer"
              >
                <option value={0}>اختر إعلان الأولاد</option>
                {mediaAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                إعلان البنات
              </label>
              <select
                value={girlsKidsMediaAssetId}
                onChange={(e) => setGirlsKidsMediaAssetId(Number(e.target.value))}
                className="input-dark cursor-pointer"
              >
                <option value={0}>اختر إعلان البنات</option>
                {mediaAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                إعلان الرجال
              </label>
              <select
                value={menMediaAssetId}
                onChange={(e) => setMenMediaAssetId(Number(e.target.value))}
                className="input-dark cursor-pointer"
              >
                <option value={0}>اختر إعلان الرجال</option>
                {mediaAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                إعلان النساء
              </label>
              <select
                value={womenMediaAssetId}
                onChange={(e) => setWomenMediaAssetId(Number(e.target.value))}
                className="input-dark cursor-pointer"
              >
                <option value={0}>اختر إعلان النساء</option>
                {mediaAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                الإعلان الافتراضي *
              </label>
              <select
                value={defaultMediaAssetId}
                onChange={(e) => setDefaultMediaAssetId(Number(e.target.value))}
                className="input-dark cursor-pointer"
                required
              >
                <option value={0}>اختر الإعلان الافتراضي</option>
                {mediaAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            إلغاء
          </button>
        )}
        <button type="submit" className="btn-primary">
          {campaign ? "تحديث الحملة" : "إنشاء الحملة"}
        </button>
      </div>
    </form>
  );
}
