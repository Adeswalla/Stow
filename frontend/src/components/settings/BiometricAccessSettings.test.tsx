import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BiometricAccessSettings from "./BiometricAccessSettings";
import { registerPasskey } from "@/lib/passkey";
import {
  createPinVerifier,
  readBiometricAccessSettings,
  saveBiometricAccessSettings,
} from "@/lib/biometricAccess";

vi.mock("@/lib/passkey", () => ({ registerPasskey: vi.fn() }));
vi.mock("@/lib/biometricAccess", () => ({
  createPinVerifier: vi.fn(),
  readBiometricAccessSettings: vi.fn(),
  removeBiometricAccessSettings: vi.fn(),
  saveBiometricAccessSettings: vi.fn(),
}));

const mockRegisterPasskey = vi.mocked(registerPasskey);
const mockCreatePinVerifier = vi.mocked(createPinVerifier);
const mockReadSettings = vi.mocked(readBiometricAccessSettings);
const mockSaveSettings = vi.mocked(saveBiometricAccessSettings);

describe("BiometricAccessSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadSettings.mockReturnValue(null);
  });

  it("registers a platform passkey and saves a fallback PIN", async () => {
    mockRegisterPasskey.mockResolvedValue({
      id: "credential-row-1",
      credential_id: "credential-1",
      device_type: "singleDevice",
      backed_up: false,
      created_at: "2026-01-01T00:00:00.000Z",
    });
    mockCreatePinVerifier.mockResolvedValue({ pinSalt: "salt", pinHash: "hash" });

    render(<BiometricAccessSettings userId="user-1" />);
    fireEvent.click(await screen.findByRole("switch", { name: "Require device verification" }));

    expect(mockRegisterPasskey).toHaveBeenCalledWith("Stow app access", {
      requirePlatformAuthenticator: true,
    });
    fireEvent.change(await screen.findByLabelText("Six-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Confirm PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN and enable" }));

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith("user-1", {
        credentialId: "credential-1",
        pinSalt: "salt",
        pinHash: "hash",
      });
    });
    expect(screen.getByRole("switch", { name: "Require device verification" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("rejects mismatched fallback PINs", async () => {
    mockRegisterPasskey.mockResolvedValue({
      id: "credential-row-1",
      credential_id: "credential-1",
      device_type: "singleDevice",
      backed_up: false,
      created_at: "2026-01-01T00:00:00.000Z",
    });

    render(<BiometricAccessSettings userId="user-1" />);
    fireEvent.click(await screen.findByRole("switch", { name: "Require device verification" }));
    fireEvent.change(await screen.findByLabelText("Six-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Confirm PIN"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN and enable" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The PINs do not match.");
    expect(mockSaveSettings).not.toHaveBeenCalled();
  });
});