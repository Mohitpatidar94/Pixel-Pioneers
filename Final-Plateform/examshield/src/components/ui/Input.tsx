// ExamShield Design System — Input
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#1f2328]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#1f2328] placeholder-[#9ca3af]
          bg-white transition-colors duration-150
          border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#3b82d4] focus:border-[#3b82d4]
          disabled:bg-[#f7f8fa] disabled:cursor-not-allowed
          ${error ? "border-[#dc2626] focus:ring-[#dc2626]" : ""}
          ${className}`}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[#dc2626]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[#57606a]">
          {hint}
        </p>
      )}
    </div>
  );
}
