// ExamShield — Demo Simulation Panel
// Allows judges to trigger proctoring events manually
// when webcam conditions are not ideal.
// Clearly labelled DEMO SIMULATION — never mixed with real events
// without labelling.
import React, { useState } from "react";
import { localProctoringEngine } from "../../lib/LocalProctoringEngine";
import { browserEventMonitor } from "../../lib/BrowserEventMonitor";
import { securityEventBus } from "../../lib/securityEventBus";
import type { SecurityEventType } from "../../types";

interface DemoSimulatorProps {
  sessionId: string;
  className?: string;
}

interface SimButton {
  label: string;
  type: SecurityEventType;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  metadata?: Record<string, unknown>;
}

const SIM_BUTTONS: SimButton[] = [
  {
    label: "Tab Switch",
    type: "TAB_SWITCH",
    severity: "MEDIUM",
    confidence: 0.95,
    metadata: { simulated: true, note: "Demo simulation" },
  },
  {
    label: "Gaze Deviation",
    type: "GAZE_DEVIATION",
    severity: "MEDIUM",
    confidence: 0.82,
    metadata: { direction: "right", durationMs: 3200, deviationAngleX: 28, simulated: true },
  },
  {
    label: "Multiple Faces",
    type: "MULTIPLE_FACES",
    severity: "HIGH",
    confidence: 0.91,
    metadata: { count: 2, simulated: true },
  },
  {
    label: "Fullscreen Exit",
    type: "FULLSCREEN_EXIT",
    severity: "MEDIUM",
    confidence: 1.0,
    metadata: { simulated: true },
  },
  {
    label: "Face Not Detected",
    type: "FACE_NOT_DETECTED",
    severity: "MEDIUM",
    confidence: 0.88,
    metadata: { absentDurationMs: 4000, simulated: true },
  },
  {
    label: "Head Pose Deviation",
    type: "HEAD_POSE_DEVIATION",
    severity: "MEDIUM",
    confidence: 0.78,
    metadata: { yaw: 32, pitch: 8, roll: 3, durationMs: 2500, simulated: true },
  },
  {
    label: "Copy Attempt",
    type: "COPY_ATTEMPT",
    severity: "LOW",
    confidence: 1.0,
    metadata: { simulated: true },
  },
  {
    label: "Camera Blocked",
    type: "CAMERA_BLOCKED",
    severity: "HIGH",
    confidence: 1.0,
    metadata: { reason: "simulated_block" },
  },
];

export function DemoSimulator({ sessionId, className = "" }: DemoSimulatorProps) {
  const [log, setLog] = useState<{ label: string; ts: string }[]>([]);
  const [open, setOpen] = useState(false);

  function simulate(btn: SimButton) {
    securityEventBus.addEvent(sessionId, btn.type, {
      severity: btn.severity,
      confidence: btn.confidence,
      metadata: btn.metadata,
    });
    setLog((prev) => [
      { label: btn.label, ts: new Date().toLocaleTimeString() },
      ...prev.slice(0, 7),
    ]);
  }

  return (
    <div className={`${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#854d0e] bg-[#fef9c3] border border-[#fde68a] rounded-lg px-3 py-1.5 hover:bg-[#fef3c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
        aria-expanded={open}
        aria-label="Toggle demo simulation panel"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        DEMO SIMULATION
      </button>

      {open && (
        <div className="mt-2 bg-white border border-[#fde68a] rounded-xl p-4 shadow-md">
          {/* Warning badge */}
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-[#fef9c3] border border-[#fde68a]">
            <span className="text-[10px] font-bold text-[#854d0e] tracking-widest">
              ⚠ DEMO SIMULATION — events are labelled as simulated
            </span>
          </div>

          {/* Simulation buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {SIM_BUTTONS.map((btn) => (
              <button
                key={btn.type}
                onClick={() => simulate(btn)}
                className="text-xs text-left px-2.5 py-2 rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] hover:bg-[#eff6ff] hover:border-[#3b82d4] text-[#1f2328] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82d4]"
              >
                <SeverityDot severity={btn.severity} />
                {" "}{btn.label}
              </button>
            ))}
          </div>

          {/* Event log */}
          {log.length > 0 && (
            <div className="border-t border-[#e5e7eb] pt-2">
              <p className="text-[10px] text-[#57606a] font-bold uppercase tracking-wide mb-1">
                Simulation Log
              </p>
              {log.map((entry, i) => (
                <div key={i} className="flex justify-between text-xs text-[#57606a]">
                  <span>{entry.label}</span>
                  <span className="text-[#9ca3af]">{entry.ts}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    HIGH: "#dc2626", MEDIUM: "#f59e0b", LOW: "#3b82d4", INFO: "#22c55e",
  };
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full mr-0.5 align-middle"
      style={{ backgroundColor: colors[severity] ?? "#9ca3af" }}
    />
  );
}
