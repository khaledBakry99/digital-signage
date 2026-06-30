"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user?.role !== "SuperAdmin") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] p-8">
        {/* Header Skeleton */}
        <div className="glass rounded-3xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-3">
              <div className="skeleton-line-pro w-64 h-10" />
              <div className="skeleton-line-pro w-full max-w-md h-4" />
            </div>
            <div className="w-full lg:w-[420px]">
              <div className="bg-white/[0.02] rounded-2xl p-6 space-y-4">
                <div className="skeleton-line-pro w-32 h-6" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/[0.03] rounded-xl p-4 h-24" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-elevated skeleton-shimmer">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-3 flex-1">
                    <div className="skeleton-line-pro w-32 h-4" />
                    <div className="skeleton-line-pro w-48 h-8" />
                    <div className="skeleton-line-pro w-64 h-4" />
                  </div>
                  <div className="skeleton-line-pro w-24 h-8" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="bg-white/[0.03] rounded-xl p-4 h-24" />
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="skeleton-line-pro w-32 h-10" />
                  <div className="skeleton-line-pro w-40 h-10" />
                </div>
              </div>
            ))}
          </div>

          {/* Form Skeleton */}
          <div className="card-elevated h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="skeleton-avatar w-10 h-10" />
              <div className="space-y-2">
                <div className="skeleton-line-pro w-32 h-6" />
                <div className="skeleton-line-pro w-48 h-4" />
              </div>
            </div>
            <div className="section-divider" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="skeleton-line-pro w-24 h-4 mb-2" />
                  <div className="skeleton-line-pro w-full h-12 rounded-xl" />
                </div>
              ))}
              <div className="skeleton-line-pro w-full h-12 rounded-xl mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== "SuperAdmin") {
    return null;
  }

  return <>{children}</>;
}
