// ExamShield Design System — Badge
import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  default: "bg-[#f3f4f6] text-[#57606a]",
  success: "bg-[#dcfce7] text-[#166534]",
  warning: "bg-[#fef9c3] text-[#854d0e]",
  error: "bg-[#fee2e2] text-[#991b1b]",
  info: "bg-[#dbeafe] text-[#1e40af]",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
