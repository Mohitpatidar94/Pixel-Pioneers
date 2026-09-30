// ============================================================
// ExamShield — useProctoringEngine React Hook
// ============================================================
// Manages the full lifecycle of the local proctoring engine
// within a React component. Handles:
//   - Engine start / stop tied to component lifecycle
//   - Browser event monitor start / stop
//   - Live integrity score recomputation on each new event
//   - Debug panel toggle (Ctrl+Shift+D)
//   - ProcessingStatus → SecurityStatus bridge for the UI
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { localProctoringEngine } from "../lib/LocalProctoringEngine";
import { browserEventMonitor } from "../lib/BrowserEventMonitor";
import { securityEventBus } from "../lib/securityEventBus";
import {
  integrityFingerprintEngine,
  computeIntegritySignalScore,
} from "../lib/IntegrityFingerprintEngine";
import type { ProcessingStatus, FaceAnalysisFrame } from "../types/proctoring";
import type { SecurityStatus } from "../types";

interface UseProctoringEngineOptions {
  sessionId: string;
  onSecurityStatusChange?: (s: SecurityStatus) => void;
}

interface ProctoringState {
  processingStatus: ProcessingStatus;
  latestFrame: FaceAnalysisFrame | null;
  integrityScore: number;
  eventCount: number;
  debugVisible: boolean;
  toggleDebug: () => void;
}

export function useProctoringEngine({
  sessionId,
  onSecurityStatusChange,
}: UseProctoringEngineOptions): ProctoringState {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("LOCAL");
  const [latestFrame, setLatestFrame] = useState<FaceAnalysisFrame | null>(null);
  const [integrityScore, setIntegrityScore] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [debugVisible, setDebugVisible] = useState(false);
  const securityStatusRef = useRef<SecurityStatus>("CHECKING");

  const toggleDebug = useCallback(() => setDebugVisible((v) => !v), []);

  // Debug panel keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDebugVisible((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Bridge processing status → security status for the exam header indicator
  useEffect(() => {
    const unsubState = localProctoringEngine.onStateChange((s) => {
      setProcessingStatus(s);
      if (s === "CAMERA_ERROR") {
        onSecurityStatusChange?.("OFFLINE");
      } else if (s === "PAUSED") {
        onSecurityStatusChange?.("CHECKING");
      }
    });
    const unsubFrame = localProctoringEngine.onFrame((f) => {
      setLatestFrame(f);
    });
    return () => {
      unsubState();
      unsubFrame();
    };
  }, [onSecurityStatusChange]);

  // Subscribe to security events — recompute score on each new event
  useEffect(() => {
    const unsub = securityEventBus.subscribe(() => {
      const all = securityEventBus.getEvents(sessionId);
      setEventCount(all.length);
      const patterns = integrityFingerprintEngine.analyseSession(all);
      const score = computeIntegritySignalScore(all, patterns);
      setIntegrityScore(score);

      // Escalate security status based on score
      const newStatus: SecurityStatus =
        score >= 61 ? "WARNING" :
        score >= 41 ? "WARNING" :
        "SECURE";

      if (newStatus !== securityStatusRef.current) {
        securityStatusRef.current = newStatus;
        onSecurityStatusChange?.(newStatus);
      }
    });
    return unsub;
  }, [sessionId, onSecurityStatusChange]);

  // Start browser event monitor
  useEffect(() => {
    browserEventMonitor.start({
      sessionId,
      onSecurityStatusChange: (s) => {
        securityStatusRef.current = s;
        onSecurityStatusChange?.(s);
      },
    });
    return () => browserEventMonitor.stop();
  }, [sessionId, onSecurityStatusChange]);

  return {
    processingStatus,
    latestFrame,
    integrityScore,
    eventCount,
    debugVisible,
    toggleDebug,
  };
}
