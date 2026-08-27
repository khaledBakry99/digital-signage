"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/context/ThemeContext";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    hasMinLength: boolean;
  }>({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPasswordStrength({
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      hasMinLength: newPassword.length >= 8,
    });
  }, [newPassword]);

  const isDark = theme === 'dark';

  if (!mounted) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("كلمات المرور الجديدة غير متطابقة");
      return;
    }

    // تحقق من قوة كلمة المرور
    const missingRequirements = [];
    if (!passwordStrength.hasMinLength) missingRequirements.push("8 أحرف على الأقل");
    if (!passwordStrength.hasUpperCase) missingRequirements.push("حرف كبير واحد على الأقل");
    if (!passwordStrength.hasLowerCase) missingRequirements.push("حرف صغير واحد على الأقل");
    if (!passwordStrength.hasNumber) missingRequirements.push("رقم واحد على الأقل");
    if (!passwordStrength.hasSpecialChar) missingRequirements.push("رمز خاص واحد على الأقل");

    if (missingRequirements.length > 0) {
      setError(`كلمة المرور يجب أن تحتوي على: ${missingRequirements.join("، ")}`);
      return;
    }

    if (!user) {
      setError("يجب تسجيل الدخول أولاً");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://backend-42316129731.europe-west1.run.app/api/Users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ""}`
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error('فشل تغيير كلمة المرور');
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError('حدث خطأ في تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: isDark
        ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
    }}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl animate-pulse ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-400/20'}`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse ${isDark ? 'bg-purple-500/10' : 'bg-purple-400/20'}`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-pulse ${isDark ? 'bg-blue-500/5' : 'bg-blue-400/15'}`} style={{ animationDelay: '2s' }}></div>
      </div>
      {/* Grid Pattern */}
      <div className="absolute inset-0" style={{
        opacity: isDark ? 0.02 : 0.05,
        backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Card */}
      <div className="w-full max-w-lg relative">
        {/* Card Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-lg"></div>

        <div className="relative rounded-3xl p-8" style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5 relative">
              {/* Glow Ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-40 animate-pulse"></div>

              <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
              }}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              تغيير كلمة المرور
            </h1>
            <p className="text-base" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              قم بتحديث كلمة المرور الخاصة بك
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 text-sm">تم تغيير كلمة المرور بنجاح! جاري التحويل...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Current Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  كلمة المرور الحالية
                </label>
                <div className="relative group">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 pl-12 rounded-xl transition-all focus:outline-none"
                    style={{
                      background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.background = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.95)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      e.target.style.background = isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: isDark ? '#818cf8' : '#6366f1' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#a78bfa' : '#818cf8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
                  >
                    {showCurrentPassword ? (
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
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  كلمة المرور الجديدة
                </label>
                <div className="relative group">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 pl-12 rounded-xl transition-all focus:outline-none"
                    style={{
                      background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.background = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.95)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      e.target.style.background = isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: isDark ? '#818cf8' : '#6366f1' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#a78bfa' : '#818cf8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
                  >
                    {showNewPassword ? (
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

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      <span>قوة كلمة المرور:</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-6 rounded-full transition-all"
                            style={{
                              background: [
                                passwordStrength.hasMinLength,
                                passwordStrength.hasLowerCase,
                                passwordStrength.hasUpperCase,
                                passwordStrength.hasNumber,
                                passwordStrength.hasSpecialChar
                              ][i]
                                ? i < 2 ? '#ef4444' : i < 4 ? '#f59e0b' : '#22c55e'
                                : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2" style={{ color: passwordStrength.hasMinLength ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }}>
                        <svg className={`w-3.5 h-3.5 ${passwordStrength.hasMinLength ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordStrength.hasMinLength ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span>8 أحرف على الأقل</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: passwordStrength.hasUpperCase ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }}>
                        <svg className={`w-3.5 h-3.5 ${passwordStrength.hasUpperCase ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordStrength.hasUpperCase ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span>حرف كبير (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: passwordStrength.hasLowerCase ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }}>
                        <svg className={`w-3.5 h-3.5 ${passwordStrength.hasLowerCase ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordStrength.hasLowerCase ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span>حرف صغير (a-z)</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: passwordStrength.hasNumber ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }}>
                        <svg className={`w-3.5 h-3.5 ${passwordStrength.hasNumber ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordStrength.hasNumber ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span>رقم (0-9)</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2" style={{ color: passwordStrength.hasSpecialChar ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }}>
                        <svg className={`w-3.5 h-3.5 ${passwordStrength.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordStrength.hasSpecialChar ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span>رمز خاص (!@#$%^&amp;*،.؟: &#123;&#125;|&lt;&gt;)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 pl-12 rounded-xl transition-all focus:outline-none"
                    style={{
                      background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.background = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.95)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      e.target.style.background = isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: isDark ? '#818cf8' : '#6366f1' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#a78bfa' : '#818cf8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
                  >
                    {showConfirmPassword ? (
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
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="relative w-full py-4 rounded-xl font-semibold text-base transition-all mt-6 overflow-hidden group"
              style={{
                background: (loading || success) ? 'rgba(99, 102, 241, 0.5)' : (isDark ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)'),
                color: '#ffffff',
                cursor: (loading || success) ? 'not-allowed' : 'pointer',
                boxShadow: (loading || success) ? 'none' : '0 20px 40px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Shimmer Effect */}
              {!loading && !success && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              )}

              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري المعالجة...</span>
                </div>
              ) : (
                <span>تغيير كلمة المرور</span>
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl font-medium text-base transition-all"
              style={{
                background: 'transparent',
                color: isDark ? '#818cf8' : '#6366f1',
                border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)';
              }}
            >
              العودة للصفحة الرئيسية
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
