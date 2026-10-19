import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import RoundUpSettings from "./RoundUpSettings";

describe("RoundUpSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("estimates monthly savings from purchase count and round-up rules", () => {
    render(<RoundUpSettings account="GACCOUNT1" />);

    fireEvent.click(screen.getByRole("switch", { name: "Enable round-ups" }));
    fireEvent.change(screen.getByLabelText("Round each purchase to"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Round-up multiplier"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Monthly round-up limit"), {
      target: { value: "none" },
    });

    expect(screen.getByTestId("round-up-estimate")).toHaveAttribute(
      "data-monthly-estimate",
      "200.00",
    );
  });

  it("caps the estimate at the monthly limit and persists the rules per account", () => {
    render(<RoundUpSettings account="GACCOUNT1" />);

    fireEvent.click(screen.getByRole("switch", { name: "Enable round-ups" }));
    fireEvent.change(screen.getByLabelText("Round each purchase to"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Estimated card purchases each month"), {
      target: { value: "200" },
    });

    expect(screen.getByTestId("round-up-estimate")).toHaveAttribute(
      "data-monthly-estimate",
      "50.00",
    );
    expect(
      JSON.parse(window.localStorage.getItem("stow-round-up-rules:GACCOUNT1") ?? "{}"),
    ).toMatchObject({ enabled: true, roundTo: 10, monthlyTransactions: 200, monthlyCap: 50 });
  });

  it("explains account-linking availability without claiming an account was linked", () => {
    render(<RoundUpSettings account="GACCOUNT1" />);

    fireEvent.click(screen.getByRole("button", { name: /link external account/i }));

    expect(screen.getByText(/transaction-data provider is not configured/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /make a one-time deposit instead/i })).toHaveAttribute(
      "href",
      "/ramps/deposit",
    );
  });
});