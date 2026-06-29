"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const COUNTDOWN_SECONDS = 5;

export default function SessionExpiryToast() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (redirectRef.current) {
      clearTimeout(redirectRef.current);
      redirectRef.current = null;
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    clearTimers();
    setVisible(false);
    router.push("/login");
  }, [clearTimers, router]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearTimers();
      setSecondsLeft(COUNTDOWN_SECONDS);
      setVisible(true);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => Math.max(prev - 1, 0));
      }, 1000);

      redirectRef.current = setTimeout(() => {
        navigateToLogin();
      }, COUNTDOWN_SECONDS * 1000);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
      clearTimers();
    };
  }, [clearTimers, navigateToLogin]);

  if (!visible) {
    return null;
  }

  const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-10 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative pointer-events-auto w-[90%] max-w-xl rounded-3xl p-[1px] shadow-[0_25px_70px_rgba(0,0,0,0.35)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(248,113,113,0.85), rgba(220,38,38,0.85))",
        }}
      >
        <div
          className="rounded-3xl bg-slate-900/80 text-white p-6"
          style={{ backdropFilter: "blur(20px)" }}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <svg
                  className="w-7 h-7 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/10 text-xs tracking-wide font-semibold">
                {secondsLeft} ثانية
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xl font-black mb-2 tracking-tight">انتهت صلاحية جلسة العمل</p>
              <p className="text-sm text-white/80 leading-relaxed">
                لحماية بياناتك قمنا بإنهاء الجلسة الحالية. سيتم تحويلك إلى صفحة تسجيل الدخول
                خلال ثوانٍ قليلة لإعادة التوثيق.
              </p>
              <div className="mt-5">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-end gap-3 flex-wrap">
                  <span className="text-xs text-white/60">
                    سيتم التحويل تلقائياً بعد انتهاء العداد
                  </span>
                  <button
                    onClick={navigateToLogin}
                    className="px-5 py-2 rounded-2xl text-sm font-semibold bg-white text-rose-600 shadow-lg shadow-white/20 hover:-translate-y-[1px] transition"
                  >
                    الذهاب الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
