// ExamShield — Privacy Notice Screen
import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useSession } from "../context/SessionContext";

const PRIVACY_POINTS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    text: "Webcam analysis happens entirely on your device using local AI. Your raw video feed never leaves your browser.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    text: "Raw video is not uploaded, stored, or transmitted to any server — not even locally.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    text: "Only structured security events are generated. Events may include timestamps and confidence scores.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    text: "Exam integrity data can be digitally verified by your institution after submission.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    text: "Events are evidence, not judgements. Final integrity decisions are made by your evaluator, not the system.",
  },
];

export function PrivacyPage() {
  const navigate = useNavigate();
  const { state, setStatus } = useSession();

  // Guard
  if (!state.session) {
    navigate("/enter-exam", { replace: true });
    return null;
  }

  function handleAccept() {
    setStatus("ready");
    navigate("/exam-ready");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center">
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg" padding="lg">
          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 rounded-full bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82d4" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1f2328]">Your Privacy Matters</h1>
            <p className="text-sm text-[#57606a] mt-1 max-w-sm">
              Please read the following before starting your exam.
            </p>
          </div>

          {/* Privacy points */}
          <ul className="flex flex-col gap-4 mb-8" aria-label="Privacy information">
            {PRIVACY_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 text-[#3b82d4]">{point.icon}</div>
                <p className="text-sm text-[#1f2328] leading-relaxed">{point.text}</p>
              </li>
            ))}
          </ul>

          {/* Consent note */}
          <div className="p-3.5 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] text-xs text-[#57606a] mb-6">
            By clicking <strong>"I Understand"</strong>, you acknowledge that ExamShield
            will monitor your exam environment locally and generate integrity events
            as described above.
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={handleAccept} fullWidth size="lg">
              I Understand — Start Exam
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)} fullWidth>
              Back
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
