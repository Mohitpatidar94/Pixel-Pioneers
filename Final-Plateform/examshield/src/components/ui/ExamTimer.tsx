// ExamShield Design System — ExamTimer
import React, { useEffect, useState, useCallback } from "react";

interface ExamTimerProps {
  durationSeconds: number;
  onExpire: () => void;
  className?: string;
}

type TimerState = "normal" | "warning" | "critical" | "expired";

function getState(remaining: number, total: number): TimerState {
  if (remaining <= 0) return "expired";
  const pct = remaining / total;
  if (pct <= 0.05) return "critical"; // last 5%
  if (pct <= 0.2) return "warning";   // last 20%
  return "normal";
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const stateStyles: Record<TimerState, string> = {
  normal:   "text-[#1f2328] bg-[#f7f8fa] border-[#e5e7eb]",
  warning:  "text-[#854d0e] bg-[#fef9c3] border-[#fde68a]",
  critical: "text-[#991b1b] bg-[#fee2e2] border-[#fca5a5]",
  expired:  "text-[#57606a] bg-[#f7f8fa] border-[#e5e7eb]",
};

export function ExamTimer({ durationSeconds, onExpire, className = "" }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const expired = remaining <= 0;

  const handleExpire = useCallback(onExpire, [onExpire]);

  useEffect(() => {
    if (expired) {
      handleExpire();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, expired, handleExpire]);

  const state = getState(remaining, durationSeconds);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold tabular-nums ${stateStyles[state]} ${className}`}
      aria-label={`Time remaining: ${formatTime(Math.max(0, remaining))}`}
      aria-live="polite"
    >
      {/* Clock icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {state === "expired" ? "00:00" : formatTime(remaining)}
    </div>
  );
}
