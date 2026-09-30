// ExamShield — Landing Page
import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-[#e5e7eb] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/teacher")}>
              Teacher / Evaluator
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/enter-exam")}>
              Enter Exam
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          {/* Shield emblem */}
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe]">
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M16 2L4 7v9c0 7.18 5.14 13.89 12 15.47C22.86 29.89 28 23.18 28 16V7L16 2Z"
                fill="url(#hero-grad)"
              />
              <path
                d="M11 16.5l3 3 7-7"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="hero-grad" x1="4" y1="2" x2="28" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82d4" />
                  <stop offset="1" stopColor="#7c5cd8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-[#1f2328]">
              Private exams. Trusted results.
            </h1>
            <p className="text-lg text-[#57606a] leading-relaxed max-w-xl">
              AI-powered exam integrity that analyses your exam environment
              locally on your device — no video leaves your browser.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/enter-exam")}
              className="sm:min-w-[180px]"
            >
              Enter Exam
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/teacher")}
              className="sm:min-w-[180px]"
            >
              Teacher / Evaluator
            </Button>
          </div>

          {/* Privacy statement */}
          <div className="flex items-center gap-2 text-sm text-[#57606a] bg-[#f7f8fa] border border-[#e5e7eb] rounded-lg px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3b82d4] shrink-0" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Your camera is analysed locally. Raw video is never uploaded.</span>
          </div>
        </div>
      </main>

      {/* Feature strip */}
      <section className="border-t border-[#e5e7eb] bg-[#f7f8fa] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              title: "Local AI Proctoring",
              desc: "Webcam analysis runs entirely in your browser using on-device AI. No video is transmitted.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              ),
              title: "Tamper-Evident Reports",
              desc: "Only structured security events are generated, allowing cryptographically verifiable integrity reports.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
              title: "Distraction-Free",
              desc: "Clean, minimal exam interface designed to keep students focused — no clutter, no anxiety.",
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <div className="text-[#3b82d4]">{f.icon}</div>
              <h3 className="text-sm font-semibold text-[#1f2328]">{f.title}</h3>
              <p className="text-sm text-[#57606a] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-5 px-6 text-center text-xs text-[#57606a]">
        © 2026 ExamShield · Privacy-first local exam proctoring
      </footer>
    </div>
  );
}
