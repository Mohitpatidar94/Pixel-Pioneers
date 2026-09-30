// ============================================================
// ExamShield — Core TypeScript Interfaces
// Member 2 (AI Proctoring Engine) should import from this file
// ============================================================

// ------ Security Events (Member 2 integration surface) ------

export type SecurityEventType =
  | "FACE_NOT_DETECTED"
  | "FACE_PRESENT"
  | "MULTIPLE_FACES"
  | "GAZE_DEVIATION"
  | "HEAD_POSE_DEVIATION"
  | "TAB_SWITCH"
  | "FULLSCREEN_EXIT"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "RIGHT_CLICK_ATTEMPT"
  | "WINDOW_BLUR"
  | "KEYBOARD_SHORTCUT"
  | "CAMERA_BLOCKED"
  | "LOW_VISIBILITY"
  | "SYSTEM_CHECK_FAILED"
  | "SESSION_STARTED"
  | "SESSION_SUBMITTED";

export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH";

export interface ExamSecurityEvent {
  id: string;
  sessionId: string;
  timestamp: string; // ISO 8601
  type: SecurityEventType;
  confidence?: number; // 0.0 – 1.0 (populated by Member 2 AI engine)
  severity?: EventSeverity;
  metadata?: Record<string, unknown>;
}

// ------ Exam Session ------

export type SessionStatus =
  | "pending"
  | "system_check"
  | "privacy_ack"
  | "ready"
  | "active"
  | "submitted"
  | "expired";

export type SecurityStatus = "SECURE" | "CHECKING" | "WARNING" | "OFFLINE";

export interface ExamSession {
  sessionId: string;
  examId: string;
  candidateId: string;
  studentName: string;
  startedAt: string | null;
  submittedAt: string | null;
  status: SessionStatus;
  securityStatus: SecurityStatus;
  events: ExamSecurityEvent[];
}

// ------ Exam & Questions ------

export type QuestionType =
  | "mcq"
  | "multiple_select"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank";

export interface MCQOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  options?: MCQOption[]; // MCQ / multiple_select / true_false
  correctAnswer?: string | string[]; // not shown to student
  points: number;
}

export interface ExamSettings {
  duration: number; // minutes
  oneQuestionMode: boolean;
  allowBackNavigation: boolean;
  securityLevel: "LOW" | "MEDIUM" | "HIGH";
  autoSubmitOnExpiry: boolean;
}

export interface Exam {
  id: string;
  key: string; // e.g. "EXAM-2026-001"
  title: string;
  subject: string;
  instructions: string;
  questions: Question[];
  settings: ExamSettings;
  startsAt?: string; // ISO — optional scheduling
  expiresAt?: string;
}

// ------ Student Answers ------

export type AnswerValue = string | string[];

export interface StudentAnswer {
  questionId: string;
  value: AnswerValue;
  answeredAt: string;
}

// ------ System Check ------

export type CheckStatus = "idle" | "checking" | "success" | "warning" | "failed";

export interface SystemCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  message?: string;
}

// ------ Integrity Summary (for Member 3 integration) ------

export interface IntegritySummary {
  sessionId: string;
  examId: string;
  studentName: string;
  submittedAt: string;
  totalEvents: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  infoCount: number;
  overallRisk: "CLEAR" | "LOW" | "MEDIUM" | "HIGH";
  events: ExamSecurityEvent[];
}
