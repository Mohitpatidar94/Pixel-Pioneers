// ============================================================
// ExamShield — Proctoring Engine Types (Member 2)
// ============================================================

import type { ExamSecurityEvent } from "./index";

// ------ Camera / Processing State ------

export type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "blocked"
  | "unavailable"
  | "error";

export type ProcessingStatus =
  | "LOCAL"      // AI running, all local
  | "PROCESSING" // Frame being analysed
  | "PAUSED"     // Temporarily paused
  | "CAMERA_ERROR"; // No camera / blocked

// ------ Gaze ------

export type GazeDirection =
  | "center"
  | "left"
  | "right"
  | "up"
  | "down"
  | "unknown";

export interface GazeState {
  direction: GazeDirection;
  confidence: number;
  durationMs: number; // how long in this direction
  deviationAngleX: number; // degrees horizontal
  deviationAngleY: number; // degrees vertical
}

// ------ Head Pose ------

export interface HeadPose {
  yaw: number;   // left(-) / right(+)  degrees
  pitch: number; // up(-) / down(+)     degrees
  roll: number;  // tilt                degrees
  confidence: number;
}

// ------ Face Analysis Frame ------

export interface FaceAnalysisFrame {
  timestamp: number;
  faceCount: number;
  gazeState: GazeState;
  headPose: HeadPose;
  lightingScore: number; // 0–1, 1 = good lighting
  confidence: number;    // overall frame confidence
}

// ------ Integrity Pattern (Temporal Correlation) ------

export interface IntegrityPattern {
  patternId: string;
  startTime: string;   // ISO 8601
  endTime: string;
  signals: string[];   // event type names
  confidence: number;  // 0–1
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  explanation: string; // plain-language description for evaluator
}

// ------ Integrity Fingerprint Payload ------
// (Member 3 will sign this with Web Crypto)

export interface IntegrityPayload {
  sessionId: string;
  examId: string;
  studentName: string;
  startedAt: string;
  submittedAt: string;
  eventCount: number;
  patterns: IntegrityPattern[];
  integritySignalScore: number; // 0–100
  riskLabel: "CLEAR" | "LOW" | "MEDIUM" | "HIGH";
  generatedAt: string;
  // NOTE: NO webcam frames, NO video, NO raw landmarks
}

// ------ Integrity Signal Score Bands ------

export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  description: string;
  color: string; // CSS hex
}

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0,  max: 20,  label: "Normal",                   description: "No significant anomalies detected.",            color: "#166534" },
  { min: 21, max: 40,  label: "Minor Anomalies",          description: "Minor isolated signals noted.",                 color: "#3b82d4" },
  { min: 41, max: 60,  label: "Attention Warning",        description: "Repeated attention-related signals observed.",  color: "#854d0e" },
  { min: 61, max: 80,  label: "Correlated Signals",       description: "Multiple correlated signals in sequence.",      color: "#9a3412" },
  { min: 81, max: 100, label: "High-Confidence Event",    description: "High-confidence integrity signal cluster.",     color: "#991b1b" },
];

export function getScoreBand(score: number): ScoreBand {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[0];
}

// ------ Proctor Engine Public API ------
// (What ProctoringEngine exposes to the rest of the app)

export interface ProctoringEngineAPI {
  start(sessionId: string): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  getLatestFrame(): FaceAnalysisFrame | null;
  getCameraStatus(): CameraStatus;
  getProcessingStatus(): ProcessingStatus;
  // Demo / simulation
  simulateEvent(type: string): void;
}

// ------ Debug Panel Data ------

export interface DebugSnapshot {
  cameraStatus: CameraStatus;
  processingStatus: ProcessingStatus;
  faceCount: number;
  fps: number;
  gazeState: GazeState | null;
  headPose: HeadPose | null;
  lightingScore: number;
  integritySignalScore: number;
  recentEvents: ExamSecurityEvent[];
}
