"use client";

import { CSSProperties } from "react";

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
}

const variantStyles = {
  primary: "btn-modern",
  secondary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeStyles = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function LoadingButton({
  children,
  loading = false,
  disabled = false,
  onClick,
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  style,
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${variantStyles[variant]} ${sizeStyles[size]} ${className} relative overflow-hidden`}
      style={{
        ...style,
        opacity: isDisabled ? 0.7 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
      }}
    >
      <span
        className="flex items-center justify-center gap-2"
        style={{
          opacity: loading ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {children}
      </span>

      {loading && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: "fadeIn 0.2s ease",
          }}
        >
          <svg
            className="animate-spin"
            style={{
              width: size === "sm" ? "16px" : size === "lg" ? "24px" : "20px",
              height: size === "sm" ? "16px" : size === "lg" ? "24px" : "20px",
            }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="60"
              strokeDashoffset="20"
              opacity="0.3"
            />
            <path
              d="M12 2C6.48 2 2 6.48 2 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
