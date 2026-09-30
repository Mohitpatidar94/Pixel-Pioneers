// ExamShield Design System — ProgressBar
import React from "react";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      {label && <span className="sr-only">{label}</span>}
      <div className="h-1.5 w-full bg-[#e5e7eb] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3b82d4] rounded-full transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
