"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { passwordApi } from "@/lib/api/password.api";
import { useTheme } from "@/lib/context/ThemeContext";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const isDark = theme === 'dark';

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

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    if (!token) {
      setError("رابط إعادة التعيين غير صالح");
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

    if (newPassword !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    setLoading(true);

    try {
      await passwordApi.resetPassword({ email, token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: mounted
        ? (isDark
          ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)')
        : 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)'
    }}>
      {!mounted ? (
        <div className="text-center" style={{ color: '#94a3b8' }}>
          جاري التحميل...
        </div>
      ) : (
        <>
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-400/20'}`}></div>
            <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-400/20'}`}></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-blue-500/5' : 'bg-blue-400/15'}`}></div>
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
              {/* Welcome Text */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2" style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}>
                  إعادة تعيين كلمة المرور
                </h1>
                <p className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  أدخل بريدك الإلكتروني وكلمة المرور الجديدة
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
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
                  background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-400 text-sm">تم إعادة تعيين كلمة المرور بنجاح! جاري التحويل...</p>
                </div>
              )}

              {/* Form */}
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                      البريد الإلكتروني
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 pl-12 rounded-xl transition-all focus:outline-none"
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
                        placeholder="example@email.com"
                        required
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#818cf8' : '#6366f1' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-12 pr-12 rounded-xl transition-all focus:outline-none"
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
                      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#818cf8' : '#6366f1' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
                        onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8'}
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
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-12 pr-12 rounded-xl transition-all focus:outline-none"
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
                      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#818cf8' : '#6366f1' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
                        onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8'}
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-4 rounded-xl font-semibold text-base transition-all mt-6 overflow-hidden group"
                    style={{
                      background: loading ? 'rgba(99, 102, 241, 0.5)' : (isDark ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)'),
                      color: '#ffffff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 15px 30px rgba(99, 102, 241, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Shimmer Effect */}
                    {!loading && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    )}

                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>جاري المعالجة...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 relative z-10">
                        <span>إعادة تعيين كلمة المرور</span>
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Back to Login */}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
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
                    العودة لتسجيل الدخول
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full py-4 rounded-xl font-semibold text-base transition-all overflow-hidden group"
                    style={{
                      background: isDark ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <span>العودة لتسجيل الدخول</span>
                      <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
      }}>
        <div style={{ color: '#64748b' }}>جاري التحميل...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
