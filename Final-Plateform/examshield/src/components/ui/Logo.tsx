// ExamShield Design System — Logo
import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { icon: 20, text: "text-base" },
  md: { icon: 28, text: "text-xl" },
  lg: { icon: 36, text: "text-2xl" },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { icon, text } = sizes[size];
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label="ExamShield">
      {/* Shield icon — original SVG */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 2L4 7v9c0 7.18 5.14 13.89 12 15.47C22.86 29.89 28 23.18 28 16V7L16 2Z"
          fill="#3b82d4"
        />
        <path
          d="M16 2L4 7v9c0 7.18 5.14 13.89 12 15.47C22.86 29.89 28 23.18 28 16V7L16 2Z"
          fill="url(#shield-grad)"
        />
        <path
          d="M11 16.5l3 3 7-7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="shield-grad" x1="4" y1="2" x2="28" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82d4" />
            <stop offset="1" stopColor="#7c5cd8" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-bold tracking-tight text-[#1f2328] ${text}`}>
        Exam<span className="text-[#3b82d4]">Shield</span>
      </span>
    </div>
  );
}
