// ExamShield — Proctor Debug Panel (Dev Mode Only)
// Never shown in production; controlled by VITE_DEBUG_PANEL env var
// or a keyboard shortcut (Ctrl+Shift+D)
import React, { useState, useEffect } from "react";
import { localProctoringEngine } from "../../lib/LocalProctoringEngine";
import { securityEventBus } from "../../lib/securityEventBus";
import { computeIntegritySignalScore, scoreToRiskLabel } from "../../lib/IntegrityFingerprintEngine";
import { getScoreBand } from "../../types/proctoring";
import type { FaceAnalysisFrame } from "../../types/proctoring";
import type { ExamSecurityEvent } from "../../types";

interface ProctorDebugPanelProps {
  sessionId: string;
  visible: boolean;
  onClose: () => void;
}

export function ProctorDebugPanel({ sessionId, visible, onClose }: ProctorDebugPanelProps) {
  const [frame, setFrame] = useState<FaceAnalysisFrame | null>(null);
  const [fps, setFps] = useState(0);
  const [events, setEvents] = useState<ExamSecurityEvent[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const unsubFrame = localProctoringEngine.onFrame((f) => {
      setFrame(f);
      setFps(localProctoringEngine.getFps());
    });

    const unsubEvents = securityEventBus.subscribe(() => {
      const all = securityEventBus.getEvents(sessionId);
      setEvents([...all].reverse().slice(0, 12));
      // recompute score (lightweight — no full pattern analysis)
      const patterns: import("../../types/proctoring").IntegrityPattern[] = [];
      setScore(computeIntegritySignalScore(all, patterns));
    });

    return () => {
      unsubFrame();
      unsubEvents();
    };
  }, [visible, sessionId]);

  if (!visible) return null;

  const cameraStatus = localProctoringEngine.getCameraStatus();
  const procStatus = localProctoringEngine.getProcessingStatus();
  const band = getScoreBand(score);
  const riskLabel = scoreToRiskLabel(score);

  return (
    <div
      className="fixed bottom-4 left-4 z-50 bg-[#1f2328] text-white rounded-xl border border-[#374151] shadow-2xl w-80 font-mono text-xs overflow-hidden"
      role="complementary"
      aria-label="Proctor debug panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#374151] bg-[#111827]">
        <span className="text-[10px] font-bold tracking-widest text-[#f59e0b]">
          ⚙ PROCTOR DEBUG
        </span>
        <button
          onClick={onClose}
          className="text-[#9ca3af] hover:text-white focus-visible:outline-none"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
        {/* Camera + Engine Status */}
        <Section title="Engine Status">
          <Row label="Camera"  value={cameraStatus} color={cameraStatus === "active" ? "#22c55e" : "#f87171"} />
          <Row label="AI Status" value={procStatus} color={procStatus === "LOCAL" ? "#22c55e" : "#f59e0b"} />
          <Row label="FPS" value={`${fps}`} />
        </Section>

        {/* Face Analysis */}
        {frame && (
          <Section title="Face Analysis">
            <Row label="Faces"       value={`${frame.faceCount}`} color={frame.faceCount === 1 ? "#22c55e" : frame.faceCount === 0 ? "#f87171" : "#f97316"} />
            <Row label="Confidence"  value={pct(frame.confidence)} />
            <Row label="Lighting"    value={pct(frame.lightingScore)} color={frame.lightingScore < 0.25 ? "#f87171" : "#22c55e"} />
          </Section>
        )}

        {/* Gaze */}
        {frame?.gazeState && (
          <Section title="Gaze">
            <Row label="Direction"   value={frame.gazeState.direction} color={frame.gazeState.direction !== "center" ? "#f59e0b" : "#22c55e"} />
            <Row label="Confidence"  value={pct(frame.gazeState.confidence)} />
            <Row label="Angle X"     value={`${Math.round(frame.gazeState.deviationAngleX)}°`} />
            <Row label="Angle Y"     value={`${Math.round(frame.gazeState.deviationAngleY)}°`} />
          </Section>
        )}

        {/* Head Pose */}
        {frame?.headPose && (
          <Section title="Head Pose">
            <Row label="Yaw"   value={`${Math.round(frame.headPose.yaw)}°`} color={Math.abs(frame.headPose.yaw) > 25 ? "#f59e0b" : "#22c55e"} />
            <Row label="Pitch" value={`${Math.round(frame.headPose.pitch)}°`} color={Math.abs(frame.headPose.pitch) > 20 ? "#f59e0b" : "#22c55e"} />
            <Row label="Roll"  value={`${Math.round(frame.headPose.roll)}°`} />
          </Section>
        )}

        {/* Integrity Score */}
        <Section title="Integrity Signal Score">
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-[#374151] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${score}%`, backgroundColor: band.color }}
              />
            </div>
            <span className="font-bold" style={{ color: band.color }}>{score}</span>
          </div>
          <Row label="Band"  value={band.label}  color={band.color} />
          <Row label="Risk"  value={riskLabel}    color={band.color} />
        </Section>

        {/* Recent Events */}
        <Section title={`Recent Events (${events.length})`}>
          {events.length === 0 ? (
            <span className="text-[#6b7280]">No events yet</span>
          ) : (
            <div className="flex flex-col gap-1 mt-1">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-1.5">
                  <SeverityDot severity={e.severity ?? "INFO"} />
                  <span className="text-[#e5e7eb] truncate">{e.type}</span>
                  <span className="text-[#6b7280] ml-auto shrink-0">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-widest text-[#6b7280] uppercase">{title}</span>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  color = "#e5e7eb",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[#9ca3af]">{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    HIGH: "#f87171", MEDIUM: "#f59e0b", LOW: "#60a5fa", INFO: "#4ade80",
  };
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: colors[severity] ?? "#9ca3af" }}
    />
  );
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
