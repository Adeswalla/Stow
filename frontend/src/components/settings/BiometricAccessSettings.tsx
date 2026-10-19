"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { registerPasskey } from "@/lib/passkey";
import {
  createPinVerifier,
  readBiometricAccessSettings,
  removeBiometricAccessSettings,
  saveBiometricAccessSettings,
  type BiometricAccessSettings as AccessSettings,
} from "@/lib/biometricAccess";

interface BiometricAccessSettingsProps {
  userId: string;
}

type SetupPhase = "idle" | "registering" | "pin" | "saving";

export default function BiometricAccessSettings({ userId }: BiometricAccessSettingsProps) {
  const [settings, setSettings] = useState<AccessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<SetupPhase>("idle");
  const [credentialId, setCredentialId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(readBiometricAccessSettings(userId));
    setIsLoading(false);
  }, [userId]);

  const handleToggle = async () => {
    setError(null);
    if (settings) {
      try {
        removeBiometricAccessSettings(userId);
        setSettings(null);
      } catch {
        setError("Could not update this device's security setting.");
      }
      return;
    }

    setPhase("registering");
    try {
      const credential = await registerPasskey("Stow app access", {
        requirePlatformAuthenticator: true,
      });
      setCredentialId(credential.credential_id);
      setPhase("pin");
    } catch (registrationError) {
      setPhase("idle");
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Could not set up biometric access on this device.",
      );
    }
  };

  const handleSavePin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter a six-digit PIN.");
      return;
    }
    if (pin !== confirmPin) {
      setError("The PINs do not match.");
      return;
    }

    setPhase("saving");
    setError(null);
    try {
      const verifier = await createPinVerifier(pin);
      const nextSettings = { credentialId, ...verifier };
      saveBiometricAccessSettings(userId, nextSettings);
      setSettings(nextSettings);
      setPin("");
      setConfirmPin("");
      setCredentialId("");
      setPhase("idle");
    } catch {
      setPhase("pin");
      setError("Could not save the fallback PIN on this device.");
    }
  };

  const cancelSetup = () => {
    setPhase("idle");
    setCredentialId("");
    setPin("");
    setConfirmPin("");
    setError(null);
  };

  return (
    <section
      aria-labelledby="biometric-access-heading"
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2
        id="biometric-access-heading"
        className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground"
      >
        <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
        Biometric app access
      </h2>
      <p className="mb-5 text-sm text-muted">
        Lock this browser session when you leave Stow. Unlock with your device
        passkey or your six-digit PIN. On shared devices, sign out when you are finished.
      </p>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-5 w-5 text-muted" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">Require device verification</p>
            <p className="text-xs text-muted">
              Face ID, fingerprint, or your device&apos;s passkey prompt
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings !== null}
          aria-label="Require device verification"
          disabled={isLoading || phase !== "idle"}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50 ${settings ? "bg-brand" : "bg-border"}`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {phase === "registering" && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Follow your device&apos;s prompt to register biometric access.
        </p>
      )}

      {phase === "pin" && (
        <form onSubmit={handleSavePin} className="mt-5 space-y-4 border-t border-border pt-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Set your fallback PIN</h3>
            <p className="mt-1 text-xs text-muted">
              Use this PIN if your passkey is unavailable. It is stored as a one-way verifier on this device.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              Six-digit PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6}"
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                aria-label="Six-digit PIN"
                required
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6}"
                maxLength={6}
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                aria-label="Confirm PIN"
                required
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={phase === "saving"}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#06211e] disabled:opacity-50"
            >
              {phase === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save PIN and enable
            </button>
            <button
              type="button"
              onClick={cancelSetup}
              className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
            >
              Cancel setup
            </button>
          </div>
        </form>
      )}

      {settings && phase === "idle" && (
        <p role="status" className="mt-4 text-sm text-brand">
          Biometric unlock is enabled for this browser. The account passkey remains available for sign-in if you turn this off.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}