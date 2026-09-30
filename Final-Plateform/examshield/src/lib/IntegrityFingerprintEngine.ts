// ============================================================
// ExamShield — Integrity Fingerprint Engine
// ============================================================
// Correlates raw security events TEMPORALLY to produce patterns.
//
// Key principle:
//   Events are EVIDENCE, not verdicts.
//   Patterns are explained in plain language.
//   The system NEVER labels a student as "cheating".
//
// Innovation: temporal sliding-window correlation across
// multiple signal types to detect contextual anomaly clusters.
// ============================================================

import { v4 as uuidv4 } from "uuid";
import type { ExamSecurityEvent } from "../types";
import type { IntegrityPattern } from "../types/proctoring";

// ---- Pattern definitions ----
// Each rule describes a combination of signals that together
// form a contextually meaningful integrity pattern.

interface PatternRule {
  name: string;
  signals: string[];           // required signal types
  windowMs: number;            // time window to look within
  minSignals: number;          // min number of matching signals in window
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  minConfidence: number;       // min average confidence of matched events
  explanation: string;
}

const PATTERN_RULES: PatternRule[] = [
  {
    name: "attention-diversion",
    signals: ["GAZE_DEVIATION", "TAB_SWITCH"],
    windowMs: 15_000,
    minSignals: 2,
    severity: "MEDIUM",
    minConfidence: 0.5,
    explanation:
      "Gaze deviation and a tab switch occurred within a short interval, " +
      "suggesting a possible attention diversion from the exam.",
  },
  {
    name: "face-absence-cluster",
    signals: ["FACE_NOT_DETECTED", "HEAD_POSE_DEVIATION"],
    windowMs: 20_000,
    minSignals: 2,
    severity: "MEDIUM",
    minConfidence: 0.6,
    explanation:
      "The candidate's face was not detected while head pose was significantly deviated, " +
      "possibly indicating looking away from the screen.",
  },
  {
    name: "multiple-faces-with-gaze",
    signals: ["MULTIPLE_FACES", "GAZE_DEVIATION"],
    windowMs: 10_000,
    minSignals: 2,
    severity: "HIGH",
    minConfidence: 0.7,
    explanation:
      "Multiple faces detected alongside gaze deviation within the same time window. " +
      "Another person may be present near the candidate.",
  },
  {
    name: "copy-paste-cluster",
    signals: ["COPY_ATTEMPT", "PASTE_ATTEMPT"],
    windowMs: 8_000,
    minSignals: 2,
    severity: "MEDIUM",
    minConfidence: 0.9,
    explanation:
      "Copy and paste actions detected in quick succession during the exam.",
  },
  {
    name: "tab-switch-repeated",
    signals: ["TAB_SWITCH", "WINDOW_BLUR"],
    windowMs: 30_000,
    minSignals: 3,
    severity: "HIGH",
    minConfidence: 0.8,
    explanation:
      "Multiple tab switches and window focus losses occurred in a short period, " +
      "suggesting sustained attention away from the exam window.",
  },
  {
    name: "fullscreen-exit-with-activity",
    signals: ["FULLSCREEN_EXIT", "TAB_SWITCH"],
    windowMs: 15_000,
    minSignals: 2,
    severity: "HIGH",
    minConfidence: 0.85,
    explanation:
      "Fullscreen mode was exited near a tab switch event, indicating possible " +
      "engagement with other windows or applications.",
  },
  {
    name: "environmental-concern",
    signals: ["LOW_VISIBILITY", "FACE_NOT_DETECTED"],
    windowMs: 20_000,
    minSignals: 2,
    severity: "LOW",
    minConfidence: 0.5,
    explanation:
      "Poor lighting and face absence signals co-occurred. " +
      "Camera conditions may be limiting proctoring effectiveness.",
  },
  {
    name: "broad-anomaly-cluster",
    signals: [
      "GAZE_DEVIATION", "HEAD_POSE_DEVIATION",
      "TAB_SWITCH", "MULTIPLE_FACES",
      "COPY_ATTEMPT", "FULLSCREEN_EXIT",
    ],
    windowMs: 60_000,
    minSignals: 4,
    severity: "HIGH",
    minConfidence: 0.6,
    explanation:
      "Multiple independent integrity signals — including visual, navigational, and " +
      "interaction signals — were detected within the same time window. " +
      "This constitutes a broad anomaly cluster requiring evaluator review.",
  },
];

// ---- Engine ----

export class IntegrityFingerprintEngine {
  /**
   * Analyse all events for a session and return detected patterns.
   * Call this at submission time (or periodically for live scoring).
   */
  analyseSession(events: ExamSecurityEvent[]): IntegrityPattern[] {
    const patterns: IntegrityPattern[] = [];

    for (const rule of PATTERN_RULES) {
      const matched = this.findPatterns(events, rule);
      patterns.push(...matched);
    }

    // De-duplicate overlapping patterns (keep highest-severity)
    return this.deduplicate(patterns);
  }

  private findPatterns(events: ExamSecurityEvent[], rule: PatternRule): IntegrityPattern[] {
    const relevant = events.filter((e) =>
      (rule.signals as string[]).includes(e.type as string)
    );
    if (relevant.length < rule.minSignals) return [];

    const results: IntegrityPattern[] = [];
    // Sliding window: for each event, look ahead within windowMs
    for (let i = 0; i < relevant.length; i++) {
      const anchor = new Date(relevant[i].timestamp).getTime();
      const window = relevant.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= anchor && t <= anchor + rule.windowMs;
      });

      // Check that the window contains enough *distinct* signal types
      const distinctTypes = new Set<string>(window.map((e) => e.type as string));
      const requiredTypes = new Set(rule.signals);
      const coveredRequired = [...requiredTypes].filter((s) => distinctTypes.has(s));

      // Need at least 2 distinct required signal types + minSignals total
      if (coveredRequired.length < 2 && rule.signals.length > 1) continue;
      if (window.length < rule.minSignals) continue;

      const avgConfidence =
        window.reduce((s, e) => s + (e.confidence ?? 0.5), 0) / window.length;
      if (avgConfidence < rule.minConfidence) continue;

      const startTime = relevant[i].timestamp;
      const endTime = window[window.length - 1].timestamp;

      results.push({
        patternId: `${rule.name}-${uuidv4().slice(0, 8)}`,
        startTime,
        endTime,
        signals: [...new Set(window.map((e) => e.type))],
        confidence: Math.round(avgConfidence * 100) / 100,
        severity: rule.severity,
        explanation: rule.explanation,
      });

      // Skip ahead past this window to avoid duplicating very similar patterns
      i += window.length - 1;
    }

    return results;
  }

  private deduplicate(patterns: IntegrityPattern[]): IntegrityPattern[] {
    // Remove patterns whose time window is entirely contained within a higher-severity pattern
    const severityRank: Record<string, number> = {
      INFO: 0, LOW: 1, MEDIUM: 2, HIGH: 3,
    };
    return patterns.filter((p, i) => {
      const pStart = new Date(p.startTime).getTime();
      const pEnd   = new Date(p.endTime).getTime();
      return !patterns.some((other, j) => {
        if (i === j) return false;
        const oStart = new Date(other.startTime).getTime();
        const oEnd   = new Date(other.endTime).getTime();
        return (
          oStart <= pStart && oEnd >= pEnd &&
          severityRank[other.severity] > severityRank[p.severity]
        );
      });
    });
  }
}

// Singleton
export const integrityFingerprintEngine = new IntegrityFingerprintEngine();

// ---- Integrity Signal Score ----

/**
 * Produces a 0–100 score from the set of patterns + raw event count.
 * This is an ASSISTIVE SIGNAL, not a cheating verdict.
 */
export function computeIntegritySignalScore(
  events: ExamSecurityEvent[],
  patterns: IntegrityPattern[]
): number {
  let score = 0;

  // Base contribution from raw events (capped to prevent inflation)
  const severityWeights: Record<string, number> = {
    INFO: 0,
    LOW: 1,
    MEDIUM: 3,
    HIGH: 7,
  };
  const rawScore = events.reduce((acc, e) => {
    return acc + (severityWeights[e.severity ?? "INFO"] ?? 0);
  }, 0);
  score += Math.min(40, rawScore); // max 40 from raw events

  // Pattern contribution
  const patternWeights: Record<string, number> = {
    INFO: 0,
    LOW: 5,
    MEDIUM: 15,
    HIGH: 25,
  };
  const patternScore = patterns.reduce((acc, p) => {
    return acc + (patternWeights[p.severity] ?? 0) * p.confidence;
  }, 0);
  score += Math.min(60, patternScore); // max 60 from patterns

  return Math.min(100, Math.round(score));
}

/**
 * Converts a numeric score to a risk label.
 */
export function scoreToRiskLabel(
  score: number
): "CLEAR" | "LOW" | "MEDIUM" | "HIGH" {
  if (score <= 20) return "CLEAR";
  if (score <= 40) return "LOW";
  if (score <= 65) return "MEDIUM";
  return "HIGH";
}
