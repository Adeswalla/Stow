"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Coins, Link2, Sparkles } from "lucide-react";

interface RoundUpRules {
  enabled: boolean;
  roundTo: number;
  multiplier: number;
  monthlyCap: number | null;
  monthlyTransactions: number;
}

interface RoundUpSettingsProps {
  account: string;
}

const DEFAULT_RULES: RoundUpRules = {
  enabled: false,
  roundTo: 1,
  multiplier: 1,
  monthlyCap: 50,
  monthlyTransactions: 40,
};

function storageKey(account: string) {
  return `stow-round-up-rules:${account}`;
}

function readRules(account: string): RoundUpRules {
  try {
    const raw = window.localStorage.getItem(storageKey(account));
    if (!raw) return DEFAULT_RULES;
    const saved = JSON.parse(raw) as Partial<RoundUpRules>;
    return {
      enabled: typeof saved.enabled === "boolean" ? saved.enabled : DEFAULT_RULES.enabled,
      roundTo: [1, 5, 10].includes(saved.roundTo ?? 0) ? saved.roundTo! : DEFAULT_RULES.roundTo,
      multiplier: [1, 2, 3].includes(saved.multiplier ?? 0) ? saved.multiplier! : DEFAULT_RULES.multiplier,
      monthlyCap:
        saved.monthlyCap === null || [25, 50, 100].includes(saved.monthlyCap ?? 0)
          ? saved.monthlyCap
          : DEFAULT_RULES.monthlyCap,
      monthlyTransactions:
        typeof saved.monthlyTransactions === "number" &&
        Number.isFinite(saved.monthlyTransactions)
          ? Math.min(200, Math.max(0, saved.monthlyTransactions))
          : DEFAULT_RULES.monthlyTransactions,
    };
  } catch {
    return DEFAULT_RULES;
  }
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function RoundUpSettings({ account }: RoundUpSettingsProps) {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [loadedAccount, setLoadedAccount] = useState<string | null>(null);
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    setRules(readRules(account));
    setLoadedAccount(account);
  }, [account]);

  useEffect(() => {
    if (loadedAccount !== account) return;
    try {
      window.localStorage.setItem(storageKey(account), JSON.stringify(rules));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [account, loadedAccount, rules]);

  const uncappedEstimate =
    rules.monthlyTransactions * (rules.roundTo / 2) * rules.multiplier;
  const monthlyEstimate =
    rules.monthlyCap === null
      ? uncappedEstimate
      : Math.min(uncappedEstimate, rules.monthlyCap);

  const updateRules = <Key extends keyof RoundUpRules>(key: Key, value: RoundUpRules[Key]) => {
    setRules((current) => ({ ...current, [key]: value }));
  };

  return (
    <section
      aria-labelledby="round-up-title"
      className="mt-8 border-t border-border pt-7"
      data-testid="round-up-settings"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-amber-400/30 bg-amber-400/10">
            <Coins className="h-5 w-5 text-amber-300" aria-hidden="true" />
          </div>
          <div>
            <h2 id="round-up-title" className="text-lg font-semibold text-foreground">
              Spare change round-ups
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Choose how purchases could round up toward your flexible USDC savings.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rules.enabled}
          aria-label="Enable round-ups"
          onClick={() => updateRules("enabled", !rules.enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 ${rules.enabled ? "bg-brand" : "bg-border"}`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${rules.enabled ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            Round each purchase to
            <select
              aria-label="Round each purchase to"
              value={rules.roundTo}
              disabled={!rules.enabled}
              onChange={(event) => updateRules("roundTo", Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50"
            >
              <option value={1}>Nearest $1</option>
              <option value={5}>Nearest $5</option>
              <option value={10}>Nearest $10</option>
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Round-up multiplier
            <select
              aria-label="Round-up multiplier"
              value={rules.multiplier}
              disabled={!rules.enabled}
              onChange={(event) => updateRules("multiplier", Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50"
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={3}>3×</option>
            </select>
          </label>
          <label className="text-sm font-medium text-foreground sm:col-span-2">
            Monthly round-up limit
            <select
              aria-label="Monthly round-up limit"
              value={rules.monthlyCap ?? "none"}
              disabled={!rules.enabled}
              onChange={(event) =>
                updateRules(
                  "monthlyCap",
                  event.target.value === "none" ? null : Number(event.target.value),
                )
              }
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50"
            >
              <option value={25}>$25</option>
              <option value={50}>$50</option>
              <option value={100}>$100</option>
              <option value="none">No limit</option>
            </select>
          </label>
          <label className="text-sm font-medium text-foreground sm:col-span-2">
            Estimated card purchases each month
            <span className="mt-2 flex items-center gap-4">
              <input
                aria-label="Estimated card purchases each month"
                type="range"
                min={0}
                max={200}
                step={5}
                value={rules.monthlyTransactions}
                disabled={!rules.enabled}
                onChange={(event) => updateRules("monthlyTransactions", Number(event.target.value))}
                className="min-w-0 flex-1 accent-brand disabled:opacity-50"
              />
              <output className="w-12 text-right tabular-nums text-foreground">
                {rules.monthlyTransactions}
              </output>
            </span>
          </label>
        </div>

        <aside className="flex flex-col justify-between rounded-xl border border-brand/30 bg-brand/5 p-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Estimated monthly savings
            </div>
            <p
              className="mt-3 text-3xl font-semibold text-foreground"
              data-testid="round-up-estimate"
              data-monthly-estimate={monthlyEstimate.toFixed(2)}
            >
              {formatUsd(monthlyEstimate)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Estimate assumes the average round-up is half your selected increment,
              multiplied by your monthly purchase count and multiplier.
            </p>
          </div>
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
            This is a preview only. No round-ups or transfers happen automatically.
          </p>
        </aside>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">External accounts</h3>
              <p className="mt-1 text-sm text-muted">No transaction accounts are connected.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConnectionInfo((visible) => !visible)}
            aria-expanded={showConnectionInfo}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            Link external account
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {showConnectionInfo && (
          <div className="mt-4 border-l-2 border-amber-400/70 bg-amber-400/5 px-4 py-3">
            <p className="text-sm text-foreground">
              Account linking is not available yet because a transaction-data provider is not configured. Your rules are saved on this device, but cannot read purchases or initiate round-ups.
            </p>
            <Link
              href="/ramps/deposit"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Make a one-time deposit instead
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {storageWarning && (
        <p role="status" className="mt-4 text-sm text-amber-300">
          Round-up rules could not be saved in this browser.
        </p>
      )}
    </section>
  );
}