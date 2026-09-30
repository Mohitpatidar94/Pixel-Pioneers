// ============================================================
// ExamShield — Web Crypto Signing Architecture
// ============================================================
// Uses the browser's native Web Crypto API (ECDSA P-256).
//
// IMPORTANT:
//   - Private keys are generated in the browser and NEVER uploaded.
//   - Public keys can be exported for evaluator verification.
//   - Member 3 will build the full evaluator verification module.
//
// API:
//   generateSessionKeyPair()   → { publicKey, privateKey }
//   signIntegrityPayload()     → base64 signature string
//   verifyIntegrityPayload()   → boolean
//   exportPublicKey()          → JWK string
//   hashPayload()              → SHA-256 hex digest
// ============================================================

import type { IntegrityPayload } from "../types/proctoring";

export interface SessionKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJwk: JsonWebKey; // exportable for evaluator
  keyId: string;            // UUID reference
}

export interface SignedIntegrityPayload {
  payload: IntegrityPayload;
  signature: string;     // base64url ECDSA signature
  publicKeyJwk: JsonWebKey;
  keyId: string;
  algorithm: "ECDSA-P256-SHA256";
  signedAt: string;
  payloadHash: string;   // SHA-256 hex of canonical JSON
}

// ---- Key Generation ----

/**
 * Generate an ECDSA P-256 key pair for this exam session.
 * Keys are stored in memory only — never persisted or uploaded.
 */
export async function generateSessionKeyPair(): Promise<SessionKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,  // extractable so we can export the public key for the evaluator
    ["sign", "verify"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const keyId = generateKeyId();

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyJwk,
    keyId,
  };
}

// ---- Signing ----

/**
 * Sign an IntegrityPayload with the session private key.
 * The signature covers the SHA-256 hash of the canonical JSON.
 * Returns a SignedIntegrityPayload ready for evaluator verification.
 */
export async function signIntegrityPayload(
  payload: IntegrityPayload,
  keyPair: SessionKeyPair
): Promise<SignedIntegrityPayload> {
  const canonical = canonicalJSON(payload);
  const payloadBytes = new TextEncoder().encode(canonical);

  const signatureBuffer = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    keyPair.privateKey,
    payloadBytes
  );

  const signature = bufferToBase64Url(signatureBuffer);
  const payloadHash = await sha256Hex(payloadBytes);

  return {
    payload,
    signature,
    publicKeyJwk: keyPair.publicKeyJwk,
    keyId: keyPair.keyId,
    algorithm: "ECDSA-P256-SHA256",
    signedAt: new Date().toISOString(),
    payloadHash,
  };
}

// ---- Verification ----

/**
 * Verify a signed integrity payload using its embedded public key.
 * Member 3 will call this (or a server-side equivalent) during evaluator review.
 */
export async function verifyIntegrityPayload(
  signed: SignedIntegrityPayload
): Promise<boolean> {
  try {
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      signed.publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const canonical = canonicalJSON(signed.payload);
    const payloadBytes = new TextEncoder().encode(canonical);
    const signatureBuffer = base64UrlToBuffer(signed.signature);

    return await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      publicKey,
      signatureBuffer,
      payloadBytes
    );
  } catch {
    return false;
  }
}

// ---- Hash utility ----

export async function hashPayload(payload: IntegrityPayload): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJSON(payload));
  return sha256Hex(bytes);
}

// ---- Export public key ----

export function exportPublicKeyAsString(keyPair: SessionKeyPair): string {
  return JSON.stringify(keyPair.publicKeyJwk);
}

// ---- Internal utilities ----

/** Deterministic JSON serialisation (sorted keys) for consistent signing */
function canonicalJSON(obj: unknown): string {
  return JSON.stringify(obj, sortedReplacer);
}

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
    );
  }
  return value;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateKeyId(): string {
  const arr = new Uint8Array(8);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
