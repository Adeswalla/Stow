import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import RecurringDepositScheduler from "./RecurringDepositScheduler";

describe("RecurringDepositScheduler", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates and persists a schedule with a selected frequency", () => {
    render(<RecurringDepositScheduler account="GACCOUNT1" />);

    fireEvent.click(screen.getByRole("button", { name: /add schedule/i }));
    fireEvent.change(screen.getByLabelText(/amount \(usdc\)/i), {
      target: { value: "25.00" },
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: "biweekly" },
    });
    fireEvent.change(screen.getByLabelText(/first planned deposit/i), {
      target: { value: "2026-11-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    expect(screen.getByText(/25\.00 USDC/)).toHaveTextContent("Every 2 weeks");
    expect(
      JSON.parse(window.localStorage.getItem("stow-recurring-deposits:GACCOUNT1") ?? "[]"),
    ).toEqual([
      expect.objectContaining({
        amount: "25.00",
        frequency: "biweekly",
        nextDate: "2026-11-01",
      }),
    ]);
  });

  it("edits and cancels a saved schedule", () => {
    window.localStorage.setItem(
      "stow-recurring-deposits:GACCOUNT1",
      JSON.stringify([
        {
          id: "schedule-1",
          amount: "25",
          frequency: "weekly",
          nextDate: "2026-11-01",
        },
      ]),
    );
    render(<RecurringDepositScheduler account="GACCOUNT1" />);

    fireEvent.click(screen.getByRole("button", { name: /edit 25 usdc schedule/i }));
    fireEvent.change(screen.getByLabelText(/amount \(usdc\)/i), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: "monthly" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText(/50 USDC/)).toHaveTextContent("Monthly");
    fireEvent.click(screen.getByRole("button", { name: /cancel 50 usdc schedule/i }));
    expect(screen.getByText(/no recurring deposit schedules yet/i)).toBeInTheDocument();
  });

  it("validates positive deposit amounts", () => {
    render(<RecurringDepositScheduler account="GACCOUNT1" />);

    fireEvent.click(screen.getByRole("button", { name: /add schedule/i }));
    fireEvent.change(screen.getByLabelText(/amount \(usdc\)/i), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save schedule/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/greater than 0/i);
  });
});