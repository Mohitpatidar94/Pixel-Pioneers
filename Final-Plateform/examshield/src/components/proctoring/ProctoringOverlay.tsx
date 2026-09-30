// ExamShield — ProctoringOverlay
// Renders the local webcam feed + privacy indicators.
// Raw video never leaves this component.
import React, { useRef, useEffect, useState, useCallback } from "react";
import { localProctoringEngine } from "../../lib/LocalProctoringEngine";
import { PrivacyStatus } from "./PrivacyStatus";
import type { ProcessingStatus, FaceAnalysisFrame } from "../../types/proctoring";

interface ProctoringOverlayProps {
  sessionId: string;
  /** Called whenever a new analysis frame arrives */
  onFrame?: (frame: FaceAnalysisFrame) => void;
  /** Called when processing status changes */
  onStatusChange?: (status: ProcessingStatus) => void;
  className?: string;
}

export function ProctoringOverlay({
  sessionId,
  onFrame,
  onStatusChange,
  className = "",
}: ProctoringOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ProcessingStatus>("LOCAL");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [engineStarted, setEngineStarted] = useState(false);

  const handleStatusChange = useCallback(
    (s: ProcessingStatus) => {
      setStatus(s);
      onStatusChange?.(s);
    },
    [onStatusChange]
  );

  useEffect(() => {
    if (!videoRef.current || engineStarted) return;
    setEngineStarted(true);

    // Subscribe to frame updates and status changes
    const unsubFrame  = localProctoringEngine.onFrame((f) => onFrame?.(f));
    const unsubStatus = localProctoringEngine.onStateChange(handleStatusChange);

    localProctoringEngine
      .start(sessionId, videoRef.current)
      .then(() => setStatus("LOCAL"))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Camera unavailable";
        setCameraError(msg);
        setStatus("CAMERA_ERROR");
        onStatusChange?.("CAMERA_ERROR");
      });

    return () => {
      unsubFrame();
      unsubStatus();
      localProctoringEngine.stop();
    };
  }, [sessionId, engineStarted, onFrame, handleStatusChange, onStatusChange]);

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      {/* Camera feed — local only, never uploaded */}
      <div className="relative rounded-lg overflow-hidden bg-[#1f2328] aspect-video w-full max-w-[240px]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          aria-label="Local webcam feed — not uploaded"
        />

        {/* Overlay: face count indicator */}
        <FaceCountBadge sessionId={sessionId} />

        {/* Camera error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2 text-[#fca5a5]" aria-hidden="true">
              <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <p className="text-xs font-medium text-[#fca5a5]">Camera unavailable</p>
            <p className="text-xs text-white/60 mt-1">{cameraError}</p>
          </div>
        )}

        {/* Privacy badge on video */}
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[10px] font-bold text-white bg-black/60 rounded px-1.5 py-0.5 tracking-wide">
            LOCAL ONLY
          </span>
        </div>
      </div>

      {/* Status indicators below camera */}
      <PrivacyStatus status={status} compact />
    </div>
  );
}

// ---- Face count badge (subscribes to engine frames) ----

function FaceCountBadge({ sessionId: _sessionId }: { sessionId: string }) {
  const [faceCount, setFaceCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = localProctoringEngine.onFrame((f) => {
      setFaceCount(f.faceCount);
    });
    return unsub;
  }, []);

  if (faceCount === null) return null;

  const color =
    faceCount === 0 ? "bg-[#dc2626]" :
    faceCount === 1 ? "bg-[#22c55e]" :
                      "bg-[#f97316]";

  return (
    <div
      className={`absolute bottom-1.5 right-1.5 ${color} rounded text-white text-[10px] font-bold px-1.5 py-0.5`}
      aria-label={`${faceCount} face${faceCount !== 1 ? "s" : ""} detected`}
    >
      {faceCount === 0 ? "No face" : faceCount === 1 ? "✓ Face" : `${faceCount} faces`}
    </div>
  );
}
