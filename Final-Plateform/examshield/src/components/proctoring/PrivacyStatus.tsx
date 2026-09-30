// ExamShield — PrivacyStatus Component
// Visible indicator that all processing is local
import React from "react";
import type { ProcessingStatus } from "../../types/proctoring";

interface PrivacyStatusProps {
  status: ProcessingStatus;
  className?: string;
  compact?: boolean;
}

const config: Record<
  ProcessingStatus,
  { dot: string; label: string; subtext: string; bg: string; border: string; text: string }
> = {
  LOCAL: {
    dot: "bg-[#22c55e]",
    label: "LOCAL AI ACTIVE",
    subtext: "All processing on-device",
    bg: "bg-[#f0fdf4]",
    border: "border-[#86efac]",
    text: "text-[#166534]",
  },
  PROCESSING: {
    dot: "bg-[#3b82d4] animate-pulse",
    label: "ANALYSING",
    subtext: "Local frame analysis",
    bg: "bg-[#eff6ff]",
    border: "border-[#bfdbfe]",
    text: "text-[#1e40af]",
  },
  PAUSED: {
    dot: "bg-[#9ca3af]",
    label: "PAUSED",
    subtext: "Proctoring paused",
    bg: "bg-[#f9fafb]",
    border: "border-[#e5e7eb]",
    text: "text-[#57606a]",
  },
  CAMERA_ERROR: {
    dot: "bg-[#dc2626]",
    label: "CAMERA ERROR",
    subtext: "Check camera permissions",
    bg: "bg-[#fef2f2]",
    border: "border-[#fca5a5]",
    text: "text-[#991b1b]",
  },
};

export function PrivacyStatus({ status, className = "", compact = false }: PrivacyStatusProps) {
  const c = config[status];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 ${className}`}
        title={`${c.label} — ${c.subtext}`}
        aria-label={`${c.label}: ${c.subtext}`}
      >
        <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} aria-hidden="true" />
        <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${c.bg} ${c.border} ${className}`}
      aria-label={`Privacy status: ${c.label}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${c.dot}`} aria-hidden="true" />
      <div className="flex flex-col">
        <span className={`text-xs font-bold tracking-wide ${c.text}`}>{c.label}</span>
        <span className={`text-xs ${c.text} opacity-80`}>{c.subtext}</span>
      </div>
    </div>
  );
}

// ------ Privacy guarantee chips ------

export function PrivacyGuarantees({ className = "" }: { className?: string }) {
  const items = [
    "Camera stays on device",
    "No video upload",
    "No video recording",
    "Event-only evidence",
  ];
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Privacy guarantees">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 text-xs text-[#166534] bg-[#dcfce7] border border-[#86efac] rounded-full px-2.5 py-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {item}
        </span>
      ))}
    </div>
  );
}
