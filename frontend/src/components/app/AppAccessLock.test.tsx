import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppAccessLock from "./AppAccessLock";
import { loginWithPasskey } from "@/lib/passkey";
import { verifyPin } from "@/lib/biometricAccess";

const { mockSetSession } = vi.hoisted(() => ({ mockSetSession: vi.fn() }));

vi.mock("@/context/SessionProvider", () => ({
  useSession: () => ({ setSession: mockSetSession }),
}));
vi.mock("@/lib/passkey", () => ({ loginWithPasskey: vi.fn() }));
vi.mock("@/lib/biometricAccess", () => ({ verifyPin: vi.fn() }));

const mockLoginWithPasskey = vi.mocked(loginWithPasskey);
const mockVerifyPin = vi.mocked(verifyPin);
const accessSettings = {
  credentialId: "credential-1",
  pinSalt: "salt",
  pinHash: "hash",
};

describe("AppAccessLock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unlocks with a valid fallback PIN", async () => {
    const onUnlock = vi.fn();
    mockVerifyPin.mockResolvedValue(true);
    render(
      <AppAccessLock
        userId="user-1"
        settings={accessSettings}
        onUnlock={onUnlock}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Six-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock with PIN" }));

    await waitFor(() => expect(onUnlock).toHaveBeenCalledOnce());
    expect(mockVerifyPin).toHaveBeenCalledWith("123456", accessSettings);
  });

  it("accepts a verified passkey only for the current account", async () => {
    const onUnlock = vi.fn();
    mockLoginWithPasskey.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      user: { id: "user-1", stellar_address: "GADDR1" },
    });
    render(
      <AppAccessLock
        userId="user-1"
        settings={accessSettings}
        onUnlock={onUnlock}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Unlock with biometrics" }));

    await waitFor(() => expect(onUnlock).toHaveBeenCalledOnce());
    expect(mockLoginWithPasskey).toHaveBeenCalledWith({
      requireUserVerification: true,
      credentialId: "credential-1",
    });
    expect(mockSetSession).toHaveBeenCalledWith(
      "access-token",
      { id: "user-1" },
      "GADDR1",
    );
  });

  it("does not unlock when a different account's passkey is used", async () => {
    const onUnlock = vi.fn();
    mockLoginWithPasskey.mockResolvedValue({
      access_token: "other-token",
      refresh_token: "refresh-token",
      user: { id: "user-2", stellar_address: "GADDR2" },
    });
    render(
      <AppAccessLock
        userId="user-1"
        settings={accessSettings}
        onUnlock={onUnlock}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Unlock with biometrics" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("different Stow account");
    expect(onUnlock).not.toHaveBeenCalled();
    expect(mockSetSession).not.toHaveBeenCalled();
  });
});