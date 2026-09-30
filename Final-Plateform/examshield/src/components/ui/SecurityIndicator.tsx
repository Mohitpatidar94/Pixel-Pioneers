// ExamShield Design System — SecurityIndicator
import React from "react";
import type { SecurityStatus } from "../../types";

interface SecurityIndicatorProps {
  status: SecurityStatus;
  className?: string;
}

const config: Record<SecurityStatus, { dot: string; label: string; text: string }> = {
  SECURE:   { dot: "bg-[#22c55e]", label: "ExamShield Active — Secure",   text: "text-[#166534]" },
  CHECKING: { dot: "bg-[#f59e0b] animate-pulse", label: "ExamShield — Checking", text: "text-[#854d0e]" },
  WARNING:  { dot: "bg-[#f97316]", label: "ExamShield — Warning",  text: "text-[#9a3412]" },
  OFFLINE:  { dot: "bg-[#9ca3af]", label: "ExamShield — Offline",  text: "text-[#57606a]" },
};

export function SecurityIndicator({ status, className = "" }: SecurityIndicatorProps) {
  const { dot, label, text } = config[status];
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={label}
      title={label}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  );
}
