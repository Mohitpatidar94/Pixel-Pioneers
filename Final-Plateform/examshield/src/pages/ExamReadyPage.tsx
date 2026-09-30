// ExamShield — Exam Ready Page
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SecurityIndicator } from "../components/ui/SecurityIndicator";
import { useSession } from "../context/SessionContext";
import { securityEventBus } from "../lib/securityEventBus";

export function ExamReadyPage() {
  const navigate = useNavigate();
  const { state, startExam, setSecurityStatus } = useSession();

  // Guard
  if (!state.session || !state.exam) {
    navigate("/enter-exam", { replace: true });
    return null;
  }

  const { session, exam } = state;

  // When page mounts, prime security status
  useEffect(() => {
    setSecurityStatus("CHECKING");
    const timer = setTimeout(() => setSecurityStatus("SECURE"), 1500);
    return () => clearTimeout(timer);
  }, [setSecurityStatus]);

  function handleStart() {
    startExam();
    // Emit session-started event
    securityEventBus.addEvent(session.sessionId, "SESSION_STARTED", {
      severity: "INFO",
      metadata: { examId: exam.id, studentName: session.studentName },
    });
    // Request fullscreen
    document.documentElement.requestFullscreen().catch(() => {});
    navigate("/exam");
  }

  const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center">
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg" padding="lg">
          {/* Ready indicator */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 rounded-full bg-[#dcfce7] border border-[#86efac] flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1f2328]">Ready to Begin</h1>
            <p className="text-sm text-[#57606a] mt-1">
              Your system is verified and privacy acknowledged.
            </p>
          </div>

          {/* Exam details */}
          <div className="flex flex-col gap-3 mb-7">
            <div className="p-4 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb]">
              <h2 className="text-base font-semibold text-[#1f2328]">{exam.title}</h2>
              <p className="text-sm text-[#57606a] mt-0.5">{exam.subject}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Candidate", value: session.studentName },
                { label: "Duration", value: `${exam.settings.duration} minutes` },
                { label: "Questions", value: `${exam.questions.length}` },
                { label: "Total Marks", value: `${totalPoints}` },
              ].map((d) => (
                <div key={d.label} className="p-3 rounded-lg bg-white border border-[#e5e7eb]">
                  <p className="text-xs text-[#57606a]">{d.label}</p>
                  <p className="text-sm font-semibold text-[#1f2328] mt-0.5">{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3.5 rounded-lg bg-[#fef9c3] border border-[#fde68a] text-xs text-[#854d0e] mb-5">
            <strong>Instructions:</strong> {exam.instructions}
          </div>

          {/* Security status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] mb-6">
            <span className="text-xs text-[#57606a]">Proctoring status</span>
            <SecurityIndicator status={session.securityStatus} />
          </div>

          <Button variant="primary" onClick={handleStart} fullWidth size="lg">
            Start Exam
          </Button>
        </Card>
      </main>
    </div>
  );
}
