// ExamShield — Pre-Exam System Check Page
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useSession } from "../context/SessionContext";
import type { SystemCheckItem, CheckStatus } from "../types";

// ------ Helpers ------

function statusBadge(s: CheckStatus) {
  switch (s) {
    case "checking": return <Badge variant="info">Checking…</Badge>;
    case "success":  return <Badge variant="success">✓ Ready</Badge>;
    case "warning":  return <Badge variant="warning">⚠ Warning</Badge>;
    case "failed":   return <Badge variant="error">✗ Failed</Badge>;
    default:         return <Badge variant="default">Idle</Badge>;
  }
}

function statusIcon(s: CheckStatus) {
  switch (s) {
    case "checking":
      return (
        <svg className="animate-spin text-[#3b82d4]" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      );
    case "success":
      return <svg className="text-[#22c55e]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>;
    case "warning":
      return <svg className="text-[#f59e0b]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "failed":
      return <svg className="text-[#dc2626]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    default:
      return <span className="w-4.5 h-4.5 rounded-full border-2 border-[#e5e7eb] inline-block" />;
  }
}

// ------ Check runners ------

async function runBrowserCheck(): Promise<{ status: CheckStatus; message: string }> {
  const ua = navigator.userAgent;
  const isSupported = /chrome|firefox|safari|edge/i.test(ua);
  return isSupported
    ? { status: "success", message: "Browser is supported." }
    : { status: "warning", message: "Unrecognised browser — some features may not work." };
}

async function runCameraCheck(): Promise<{ status: CheckStatus; message: string }> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((d) => d.kind === "videoinput");
    if (!hasCamera) return { status: "failed", message: "No camera found." };
    // Try to actually get the stream to confirm permissions
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return { status: "success", message: "Camera detected and accessible." };
  } catch {
    return { status: "warning", message: "Camera permission not granted — please allow access." };
  }
}

async function runMicrophoneCheck(): Promise<{ status: CheckStatus; message: string }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { status: "success", message: "Microphone accessible." };
  } catch {
    return { status: "warning", message: "Microphone not accessible — may be required." };
  }
}

async function runFullscreenCheck(): Promise<{ status: CheckStatus; message: string }> {
  const supported = document.fullscreenEnabled ?? false;
  return supported
    ? { status: "success", message: "Fullscreen mode supported." }
    : { status: "warning", message: "Fullscreen not supported by this browser." };
}

async function runAICheck(): Promise<{ status: CheckStatus; message: string }> {
  // Stub — Member 2 will replace with actual MediaPipe / TF.js readiness check
  return { status: "success", message: "Local AI engine ready (integration point for Member 2)." };
}

async function runStorageCheck(): Promise<{ status: CheckStatus; message: string }> {
  try {
    localStorage.setItem("__examshield_test", "1");
    localStorage.removeItem("__examshield_test");
    return { status: "success", message: "Local storage available." };
  } catch {
    return { status: "failed", message: "Local storage unavailable." };
  }
}

async function runNetworkCheck(): Promise<{ status: CheckStatus; message: string }> {
  return navigator.onLine
    ? { status: "success", message: "Network connection present." }
    : { status: "warning", message: "Offline — exam will still run locally." };
}

const CHECKS: { id: string; label: string; run: () => Promise<{ status: CheckStatus; message: string }> }[] = [
  { id: "browser",     label: "Browser supported",  run: runBrowserCheck },
  { id: "camera",      label: "Camera available",    run: runCameraCheck },
  { id: "microphone",  label: "Microphone available",run: runMicrophoneCheck },
  { id: "fullscreen",  label: "Fullscreen supported", run: runFullscreenCheck },
  { id: "ai",          label: "Local AI ready",       run: runAICheck },
  { id: "storage",     label: "Storage available",    run: runStorageCheck },
  { id: "network",     label: "Network status",       run: runNetworkCheck },
];

// ------ Page ------

export function SystemCheckPage() {
  const navigate = useNavigate();
  const { state, setStatus } = useSession();

  const [items, setItems] = useState<SystemCheckItem[]>(
    CHECKS.map((c) => ({ id: c.id, label: c.label, status: "idle" as CheckStatus }))
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  // Guard: redirect if no session
  if (!state.session) {
    navigate("/enter-exam", { replace: true });
    return null;
  }

  const canContinue = done && items.every((i) => i.status !== "failed");

  const runChecks = useCallback(async () => {
    setRunning(true);
    setDone(false);

    // Reset all to checking
    setItems(CHECKS.map((c) => ({ id: c.id, label: c.label, status: "checking" as CheckStatus })));

    for (let i = 0; i < CHECKS.length; i++) {
      const check = CHECKS[i];
      const result = await check.run();
      setItems((prev) =>
        prev.map((item) =>
          item.id === check.id
            ? { ...item, status: result.status, message: result.message }
            : item
        )
      );
      // Small delay between checks for visual feedback
      await new Promise((r) => setTimeout(r, 250));
    }

    setRunning(false);
    setDone(true);
  }, []);

  function handleContinue() {
    setStatus("privacy_ack");
    navigate("/privacy");
  }

  const failedCount = items.filter((i) => i.status === "failed").length;
  const warningCount = items.filter((i) => i.status === "warning").length;

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
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#1f2328]">System Check</h1>
            <p className="text-sm text-[#57606a] mt-1">
              We'll verify your device meets the requirements before starting.
            </p>
            {state.exam && (
              <div className="mt-3 p-3 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] text-sm text-[#1e40af]">
                <strong>{state.exam.title}</strong> — {state.exam.settings.duration} minutes
              </div>
            )}
          </div>

          {/* Check list */}
          <div className="flex flex-col divide-y divide-[#f3f4f6]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3.5">
                <div className="shrink-0 w-5 flex items-center justify-center">
                  {statusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1f2328]">{item.label}</p>
                  {item.message && (
                    <p className="text-xs text-[#57606a] mt-0.5">{item.message}</p>
                  )}
                </div>
                {statusBadge(item.status)}
              </div>
            ))}
          </div>

          {/* Summary */}
          {done && (failedCount > 0 || warningCount > 0) && (
            <div className={`mt-4 p-3 rounded-lg border text-sm ${failedCount > 0 ? "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]" : "bg-[#fef9c3] border-[#fde68a] text-[#854d0e]"}`}>
              {failedCount > 0
                ? `${failedCount} check(s) failed. Please resolve them before continuing.`
                : `${warningCount} warning(s). You may continue but some features may be limited.`}
            </div>
          )}
          {done && failedCount === 0 && warningCount === 0 && (
            <div className="mt-4 p-3 rounded-lg border bg-[#dcfce7] border-[#86efac] text-sm text-[#166534]">
              All checks passed. You are ready to proceed.
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={runChecks}
              loading={running}
              disabled={running}
              fullWidth
            >
              {done ? "Re-run System Check" : "Run System Check"}
            </Button>
            {canContinue && (
              <Button variant="primary" onClick={handleContinue} fullWidth>
                Continue
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
