export const BIOMETRIC_ACCESS_CHANGED_EVENT = "stow-biometric-access-changed";
const STORAGE_PREFIX = "stow-biometric-access:";
const PIN_ITERATIONS = 310_000;

export interface BiometricAccessSettings {
  credentialId: string;
  pinSalt: string;
  pinHash: string;
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function readBiometricAccessSettings(userId: string): BiometricAccessSettings | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const settings = JSON.parse(raw) as Partial<BiometricAccessSettings>;
    if (!settings.credentialId || !settings.pinSalt || !settings.pinHash) return null;
    return settings as BiometricAccessSettings;
  } catch {
    return null;
  }
}

export function saveBiometricAccessSettings(
  userId: string,
  settings: BiometricAccessSettings,
) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(settings));
  window.dispatchEvent(new Event(BIOMETRIC_ACCESS_CHANGED_EVENT));
}

export function removeBiometricAccessSettings(userId: string) {
  window.localStorage.removeItem(storageKey(userId));
  window.dispatchEvent(new Event(BIOMETRIC_ACCESS_CHANGED_EVENT));
}

export async function createPinVerifier(pin: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const pinHash = await derivePinHash(pin, salt);
  return { pinSalt: encodeBase64Url(salt), pinHash: encodeBase64Url(pinHash) };
}

export async function verifyPin(pin: string, settings: BiometricAccessSettings) {
  try {
    const salt = decodeBase64Url(settings.pinSalt);
    const expected = decodeBase64Url(settings.pinHash);
    const actual = await derivePinHash(pin, salt);
    if (actual.length !== expected.length) return false;
    return actual.reduce((difference, byte, index) => difference | (byte ^ expected[index]), 0) === 0;
  } catch {
    return false;
  }
}

async function derivePinHash(pin: string, salt: Uint8Array) {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PIN_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}