// ExamShield — Exam Workspace
// Full exam interface: header, question area, palette, timer, security indicator
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { ExamTimer } from "../components/ui/ExamTimer";
import { SecurityIndicator } from "../components/ui/SecurityIndicator";
import { QuestionCard } from "../components/ui/QuestionCard";
import { QuestionPalette } from "../components/ui/QuestionPalette";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { useSession } from "../context/SessionContext";
import { securityEventBus } from "../lib/securityEventBus";
import type { AnswerValue } from "../types";

export function ExamWorkspacePage() {
  const navigate = useNavigate();
  const { state, setAnswer, setQuestionIndex, submitExam, setSecurityStatus, addEvent } = useSession();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const timerExpiredRef = useRef(false);

  // Guard
  const { session, exam, answers, currentQuestionIndex } = state;
  if (!session || !exam || session.status !== "active") {
    navigate("/enter-exam", { replace: true });
    return null;
  }

  const questions = exam.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const oneQuestionMode = exam.settings.oneQuestionMode;
  const allowBack = exam.settings.allowBackNavigation;
  const durationSeconds = exam.settings.duration * 60;

  // ------ Security event listeners ------

  useEffect(() => {
    // Tab/window visibility
    const handleVisibility = () => {
      if (document.hidden) {
        const ev = securityEventBus.addEvent(session.sessionId, "TAB_SWITCH", {
          severity: "MEDIUM",
          metadata: { at: new Date().toISOString() },
        });
        addEvent(ev);
        setSecurityStatus("WARNING");
        setTimeout(() => setSecurityStatus("SECURE"), 3000);
      }
    };

    // Window blur (alt-tab, etc.)
    const handleBlur = () => {
      const ev = securityEventBus.addEvent(session.sessionId, "WINDOW_BLUR", {
        severity: "LOW",
      });
      addEvent(ev);
    };

    // Fullscreen exit
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        const ev = securityEventBus.addEvent(session.sessionId, "FULLSCREEN_EXIT", {
          severity: "MEDIUM",
        });
        addEvent(ev);
        setSecurityStatus("WARNING");
        setTimeout(() => setSecurityStatus("SECURE"), 3000);
      }
    };

    // Right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const ev = securityEventBus.addEvent(session.sessionId, "RIGHT_CLICK_ATTEMPT", {
        severity: "LOW",
      });
      addEvent(ev);
    };

    // Copy / Paste
    const handleCopy = () => {
      const ev = securityEventBus.addEvent(session.sessionId, "COPY_ATTEMPT", { severity: "LOW" });
      addEvent(ev);
    };
    const handlePaste = () => {
      const ev = securityEventBus.addEvent(session.sessionId, "PASTE_ATTEMPT", { severity: "LOW" });
      addEvent(ev);
    };

    // Keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+T, F12, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        (e.ctrlKey || e.metaKey) && e.key === "c",
        (e.ctrlKey || e.metaKey) && e.key === "v",
        (e.ctrlKey || e.metaKey) && e.key === "t",
        (e.ctrlKey || e.metaKey) && e.key === "n",
        e.key === "F12",
        e.key === "PrintScreen",
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        const ev = securityEventBus.addEvent(session.sessionId, "KEYBOARD_SHORTCUT", {
          severity: "LOW",
          metadata: { key: e.key },
        });
        addEvent(ev);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [session.sessionId, addEvent, setSecurityStatus]);

  // ------ Helpers ------

  const getAnswer = useCallback(
    (questionId: string): AnswerValue => {
      const found = answers.find((a) => a.questionId === questionId);
      if (!found) return "";
      return found.value;
    },
    [answers]
  );

  const handleAnswerChange = useCallback(
    (questionId: string, value: AnswerValue) => {
      setAnswer({
        questionId,
        value,
        answeredAt: new Date().toISOString(),
      });
    },
    [setAnswer]
  );

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= questions.length) return;
      setQuestionIndex(index);
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

  // ------ Palette data ------

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

  // ------ Render ------

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
            <ExamTimer
              durationSeconds={durationSeconds}
              onExpire={handleTimerExpire}
            />
            <SecurityIndicator status={session.securityStatus} className="hidden sm:flex" />
            {/* Mobile: palette toggle */}
            <button
              className="sm:hidden p-2 rounded-lg border border-[#e5e7eb] text-[#57606a] hover:bg-[#f7f8fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82d4]"
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
          {oneQuestionMode ? (
            /* One-question-at-a-time mode */
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8">
              <QuestionCard
                question={currentQuestion}
                answer={getAnswer(currentQuestion.id)}
                onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
              />

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={() => goTo(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0 || !allowBack}
                  size="md"
                >
                  ← Previous
                </Button>

                <span className="text-sm text-[#57606a]">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => goTo(currentQuestionIndex + 1)}
                    size="md"
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setShowSubmitModal(true)}
                    size="md"
                  >
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* All-questions mode */
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

              {/* Submit area */}
              <div className="flex justify-end pb-4">
                <Button variant="primary" size="lg" onClick={() => setShowSubmitModal(true)}>
                  Submit Exam
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* ---- Right sidebar (palette) ---- */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-20 bg-white border-l border-[#e5e7eb] w-64 flex flex-col transition-transform duration-200
            ${showPalette ? "translate-x-0" : "translate-x-full"}
            sm:relative sm:translate-x-0 sm:w-56 sm:flex sm:flex-col sm:border-t-0
          `}
          aria-label="Question navigation sidebar"
        >
          {/* Close button (mobile) */}
          <div className="flex items-center justify-between px-4 pt-4 sm:hidden">
            <span className="text-sm font-semibold text-[#1f2328]">Questions</span>
            <button
              className="text-[#57606a] hover:text-[#1f2328] focus-visible:outline-none"
              onClick={() => setShowPalette(false)}
              aria-label="Close palette"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-3">
            <p className="text-xs text-[#57606a] font-medium mb-3 hidden sm:block">Questions</p>
            <QuestionPalette
              items={paletteItems}
              onSelect={(idx) => {
                goTo(idx);
                setShowPalette(false);
                if (!oneQuestionMode) {
                  const el = document.getElementById(`question-${idx}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            />
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
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Exam
            </Button>
          </div>
        </aside>
      </div>

      {/* ---- Footer status bar ---- */}
      <footer className="bg-white border-t border-[#e5e7eb] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#57606a]">
          <SecurityIndicator status={session.securityStatus} />
          <span className="hidden sm:inline">Raw video is never uploaded — analysis is local only.</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
      </footer>

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
              { label: "Answered", value: `${answeredCount}/${questions.length}`, color: "text-[#166534]" },
              { label: "Unanswered", value: `${questions.length - answeredCount}`, color: "text-[#991b1b]" },
            ].map((d) => (
              <div key={d.label} className="p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] text-center">
                <p className="text-xs text-[#57606a]">{d.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${d.color}`}>{d.value}</p>
              </div>
            ))}
          </div>

          {questions.length - answeredCount > 0 && (
            <div className="p-3 rounded-lg bg-[#fef9c3] border border-[#fde68a] text-xs text-[#854d0e]">
              You have {questions.length - answeredCount} unanswered question(s). 
              Are you sure you want to submit?
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
