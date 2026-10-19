"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const TOUR_STORAGE_KEY = "stow-onboarding-complete";

const steps = [
  {
    target: "dashboard",
    title: "Your savings dashboard",
    description: "See your savings at a glance and jump straight into common actions.",
  },
  {
    target: "goals",
    title: "Save toward a goal",
    description: "Create a goal, choose a target, and build your savings at your own pace.",
  },
  {
    target: "locked",
    title: "Put savings aside",
    description: "Explore locked savings when you want to set money aside for a period of time.",
  },
  {
    target: "groups",
    title: "Save with a group",
    description: "Start or join a group and make progress toward a shared savings goal.",
  },
  {
    target: "deposit",
    title: "Move money in and out",
    description: "Use deposit and withdraw to manage funds in your Stow account.",
  },
  {
    target: "referrals",
    title: "Invite someone",
    description: "Find your referral link and share Stow with someone you know.",
  },
] as const;

interface OnboardingTourProps {
  onClose: () => void;
}

export default function OnboardingTour({ onClose }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [panelPosition, setPanelPosition] = useState({ left: 16, top: 16 });
  const step = steps[stepIndex];

  useEffect(() => {
    const selector = `[data-tour="${step.target}"]`;
    setTargetRect(null);
    const updatePosition = () => {
      const target = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
        (candidate) => candidate.getClientRects().length > 0,
      );

      setTargetRect(target ? target.getBoundingClientRect() : null);
    };

    const frame = window.requestAnimationFrame(updatePosition);
    if (!document.querySelector(selector)) {
      setTargetRect(null);
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [step.target]);

  useEffect(() => {
    const panelWidth = Math.min(360, window.innerWidth - 32);
    const preferredLeft = targetRect
      ? targetRect.right + 16
      : (window.innerWidth - panelWidth) / 2;
    const panelLeft = targetRect
      ? Math.max(16, Math.min(preferredLeft, window.innerWidth - panelWidth - 16))
      : Math.max(16, preferredLeft);
    const panelTop = targetRect
      ? targetRect.bottom + 16 + 280 <= window.innerHeight
        ? targetRect.bottom + 16
        : Math.max(16, targetRect.top - 296)
      : Math.max(16, (window.innerHeight - 260) / 2);

    setPanelPosition({ left: panelLeft, top: panelTop });
  }, [targetRect]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const finish = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60]" data-testid="onboarding-tour">
      <div
        className="absolute inset-0 bg-black/65"
        aria-hidden="true"
        style={targetRect ? {
          clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${targetRect.left - 4}px ${targetRect.top - 4}px, ${targetRect.left - 4}px ${targetRect.bottom + 4}px, ${targetRect.right + 4}px ${targetRect.bottom + 4}px, ${targetRect.right + 4}px ${targetRect.top - 4}px, ${targetRect.left - 4}px ${targetRect.top - 4}px)`,
        } : undefined}
      />
      {targetRect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl ring-2 ring-brand ring-offset-2 ring-offset-background"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            zIndex: 62,
          }}
        />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        className="fixed z-[63] w-[calc(100vw-2rem)] max-w-[22.5rem] rounded-xl border border-border bg-background-elevated p-5 shadow-2xl"
        style={{ left: panelPosition.left, top: panelPosition.top }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Getting started · {stepIndex + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label="Skip tutorial"
            title="Skip tutorial"
            className="rounded-md p-1 text-muted hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <h2 id="onboarding-title" className="text-lg font-semibold text-foreground">
          {step.title}
        </h2>
        <p id="onboarding-description" className="mt-2 text-sm leading-6 text-muted">
          {step.description}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((index) => index - 1)}
                aria-label="Previous step"
                className="rounded-lg border border-border p-2 text-muted hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => stepIndex === steps.length - 1 ? finish() : setStepIndex((index) => index + 1)}
              className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-background focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background-elevated"
            >
              {stepIndex === steps.length - 1 ? "Finish" : "Next"}
              {stepIndex < steps.length - 1 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}