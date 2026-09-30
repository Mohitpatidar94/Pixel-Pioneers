# ExamShield

> **Private exams. Trusted results.**

AI-powered exam integrity that analyses your exam environment locally on your device.
Raw webcam video never leaves the browser.

---

## Tech Stack

| Technology | Role |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite 8 | Dev server & bundler |
| Tailwind CSS v4 | Styling |
| React Router v7 | Client-side routing |
| Web APIs (getUserMedia, Fullscreen, Visibility) | Browser security events |
| MediaPipe + TensorFlow.js | Local AI proctoring *(Member 2 integration point)* |
| Web Crypto API | Integrity report signing *(Member 3 integration point)* |

---

## Quick Start

```bash
cd Final-Plateform/examshield
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Exam Keys

| Key | Exam | Duration |
|---|---|---|
| `EXAM-2026-001` | Computer Science Fundamentals | 30 min |
| `EXAM-2026-002` | Data Analytics Basics | 25 min |

---

## Student Flow

```
Landing Page
  → Enter Exam Key
  → System Check  (camera, mic, fullscreen, AI, storage, network)
  → Privacy Notice
  → Exam Ready
  → Exam Workspace  (timer, question palette, security indicator)
  → Submit Confirmation Modal
  → Exam Submitted + Integrity Summary
```

---

## Architecture & Integration Points

### Member 2 — AI Proctoring Engine

Import the security event bus and push events:

```ts
import { securityEventBus } from "./src/lib/securityEventBus";
import type { ExamSecurityEvent } from "./src/types";

// Emit from your MediaPipe / TF.js analysis loop:
securityEventBus.addEvent(sessionId, "FACE_NOT_DETECTED", {
  confidence: 0.92,
  severity: "HIGH",
  metadata: { frameTimestamp: Date.now() },
});
```

The `SystemCheckPage` contains a stub `runAICheck()` function — replace it with your actual
MediaPipe/TF.js readiness check.

### Member 3 — Digital Signature + Evaluator Analytics

The `IntegritySummary` type in `src/types/index.ts` is the output shape for signing.
The `SubmittedPage` shows a placeholder note for cryptographic verification.
The `TeacherPage` is the integration point for evaluator analytics.

---

## Project Structure

```
src/
  types/          # All shared TypeScript interfaces
  lib/
    securityEventBus.ts   # Local event bus (Member 2 integration)
  data/
    exams.ts      # Demo exam data
  context/
    SessionContext.tsx    # Exam session state management
  components/ui/  # Reusable design system components
  pages/          # All page-level components
  App.tsx         # React Router routing
  main.tsx        # Entry point
```

---

## Security Event Types

| Event | Severity | Source |
|---|---|---|
| `FACE_NOT_DETECTED` | HIGH | Member 2 (AI) |
| `MULTIPLE_FACES` | HIGH | Member 2 (AI) |
| `GAZE_DEVIATION` | MEDIUM | Member 2 (AI) |
| `HEAD_POSE_DEVIATION` | MEDIUM | Member 2 (AI) |
| `TAB_SWITCH` | MEDIUM | Browser (built-in) |
| `FULLSCREEN_EXIT` | MEDIUM | Browser (built-in) |
| `COPY_ATTEMPT` | LOW | Browser (built-in) |
| `PASTE_ATTEMPT` | LOW | Browser (built-in) |
| `RIGHT_CLICK_ATTEMPT` | LOW | Browser (built-in) |
| `WINDOW_BLUR` | LOW | Browser (built-in) |
| `KEYBOARD_SHORTCUT` | LOW | Browser (built-in) |

---

*ExamShield — Hackathon Project · Member 1: Exam Platform + Student UI*
