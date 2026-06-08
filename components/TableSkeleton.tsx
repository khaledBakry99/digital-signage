"use client";

interface TableSkeletonProps {
  cols: number;
  rows?: number;
}

export default function TableSkeleton({ cols, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="glass overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="table-dark w-full">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-4 px-6">
                  <div className="h-4 bg-indigo-500/10 border border-indigo-500/5 rounded-md w-2/3 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-white/5">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-4 px-6">
                    <div 
                      className="h-5 bg-white/5 rounded-lg animate-pulse"
                      style={{
                        width: `${Math.floor(Math.random() * (90 - 40 + 1)) + 40}%`,
                        animationDelay: `${r * 100 + c * 50}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
