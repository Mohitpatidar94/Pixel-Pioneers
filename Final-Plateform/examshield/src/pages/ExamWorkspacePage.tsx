// ExamShield — Exam Workspace (with full proctoring integration)
import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { ExamTimer } from "../components/ui/ExamTimer";
import { SecurityIndicator } from "../components/ui/SecurityIndicator";
import { QuestionCard } from "../components/ui/QuestionCard";
import { QuestionPalette } from "../components/ui/QuestionPalette";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { ProctoringOverlay } from "../components/proctoring/ProctoringOverlay";
import { PrivacyStatus } from "../components/proctoring/PrivacyStatus";
import { ProctorDebugPanel } from "../components/proctoring/ProctorDebugPanel";
import { DemoSimulator } from "../components/proctoring/DemoSimulator";
import { useSession } from "../context/SessionContext";
import { useProctoringEngine } from "../hooks/useProctoringEngine";
import { securityEventBus } from "../lib/securityEventBus";
import { getScoreBand } from "../types/proctoring";
import type { AnswerValue, SecurityStatus } from "../types";

export function ExamWorkspacePage() {
  const navigate = useNavigate();
  const {
    state,
    setAnswer,
    setQuestionIndex,
    submitExam,
    setSecurityStatus,
    addEvent,
  } = useSession();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const timerExpiredRef = useRef(false);

  // Guard
  const { session, exam, answers, currentQuestionIndex } = state;
  if (!session || !exam || session.status !== "active") {
    navigate("/enter-exam", { replace: true });
    return null;
  }

  // ---- Proctoring Engine ----
  const handleSecurityStatusChange = useCallback(
    (s: SecurityStatus) => setSecurityStatus(s),
    [setSecurityStatus]
  );

  const {
    processingStatus,
    integrityScore,
    debugVisible,
    toggleDebug,
  } = useProctoringEngine({
    sessionId: session.sessionId,
    onSecurityStatusChange: handleSecurityStatusChange,
  });

  const scoreBand = getScoreBand(integrityScore);

  const questions    = exam.questions;
  const currentQ     = questions[currentQuestionIndex];
  const oneQMode     = exam.settings.oneQuestionMode;
  const allowBack    = exam.settings.allowBackNavigation;
  const durationSecs = exam.settings.duration * 60;

  // ---- Answer helpers ----

  const getAnswer = useCallback(
    (qid: string): AnswerValue => answers.find((a) => a.questionId === qid)?.value ?? "",
    [answers]
  );

  const handleAnswerChange = useCallback(
    (qid: string, value: AnswerValue) =>
      setAnswer({ questionId: qid, value, answeredAt: new Date().toISOString() }),
    [setAnswer]
  );

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) setQuestionIndex(index);
    },
    [questions.length, setQuestionIndex]
  );

  const handleTimerExpire = useCallback(() => {
    if (timerExpiredRef.current) return;
    timerExpiredRef.current = true;
    if (exam.settings.autoSubmitOnExpiry) {
      submitExam();
      navigate("/submitted");
    } else {
      setShowSubmitModal(true);
    }
  }, [exam.settings.autoSubmitOnExpiry, navigate, submitExam]);

  const handleSubmitConfirm = useCallback(() => {
    const ev = securityEventBus.addEvent(session.sessionId, "SESSION_SUBMITTED", {
      severity: "INFO",
    });
    addEvent(ev);
    submitExam();
    navigate("/submitted");
  }, [addEvent, navigate, session.sessionId, submitExam]);

  // ---- Palette ----

  const paletteItems = questions.map((q, i) => {
    const isAnswered = answers.some(
      (a) =>
        a.questionId === q.id &&
        (Array.isArray(a.value) ? a.value.length > 0 : (a.value as string).trim() !== "")
    );
    return {
      number: q.number,
      state:
        i === currentQuestionIndex
          ? ("current" as const)
          : isAnswered
          ? ("answered" as const)
          : ("unanswered" as const),
    };
  });

  const answeredCount = answers.filter(
    (a) =>
      Array.isArray(a.value) ? a.value.length > 0 : (a.value as string).trim() !== ""
  ).length;

  // ---- Render ----

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* ---- Header ---- */}
      <header className="bg-white border-b border-[#e5e7eb] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Logo size="sm" className="shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1f2328] truncate">{exam.title}</p>
            <p className="text-xs text-[#57606a]">{session.studentName}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Integrity score pill */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{
                color: scoreBand.color,
                borderColor: scoreBand.color + "40",
                backgroundColor: scoreBand.color + "14",
              }}
              title={`Integrity Signal Score: ${integrityScore} — ${scoreBand.label}`}
              aria-label={`Integrity signal score: ${integrityScore}`}
            >
              <span>ISS {integrityScore}</span>
            </div>

            <ExamTimer durationSeconds={durationSecs} onExpire={handleTimerExpire} />
            <SecurityIndicator status={session.securityStatus} className="hidden md:flex" />

            {/* Mobile palette toggle */}
            <button
              className="sm:hidden p-2 rounded-lg border border-[#e5e7eb] text-[#57606a]"
              onClick={() => setShowPalette((p) => !p)}
              aria-label="Toggle question palette"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ---- Body ---- */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* ---- Main question area ---- */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {oneQMode ? (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8">
              <QuestionCard
                question={currentQ}
                answer={getAnswer(currentQ.id)}
                onChange={(v) => handleAnswerChange(currentQ.id, v)}
              />
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={() => goTo(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0 || !allowBack}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-[#57606a]">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button variant="primary" onClick={() => goTo(currentQuestionIndex + 1)}>
                    Next →
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  id={`question-${i}`}
                  className={`bg-white border rounded-xl p-6 md:p-8 scroll-mt-20 ${
                    i === currentQuestionIndex
                      ? "border-[#3b82d4] ring-1 ring-[#3b82d4]/20"
                      : "border-[#e5e7eb]"
                  }`}
                  onClick={() => setQuestionIndex(i)}
                >
                  <QuestionCard
                    question={q}
                    answer={getAnswer(q.id)}
                    onChange={(v) => handleAnswerChange(q.id, v)}
                  />
                </div>
              ))}
              <div className="flex justify-end pb-4">
                <Button variant="primary" size="lg" onClick={() => setShowSubmitModal(true)}>
                  Submit Exam
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* ---- Right sidebar ---- */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-20 bg-white border-l border-[#e5e7eb] w-64 flex flex-col transition-transform duration-200
            ${showPalette ? "translate-x-0" : "translate-x-full"}
            sm:relative sm:translate-x-0 sm:w-56 sm:flex sm:flex-col
          `}
        >
          {/* Mobile close */}
          <div className="flex items-center justify-between px-4 pt-4 sm:hidden">
            <span className="text-sm font-semibold text-[#1f2328]">Questions</span>
            <button onClick={() => setShowPalette(false)} aria-label="Close palette">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-3 flex flex-col gap-4">
            <p className="text-xs text-[#57606a] font-medium hidden sm:block">Questions</p>
            <QuestionPalette
              items={paletteItems}
              onSelect={(idx) => {
                goTo(idx);
                setShowPalette(false);
                if (!oneQMode) {
                  document.getElementById(`question-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            />

            {/* Webcam + privacy indicator — local only */}
            <div className="mt-2">
              <ProctoringOverlay
                sessionId={session.sessionId}
                onStatusChange={(s) => {
                  if (s === "CAMERA_ERROR") setSecurityStatus("OFFLINE");
                }}
                className="w-full"
              />
            </div>

            {/* Demo simulator */}
            <DemoSimulator sessionId={session.sessionId} />

            {/* Debug toggle hint */}
            <p className="text-[10px] text-[#9ca3af] text-center">
              Ctrl+Shift+D for debug panel
            </p>
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-[#e5e7eb] px-4 py-3">
            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#57606a]">Answered</span>
                <span className="font-semibold text-[#166534]">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#57606a]">Remaining</span>
                <span className="font-semibold text-[#1f2328]">{questions.length - answeredCount}</span>
              </div>
            </div>
            <Button variant="primary" size="sm" fullWidth onClick={() => setShowSubmitModal(true)}>
              Submit Exam
            </Button>
          </div>
        </aside>
      </div>

      {/* ---- Footer ---- */}
      <footer className="bg-white border-t border-[#e5e7eb] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs text-[#57606a]">
          <SecurityIndicator status={session.securityStatus} />
          <PrivacyStatus status={processingStatus} compact className="hidden sm:flex" />
          <span className="hidden md:inline">Raw video never uploaded — local analysis only</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
      </footer>

      {/* ---- Debug Panel (dev-only) ---- */}
      <ProctorDebugPanel
        sessionId={session.sessionId}
        visible={debugVisible}
        onClose={toggleDebug}
      />

      {/* ---- Submit Confirmation Modal ---- */}
      <Modal
        open={showSubmitModal}
        onClose={() => !timerExpiredRef.current && setShowSubmitModal(false)}
        title="Submit Your Exam?"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Answered",   value: `${answeredCount}/${questions.length}`, color: "text-[#166534]" },
              { label: "Unanswered", value: `${questions.length - answeredCount}`,   color: "text-[#991b1b]" },
            ].map((d) => (
              <div key={d.label} className="p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] text-center">
                <p className="text-xs text-[#57606a]">{d.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${d.color}`}>{d.value}</p>
              </div>
            ))}
          </div>

          {/* Integrity score preview */}
          <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f7f8fa]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#57606a]">Integrity Signal Score</span>
              <span
                className="text-sm font-bold"
                style={{ color: scoreBand.color }}
              >
                {integrityScore} — {scoreBand.label}
              </span>
            </div>
            <div className="h-2 w-full bg-[#e5e7eb] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${integrityScore}%`, backgroundColor: scoreBand.color }}
              />
            </div>
            <p className="text-xs text-[#57606a] mt-1.5">{scoreBand.description}</p>
          </div>

          {questions.length - answeredCount > 0 && (
            <div className="p-3 rounded-lg bg-[#fef9c3] border border-[#fde68a] text-xs text-[#854d0e]">
              {questions.length - answeredCount} unanswered question(s). Sure you want to submit?
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={handleSubmitConfirm} fullWidth size="lg">
              Submit Exam
            </Button>
            {!timerExpiredRef.current && (
              <Button variant="ghost" onClick={() => setShowSubmitModal(false)} fullWidth>
                Continue Exam
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
