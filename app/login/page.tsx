"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Update expiration status and check subscription for non-SuperAdmin users
        if (result.user?.role !== "SuperAdmin" && result.user?.clientId) {
          try {
            // Update expiration status first to ensure accurate status
            await subscriptionsApi.updateExpirationStatusByClient(result.user.clientId);
            // Then load the subscription data
            const subscription = await subscriptionsApi.getClientSubscription(result.user.clientId);
            // Check if subscription is expired
            const now = new Date();
            const endDate = new Date(subscription.endsAtUtc);
            const isExpired = endDate < now;

            if (isExpired || subscription.status === "Expired") {
              // Logout the user since subscription is expired
              logout();
              setError("انتهت صلاحية الاشتراك. يرجى التواصل مع المسؤول للتجديد.");
              setLoading(false);
              return;
            }
          } catch (subError) {
            // If we can't check subscription, allow login but log the error
            console.error("Failed to check subscription status:", subError);
          }
        }

        const destination = result.user?.role === "SuperAdmin" ? "/super-admin" : "/";
        router.push(destination);
      } else {
        setError(result.error || "فشل تسجيل الدخول");
      }
    } catch {
      setError("حدث خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      {/* Login Card */}
      <div className="w-full max-w-lg relative">
        {/* Card Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-lg"></div>

        <div className="relative rounded-3xl p-8" style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5 relative">
              {/* Glow Ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-40 animate-pulse"></div>

              <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
              }}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              مرحباً بعودتك
            </h1>
            <p className="text-base" style={{ color: '#94a3b8' }}>
              سجل دخولك للوصول إلى لوحة التحكم
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>
                  البريد الإلكتروني
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-xl transition-all focus:outline-none"
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                      color: '#e2e8f0',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.background = 'rgba(15, 23, 42, 0.7)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      e.target.style.background = 'rgba(15, 23, 42, 0.5)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="example@email.com"
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#818cf8' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>
                  كلمة المرور
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 pl-12 rounded-xl transition-all focus:outline-none"
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                      color: '#e2e8f0',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                      e.target.style.background = 'rgba(15, 23, 42, 0.7)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      e.target.style.background = 'rgba(15, 23, 42, 0.5)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="••••••••"
                    required
                  />
                  {/* Eye Icon on Left */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#818cf8' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#818cf8'}
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
                {/* Forgot Password Link Below Input */}
                <div className="mt-2 text-left">
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-sm font-medium transition-colors inline-flex items-center gap-1"
                    style={{ color: '#818cf8' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#818cf8'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>نسيت كلمة المرور؟</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 rounded-xl font-semibold text-base transition-all mt-6 overflow-hidden group"
              style={{
                background: loading ? 'rgba(99, 102, 241, 0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 20px 40px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
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
                  <span>جاري التحميل...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <span>تسجيل الدخول</span>
                  <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}>
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#64748b' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>اتصال آمن ومشفر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
