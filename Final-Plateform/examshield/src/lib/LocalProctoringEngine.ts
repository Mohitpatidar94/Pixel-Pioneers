// ============================================================
// ExamShield — Local Proctoring Engine
// ============================================================
// All webcam analysis happens locally in the browser.
// Raw video never leaves the device.
// Integrates with Member 1's securityEventBus.
// ============================================================

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { v4 as uuidv4 } from "uuid";
import { securityEventBus } from "../lib/securityEventBus";
import type { SecurityEventType } from "../types";
import type {
  CameraStatus,
  ProcessingStatus,
  FaceAnalysisFrame,
  GazeState,
  GazeDirection,
  HeadPose,
} from "../types/proctoring";

// ---- Constants ----

const INFERENCE_INTERVAL_MS = 150;   // ~6–7 FPS max inference rate
const GAZE_COOLDOWN_MS       = 3000; // min ms between gaze events
const GAZE_MIN_DURATION_MS   = 2500; // must deviate for this long before event
const HEAD_COOLDOWN_MS       = 3000;
const HEAD_MIN_DURATION_MS   = 2000;
const FACE_COOLDOWN_MS       = 4000;
const MULTI_FACE_COOLDOWN_MS = 5000;
const LOW_LIGHT_THRESHOLD    = 0.25; // 0–1

// MediaPipe WASM hosted on CDN (local-first: tries CDN, no video upload)
const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

// ---- Cooldown tracker ----

class CooldownTracker {
  private lastFired: Map<string, number> = new Map();
  canFire(key: string, cooldownMs: number): boolean {
    const last = this.lastFired.get(key) ?? 0;
    const now = Date.now();
    if (now - last >= cooldownMs) {
      this.lastFired.set(key, now);
      return true;
    }
    return false;
  }
  reset(key?: string) {
    if (key) this.lastFired.delete(key);
    else this.lastFired.clear();
  }
}

// ---- Main Engine ----

type StateListener = (status: ProcessingStatus) => void;
type FrameListener  = (frame: FaceAnalysisFrame) => void;

export class LocalProctoringEngine {
  private sessionId = "";
  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private animFrameId: number | null = null;
  private lastInferenceTime = 0;
  private cameraStatus: CameraStatus = "idle";
  private processingStatus: ProcessingStatus = "LOCAL";
  private latestFrame: FaceAnalysisFrame | null = null;
  private cooldown = new CooldownTracker();
  private stateListeners: Set<StateListener> = new Set();
  private frameListeners: Set<FrameListener> = new Set();

  // Deviation streak tracking (for minimum-duration debounce)
  private gazeDeviationSince: number | null = null;
  private headDeviationSince: number | null = null;
  private faceAbsentSince: number | null = null;
  private fps = 0;
  private frameCount = 0;
  private fpsInterval: ReturnType<typeof setInterval> | null = null;

  // ---- Public API ----

  async start(sessionId: string, videoElement: HTMLVideoElement): Promise<void> {
    this.sessionId = sessionId;
    this.videoEl = videoElement;
    this.setCameraStatus("requesting");

    try {
      await this.initCamera();
      await this.initMediaPipe();
      this.setProcessingStatus("LOCAL");
      this.startLoop();
      this.startFpsMeter();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        this.setCameraStatus("blocked");
        this.emitEvent("CAMERA_BLOCKED", "HIGH", 1.0, { reason: "permission_denied" });
      } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
        this.setCameraStatus("unavailable");
      } else {
        this.setCameraStatus("error");
      }
      this.setProcessingStatus("CAMERA_ERROR");
      throw err;
    }
  }

  stop(): void {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
    if (this.fpsInterval !== null) clearInterval(this.fpsInterval);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.faceLandmarker?.close();
    this.stream = null;
    this.faceLandmarker = null;
    this.animFrameId = null;
    this.setCameraStatus("idle");
    this.setProcessingStatus("PAUSED");
    this.cooldown.reset();
  }

  pause(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.setProcessingStatus("PAUSED");
  }

  resume(): void {
    if (this.processingStatus === "PAUSED") {
      this.setProcessingStatus("LOCAL");
      this.startLoop();
    }
  }

  getLatestFrame(): FaceAnalysisFrame | null {
    return this.latestFrame;
  }

  getCameraStatus(): CameraStatus {
    return this.cameraStatus;
  }

  getProcessingStatus(): ProcessingStatus {
    return this.processingStatus;
  }

  getFps(): number {
    return this.fps;
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onFrame(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  /** Simulation mode — inject a fake event for demos */
  simulateEvent(type: SecurityEventType): void {
    this.emitEvent(type, "MEDIUM", 0.85, { simulated: true });
  }

  // ---- Init ----

  private async initCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: false,
    });
    this.stream = stream;
    if (this.videoEl) {
      this.videoEl.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        this.videoEl!.onloadedmetadata = () => {
          this.videoEl!.play().then(resolve).catch(reject);
        };
      });
    }
    this.setCameraStatus("active");
  }

  private async initMediaPipe(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 3, // detect up to 3 to catch multiple faces
      });
    } catch {
      // GPU delegate failed — fall back to CPU
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 3,
      });
    }
  }

  // ---- Frame Loop ----

  private startLoop(): void {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const now = Date.now();
      if (now - this.lastInferenceTime < INFERENCE_INTERVAL_MS) return;
      this.lastInferenceTime = now;
      this.frameCount++;
      this.processFrame(now);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private startFpsMeter(): void {
    this.frameCount = 0;
    this.fpsInterval = setInterval(() => {
      this.fps = this.frameCount;
      this.frameCount = 0;
    }, 1000);
  }

  private processFrame(nowMs: number): void {
    if (!this.faceLandmarker || !this.videoEl) return;
    if (this.videoEl.readyState < 2) return;

    this.setProcessingStatus("PROCESSING");

    let result: FaceLandmarkerResult;
    try {
      result = this.faceLandmarker.detectForVideo(this.videoEl, nowMs);
    } catch {
      this.setProcessingStatus("LOCAL");
      return;
    }

    const faceCount = result.faceLandmarks?.length ?? 0;
    const lightingScore = this.estimateLighting();
    const headPose = faceCount > 0 ? this.estimateHeadPose(result, 0) : null;
    const gazeState = faceCount > 0 ? this.estimateGaze(result, 0, headPose) : null;
    const confidence = faceCount > 0 ? 0.9 : 0.1;

    this.latestFrame = {
      timestamp: nowMs,
      faceCount,
      gazeState: gazeState ?? {
        direction: "unknown", confidence: 0, durationMs: 0,
        deviationAngleX: 0, deviationAngleY: 0,
      },
      headPose: headPose ?? { yaw: 0, pitch: 0, roll: 0, confidence: 0 },
      lightingScore,
      confidence,
    };

    // Notify frame listeners (debug panel uses this)
    this.frameListeners.forEach((fn) => fn(this.latestFrame!));
    this.setProcessingStatus("LOCAL");

    // -- Event generation --
    this.handleFacePresence(faceCount, nowMs);
    if (faceCount > 0 && gazeState) this.handleGaze(gazeState, nowMs);
    if (faceCount > 0 && headPose) this.handleHeadPose(headPose, nowMs);
    if (faceCount > 1) this.handleMultipleFaces(faceCount, nowMs);
    this.handleLighting(lightingScore, nowMs);
  }

  // ---- Head Pose Estimation ----
  // Uses MediaPipe face landmarks to compute yaw/pitch/roll
  // Based on specific landmark positions for a reliable 3D approximation

  private estimateHeadPose(result: FaceLandmarkerResult, faceIndex: number): HeadPose {
    const landmarks = result.faceLandmarks[faceIndex];
    if (!landmarks || landmarks.length < 468) {
      return { yaw: 0, pitch: 0, roll: 0, confidence: 0 };
    }

    // Key landmark indices (MediaPipe 468-point model)
    const nose     = landmarks[1];   // nose tip
    const chin     = landmarks[152]; // chin
    const leftEye  = landmarks[33];  // left eye outer corner
    const rightEye = landmarks[263]; // right eye outer corner
    const leftMouth  = landmarks[61];
    const rightMouth = landmarks[291];

    // Yaw: horizontal nose deviation from eye midpoint
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const yawRaw = (nose.x - eyeMidX) / (rightEye.x - leftEye.x + 1e-6);
    const yaw = yawRaw * 90; // scale to degrees approximation

    // Pitch: vertical nose deviation from eye/mouth midpoint
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const mouthMidY = (leftMouth.y + rightMouth.y) / 2;
    const faceHeight = mouthMidY - eyeMidY + 1e-6;
    const pitchRaw = (nose.y - eyeMidY) / faceHeight - 0.45;
    const pitch = pitchRaw * 60;

    // Roll: angle of eye line
    const dy = rightEye.y - leftEye.y;
    const dx = rightEye.x - leftEye.x + 1e-6;
    const roll = Math.atan2(dy, dx) * (180 / Math.PI);

    // Confidence: how well-centered and visible the face is
    const faceSizeX = rightEye.x - leftEye.x;
    const confidence = Math.min(1, faceSizeX * 4); // larger face = more confident

    return { yaw, pitch, roll, confidence };
  }

  // ---- Gaze Estimation ----
  // Uses iris position relative to eye corners for horizontal gaze
  // Uses eye opening ratio for vertical (blink detection as proxy)

  private estimateGaze(
    result: FaceLandmarkerResult,
    faceIndex: number,
    headPose: HeadPose | null
  ): GazeState {
    const landmarks = result.faceLandmarks[faceIndex];
    if (!landmarks || landmarks.length < 468) {
      return { direction: "unknown", confidence: 0, durationMs: 0, deviationAngleX: 0, deviationAngleY: 0 };
    }

    // Iris landmarks (MediaPipe provides these at indices 468–477)
    // Fallback to eye corner approach if iris not available
    const hasIris = landmarks.length >= 478;

    let gazeX = 0; // -1 = far left, +1 = far right
    let gazeY = 0; // -1 = up,       +1 = down

    if (hasIris) {
      // Left iris center ≈ 473, Right iris center ≈ 468
      const leftIris  = landmarks[473];
      const rightIris = landmarks[468];
      const leftOuter = landmarks[33];
      const leftInner = landmarks[133];
      const rightOuter = landmarks[263];
      const rightInner = landmarks[362];

      const leftEyeWidth  = Math.abs(leftInner.x  - leftOuter.x)  + 1e-6;
      const rightEyeWidth = Math.abs(rightInner.x - rightOuter.x) + 1e-6;

      const leftGazeX  = (leftIris.x  - leftOuter.x)  / leftEyeWidth  - 0.5;
      const rightGazeX = (rightIris.x - rightOuter.x) / rightEyeWidth - 0.5;
      gazeX = (leftGazeX + rightGazeX) / 2;

      const leftEyeTop    = landmarks[159];
      const leftEyeBottom = landmarks[145];
      const eyeOpenHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y) + 1e-6;
      const leftIrisY = (leftIris.y - leftEyeTop.y) / eyeOpenHeight - 0.5;
      gazeY = leftIrisY;
    } else if (headPose) {
      // Fallback: use head pose as proxy for gaze
      gazeX = headPose.yaw / 45;
      gazeY = headPose.pitch / 30;
    }

    const deviationAngleX = gazeX * 40; // approx degrees
    const deviationAngleY = gazeY * 25;

    let direction: GazeDirection = "center";
    const absX = Math.abs(gazeX);
    const absY = Math.abs(gazeY);

    if (absX > 0.35 || absY > 0.35) {
      if (absX >= absY) {
        direction = gazeX < 0 ? "left" : "right";
      } else {
        direction = gazeY < 0 ? "up" : "down";
      }
    }

    const confidence = hasIris ? 0.85 : 0.55;

    return {
      direction,
      confidence,
      durationMs: 0, // filled in by handleGaze
      deviationAngleX,
      deviationAngleY,
    };
  }

  // ---- Lighting Estimation ----
  // Samples the video frame via OffscreenCanvas for average brightness

  private estimateLighting(): number {
    if (!this.videoEl || this.videoEl.readyState < 2) return 0.8;
    try {
      const canvas = new OffscreenCanvas(32, 24);
      const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
      if (!ctx) return 0.8;
      ctx.drawImage(this.videoEl, 0, 0, 32, 24);
      const data = ctx.getImageData(0, 0, 32, 24).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Luminance formula
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avg = sum / (32 * 24);
      return avg / 255;
    } catch {
      return 0.8;
    }
  }

  // ---- Event Handlers ----

  private handleFacePresence(faceCount: number, now: number): void {
    if (faceCount === 0) {
      if (this.faceAbsentSince === null) {
        this.faceAbsentSince = now;
      } else if (
        now - this.faceAbsentSince >= 2000 &&
        this.cooldown.canFire("face_absent", FACE_COOLDOWN_MS)
      ) {
        this.emitEvent("FACE_NOT_DETECTED", "MEDIUM", 0.9, {
          absentDurationMs: now - this.faceAbsentSince,
        });
      }
    } else {
      this.faceAbsentSince = null;
    }
  }

  private handleGaze(gaze: GazeState, now: number): void {
    if (gaze.direction !== "center" && gaze.direction !== "unknown") {
      if (this.gazeDeviationSince === null) {
        this.gazeDeviationSince = now;
      }
      const duration = now - this.gazeDeviationSince;
      if (
        duration >= GAZE_MIN_DURATION_MS &&
        this.cooldown.canFire("gaze", GAZE_COOLDOWN_MS)
      ) {
        this.emitEvent("GAZE_DEVIATION", "MEDIUM", gaze.confidence, {
          direction: gaze.direction,
          durationMs: duration,
          deviationAngleX: Math.round(gaze.deviationAngleX),
          deviationAngleY: Math.round(gaze.deviationAngleY),
        });
        this.gazeDeviationSince = null;
      }
    } else {
      this.gazeDeviationSince = null;
    }
  }

  private handleHeadPose(pose: HeadPose, now: number): void {
    const yawThreshold   = 25; // degrees
    const pitchThreshold = 20;
    const isDeviated =
      Math.abs(pose.yaw) > yawThreshold || Math.abs(pose.pitch) > pitchThreshold;

    if (isDeviated && pose.confidence > 0.4) {
      if (this.headDeviationSince === null) {
        this.headDeviationSince = now;
      }
      const duration = now - this.headDeviationSince;
      if (
        duration >= HEAD_MIN_DURATION_MS &&
        this.cooldown.canFire("head", HEAD_COOLDOWN_MS)
      ) {
        this.emitEvent("HEAD_POSE_DEVIATION", "MEDIUM", pose.confidence, {
          yaw:      Math.round(pose.yaw),
          pitch:    Math.round(pose.pitch),
          roll:     Math.round(pose.roll),
          durationMs: duration,
        });
        this.headDeviationSince = null;
      }
    } else {
      this.headDeviationSince = null;
    }
  }

  private handleMultipleFaces(faceCount: number, _now: number): void {
    if (this.cooldown.canFire("multiple_faces", MULTI_FACE_COOLDOWN_MS)) {
      this.emitEvent("MULTIPLE_FACES", "HIGH", 0.95, { count: faceCount });
    }
  }

  private handleLighting(score: number, _now: number): void {
    if (score < LOW_LIGHT_THRESHOLD) {
      if (this.cooldown.canFire("low_light", 15000)) {
        this.emitEvent("LOW_VISIBILITY", "LOW", 0.8, {
          lightingScore: Math.round(score * 100),
        });
      }
    }
  }

  // ---- Internal helpers ----

  private emitEvent(
    type: SecurityEventType,
    severity: "INFO" | "LOW" | "MEDIUM" | "HIGH",
    confidence: number,
    metadata?: Record<string, unknown>
  ): void {
    securityEventBus.addEvent(this.sessionId, type, {
      severity,
      confidence,
      metadata,
    });
  }

  private setCameraStatus(s: CameraStatus): void {
    this.cameraStatus = s;
  }

  private setProcessingStatus(s: ProcessingStatus): void {
    if (this.processingStatus === s) return;
    this.processingStatus = s;
    this.stateListeners.forEach((fn) => fn(s));
  }
}

// Singleton instance
export const localProctoringEngine = new LocalProctoringEngine();
