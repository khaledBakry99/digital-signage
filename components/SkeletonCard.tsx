import type { CSSProperties, ReactNode } from "react";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export default function SkeletonCard({ lines = 3, className = "", children, style }: SkeletonCardProps) {
  const placeholders = Array.from({ length: lines });

  return (
    <div className={`skeleton-card animate-pulse ${className}`} style={style}>
      {children ??
        placeholders.map((_, idx) => (
          <div
            key={idx}
            className="skeleton-line"
            style={{ width: `${Math.max(40, 100 - idx * 12)}%` }}
          />
        ))}
    </div>
  );
}
