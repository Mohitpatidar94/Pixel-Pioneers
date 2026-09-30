// ============================================================
// ExamShield — Security Event Bus
// ============================================================
// Member 2 (AI Proctoring Engine) can import this module and
// call addEvent() to push structured proctoring events.
// The exam session and integrity report will consume them via
// getEvents() / subscribe().
// ============================================================

import { v4 as uuidv4 } from "uuid";
import type { ExamSecurityEvent, SecurityEventType, EventSeverity } from "../types";

type Listener = (event: ExamSecurityEvent) => void;

class SecurityEventBus {
  private events: ExamSecurityEvent[] = [];
  private listeners: Set<Listener> = new Set();

  /** Add a structured security event. Returns the stored event. */
  addEvent(
    sessionId: string,
    type: SecurityEventType,
    options?: {
      confidence?: number;
      severity?: EventSeverity;
      metadata?: Record<string, unknown>;
    }
  ): ExamSecurityEvent {
    const event: ExamSecurityEvent = {
      id: uuidv4(),
      sessionId,
      timestamp: new Date().toISOString(),
      type,
      confidence: options?.confidence,
      severity: options?.severity ?? "INFO",
      metadata: options?.metadata,
    };
    this.events.push(event);
    this.listeners.forEach((fn) => fn(event));
    return event;
  }

  /** Return a snapshot of all events (optionally filtered by sessionId). */
  getEvents(sessionId?: string): ExamSecurityEvent[] {
    if (sessionId) return this.events.filter((e) => e.sessionId === sessionId);
    return [...this.events];
  }

  /** Clear all events (or only events for a specific session). */
  clearEvents(sessionId?: string): void {
    if (sessionId) {
      this.events = this.events.filter((e) => e.sessionId !== sessionId);
    } else {
      this.events = [];
    }
  }

  /** Subscribe to new events. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Singleton — import this instance everywhere
export const securityEventBus = new SecurityEventBus();
