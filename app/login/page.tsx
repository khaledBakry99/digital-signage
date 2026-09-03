"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { useTheme } from "@/lib/context/ThemeContext";

const MAX_ATTEMPTS = 5; // Maximum login attempts
const BLOCK_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Rate limiting states
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [blockUntil, setBlockUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const isDark = theme === 'dark';

  // Load rate limiting data from localStorage on mount
  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const storedBlockUntil = localStorage.getItem('blockUntil');
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
    
    if (storedBlockUntil) {
      const blockTime = parseInt(storedBlockUntil);
      if (blockTime > Date.now()) {
        setBlockUntil(blockTime);
      } else {
        // Clear expired block
        localStorage.removeItem('blockUntil');
        localStorage.removeItem('loginAttempts');
        setLoginAttempts(0);
      }
    }
  }, []);

  // Countdown timer for blocked state
  useEffect(() => {
    if (!blockUntil) return;

    const interval = setInterval(() => {
      const remaining = blockUntil - Date.now();
      
      if (remaining <= 0) {
        // Unblock user
        setBlockUntil(null);
        setLoginAttempts(0);
        setRemainingTime(0);
        localStorage.removeItem('blockUntil');
        localStorage.removeItem('loginAttempts');
        setError('');
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockUntil]);

  // Format remaining time as MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if user is blocked
    if (blockUntil && Date.now() < blockUntil) {
      const remaining = formatTime(blockUntil - Date.now());
      setError(`تم حظر تسجيل الدخول مؤقتاً. حاول مرة أخرى بعد ${remaining}`);
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Reset attempts on successful login
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('blockUntil');
        
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
          }
        }

        const destination = result.user?.role === "SuperAdmin" ? "/super-admin" : "/";
        router.push(destination);
      } else {
        // Failed login attempt
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        // Check if should block
        if (newAttempts >= MAX_ATTEMPTS) {
          const blockTime = Date.now() + BLOCK_DURATION;
          setBlockUntil(blockTime);
          localStorage.setItem('blockUntil', blockTime.toString());
          setError(`تجاوزت الحد الأقصى من المحاولات (${MAX_ATTEMPTS}). تم حظر تسجيل الدخول لمدة 10 دقائق.`);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(`${result.error || "فشل تسجيل الدخول"}. المحاولات المتبقية: ${remaining}`);
        }
      }
    } catch {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const blockTime = Date.now() + BLOCK_DURATION;
        setBlockUntil(blockTime);
        localStorage.setItem('blockUntil', blockTime.toString());
        setError(`تجاوزت الحد الأقصى من المحاولات (${MAX_ATTEMPTS}). تم حظر تسجيل الدخول لمدة 10 دقائق.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`حدث خطأ في تسجيل الدخول. المحاولات المتبقية: ${remaining}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" suppressHydrationWarning style={{
      background: isDark
        ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
    }}>
      {/* Animated Background */}
      <div className="absolute inset-0" suppressHydrationWarning>
        <div className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-400/20'}`} suppressHydrationWarning></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-400/20'}`} suppressHydrationWarning></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-blue-500/5' : 'bg-blue-400/15'}`} suppressHydrationWarning></div>
      </div>
      {/* Grid Pattern */}
      <div className="absolute inset-0" suppressHydrationWarning style={{
        opacity: isDark ? 0.02 : 0.05,
        backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      {/* Login Card */}
      <div className="w-1/2 max-w-md relative">
        {/* Card Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-lg"></div>

        <div className="relative rounded-3xl overflow-hidden" suppressHydrationWarning style={{
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Top Section with Logo */}
          <div className="text-center" suppressHydrationWarning style={{
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
          <div className="relative h-px" suppressHydrationWarning style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent)'
          }}></div>

          {/* Form Section */}
          <div className="p-8" suppressHydrationWarning style={{
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
                مرحباً بعودتك
              </h1>
              <p className="text-sm" suppressHydrationWarning style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                سجل دخولك للوصول إلى لوحة التحكم
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                blockUntil && Date.now() < blockUntil
                  ? isDark ? 'bg-red-500/20 border-2 border-red-500/40' : 'bg-red-50 border-2 border-red-300'
                  : isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
              }`}>
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {blockUntil && Date.now() < blockUntil ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  {blockUntil && Date.now() < blockUntil && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                          الوقت المتبقي للحظر
                        </span>
                        <span className={`text-sm font-bold font-mono ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                          {formatTime(remainingTime)}
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-red-950/50' : 'bg-red-100'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000"
                          style={{ 
                            width: `${(remainingTime / BLOCK_DURATION) * 100}%`,
                            transition: 'width 1s linear'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attempts Warning (show when no error but attempts > 0) */}
            {!error && loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                loginAttempts >= 3
                  ? isDark ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'
                  : isDark ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <svg className={`w-5 h-5 shrink-0 mt-0.5 ${
                  loginAttempts >= 3 ? 'text-orange-400' : 'text-yellow-500'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    loginAttempts >= 3 
                      ? isDark ? 'text-orange-300' : 'text-orange-700'
                      : isDark ? 'text-yellow-300' : 'text-yellow-700'
                  }`}>
                    المحاولات المتبقية: {MAX_ATTEMPTS - loginAttempts} من {MAX_ATTEMPTS}
                  </p>
                  <div className="mt-2">
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-200'
                    }`}>
                      <div 
                        className={`h-full transition-all duration-300 ${
                          loginAttempts >= 3
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-yellow-400 to-orange-400'
                        }`}
                        style={{ width: `${(loginAttempts / MAX_ATTEMPTS) * 100}%` }}
                      />
                    </div>
                  </div>
                  {loginAttempts >= 3 && (
                    <p className={`text-xs mt-2 ${isDark ? 'text-orange-400/80' : 'text-orange-600'}`}>
                      ⚠️ تحذير: محاولة واحدة أخرى خاطئة سيؤدي إلى حظر مؤقت لمدة 10 دقائق
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2" suppressHydrationWarning style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                    البريد الإلكتروني
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-xl transition-all focus:outline-none"
                      suppressHydrationWarning
                      style={{
                        background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                        border: '2px solid rgba(99, 102, 241, 0.2)',
                        color: isDark ? '#e2e8f0' : '#1e293b',
                        fontSize: '16px'
                      }}
                      onFocus={(e) => {
                        const theme = document.documentElement.classList.contains('dark');
                        e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                        e.target.style.background = theme ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.95)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                        e.target.style.color = theme ? '#e2e8f0' : '#1e293b';
                      }}
                      onBlur={(e) => {
                        const theme = document.documentElement.classList.contains('dark');
                        e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                        e.target.style.background = theme ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.color = theme ? '#e2e8f0' : '#1e293b';
                      }}
                      placeholder="example@email.com"
                      required
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" suppressHydrationWarning style={{ color: isDark ? '#818cf8' : '#6366f1' }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2" suppressHydrationWarning style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 pl-12 rounded-xl transition-all focus:outline-none"
                      suppressHydrationWarning
                      style={{
                        background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                        border: '2px solid rgba(99, 102, 241, 0.2)',
                        color: isDark ? '#e2e8f0' : '#1e293b',
                        fontSize: '16px'
                      }}
                      onFocus={(e) => {
                        const theme = document.documentElement.classList.contains('dark');
                        e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                        e.target.style.background = theme ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.95)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                        e.target.style.color = theme ? '#e2e8f0' : '#1e293b';
                      }}
                      onBlur={(e) => {
                        const theme = document.documentElement.classList.contains('dark');
                        e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                        e.target.style.background = theme ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.color = theme ? '#e2e8f0' : '#1e293b';
                      }}
                      placeholder="••••••••"
                      required
                    />
                    {/* Eye Icon on Left */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                      suppressHydrationWarning
                      style={{ color: isDark ? '#818cf8' : '#6366f1' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#a78bfa' : '#8b5cf6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
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
                      onClick={() => window.location.href = '/forgot-password'}
                      className="text-sm font-medium transition-colors inline-flex items-center gap-1"
                      suppressHydrationWarning
                      style={{ color: isDark ? '#818cf8' : '#6366f1' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#a78bfa' : '#8b5cf6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#818cf8' : '#6366f1'}
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
                disabled={loading || (blockUntil !== null && Date.now() < blockUntil)}
                className="relative w-full py-4 rounded-xl font-semibold text-base transition-all mt-6 overflow-hidden group disabled:cursor-not-allowed"
                suppressHydrationWarning
                style={{
                  background: (loading || (blockUntil !== null && Date.now() < blockUntil))
                    ? 'rgba(99, 102, 241, 0.3)' 
                    : (isDark ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)'),
                  color: '#ffffff',
                  cursor: (loading || (blockUntil !== null && Date.now() < blockUntil)) ? 'not-allowed' : 'pointer',
                  boxShadow: (loading || (blockUntil !== null && Date.now() < blockUntil)) ? 'none' : '0 20px 40px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Shimmer Effect */}
                {!loading && !(blockUntil !== null && Date.now() < blockUntil) && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>جاري التحميل...</span>
                  </div>
                ) : (blockUntil !== null && Date.now() < blockUntil) ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>محظور مؤقتاً ({formatTime(remainingTime)})</span>
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
            <div className="mt-6 pt-5 border-t" suppressHydrationWarning style={{ borderColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }}>
              <div className="flex items-center justify-center gap-2 text-sm" suppressHydrationWarning style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>اتصال آمن ومشفر</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
