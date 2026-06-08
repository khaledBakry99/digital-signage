"use client";

import { useEffect } from "react";
import type { Campaign, CreateCampaignInput } from "@/lib/types/campaign";
import CampaignForm from "./CampaignForm";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCampaignInput) => void;
  campaign?: Campaign;
  clientId: number;
  error?: string | null;
}

export default function CampaignModal({ isOpen, onClose, onSubmit, campaign, clientId, error }: CampaignModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (data: CreateCampaignInput) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0, 0, 0, 0.7)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl animate-scale-in overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(15, 20, 35, 0.98), rgba(20, 25, 45, 0.95))",
          border: "1.5px solid rgba(99, 102, 241, 0.2)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-6 border-b" style={{ 
          borderColor: "rgba(99, 102, 241, 0.2)",
          background: "linear-gradient(180deg, rgba(15, 20, 35, 0.95), rgba(15, 20, 35, 0.8))"
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">
                <span className="gradient-text-modern">
                  {campaign ? "تعديل الحملة" : "إضافة حملة جديدة"}
                </span>
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                قم بإنشاء حملة إعلانية مجدولة
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <svg
                className="w-5 h-5 transition-colors"
                style={{ color: "#f87171" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
          
          <CampaignForm
            campaign={campaign}
            onSubmit={handleSubmit}
            onCancel={onClose}
            clientId={clientId}
          />
        </div>
      </div>
    </div>
  );
}
