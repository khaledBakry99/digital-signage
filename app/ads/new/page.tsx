"use client";

import { useRouter } from "next/navigation";
import AdForm from "@/components/AdForm";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useAuth } from "@/lib/hooks/useAuth";

export default function NewAdPage() {
  const router = useRouter();
  const { clientId } = useAuth();
  const { createAdvertisement, error } = useAdvertisements(clientId);

  const handleSubmit = async (data: {
    name: string;
    file: File;
    description?: string;
    type: 'Image' | 'Video';
  }) => {
    const ad = await createAdvertisement(data);
    if (ad) router.push("/ads");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-1">
          <span className="gradient-text">إضافة إعلان</span>
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          ارفع صورة أو فيديو واختر الشاشة المطلوبة
        </p>
      </div>

      {/* Form card */}
      <div
        className="glass p-8 animate-fade-in"
        style={{ animationDelay: "80ms" }}
      >
        <AdForm onSubmit={handleSubmit} />
      </div>

      {error && (
        <div
          className="mt-4 p-4 rounded-xl animate-fade-in"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
