"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { passwordApi } from "@/lib/api/password.api";
import { useTheme } from "@/lib/context/ThemeContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    setLoading(true);

    try {
      await passwordApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في إرسال رابط إعادة تعيين كلمة المرور');
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
      <div className="w-1/2 max-w-md relative">
        {/* Card Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-lg"></div>

        <div className="relative rounded-3xl overflow-hidden" style={{
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Top Section with Logo */}
          <div className="text-center" style={{
            background: isDark
              ? 'linear-gradient(135deg, #8380dd 60%, #824edb 100%)'
              : 'linear-gradient(135deg, #c7c7f4 0%, #cfbdf9 100%)',
            borderBottom: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            <img
              src="/logo-small.png"
              alt="Logo"
              className="mx-auto"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                padding: '20px 0'
              }}
            />
          </div>

          {/* Professional Divider */}
          <div className="relative h-px" style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)'
          }}></div>

          {/* Form Section */}
          <div className="p-8" style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Welcome Text */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                نسيت كلمة المرور؟
              </h1>
              <p className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
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
                <p className="text-green-400 text-sm">تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني</p>
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
                      <span>جاري الإرسال...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <span>إرسال رابط إعادة التعيين</span>
                      <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
                    boxShadow: '0 15px 30px rgba(99, 102, 241, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
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
      </div>
    </div>
  );
}
