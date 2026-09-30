// ============================================================
// ExamShield — Browser Event Monitor
// ============================================================
// Monitors browser-native security signals:
// tab switching, fullscreen, copy/paste, keyboard shortcuts.
// Replaces the inline listeners in ExamWorkspacePage so they
// are centralised, debounced, and properly cooldown-controlled.
// ============================================================

import { securityEventBus } from "./securityEventBus";
import type { SecurityEventType } from "../types";

interface BrowserMonitorOptions {
  sessionId: string;
  onSecurityStatusChange?: (status: "SECURE" | "WARNING") => void;
}

class BrowserEventMonitor {
  private sessionId = "";
  private onStatusChange: ((s: "SECURE" | "WARNING") => void) | null = null;
  private active = false;
  private tabSwitchCooldown = 0;
  private fullscreenCooldown = 0;
  private copyPasteCooldown = 0;
  private blurCooldown = 0;
  private statusResetTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- Bound handlers (kept as instance props for remove) ----
  private _onVisibility = this.handleVisibility.bind(this);
  private _onBlur = this.handleBlur.bind(this);
  private _onFocus = this.handleFocus.bind(this);
  private _onFullscreen = this.handleFullscreen.bind(this);
  private _onContextMenu = this.handleContextMenu.bind(this);
  private _onCopy = this.handleCopy.bind(this);
  private _onCut = this.handleCut.bind(this);
  private _onPaste = this.handlePaste.bind(this);
  private _onKeyDown = this.handleKeyDown.bind(this);

  start(opts: BrowserMonitorOptions): void {
    if (this.active) this.stop();
    this.sessionId = opts.sessionId;
    this.onStatusChange = opts.onSecurityStatusChange ?? null;
    this.active = true;

    document.addEventListener("visibilitychange", this._onVisibility);
    window.addEventListener("blur", this._onBlur);
    window.addEventListener("focus", this._onFocus);
    document.addEventListener("fullscreenchange", this._onFullscreen);
    document.addEventListener("contextmenu", this._onContextMenu);
    document.addEventListener("copy", this._onCopy);
    document.addEventListener("cut", this._onCut);
    document.addEventListener("paste", this._onPaste);
    document.addEventListener("keydown", this._onKeyDown);
  }

  stop(): void {
    this.active = false;
    document.removeEventListener("visibilitychange", this._onVisibility);
    window.removeEventListener("blur", this._onBlur);
    window.removeEventListener("focus", this._onFocus);
    document.removeEventListener("fullscreenchange", this._onFullscreen);
    document.removeEventListener("contextmenu", this._onContextMenu);
    document.removeEventListener("copy", this._onCopy);
    document.removeEventListener("cut", this._onCut);
    document.removeEventListener("paste", this._onPaste);
    document.removeEventListener("keydown", this._onKeyDown);
    if (this.statusResetTimer) clearTimeout(this.statusResetTimer);
  }

  // ---- Handlers ----

  private handleVisibility(): void {
    if (!document.hidden) return;
    const now = Date.now();
    if (now - this.tabSwitchCooldown < 2000) return;
    this.tabSwitchCooldown = now;
    this.emit("TAB_SWITCH", "MEDIUM", 0.95, {
      at: new Date().toISOString(),
      note: "Browser tab hidden — visibility API",
    });
    this.triggerWarning();
  }

  private handleBlur(): void {
    const now = Date.now();
    if (now - this.blurCooldown < 3000) return;
    this.blurCooldown = now;
    this.emit("WINDOW_BLUR", "LOW", 0.7, {
      note: "Window lost focus",
    });
  }

  private handleFocus(): void {
    // focus return — no event, just clear warning
    this.clearWarning();
  }

  private handleFullscreen(): void {
    if (document.fullscreenElement) return; // entered fullscreen — OK
    const now = Date.now();
    if (now - this.fullscreenCooldown < 3000) return;
    this.fullscreenCooldown = now;
    this.emit("FULLSCREEN_EXIT", "MEDIUM", 1.0, {
      at: new Date().toISOString(),
    });
    this.triggerWarning();
  }

  private handleContextMenu(e: Event): void {
    e.preventDefault();
    const now = Date.now();
    if (now - this.copyPasteCooldown < 1000) return;
    this.copyPasteCooldown = now;
    this.emit("RIGHT_CLICK_ATTEMPT", "LOW", 1.0);
  }

  private handleCopy(): void {
    const now = Date.now();
    if (now - this.copyPasteCooldown < 1000) return;
    this.copyPasteCooldown = now;
    this.emit("COPY_ATTEMPT", "LOW", 1.0, {
      selectedText: window.getSelection()?.toString()?.slice(0, 50) ?? "",
    });
  }

  private handleCut(): void {
    const now = Date.now();
    if (now - this.copyPasteCooldown < 1000) return;
    this.copyPasteCooldown = now;
    this.emit("COPY_ATTEMPT", "LOW", 1.0, { action: "cut" });
  }

  private handlePaste(): void {
    const now = Date.now();
    if (now - this.copyPasteCooldown < 1000) return;
    this.copyPasteCooldown = now;
    this.emit("PASTE_ATTEMPT", "LOW", 1.0);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const isBlockedShortcut =
      (e.ctrlKey || e.metaKey) && ["c", "v", "x", "t", "n", "w", "u", "a"].includes(e.key.toLowerCase()) ||
      e.key === "F12" ||
      e.key === "PrintScreen" ||
      (e.ctrlKey && e.shiftKey && e.key === "I") ||
      (e.ctrlKey && e.shiftKey && e.key === "J") ||
      (e.ctrlKey && e.shiftKey && e.key === "C");

    if (isBlockedShortcut) {
      e.preventDefault();
      this.emit("KEYBOARD_SHORTCUT", "LOW", 1.0, {
        key: e.key,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
      });
    }
  }

  // ---- Helpers ----

  private emit(
    type: SecurityEventType,
    severity: "INFO" | "LOW" | "MEDIUM" | "HIGH",
    confidence: number,
    metadata?: Record<string, unknown>
  ): void {
    securityEventBus.addEvent(this.sessionId, type, { severity, confidence, metadata });
  }

  private triggerWarning(): void {
    this.onStatusChange?.("WARNING");
    if (this.statusResetTimer) clearTimeout(this.statusResetTimer);
    this.statusResetTimer = setTimeout(() => {
      this.onStatusChange?.("SECURE");
    }, 4000);
  }

  private clearWarning(): void {
    if (this.statusResetTimer) clearTimeout(this.statusResetTimer);
    this.onStatusChange?.("SECURE");
  }
}

export const browserEventMonitor = new BrowserEventMonitor();
