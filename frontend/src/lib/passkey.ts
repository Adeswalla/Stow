import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
  WebAuthnError,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/browser";
import { api } from "@/lib/api";

export class PasskeyLoginError extends Error {
  /** True when the user dismissed the passkey prompt rather than it failing outright. */
  cancelled: boolean;

  constructor(message: string, cancelled = false) {
    super(message);
    this.name = "PasskeyLoginError";
    this.cancelled = cancelled;
  }
}

export class PasskeyRegistrationError extends Error {
  /** True when the user dismissed the passkey prompt rather than it failing outright. */
  cancelled: boolean;

  constructor(message: string, cancelled = false) {
    super(message);
    this.name = "PasskeyRegistrationError";
    this.cancelled = cancelled;
  }
}

export interface PasskeyLoginResult {
  access_token: string;
  refresh_token: string;
  user: { id: string; stellar_address: string; [key: string]: unknown };
}

/**
 * Runs the full passkey login ceremony: fetches WebAuthn assertion options
 * from the backend, prompts the browser's platform authenticator via
 * navigator.credentials.get(), and exchanges the signed assertion for a
 * session. Throws PasskeyLoginError with a user-facing message on any
 * failure, distinguishing a user-cancelled prompt from a real error.
 */
export async function loginWithPasskey(
  securityOptions: { requireUserVerification?: boolean; credentialId?: string } = {},
): Promise<PasskeyLoginResult> {
  if (!browserSupportsWebAuthn()) {
    throw new PasskeyLoginError(
      "This browser doesn't support passkeys. Try a recent version of Chrome, Safari, or Edge.",
    );
  }

  const requestOptions = await api.post<PublicKeyCredentialRequestOptionsJSON>(
    "/api/v1/auth/passkey/authenticate/begin",
    undefined,
    { skipAuth: true },
  );

  const authenticationOptions = {
    ...requestOptions,
    ...(securityOptions.credentialId
      ? {
          allowCredentials: [
            { id: securityOptions.credentialId, type: "public-key" as const },
          ],
        }
      : {}),
    ...(securityOptions.requireUserVerification
      ? { userVerification: "required" as const }
      : {}),
  };

  let assertion;
  try {
    assertion = await startAuthentication({ optionsJSON: authenticationOptions });
  } catch (err) {
    if (err instanceof WebAuthnError && err.name === "NotAllowedError") {
      throw new PasskeyLoginError(
        "Passkey login was cancelled or timed out.",
        true,
      );
    }
    throw new PasskeyLoginError(
      "Couldn't complete the passkey prompt. Please try again.",
    );
  }

  try {
    return await api.post<PasskeyLoginResult>(
      "/api/v1/auth/passkey/authenticate/finish",
      { response: assertion },
      { skipAuth: true },
    );
  } catch {
    throw new PasskeyLoginError(
      "That passkey wasn't recognized, or the login attempt expired. Please try again.",
    );
  }
}

export interface PasskeyRegistrationResult {
  id: string;
  credential_id: string;
  device_type: string;
  backed_up: boolean;
  created_at: string;
}

/**
 * Runs the full passkey registration ceremony against the caller's current
 * session: fetches WebAuthn creation options from the backend, prompts the
 * browser's platform authenticator via navigator.credentials.create(), and
 * submits the attestation to attach the new passkey to the account. Unlike
 * loginWithPasskey, this requires an authenticated session (the begin/finish
 * endpoints are gated on @CurrentUser()) so callers must already hold a
 * session token before invoking this - api.post attaches it automatically.
 * Throws PasskeyRegistrationError with a user-facing message on any
 * failure, distinguishing a user-cancelled prompt from a real error.
 */
export async function registerPasskey(
  displayName?: string,
  securityOptions: { requirePlatformAuthenticator?: boolean } = {},
): Promise<PasskeyRegistrationResult> {
  if (!browserSupportsWebAuthn()) {
    throw new PasskeyRegistrationError(
      "This browser doesn't support passkeys. Try a recent version of Chrome, Safari, or Edge.",
    );
  }

  const requestOptions = await api.post<PublicKeyCredentialCreationOptionsJSON>(
    "/api/v1/auth/passkey/register/begin",
    displayName ? { display_name: displayName } : undefined,
  );

  const registrationOptions = securityOptions.requirePlatformAuthenticator
    ? {
        ...requestOptions,
        authenticatorSelection: {
          ...requestOptions.authenticatorSelection,
          authenticatorAttachment: "platform" as const,
          residentKey: "required" as const,
          userVerification: "required" as const,
        },
      }
    : requestOptions;

  let attestation;
  try {
    attestation = await startRegistration({ optionsJSON: registrationOptions });
  } catch (err) {
    if (err instanceof WebAuthnError && err.name === "NotAllowedError") {
      throw new PasskeyRegistrationError(
        "Passkey creation was cancelled or timed out.",
        true,
      );
    }
    throw new PasskeyRegistrationError(
      "Couldn't complete the passkey prompt. Please try again.",
    );
  }

  try {
    return await api.post<PasskeyRegistrationResult>(
      "/api/v1/auth/passkey/register/finish",
      { response: attestation },
    );
  } catch {
    throw new PasskeyRegistrationError(
      "Couldn't save your passkey. Please try again.",
    );
  }
}
