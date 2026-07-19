"use client";

import { useMemo, useRef, useState } from "react";
import SuperAdminGuard from "@/components/SuperAdminGuard";
import LoadingButton from "@/components/LoadingButton";
import { useSuperAdminUsers } from "@/lib/hooks/useSuperAdminUsers";
import { useSuperAdminClients } from "@/lib/hooks/useSuperAdminClients";
import type { CreateManagedUserInput, ManagedUser, SystemUserRole } from "@/lib/types/superAdmin";
import { useTheme } from "@/lib/context/ThemeContext";

const roles: SystemUserRole[] = ["SuperAdmin", "ClientAdmin", "Operator", "Analyst"];

const roleLabels: Record<SystemUserRole, string> = {
  SuperAdmin: "SuperAdmin",
  ClientAdmin: "ClientAdmin",
  Operator: "Operator",
  Analyst: "Analyst",
};

const roleBadgeStyles: Record<SystemUserRole, string> = {
  SuperAdmin: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ClientAdmin: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Operator: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Analyst: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// Skeleton Components
function UserCardSkeleton() {
  return (
    <div className="card-elevated skeleton-shimmer">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="skeleton-line-pro w-40 h-6" />
          <div className="skeleton-line-pro w-56 h-4" />
        </div>
        <div className="skeleton-line-pro w-20 h-8" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="skeleton-line-pro w-24 h-6" />
        <div className="skeleton-line-pro w-32 h-6" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
        <div className="skeleton-line-pro w-32 h-4" />
        <div className="skeleton-line-pro w-28 h-10" />
      </div>
    </div>
  );
}

export default function SuperAdminUsersPage() {
  const { users, loading, createUser, updateUser } = useSuperAdminUsers();
  const { theme } = useTheme();
  const { clients } = useSuperAdminClients();
  const [isCreating, setIsCreating] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string; show: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [shakeButton, setShakeButton] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<number | "all">("all");
  const [showPassword, setShowPassword] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<HTMLSelectElement>(null);

  const [newUser, setNewUser] = useState<CreateManagedUserInput>({
    clientId: 0,
    fullName: "",
    email: "",
    password: "",
    role: "ClientAdmin",
    isActive: true,
  });
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const clientOptions = useMemo(() => clients.filter((client) => client.isActive).map((client) => ({ value: client.id, label: client.name })), [clients]);

  const stats = useMemo(() => {
    const activeCount = users.filter((u) => u.isActive).length;
    return {
      total: users.length,
      active: activeCount,
      inactive: users.length - activeCount,
    };
  }, [users]);

  const handleInputChange = (field: keyof CreateManagedUserInput, value: string | number | boolean) => {
    if (editingUser) {
      setEditingUser((prev) => prev ? { ...prev, [field]: value } : null);
    } else {
      setNewUser((prev) => ({ ...prev, [field]: value }));
    }
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setShowModal(true);
    setFieldErrors({});
    setFormMessage(null);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setNewUser({ clientId: 0, fullName: "", email: "", password: "", role: "ClientAdmin", isActive: true });
    setShowModal(true);
    setFieldErrors({});
    setFormMessage(null);
  };

  const canSubmit = newUser.fullName && newUser.email && newUser.password && newUser.clientId;

  const validateAndSubmit = async () => {
    const errors: Record<string, boolean> = {};
    if (editingUser) {
      if (!editingUser.fullName.trim()) errors.fullName = true;
      if (!editingUser.email.trim()) errors.email = true;
      if (!editingUser.clientId || editingUser.clientId === 0) errors.clientId = true;
    } else {
      if (!newUser.fullName.trim()) errors.fullName = true;
      if (!newUser.email.trim()) errors.email = true;
      if (!newUser.password.trim()) errors.password = true;
      if (!newUser.clientId || newUser.clientId === 0) errors.clientId = true;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormMessage({ type: "error", text: "يرجى إكمال جميع الحقول المطلوبة" });
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);

      // Focus first error field
      if (errors.fullName) nameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      else if (errors.password) passwordRef.current?.focus();
      else if (errors.clientId) clientRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setIsCreating(true);
    setFormMessage(null);

    if (editingUser) {
      // Update existing user
      const result = await updateUser(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
      });
      if (result) {
        setShowModal(false);
        setEditingUser(null);
        setToast({ type: "success", text: "تم تحديث المستخدم بنجاح", show: true });
        setTimeout(() => {
          setToast((prev) => (prev ? { ...prev, show: false } : null));
        }, 3000);
      } else {
        setFormMessage({ type: "error", text: "فشل تحديث المستخدم، يرجى المحاولة مرة أخرى" });
      }
    } else {
      // Create new user
      const result = await createUser(newUser);
      if (result.success) {
        setShowModal(false);
        setFormMessage(null);
        setNewUser({ clientId: 0, fullName: "", email: "", password: "", role: "ClientAdmin", isActive: true });
        // Show toast for 3 seconds
        setToast({ type: "success", text: "تم إنشاء المستخدم بنجاح", show: true });
        setTimeout(() => {
          setToast((prev) => (prev ? { ...prev, show: false } : null));
        }, 3000);
      } else {
        setFormMessage({ type: "error", text: result.error || "فشل إنشاء المستخدم، يرجى المحاولة مرة أخرى" });
      }
    }
    setIsCreating(false);
  };

  const handleCreateUser = validateAndSubmit;

  const handleToggleActive = async (user: ManagedUser) => {
    setUpdatingUserId(user.id);
    await updateUser(user.id, {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: !user.isActive,
    });
    setUpdatingUserId(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClient = clientFilter === "all" || user.clientId === clientFilter;
      return matchesSearch && matchesClient;
    });
  }, [users, searchQuery, clientFilter]);

  const formatLastLogin = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeStr = date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  };

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

          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left Side: Title, Description, Search & Filter */}
            <div className="flex-1">
              <h1 className={`text-3xl font-bold mb-2 ${theme === "light" ? "text-slate-800" : "text-white"}`}>إدارة مستخدمي المنصة</h1>
              <p className={`text-sm leading-relaxed max-w-2xl mb-4 ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                من خلال هذه الواجهة يمكنك إدارة حسابات المستخدمين، توزيع الصلاحيات،
                تفعيل أو تعطيل الحسابات، ومراقبة نشاط المستخدمين في النظام.
              </p>
              {/* Search & Filter - Single Row */}
              <div className="flex flex-row gap-3 items-center">
                <button
                  onClick={openAddModal}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${theme === "light"
                    ? "bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200"
                    : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25"
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إضافة مستخدم
                </button>
                <div className="relative">
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className={`appearance-none rounded-xl px-4 pr-10 pl-4 py-2.5 text-sm focus:outline-none transition-colors min-w-[180px] cursor-pointer ${theme === "light"
                      ? "bg-white border-slate-200 text-slate-700 focus:border-indigo-300"
                      : "bg-[#1a1f2e] border-white/[0.08] text-white focus:border-indigo-500/50"
                      }`}
                  >
                    <option value="all">جميع الشركات</option>
                    {clientOptions.map((client) => (
                      <option key={client.value} value={client.value}>{client.label}</option>
                    ))}
                  </select>
                  <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "light" ? "text-slate-400" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="relative flex-1 min-w-[280px]" style={{ maxWidth: '380px' }}>
                  <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "light" ? "text-slate-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="البحث بالاسم أو البريد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none transition-colors ${theme === "light"
                      ? "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-indigo-300"
                      : "bg-[#1a1f2e] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Stats Card */}
            <div className="w-full lg:w-[280px]">
              <div className={`rounded-2xl border p-5 ${theme === "light"
                ? "bg-white border-slate-200"
                : "bg-slate-900/50 border-white/5"
                }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${theme === "light"
                    ? "bg-indigo-100 border-indigo-200"
                    : "bg-indigo-500/10 border-indigo-500/20"
                    }`}>
                    <svg className={`w-6 h-6 ${theme === "light" ? "text-indigo-600" : "text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>إجمالي المستخدمين</p>
                    {loading ? (
                      <div className={`w-16 h-8 rounded-lg skeleton-shimmer ${theme === "light" ? "bg-slate-200" : "bg-white/5"}`} />
                    ) : (
                      <p className={`text-2xl font-bold ${theme === "light" ? "text-indigo-600" : "text-indigo-400"}`}>{stats.total}</p>
                    )}
                  </div>
                </div>
                {loading ? (
                  <div className="flex gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className={`flex-1 h-14 rounded-lg skeleton-shimmer ${theme === "light" ? "bg-slate-200" : "bg-white/5"}`} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 text-sm">
                    <div className={`flex-1 text-center py-3 px-2 rounded-xl border ${theme === "light"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-emerald-500/10 border-emerald-500/20"
                      }`}>
                      <span className={`block text-xl font-bold ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>{stats.active}</span>
                      <span className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>نشط</span>
                    </div>
                    <div className={`flex-1 text-center py-3 px-2 rounded-xl border ${theme === "light"
                      ? "bg-rose-50 border-rose-200"
                      : "bg-rose-500/10 border-rose-500/20"
                      }`}>
                      <span className={`block text-xl font-bold ${theme === "light" ? "text-rose-600" : "text-rose-400"}`}>{stats.inactive}</span>
                      <span className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>معطل</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <section className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">قائمة المستخدمين</h2>

          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl skeleton-shimmer ${theme === "light" ? "bg-slate-100" : "bg-white/[0.02]"}`}>
                  <div className={`skeleton-avatar w-10 h-10 ${theme === "light" ? "bg-slate-200" : ""}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`skeleton-line-pro w-32 h-5 ${theme === "light" ? "bg-slate-200" : ""}`} />
                    <div className={`skeleton-line-pro w-48 h-4 ${theme === "light" ? "bg-slate-200" : ""}`} />
                  </div>
                  <div className={`skeleton-line-pro w-24 h-8 ${theme === "light" ? "bg-slate-200" : ""}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-right">
                    <th className="pb-4 pr-8 font-medium">المستخدم</th>
                    <th className="pb-4 pr-5 font-medium">البريد الإلكتروني</th>
                    <th className="pb-4 pr-7 font-medium">الدور</th>
                    <th className="pb-4 font-medium">الشركة/المنشأة</th>
                    <th className="pb-4 pr-4 font-medium">الحالة</th>
                    <th className="pb-4 pr-1 font-medium">آخر دخول</th>
                    <th className="pb-4 pr-8 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const client = clients.find((c) => c.id === user.clientId);
                    return (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                              <span className="text-indigo-400 font-bold">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-white">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-400">{user.email}</td>
                        <td className="py-4">
                          <span className={`status-badge ${roleBadgeStyles[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-slate-300 text-sm font-medium">{client?.name || "—"}</span>
                        </td>
                        <td className="py-4">
                          <span className={`status-badge ${user.isActive ? "status-badge-active" : "status-badge-inactive"}`}>
                            {user.isActive ? "نشط" : "معطل"}
                          </span>
                        </td>
                        <td className="py-4">
                          {(() => {
                            const lastLogin = formatLastLogin(user.lastLoginAtUtc);
                            if (!lastLogin) return <span className="text-slate-500 text-sm">—</span>;
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-300 text-sm font-medium">{lastLogin.date}</span>
                                <span className="text-slate-500 text-xs">{lastLogin.time}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                              title="تعديل"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={updatingUserId === user.id}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] ${user.isActive
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                } ${updatingUserId === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {updatingUserId === user.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                </span>
                              ) : (
                                user.isActive ? "تعطيل" : "تفعيل"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">لا توجد نتائج</h3>
              <p className="text-sm text-slate-400">
                لم يتم العثور على مستخدمين مطابقين للبحث
              </p>
            </div>
          )}
        </section>

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowModal(false);
                setEditingUser(null);
              }}
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
                      ? "bg-indigo-100 border-indigo-200"
                      : "bg-gradient-to-br from-indigo-500/20 to-indigo-600/10"
                      }`}>
                      <svg className={`w-5 h-5 ${theme === "light" ? "text-indigo-600" : "text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === "light" ? "text-slate-800" : "text-white"}`}>{editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</h3>
                      <p className={`text-sm ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>{editingUser ? "تحديث بيانات الحساب والصلاحيات" : "إنشاء حساب مع تحديد الصلاحيات"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
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
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.clientId ? "text-rose-400" : "text-indigo-400/80"}`}>
                    الشركة/المنشأة <span className="text-rose-400">*</span>
                  </label>
                  <select
                    ref={clientRef}
                    disabled={!!editingUser}
                    className={`input-modern transition-all duration-300 ${fieldErrors.clientId ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50" : ""} ${editingUser ? "opacity-60 cursor-not-allowed bg-white/5" : ""}`}
                    value={editingUser ? editingUser.clientId : newUser.clientId}
                    onChange={(e) => {
                      handleInputChange("clientId", Number(e.target.value));
                      if (fieldErrors.clientId) setFieldErrors((prev) => ({ ...prev, clientId: false }));
                    }}
                  >
                    {editingUser ? (
                      clients
                        .filter((c) => c.id === editingUser.clientId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value={0}>اختر العميل</option>
                        {clientOptions.map((client) => (
                          <option key={client.value} value={client.value}>{client.label}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {fieldErrors.clientId && <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>}
                </div>

                <div>
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.fullName ? "text-rose-400" : "text-indigo-400/80"}`}>
                    الاسم الكامل <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    className={`input-modern transition-all duration-300 ${fieldErrors.fullName ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50" : ""}`}
                    value={editingUser ? editingUser.fullName : newUser.fullName}
                    onChange={(e) => {
                      handleInputChange("fullName", e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: false }));
                    }}
                    placeholder="  الاسم الكامل "
                  />
                  {fieldErrors.fullName && <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>}
                </div>

                <div>
                  <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.email ? "text-rose-400" : (theme === "light" ? "text-indigo-600" : "text-indigo-400/80")}`}>
                    البريد الإلكتروني <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    className={`input-modern transition-all duration-300 ${fieldErrors.email ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50" : ""}`}
                    value={editingUser ? editingUser.email : newUser.email}
                    onChange={(e) => {
                      handleInputChange("email", e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: false }));
                    }}
                    placeholder="admin@company.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>}
                </div>

                {!editingUser && (
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block transition-colors ${fieldErrors.password ? "text-rose-400" : (theme === "light" ? "text-indigo-600" : "text-indigo-400/80")}`}>
                      كلمة المرور المؤقتة <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        className={`input-modern w-full pr-10 transition-all duration-300 ${fieldErrors.password ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/50" : ""}`}
                        value={newUser.password}
                        onChange={(e) => {
                          handleInputChange("password", e.target.value);
                          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: false }));
                        }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-rose-400 mt-1">هذا الحقل مطلوب</p>}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-indigo-400/80 mb-1.5 block">الدور</label>
                  <select
                    className="input-modern"
                    value={editingUser ? editingUser.role : newUser.role}
                    onChange={(e) => handleInputChange("role", e.target.value as SystemUserRole)}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{roleLabels[role]}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <input
                    id="active"
                    type="checkbox"
                    checked={editingUser ? editingUser.isActive : newUser.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.checked)}
                    className="w-5 h-5 rounded accent-indigo-500"
                  />
                  <label htmlFor="active" className="text-sm text-slate-300 cursor-pointer select-none flex-1">
                    {editingUser ? "المستخدم مفعل" : "تفعيل المستخدم فوراً"}
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
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${theme === "light"
                      ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                  >
                    إلغاء
                  </button>
                  <LoadingButton
                    onClick={handleCreateUser}
                    loading={isCreating}
                    variant="primary"
                    size="lg"
                    className={`flex-1 ${shakeButton ? "animate-shake" : ""} ${Object.keys(fieldErrors).length > 0 ? "btn-danger" : ""}`}
                  >
                    {editingUser ? "حفظ التغييرات" : "إنشاء المستخدم"}
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
              }`}
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${toast.type === "success"
                ? "bg-emerald-500/95 border-emerald-400/30 text-white"
                : "bg-rose-500/95 border-rose-400/30 text-white"
                }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === "success" ? "bg-white/20" : "bg-white/20"
                  }`}
              >
                {toast.type === "success" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className="font-medium text-base">{toast.text}</span>
            </div>
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
