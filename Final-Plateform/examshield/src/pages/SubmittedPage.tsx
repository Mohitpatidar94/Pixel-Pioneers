// ExamShield — Exam Submitted + Integrity Summary Page
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useSession } from "../context/SessionContext";
import { securityEventBus } from "../lib/securityEventBus";
import type { IntegritySummary, EventSeverity } from "../types";

function buildSummary(
  sessionId: string,
  examId: string,
  studentName: string,
  submittedAt: string
): IntegritySummary {
  const events = securityEventBus.getEvents(sessionId);

  const count = (sev: EventSeverity) => events.filter((e) => e.severity === sev).length;
  const high = count("HIGH");
  const medium = count("MEDIUM");
  const low = count("LOW");
  const info = count("INFO");

  let risk: IntegritySummary["overallRisk"] = "CLEAR";
  if (high > 0) risk = "HIGH";
  else if (medium >= 3) risk = "HIGH";
  else if (medium >= 1) risk = "MEDIUM";
  else if (low >= 5) risk = "MEDIUM";
  else if (low >= 1) risk = "LOW";

  return {
    sessionId,
    examId,
    studentName,
    submittedAt,
    totalEvents: events.length,
    highSeverityCount: high,
    mediumSeverityCount: medium,
    lowSeverityCount: low,
    infoCount: info,
    overallRisk: risk,
    events,
  };
}

const riskBadgeVariant: Record<IntegritySummary["overallRisk"], "success" | "info" | "warning" | "error"> = {
  CLEAR:  "success",
  LOW:    "info",
  MEDIUM: "warning",
  HIGH:   "error",
};

const riskLabel: Record<IntegritySummary["overallRisk"], string> = {
  CLEAR:  "Clear — No significant events",
  LOW:    "Low — Minor events noted",
  MEDIUM: "Medium — Review recommended",
  HIGH:   "High — Evaluator review required",
};

export function SubmittedPage() {
  const navigate = useNavigate();
  const { state, reset } = useSession();

  const { session, exam } = state;

  // Guard
  if (!session || !exam || session.status !== "submitted") {
    navigate("/enter-exam", { replace: true });
    return null;
  }

  const summary = useMemo(
    () =>
      buildSummary(
        session.sessionId,
        session.examId,
        session.studentName,
        session.submittedAt ?? new Date().toISOString()
      ),
    [session.sessionId, session.examId, session.studentName, session.submittedAt]
  );

  const submissionId = `ES-${session.sessionId.slice(0, 8).toUpperCase()}`;
  const timestamp = session.submittedAt
    ? new Date(session.submittedAt).toLocaleString()
    : "—";

  function handleStartNew() {
    reset();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center">
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* Success card */}
          <Card padding="lg">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#dcfce7] border border-[#86efac] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1f2328]">Exam Submitted Successfully</h1>
                <p className="text-sm text-[#57606a] mt-1">
                  Your answers have been recorded and your exam evidence has been securely summarised.
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mt-2">
                {[
                  { label: "Submission ID", value: submissionId },
                  { label: "Exam", value: exam.title },
                  { label: "Candidate", value: session.studentName },
                  { label: "Submitted At", value: timestamp },
                ].map((d) => (
                  <div key={d.label} className="p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] text-left">
                    <p className="text-xs text-[#57606a]">{d.label}</p>
                    <p className="text-sm font-semibold text-[#1f2328] mt-0.5 break-all">{d.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] w-full">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82d4" strokeWidth="2" className="shrink-0" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-xs text-[#57606a]">
                  Your exam evidence has been securely summarised. Raw video was never uploaded.
                </span>
              </div>
            </div>
          </Card>

          {/* Integrity Summary */}
          <Card padding="lg">
            <h2 className="text-base font-semibold text-[#1f2328] mb-4">Integrity Summary</h2>

            {/* Overall risk */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] mb-5">
              <div>
                <p className="text-xs text-[#57606a]">Overall Risk Level</p>
                <p className="text-sm font-semibold text-[#1f2328] mt-0.5">
                  {riskLabel[summary.overallRisk]}
                </p>
              </div>
              <Badge variant={riskBadgeVariant[summary.overallRisk]}>
                {summary.overallRisk}
              </Badge>
            </div>

            {/* Event counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "High", count: summary.highSeverityCount, color: "text-[#991b1b]", bg: "bg-[#fee2e2]" },
                { label: "Medium", count: summary.mediumSeverityCount, color: "text-[#854d0e]", bg: "bg-[#fef9c3]" },
                { label: "Low", count: summary.lowSeverityCount, color: "text-[#1e40af]", bg: "bg-[#dbeafe]" },
                { label: "Info", count: summary.infoCount, color: "text-[#166534]", bg: "bg-[#dcfce7]" },
              ].map((d) => (
                <div key={d.label} className={`p-3 rounded-lg border border-[#e5e7eb] ${d.bg} text-center`}>
                  <p className="text-xs text-[#57606a]">{d.label} Severity</p>
                  <p className={`text-2xl font-bold mt-1 ${d.color}`}>{d.count}</p>
                </div>
              ))}
            </div>

            {/* Event list (if any non-info events) */}
            {summary.events.filter((e) => e.severity !== "INFO").length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-[#57606a] mb-1">Security Events</p>
                <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {summary.events
                    .filter((e) => e.severity !== "INFO")
                    .map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] text-xs"
                      >
                        <Badge
                          variant={
                            e.severity === "HIGH"
                              ? "error"
                              : e.severity === "MEDIUM"
                              ? "warning"
                              : "info"
                          }
                        >
                          {e.severity}
                        </Badge>
                        <span className="text-[#1f2328] font-medium">
                          {formatEventType(e.type)}
                        </span>
                        <span className="text-[#57606a] ml-auto">
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#dcfce7] border border-[#86efac] text-xs text-[#166534]">
                No security events recorded during this session.
              </div>
            )}

            {/* Integration note */}
            <div className="mt-4 p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb] text-xs text-[#57606a]">
              <strong>Note:</strong> This summary will be cryptographically signed and verifiable 
              by your evaluator (digital signature module — Member 3 integration).
            </div>
          </Card>

          <div className="flex justify-center">
            <Button variant="secondary" onClick={handleStartNew}>
              Return to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatEventType(type: string): string {
  return type
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}
