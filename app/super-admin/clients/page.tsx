"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import SuperAdminGuard from "@/components/SuperAdminGuard";
import LoadingButton from "@/components/LoadingButton";
import { useSuperAdminClients } from "@/lib/hooks/useSuperAdminClients";
import { useSubscriptions } from "@/lib/hooks/useSubscriptions";
import type { CreateClientInput, ManagedClient, UpdateClientInput, Subscription, CreateSubscriptionInput, RenewSubscriptionInput, RenewSubscriptionDateInput } from "@/lib/types/superAdmin";
import { useTheme } from "@/lib/context/ThemeContext";

const initialClientForm: CreateClientInput = {
  name: "",
  contactEmail: "",
  city: "",
  isAiEnabled: true,
  maxScreens: 10,
  maxCameras: 10,
  retentionDays: 30,
};

type PendingAction = {
  id: number;
  action: "status" | "ai" | "subscription";
};

// Subscription modal states
type SubscriptionModalType = 'create' | 'edit' | 'renew-days' | 'renew-date' | null;

// Renew date form state
interface RenewDateForm {
  newEndDate: string;
}

export default function SuperAdminClientsPage() {
  const { clients, loading, createClient, updateClient, activateClient, deactivateClient } = useSuperAdminClients();
  const { theme } = useTheme();
  const [newClient, setNewClient] = useState<CreateClientInput>(initialClientForm);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [shakeButton, setShakeButton] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Subscription management state
  const [selectedClientForSubscription, setSelectedClientForSubscription] = useState<ManagedClient | null>(null);
  const [subscriptionModalType, setSubscriptionModalType] = useState<SubscriptionModalType>(null);
  const [subscriptionForm, setSubscriptionForm] = useState<CreateSubscriptionInput>({
    clientId: 0,
    planName: 'basic',
    startsAtUtc: new Date().toISOString(),
    endsAtUtc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    maxScreens: 10,
    maxCameras: 10,
    autoRenew: false,
  });
  const [renewDaysForm, setRenewDaysForm] = useState<RenewSubscriptionInput>({ durationInDays: 30 });
  const [renewDateForm, setRenewDateForm] = useState<RenewDateForm>({ newEndDate: '' });
  const [deleteSubscriptionModal, setDeleteSubscriptionModal] = useState<{ clientId: number; subscriptionId: number } | null>(null);

  // Store subscriptions for each client to display without clicking
  const [clientSubscriptions, setClientSubscriptions] = useState<Map<number, Subscription | null>>(new Map());
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<Set<number>>(new Set());
  const [renewingClientId, setRenewingClientId] = useState<number | null>(null);

  // Load subscription for a specific client when needed
  const loadClientSubscription = async (clientId: number, force: boolean = false) => {
    // Skip if already loaded and not forcing refresh
    if (!force && clientSubscriptions.has(clientId)) return;

    setLoadingSubscriptions(prev => new Set(prev).add(clientId));
    try {
      const { subscriptionsApi } = await import('@/lib/api/subscriptions.api');
      // Update expiration status first to ensure accurate status
      await subscriptionsApi.updateExpirationStatusByClient(clientId);
      // Then load the subscription data
      const sub = await subscriptionsApi.getClientSubscription(clientId);
      setClientSubscriptions(prev => new Map(prev).set(clientId, sub));
    } catch (err) {
      setClientSubscriptions(prev => new Map(prev).set(clientId, null));
    } finally {
      setLoadingSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
    }
  };

  // Use subscription hook for selected client (for modal operations)
  const { subscription: selectedSubscription, loading: subscriptionLoading, createSubscription, renewByDays, renewByDate, updateExpirationStatusByClient } = useSubscriptions(selectedClientForSubscription?.id);

  // Load subscriptions for all clients on mount
  useEffect(() => {
    clients.forEach(client => {
      loadClientSubscription(client.id);
    });
  }, [clients]);

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

  // Helper: Calculate remaining days for subscription
  const getRemainingDays = (endsAtUtc: string) => {
    const now = new Date();
    const endDate = new Date(endsAtUtc);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper: Format date in Arabic with English numerals (DD/MM/YYYY)
  const formatDateArabic = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Helper: Get subscription status color and text
  const getSubscriptionStatusInfo = (status: string) => {
    switch (status) {
      case 'Active':
        return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'نشط' };
      case 'Expired':
        return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'منتهي' };
      case 'Cancelled':
        return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'ملغي' };
      default:
        return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'مسودة' };
    }
  };

  // Handle subscription modal open
  const handleOpenSubscriptionModal = (client: ManagedClient, type: SubscriptionModalType) => {
    setSelectedClientForSubscription(client);
    setSubscriptionModalType(type);
    if (type === 'create') {
      setSubscriptionForm({
        clientId: client.id,
        planName: 'basic',
        startsAtUtc: new Date().toISOString(),
        endsAtUtc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        maxScreens: client.maxScreens,
        maxCameras: 10,
        autoRenew: false,
      });
    } else if (type === 'renew-days') {
      setRenewDaysForm({ durationInDays: 30 });
    } else if (type === 'renew-date') {
      setRenewDateForm({ newEndDate: '' });
    } else if (type === 'edit') {
      const sub = clientSubscriptions.get(client.id);
      if (sub) {
        setSubscriptionForm({
          clientId: sub.clientId,
          planName: sub.planName,
          startsAtUtc: sub.startsAtUtc,
          endsAtUtc: sub.endsAtUtc,
          status: sub.status,
          maxScreens: sub.maxScreens,
          maxCameras: sub.maxCameras,
          autoRenew: sub.autoRenew,
        });
      }
    }
  };

  // Handle subscription modal close
  const handleCloseSubscriptionModal = () => {
    setSelectedClientForSubscription(null);
    setSubscriptionModalType(null);
    setFormMessage(null);
  };

  // Handle delete subscription
  const handleDeleteSubscription = async (clientId: number, subscriptionId: number) => {
    setDeleteSubscriptionModal({ clientId, subscriptionId });
  };

  // Confirm delete subscription
  const confirmDeleteSubscription = async () => {
    if (!deleteSubscriptionModal) return;
    setRenewingClientId(deleteSubscriptionModal.clientId);
    try {
      const { subscriptionsApi } = await import('@/lib/api/subscriptions.api');
      await subscriptionsApi.delete(deleteSubscriptionModal.subscriptionId);
      // Force refresh the subscription data for this client
      await loadClientSubscription(deleteSubscriptionModal.clientId, true);
      setFormMessage({ type: 'success', text: 'تم حذف الاشتراك بنجاح' });
    } catch (err) {
      setFormMessage({ type: 'error', text: 'فشل حذف الاشتراك' });
    } finally {
      setRenewingClientId(null);
      setDeleteSubscriptionModal(null);
    }
  };

  // Handle create or update subscription
  const handleCreateSubscription = async () => {
    if (!selectedClientForSubscription) return;
    setRenewingClientId(selectedClientForSubscription.id);
    try {
      if (subscriptionModalType === 'edit') {
        // Update existing subscription
        const { subscriptionsApi } = await import('@/lib/api/subscriptions.api');
        const sub = clientSubscriptions.get(selectedClientForSubscription.id);
        if (sub) {
          await subscriptionsApi.update(sub.id, subscriptionForm);
        }
      } else {
        // Create new subscription
        await createSubscription(subscriptionForm);
      }
      // Force refresh the subscription data for this client
      await loadClientSubscription(selectedClientForSubscription.id, true);
      setFormMessage({ type: 'success', text: subscriptionModalType === 'edit' ? 'تم تحديث الاشتراك بنجاح' : 'تم إنشاء الاشتراك بنجاح' });
      setTimeout(() => handleCloseSubscriptionModal(), 1500);
    } catch (err) {
      setFormMessage({ type: 'error', text: subscriptionModalType === 'edit' ? 'فشل تحديث الاشتراك' : 'فشل إنشاء الاشتراك' });
    } finally {
      setRenewingClientId(null);
    }
  };

  // Handle renew by days
  const handleRenewByDays = async () => {
    if (!selectedClientForSubscription || !selectedSubscription) return;
    setRenewingClientId(selectedClientForSubscription.id);
    try {
      await renewByDays(selectedSubscription.id, renewDaysForm);
      // Force refresh the subscription data for this client
      await loadClientSubscription(selectedClientForSubscription.id, true);
      setFormMessage({ type: 'success', text: 'تم تجديد الاشتراك بنجاح' });
      setTimeout(() => handleCloseSubscriptionModal(), 1500);
    } catch (err) {
      setFormMessage({ type: 'error', text: 'فشل تجديد الاشتراك' });
    } finally {
      setRenewingClientId(null);
    }
  };

  // Handle renew by date
  const handleRenewByDate = async () => {
    if (!selectedClientForSubscription || !selectedSubscription || !renewDateForm.newEndDate) return;
    setRenewingClientId(selectedClientForSubscription.id);
    try {
      // Convert the date string (YYYY-MM-DD) to full UTC ISO string with current time
      const selectedDate = new Date(renewDateForm.newEndDate);
      // Set the time to current device time but keep the selected date
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      const endsAtUtc = selectedDate.toISOString();

      await renewByDate(selectedSubscription.id, { endsAtUtc });
      // Force refresh the subscription data for this client
      await loadClientSubscription(selectedClientForSubscription.id, true);
      setFormMessage({ type: 'success', text: 'تم تجديد الاشتراك بنجاح' });
      setTimeout(() => handleCloseSubscriptionModal(), 1500);
    } catch (err) {
      setFormMessage({ type: 'error', text: 'فشل تجديد الاشتراك' });
    } finally {
      setRenewingClientId(null);
    }
  };


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
      maxCameras: updates.maxCameras ?? client.maxCameras,
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
  const isSubscriptionLoading = (clientId: number) => renewingClientId === clientId;

  return (
    <SuperAdminGuard>
      <div className={`p-8 space-y-8 min-h-screen ${theme === "light" ? "bg-slate-50" : "bg-[#0a0e1a]"}`}>
        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 ${theme === "light"
          ? "bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200"
          : "bg-gradient-to-br from-slate-800/80 via-[#0f1419] to-slate-900/80 border-white/10"
          }`}>
          {/* Decorative gradient orbs */}
          <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl ${theme === "light" ? "bg-indigo-200/30" : "bg-indigo-500/10"}`} />
          <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl ${theme === "light" ? "bg-violet-200/30" : "bg-violet-500/10"}`} />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side: Title, Description, and Buttons */}
            <div className="flex-1">
              <h1 className={`text-3xl font-bold mb-2 ${theme === "light" ? "text-slate-800" : "text-white"}`}>إدارة الشركات/المنشآت</h1>
              <p className={`text-sm leading-relaxed max-w-xl mb-4 ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
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
                <div className={`relative overflow-hidden rounded-2xl border p-5 mb-6 ${theme === "light"
                  ? "bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-indigo-200"
                  : "bg-gradient-to-br from-indigo-500/10 via-slate-800/50 to-violet-500/10 border-indigo-500/20"
                  }`}>
                  {/* Decorative gradient orbs */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${theme === "light" ? "bg-indigo-200/40" : "bg-indigo-500/20"}`} />
                  <div className={`absolute -bottom-10 -left-10 w-24 h-24 rounded-full blur-2xl ${theme === "light" ? "bg-violet-200/40" : "bg-violet-500/20"}`} />

                  <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className={`text-2xl font-bold mb-2 tracking-tight ${theme === "light" ? "text-slate-800" : "text-white"}`}>
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        {client.city && (
                          <span className={`flex items-center gap-1.5 ${theme === "light" ? "text-indigo-600" : "text-indigo-200/80"}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {client.city}
                          </span>
                        )}
                        {client.city && client.contactEmail && (
                          <span className={`w-px h-4 ${theme === "light" ? "bg-indigo-300" : "bg-indigo-400/30"}`} />
                        )}
                        {client.contactEmail && (
                          <span className={`flex items-center gap-1.5 ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
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

                {/* Compact Stats Bar */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {/* Screens */}
                  <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${theme === "light"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-blue-500/5 border-blue-500/10"
                    }`}>
                    <svg className={`w-4 h-4 ${theme === "light" ? "text-blue-600" : "text-blue-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className={`text-[10px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>الشاشات</p>
                      <p className={`text-sm font-semibold ${theme === "light" ? "text-slate-700" : "text-white"}`}>
                        {clientSubscriptions.get(client.id)?.maxScreens || client.maxScreens}
                      </p>
                    </div>
                  </div>

                  {/* Cameras */}
                  <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${theme === "light"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-amber-500/5 border-amber-500/10"
                    }`}>
                    <svg className={`w-4 h-4 ${theme === "light" ? "text-amber-600" : "text-amber-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className={`text-[10px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>الكاميرات</p>
                      <p className={`text-sm font-semibold ${theme === "light" ? "text-slate-700" : "text-white"}`}>
                        {clientSubscriptions.get(client.id)?.maxCameras || client.maxCameras}
                      </p>
                    </div>
                  </div>

                  {/* AI Status */}
                  <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${theme === "light"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-emerald-500/5 border-emerald-500/10"
                    }`}>
                    <svg className={`w-4 h-4 ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <p className={`text-[10px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>الذكاء الاصطناعي</p>
                      <p className={`text-sm font-semibold ${client.isAiEnabled ? (theme === "light" ? "text-emerald-600" : "text-emerald-400") : (theme === "light" ? "text-rose-600" : "text-rose-400")}`}>
                        {client.isAiEnabled ? "يعمل" : "متوقف"}
                      </p>
                    </div>
                  </div>

                  {/* Subscription Status */}
                  <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${theme === "light"
                    ? "bg-violet-50 border-violet-200"
                    : "bg-violet-500/5 border-violet-500/10"
                    }`}>
                    <svg className={`w-4 h-4 ${theme === "light" ? "text-violet-600" : "text-violet-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className={`text-[10px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>الاشتراك</p>
                      {loadingSubscriptions.has(client.id) || renewingClientId === client.id ? (
                        <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                      ) : clientSubscriptions.get(client.id) ? (
                        (() => {
                          const sub = clientSubscriptions.get(client.id)!;
                          return (
                            <p className={`text-sm font-semibold ${getSubscriptionStatusInfo(sub.status).color}`}>
                              {getSubscriptionStatusInfo(sub.status).text}
                            </p>
                          );
                        })()
                      ) : (
                        <p className="text-sm font-semibold text-slate-400">لا يوجد</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription Details Card */}
                {clientSubscriptions.get(client.id) && (
                  <div className={`mt-3 relative overflow-hidden rounded-xl border p-3 ${theme === "light"
                    ? "bg-gradient-to-br from-violet-50 via-white to-purple-50 border-violet-200"
                    : "bg-gradient-to-br from-violet-500/5 via-slate-800/30 to-purple-500/5 border-violet-500/10"
                    }`}>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Start Date */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${theme === "light"
                          ? "bg-emerald-100 border-emerald-200"
                          : "bg-emerald-500/10 border-emerald-500/20"
                          }`}>
                          <svg className={`w-4 h-4 ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-[10px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>تاريخ البدء</p>
                          <p className={`text-xs font-medium ${theme === "light" ? "text-slate-700" : "text-white"}`}>
                            {formatDateArabic(clientSubscriptions.get(client.id)!.startsAtUtc)}
                          </p>
                        </div>
                      </div>
                      {/* End Date */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${theme === "light"
                          ? "bg-violet-100 border-violet-200"
                          : "bg-violet-500/10 border-violet-500/20"
                          }`}>
                          <svg className={`w-4 h-4 ${theme === "light" ? "text-violet-600" : "text-violet-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-[10px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>تاريخ الانتهاء</p>
                          <p className={`text-xs font-medium ${theme === "light" ? "text-slate-700" : "text-white"}`}>
                            {formatDateArabic(clientSubscriptions.get(client.id)!.endsAtUtc)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      {getRemainingDays(clientSubscriptions.get(client.id)!.endsAtUtc) > 0 ? (
                        <div className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-2 ${theme === "light"
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                          : "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
                          }`}>
                          <svg className={`w-4 h-4 ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-sm font-semibold ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>
                            متبقي {getRemainingDays(clientSubscriptions.get(client.id)!.endsAtUtc)} يوم
                          </span>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-2 ${theme === "light"
                          ? "bg-gradient-to-r from-rose-50 to-red-50 border-rose-200"
                          : "bg-gradient-to-r from-rose-500/10 to-red-500/10 border-rose-500/20"
                          }`}>
                          <svg className={`w-4 h-4 ${theme === "light" ? "text-rose-600" : "text-rose-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className={`text-sm font-semibold ${theme === "light" ? "text-rose-600" : "text-rose-400"}`}>
                            انتهى الاشتراك
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/[0.04]">


                  <LoadingButton
                    onClick={() => handleQuickEdit(client, { isAiEnabled: !client.isAiEnabled }, "ai")}
                    loading={isAiLoading(client.id)}
                    variant="ghost"
                    size="md"
                    className="min-w-[180px]"
                  >
                    {client.isAiEnabled ? "إيقاف الذكاء الاصطناعي" : "تفعيل الذكاء الاصطناعي"}
                  </LoadingButton>

                  {/* Subscription management buttons */}
                  {clientSubscriptions.get(client.id) ? (
                    <>
                      <LoadingButton
                        onClick={() => handleOpenSubscriptionModal(client, 'renew-days')}
                        loading={isSubscriptionLoading(client.id)}
                        variant="ghost"
                        size="md"
                        className="min-w-[140px]"
                      >
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        تجديد بالأيام
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => handleOpenSubscriptionModal(client, 'renew-date')}
                        loading={isSubscriptionLoading(client.id)}
                        variant="ghost"
                        size="md"
                        className="min-w-[140px]"
                      >
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        تجديد بالتاريخ
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => handleOpenSubscriptionModal(client, 'edit')}
                        loading={isSubscriptionLoading(client.id)}
                        variant="ghost"
                        size="md"
                        className="min-w-[140px]"
                      >
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تعديل الاشتراك
                      </LoadingButton>

                      <LoadingButton
                        onClick={() => handleDeleteSubscription(client.id, clientSubscriptions.get(client.id)!.id)}
                        loading={isSubscriptionLoading(client.id)}
                        variant="danger"
                        size="md"
                        className="min-w-[140px]"
                      >
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        حذف الاشتراك
                      </LoadingButton>

                      <LoadingButton
                        onClick={() => handleToggleActivation(client)}
                        loading={isStatusLoading(client.id)}
                        variant={client.isActive ? "danger" : "primary"}
                        size="md"
                        className="min-w-[160px]"
                      >
                        {client.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                      </LoadingButton>

                    </>
                  ) : (
                    <LoadingButton
                      onClick={() => handleOpenSubscriptionModal(client, 'create')}
                      loading={isSubscriptionLoading(client.id)}
                      variant="primary"
                      size="md"
                      className="min-w-[140px]"
                    >
                      إنشاء اشتراك
                    </LoadingButton>
                  )}
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

        {/* Subscription Management Modals */}
        {subscriptionModalType && selectedClientForSubscription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseSubscriptionModal}
            />
            <div className={`relative border rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in ${theme === "light"
              ? "bg-white border-slate-200"
              : "bg-[#0f1419] border-white/10"
              }`}>
              {/* Modal Header */}
              <div className={`flex-shrink-0 p-6 border-b ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center ${theme === "light"
                      ? "bg-violet-100 border-violet-200"
                      : ""
                      }`}>
                      <svg className={`w-5 h-5 ${theme === "light" ? "text-violet-600" : "text-violet-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === "light" ? "text-slate-800" : "text-white"}`}>
                        {subscriptionModalType === 'create' ? 'إنشاء اشتراك جديد' :
                          subscriptionModalType === 'edit' ? 'تعديل الاشتراك' :
                            subscriptionModalType === 'renew-days' ? 'تجديد الاشتراك بالأيام' :
                              'تجديد الاشتراك بالتاريخ'}
                      </h3>
                      <p className={`text-sm ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>{selectedClientForSubscription.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseSubscriptionModal}
                    className={`p-2 rounded-xl transition-colors ${theme === "light"
                      ? "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      : "hover:bg-white/5 text-slate-400 hover:text-white"
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(subscriptionModalType === 'create' || subscriptionModalType === 'edit') && (
                  <>
                    <div>
                      <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>اسم الخطة</label>
                      <select
                        value={subscriptionForm.planName}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planName: e.target.value })}
                        className="input-modern"
                      >
                        <option value="basic">الأساسية</option>
                        <option value="premium">المميزة</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>تاريخ البداية</label>
                        <input
                          type="date"
                          value={subscriptionForm.startsAtUtc.split('T')[0]}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, startsAtUtc: new Date(e.target.value).toISOString() })}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>تاريخ النهاية</label>
                        <input
                          type="date"
                          value={subscriptionForm.endsAtUtc.split('T')[0]}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, endsAtUtc: new Date(e.target.value).toISOString() })}
                          className="input-modern"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>الشاشات المسموحة</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={subscriptionForm.maxScreens}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setSubscriptionForm({ ...subscriptionForm, maxScreens: Math.max(1, Math.min(100, parseInt(value) || 1)) });
                          }}
                          className="input-modern"
                          style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>الكاميرات المسموحة</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={subscriptionForm.maxCameras}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setSubscriptionForm({ ...subscriptionForm, maxCameras: Math.max(1, Math.min(100, parseInt(value) || 1)) });
                          }}
                          className="input-modern"
                          style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                        />
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${theme === "light"
                      ? "bg-slate-50 border-slate-200"
                      : "bg-white/[0.02] border-white/[0.04]"
                      }`}>
                      <input
                        id="autoRenew"
                        type="checkbox"
                        checked={subscriptionForm.autoRenew}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, autoRenew: e.target.checked })}
                        className="w-5 h-5 rounded accent-emerald-500"
                      />
                      <label htmlFor="autoRenew" className={`text-sm cursor-pointer select-none flex-1 ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
                        التجديد التلقائي
                      </label>
                    </div>
                  </>
                )}

                {subscriptionModalType === 'renew-days' && (
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>عدد الأيام للتجديد</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={renewDaysForm.durationInDays}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setRenewDaysForm({ durationInDays: Math.max(1, Math.min(365, parseInt(value) || 1)) });
                      }}
                      className="input-modern"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                    />
                    <p className={`text-xs mt-2 ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>سيتم إضافة هذه الأيام إلى تاريخ الانتهاء الحالي</p>
                  </div>
                )}

                {subscriptionModalType === 'renew-date' && (
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${theme === "light" ? "text-emerald-600" : "text-emerald-400/80"}`}>تاريخ الانتهاء الجديد</label>
                    <input
                      type="date"
                      value={renewDateForm.newEndDate}
                      onChange={(e) => setRenewDateForm({ newEndDate: e.target.value })}
                      className="input-modern"
                    />
                    <p className={`text-xs mt-2 ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>سيتم تحديث تاريخ انتهاء الاشتراك إلى التاريخ المحدد</p>
                  </div>
                )}

                {formMessage && (
                  <div className={`p-3 rounded-xl text-sm text-center ${formMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}>
                    {formMessage.text}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`flex-shrink-0 p-6 border-t ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseSubscriptionModal}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${theme === "light"
                      ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                  >
                    إلغاء
                  </button>
                  <LoadingButton
                    onClick={subscriptionModalType === 'create' || subscriptionModalType === 'edit' ? handleCreateSubscription :
                      subscriptionModalType === 'renew-days' ? handleRenewByDays :
                        handleRenewByDate}
                    loading={isSubscriptionLoading(selectedClientForSubscription.id)}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                  >
                    {subscriptionModalType === 'create' ? 'إنشاء الاشتراك' :
                      subscriptionModalType === 'edit' ? 'تحديث الاشتراك' :
                        subscriptionModalType === 'renew-days' ? 'تجديد' :
                          'تحديث التاريخ'}
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Subscription Confirmation Modal */}
        {deleteSubscriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteSubscriptionModal(null)}
            />
            <div className={`relative border rounded-3xl w-full max-w-md p-6 animate-scale-in ${theme === "light"
              ? "bg-white border-slate-200"
              : "bg-[#0f1419] border-white/10"
              }`}>
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === "light"
                  ? "bg-rose-100"
                  : "bg-rose-500/10"
                  }`}>
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${theme === "light" ? "text-slate-800" : "text-white"}`}>حذف الاشتراك</h3>
                <p className={`text-sm mb-6 ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>هل أنت متأكد من حذف هذا الاشتراك؟ هذا الإجراء لا يمكن التراجع عنه.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteSubscriptionModal(null)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${theme === "light"
                      ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                  >
                    إلغاء
                  </button>
                  <LoadingButton
                    onClick={confirmDeleteSubscription}
                    loading={isSubscriptionLoading(deleteSubscriptionModal.clientId)}
                    variant="danger"
                    size="lg"
                    className="flex-1"
                  >
                    حذف
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Client Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleModalClose}
            />
            <div className={`relative border rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in ${theme === "light"
              ? "bg-white border-slate-200"
              : "bg-[#0f1419] border-white/10"
              }`}>
              {/* Modal Header - Fixed */}
              <div className={`flex-shrink-0 p-6 border-b ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === "light"
                      ? "bg-emerald-100 border-emerald-200"
                      : "bg-gradient-to-br from-emerald-500/20 to-teal-600/10"
                      }`}>
                      <svg className={`w-5 h-5 ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === "light" ? "text-slate-800" : "text-white"}`}>إضافة شركة/منشأة جديدة</h3>
                      <p className={`text-sm ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>إنشاء حساب جديد مع تحديد الإعدادات</p>
                    </div>
                  </div>
                  <button
                    onClick={handleModalClose}
                    className={`p-2 rounded-xl transition-colors ${theme === "light"
                      ? "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      : "hover:bg-white/5 text-slate-400 hover:text-white"
                      }`}
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
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.city ? "text-rose-400" : (theme === "light" ? "text-emerald-600" : "text-emerald-400/80")
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
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newClient.maxScreens}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNewClient((prev) => ({ ...prev, maxScreens: Math.max(1, Math.min(100, parseInt(value) || 1)) }));
                      }}
                      className="input-modern"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-emerald-400/80 mb-1.5 block">أيام الاحتفاظ</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newClient.retentionDays}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNewClient((prev) => ({ ...prev, retentionDays: Math.max(7, Math.min(365, parseInt(value) || 7)) }));
                      }}
                      className="input-modern"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                    />
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
              <div className={`flex-shrink-0 p-6 border-t ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
                <div className="flex gap-3">
                  <button
                    onClick={handleModalClose}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${theme === "light"
                      ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
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
