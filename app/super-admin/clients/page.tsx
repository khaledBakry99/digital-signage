"use client";

import { useMemo, useRef, useState } from "react";
import SuperAdminGuard from "@/components/SuperAdminGuard";
import LoadingButton from "@/components/LoadingButton";
import { useSuperAdminClients } from "@/lib/hooks/useSuperAdminClients";
import type { CreateClientInput, ManagedClient, UpdateClientInput } from "@/lib/types/superAdmin";

const initialClientForm: CreateClientInput = {
  name: "",
  contactEmail: "",
  city: "",
  isAiEnabled: true,
  maxScreens: 10,
  retentionDays: 30,
};

type PendingAction = {
  id: number;
  action: "status" | "ai";
};

export default function SuperAdminClientsPage() {
  const { clients, loading, createClient, updateClient, activateClient, deactivateClient } = useSuperAdminClients();
  const [newClient, setNewClient] = useState<CreateClientInput>(initialClientForm);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [shakeButton, setShakeButton] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    const active = clients.filter((c) => c.isActive).length;
    const inactive = clients.filter((c) => !c.isActive).length;
    const aiEnabled = clients.filter((c) => c.isAiEnabled).length;
    return {
      total: clients.length,
      active,
      inactive,
      aiEnabled,
    };
  }, [clients]);

  const handleCreate = async () => {
    const errors: Record<string, boolean> = {};
    if (!newClient.name.trim()) errors.name = true;
    if (!newClient.contactEmail.trim()) errors.email = true;
    if (!newClient.city.trim()) errors.city = true;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormMessage({ type: "error", text: "يرجى إكمال جميع الحقول المطلوبة (الاسم، البريد، المدينة)" });
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);

      // Focus on first empty field
      if (errors.name) {
        nameRef.current?.focus();
      } else if (errors.email) {
        emailRef.current?.focus();
      } else if (errors.city) {
        cityRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsCreating(true);
    setFormMessage(null);
    const success = await createClient(newClient);
    if (success) {
      setFormMessage({ type: "success", text: "تم إنشاء الشركة/المنشأة بنجاح" });
      setNewClient(initialClientForm);
      // Close modal after successful creation
      setTimeout(() => {
        setShowModal(false);
        setFormMessage(null);
      }, 1500);
    } else {
      setFormMessage({ type: "error", text: "تعذر إنشاء الشركة/المنشأة، يرجى المحاولة مرة أخرى" });
    }
    setIsCreating(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormMessage(null);
    setFieldErrors({});
    setNewClient(initialClientForm);
  };

  const handleToggleActivation = async (client: ManagedClient) => {
    setPendingAction({ id: client.id, action: "status" });
    try {
      if (client.isActive) {
        await deactivateClient(client.id, { reason: "تم التعطيل من قبل إدارة النظام" });
      } else {
        await activateClient(client.id);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleQuickEdit = async (
    client: ManagedClient,
    updates: Partial<UpdateClientInput>,
    action?: "ai",
  ) => {
    const payload: UpdateClientInput = {
      name: updates.name ?? client.name,
      contactEmail: updates.contactEmail ?? client.contactEmail,
      city: updates.city ?? client.city,
      isActive: updates.isActive ?? client.isActive,
      isAiEnabled: updates.isAiEnabled ?? client.isAiEnabled,
      maxScreens: updates.maxScreens ?? client.maxScreens,
      retentionDays: updates.retentionDays ?? client.retentionDays,
    };
    if (action) {
      setPendingAction({ id: client.id, action });
    }
    try {
      await updateClient(client.id, payload);
    } finally {
      if (action) {
        setPendingAction(null);
      }
    }
  };

  const isStatusLoading = (clientId: number) => pendingAction?.id === clientId && pendingAction.action === "status";
  const isAiLoading = (clientId: number) => pendingAction?.id === clientId && pendingAction.action === "ai";

  return (
    <SuperAdminGuard>
      <div className="p-8 space-y-8 min-h-screen bg-[#0a0e1a]">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/80 via-[#0f1419] to-slate-900/80 border border-white/10 p-6">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side: Title, Description, and Buttons */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">إدارة الشركات/المنشآت</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-4">
                من خلال هذه الواجهة يمكنك إدارة حسابات الشركات والمنشآت، تفعيل أو تعطيل الخدمات،
                ضبط حدود الشاشات، والتحكم في ميزات الذكاء الاصطناعي.
              </p>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إضافة شركة/منشأة
                </button>
              </div>
            </div>

            {/* Right Side: Stats Card */}
            <div className="w-full lg:w-[320px]">
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">إجمالي الشركات/المنشآت</p>
                    <p className="text-3xl font-bold text-emerald-400">{summary.total}</p>
                  </div>
                </div>
                {loading && clients.length === 0 ? (
                  <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 h-14 bg-white/5 rounded-lg skeleton-shimmer" />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 text-sm">
                    <div className="flex-1 text-center py-3 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="block text-xl font-bold text-emerald-400">{summary.active}</span>
                      <span className="text-slate-400 text-xs">نشطة</span>
                    </div>
                    <div className="flex-1 text-center py-3 px-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <span className="block text-xl font-bold text-rose-400">{summary.inactive}</span>
                      <span className="text-slate-400 text-xs">معطلة</span>
                    </div>
                    <div className="flex-1 text-center py-3 px-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <span className="block text-xl font-bold text-blue-400">{summary.aiEnabled}</span>
                      <span className="text-slate-400 text-xs">ذكاء</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          {loading && clients.length === 0 ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-elevated skeleton-shimmer">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-3">
                      <div className="skeleton-line-pro w-32" />
                      <div className="skeleton-line-pro w-48" />
                    </div>
                    <div className="skeleton-line-pro w-24" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="skeleton-line-pro h-20" />
                    <div className="skeleton-line-pro h-20" />
                    <div className="skeleton-line-pro h-20" />
                    <div className="skeleton-line-pro h-20" />
                  </div>
                  <div className="flex gap-3">
                    <div className="skeleton-line-pro w-32" />
                    <div className="skeleton-line-pro w-40" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="card-elevated">
                {/* Header Section with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-800/50 to-violet-500/10 border border-indigo-500/20 p-5 mb-6">
                  {/* Decorative gradient orbs */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />

                  <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        {client.city && (
                          <span className="flex items-center gap-1.5 text-indigo-200/80">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {client.city}
                          </span>
                        )}
                        {client.city && client.contactEmail && (
                          <span className="w-px h-4 bg-indigo-400/30" />
                        )}
                        {client.contactEmail && (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {client.contactEmail}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                      <span className={`status-badge ${client.isActive ? "status-badge-active" : "status-badge-inactive"}`}>
                        {client.isActive ? "حساب نشط" : "حساب معطل"}
                      </span>
                      <span className={`status-badge ${client.isAiEnabled ? "status-badge-ai" : "bg-white/5 text-slate-400 border border-white/10"}`}>
                        {client.isAiEnabled ? "الذكاء الاصطناعي مفعّل" : "الذكاء الاصطناعي معطل"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {/* Screens Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-800/50 to-indigo-500/10 border border-blue-500/20 p-4">
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/20 rounded-full blur-xl" />
                    <p className="text-xs text-slate-400 relative">عدد الشاشات</p>
                    <div className="flex items-center gap-2 mt-2 relative">
                      <button
                        onClick={() => handleQuickEdit(client, { maxScreens: Math.max(1, client.maxScreens - 1) })}
                        className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-sm"
                        disabled={client.maxScreens <= 1}
                      >
                        −
                      </button>
                      <span className="text-2xl font-bold text-white flex-1 text-center">{client.maxScreens}</span>
                      <button
                        onClick={() => handleQuickEdit(client, { maxScreens: Math.min(100, client.maxScreens + 1) })}
                        className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={client.maxScreens}
                      onChange={(e) => handleQuickEdit(client, { maxScreens: Number(e.target.value) })}
                      className="mt-2 w-full relative"
                    />
                  </div>

                  {/* Retention Days Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-slate-800/50 to-purple-500/10 border border-violet-500/20 p-4">
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-violet-500/20 rounded-full blur-xl" />
                    <p className="text-xs text-slate-400 relative">مدة الاحتفاظ</p>
                    <div className="flex items-center gap-2 mt-2 relative">
                      <button
                        onClick={() => handleQuickEdit(client, { retentionDays: Math.max(7, client.retentionDays - 1) })}
                        className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-sm"
                        disabled={client.retentionDays <= 7}
                      >
                        −
                      </button>
                      <span className="text-2xl font-bold text-white flex-1 text-center">{client.retentionDays}</span>
                      <button
                        onClick={() => handleQuickEdit(client, { retentionDays: Math.min(365, client.retentionDays + 1) })}
                        className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-1 relative">يوم</p>
                  </div>

                  {/* AI Status Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-teal-500/10 border border-emerald-500/20 p-4">
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl" />
                    <p className="text-xs text-slate-400 relative">الذكاء الاصطناعي</p>
                    <div className="flex items-center justify-center gap-2 mt-3 relative">
                      <div className={`w-2.5 h-2.5 rounded-full ${client.isAiEnabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500"}`} />
                      <span className={`text-lg font-semibold ${client.isAiEnabled ? "text-emerald-400" : "text-rose-400"}`}>
                        {client.isAiEnabled ? "يعمل" : "متوقف"}
                      </span>
                    </div>
                  </div>

                  {/* Creation Date Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700/50 via-slate-800/50 to-slate-600/30 border border-white/10 p-4">
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-slate-500/10 rounded-full blur-xl" />
                    <p className="text-xs text-slate-400 relative">تاريخ الإنشاء</p>
                    <p className="text-lg font-semibold mt-3 text-slate-300 relative text-center">
                      {new Date(client.createdAtUtc).toLocaleDateString("ar-SA", { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/[0.04]">
                  <LoadingButton
                    onClick={() => handleToggleActivation(client)}
                    loading={isStatusLoading(client.id)}
                    variant={client.isActive ? "danger" : "primary"}
                    size="md"
                    className="min-w-[160px]"
                  >
                    {client.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                  </LoadingButton>

                  <LoadingButton
                    onClick={() => handleQuickEdit(client, { isAiEnabled: !client.isAiEnabled }, "ai")}
                    loading={isAiLoading(client.id)}
                    variant="ghost"
                    size="md"
                    className="min-w-[180px]"
                  >
                    {client.isAiEnabled ? "إيقاف الذكاء الاصطناعي" : "تفعيل الذكاء الاصطناعي"}
                  </LoadingButton>
                </div>

                {!client.isActive && client.deactivationReason && (
                  <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-sm text-rose-300">
                      <span className="font-semibold">سبب التعطيل:</span> {client.deactivationReason}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
          {clients.length === 0 && !loading && (
            <div className="card-elevated text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">لا توجد شركات/منشآت</h3>
              <p className="text-sm text-slate-400 mb-4">
                لم يتم تسجيل أي شركات/منشآت بعد.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
              >
                إضافة شركة/منشأة جديدة
              </button>
            </div>
          )}
        </section>

        {/* Add Client Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleModalClose}
            />
            <div className="relative bg-[#0f1419] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
              {/* Modal Header - Fixed */}
              <div className="flex-shrink-0 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">إضافة شركة/منشأة جديدة</h3>
                      <p className="text-sm text-slate-400">إنشاء حساب جديد مع تحديد الإعدادات</p>
                    </div>
                  </div>
                  <button
                    onClick={handleModalClose}
                    className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.name ? "text-rose-400" : "text-emerald-400/80"
                    }`}>
                    الاسم التجاري <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    className={`input-modern transition-all duration-300 ${fieldErrors.name
                      ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50"
                      : ""
                      }`}
                    placeholder="مثال: شركة الأمل للتجارة"
                    value={newClient.name}
                    onChange={(e) => {
                      setNewClient((prev) => ({ ...prev, name: e.target.value }));
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: false }));
                      }
                    }}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>
                  )}
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.email ? "text-rose-400" : "text-emerald-400/80"
                    }`}>
                    البريد الإلكتروني الرئيسي <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    className={`input-modern transition-all duration-300 ${fieldErrors.email
                      ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50"
                      : ""
                      }`}
                    placeholder="admin@company.com"
                    value={newClient.contactEmail}
                    onChange={(e) => {
                      setNewClient((prev) => ({ ...prev, contactEmail: e.target.value }));
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: false }));
                      }
                    }}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>
                  )}
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.city ? "text-rose-400" : "text-emerald-400/80"
                    }`}>
                    المدينة <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={cityRef}
                    className={`input-modern transition-all duration-300 ${fieldErrors.city
                      ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50"
                      : ""
                      }`}
                    placeholder="مثال: الرياض"
                    value={newClient.city}
                    onChange={(e) => {
                      setNewClient((prev) => ({ ...prev, city: e.target.value }));
                      if (fieldErrors.city) {
                        setFieldErrors((prev) => ({ ...prev, city: false }));
                      }
                    }}
                  />
                  {fieldErrors.city && (
                    <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-emerald-400/80 mb-1.5 block">الشاشات المسموحة</label>
                    <div className="flex items-center bg-[#1a1f2e] border border-white/[0.08] rounded-xl px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setNewClient((prev) => ({ ...prev, maxScreens: Math.max(1, prev.maxScreens - 1) }))}
                        disabled={newClient.maxScreens <= 1}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-lg font-medium disabled:opacity-30"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newClient.maxScreens}
                        onChange={(e) => setNewClient((prev) => ({ ...prev, maxScreens: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) }))}
                        className="flex-1 bg-transparent text-center text-lg font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setNewClient((prev) => ({ ...prev, maxScreens: Math.min(100, prev.maxScreens + 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-lg font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-emerald-400/80 mb-1.5 block">أيام الاحتفاظ</label>
                    <div className="flex items-center bg-[#1a1f2e] border border-white/[0.08] rounded-xl px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setNewClient((prev) => ({ ...prev, retentionDays: Math.max(7, prev.retentionDays - 1) }))}
                        disabled={newClient.retentionDays <= 7}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-lg font-medium disabled:opacity-30"
                      >
                        −
                      </button>
                      <div className="flex-1 flex items-baseline justify-center gap-1">
                        <input
                          type="number"
                          min={7}
                          max={365}
                          value={newClient.retentionDays}
                          onChange={(e) => setNewClient((prev) => ({ ...prev, retentionDays: Math.max(7, Math.min(365, parseInt(e.target.value) || 7)) }))}
                          className="w-12 bg-transparent text-center text-lg font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-xs text-slate-400">يوم</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewClient((prev) => ({ ...prev, retentionDays: Math.min(365, prev.retentionDays + 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center text-lg font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <input
                    id="ai"
                    type="checkbox"
                    checked={newClient.isAiEnabled}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, isAiEnabled: e.target.checked }))}
                    className="w-5 h-5 rounded accent-emerald-500"
                  />
                  <label htmlFor="ai" className="text-sm text-slate-300 cursor-pointer select-none flex-1">
                    تفعيل خدمات الذكاء الاصطناعي
                  </label>
                </div>
                {formMessage && (
                  <div className={`p-3 rounded-xl text-sm text-center ${formMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}>
                    {formMessage.text}
                  </div>
                )}
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex-shrink-0 p-6 border-t border-white/10">
                <div className="flex gap-3">
                  <button
                    onClick={handleModalClose}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 transition-colors"
                  >
                    إلغاء
                  </button>
                  <LoadingButton
                    onClick={handleCreate}
                    loading={isCreating}
                    variant="primary"
                    size="lg"
                    className={`flex-1 ${shakeButton ? "animate-shake" : ""} ${Object.keys(fieldErrors).length > 0 ? "btn-danger" : ""}`}
                  >
                    إنشاء حساب
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
