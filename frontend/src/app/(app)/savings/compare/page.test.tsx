import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SavingsComparisonPage from "./page";

describe("SavingsComparisonPage", () => {
  it("compares flexible, locked, and goal savings features", () => {
    render(<SavingsComparisonPage />);

    expect(screen.getByRole("heading", { name: "Compare your options" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Withdraw any time")).toBeInTheDocument();
    expect(screen.getByText("Withdraw after the unlock date")).toBeInTheDocument();
    expect(screen.getByText("Claim after the target is reached")).toBeInTheDocument();
  });

  it("links each product to its existing flow", () => {
    render(<SavingsComparisonPage />);

    expect(screen.getByRole("link", { name: /explore flexible savings/i })).toHaveAttribute(
      "href",
      "/savings/flexible",
    );
    expect(screen.getByRole("link", { name: /create a locked plan/i })).toHaveAttribute(
      "href",
      "/savings/locked/new",
    );
    expect(screen.getByRole("link", { name: /create a savings goal/i })).toHaveAttribute(
      "href",
      "/savings/goals/new",
    );
  });
});