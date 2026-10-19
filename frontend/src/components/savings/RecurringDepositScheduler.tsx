"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Pencil, Plus, Trash2, X } from "lucide-react";
import { validateDepositAmount, type DepositAmountError } from "@/hooks/useDeposit";

type DepositFrequency = "weekly" | "biweekly" | "monthly";

interface RecurringDepositSchedule {
  id: string;
  amount: string;
  frequency: DepositFrequency;
  nextDate: string;
}

interface RecurringDepositSchedulerProps {
  account: string;
}

const FREQUENCY_LABELS: Record<DepositFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

const AMOUNT_ERROR_MESSAGES: Record<DepositAmountError, string> = {
  required: "Enter an amount to deposit.",
  invalid: "Enter a valid number.",
  "too-small": "Amount must be greater than 0.",
};

function storageKey(account: string) {
  return `stow-recurring-deposits:${account}`;
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readSchedules(account: string): RecurringDepositSchedule[] {
  try {
    const stored = window.localStorage.getItem(storageKey(account));
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is RecurringDepositSchedule => {
      if (!value || typeof value !== "object") return false;
      const schedule = value as Partial<RecurringDepositSchedule>;
      return (
        typeof schedule.id === "string" &&
        typeof schedule.amount === "string" &&
        typeof schedule.nextDate === "string" &&
        typeof schedule.frequency === "string" &&
        schedule.frequency in FREQUENCY_LABELS
      );
    });
  } catch {
    return [];
  }
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function newScheduleId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function RecurringDepositScheduler({
  account,
}: RecurringDepositSchedulerProps) {
  const [schedules, setSchedules] = useState<RecurringDepositSchedule[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<DepositFrequency>("weekly");
  const [nextDate, setNextDate] = useState(() => localDateValue(new Date()));
  const [amountError, setAmountError] = useState<DepositAmountError | null>(null);

  useEffect(() => {
    setSchedules(readSchedules(account));
    setStorageReady(true);
  }, [account]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(storageKey(account), JSON.stringify(schedules));
    } catch {
      // Keep the editor usable when browser storage is unavailable.
    }
  }, [account, schedules, storageReady]);

  const resetForm = () => {
    setAmount("");
    setFrequency("weekly");
    setNextDate(localDateValue(new Date()));
    setAmountError(null);
    setEditingId(null);
    setFormOpen(false);
  };

  const editSchedule = (schedule: RecurringDepositSchedule) => {
    setAmount(schedule.amount);
    setFrequency(schedule.frequency);
    setNextDate(schedule.nextDate);
    setAmountError(null);
    setEditingId(schedule.id);
    setFormOpen(true);
  };

  const saveSchedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateDepositAmount(amount);
    setAmountError(validation);
    if (validation) return;

    const schedule: RecurringDepositSchedule = {
      id: editingId ?? newScheduleId(),
      amount: amount.trim(),
      frequency,
      nextDate,
    };

    setSchedules((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? schedule : item))
        : [...current, schedule],
    );
    resetForm();
  };

  return (
    <section
      aria-labelledby="recurring-deposits-title"
      className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6"
      data-testid="recurring-deposit-scheduler"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-brand" aria-hidden="true" />
          <div>
            <h2 id="recurring-deposits-title" className="font-semibold text-foreground">
              Recurring deposits
            </h2>
            <p className="mt-1 text-sm text-muted">
              Set an amount and a cadence for your savings plan.
            </p>
          </div>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add schedule
          </button>
        )}
      </div>

      <p className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        Schedules are saved on this device. Deposits are not sent automatically yet; each deposit still requires completing the partner&apos;s interactive flow.
      </p>

      {formOpen && (
        <form onSubmit={saveSchedule} className="mt-5 border-t border-border pt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="recurring-deposit-amount" className="mb-2 block text-sm font-medium text-foreground">
                Amount (USDC)
              </label>
              <input
                id="recurring-deposit-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                aria-invalid={amountError !== null}
                aria-describedby={amountError ? "recurring-deposit-amount-error" : undefined}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              {amountError && (
                <p id="recurring-deposit-amount-error" role="alert" className="mt-1 text-xs text-red-400">
                  {AMOUNT_ERROR_MESSAGES[amountError]}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="recurring-deposit-frequency" className="mb-2 block text-sm font-medium text-foreground">
                Frequency
              </label>
              <select
                id="recurring-deposit-frequency"
                value={frequency}
                onChange={(event) => setFrequency(event.target.value as DepositFrequency)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recurring-deposit-date" className="mb-2 block text-sm font-medium text-foreground">
                First planned deposit
              </label>
              <input
                id="recurring-deposit-date"
                type="date"
                min={localDateValue(new Date())}
                value={nextDate}
                onChange={(event) => setNextDate(event.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-background-elevated hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              {editingId ? "Save changes" : "Save schedule"}
            </button>
          </div>
        </form>
      )}

      {schedules.length === 0 ? (
        <p className="mt-5 border-t border-border pt-5 text-sm text-muted">
          No recurring deposit schedules yet.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {schedule.amount} USDC <span className="font-normal text-muted">· {FREQUENCY_LABELS[schedule.frequency]}</span>
                </p>
                <p className="mt-1 text-sm text-muted">First planned deposit {formatDate(schedule.nextDate)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => editSchedule(schedule)}
                  aria-label={`Edit ${schedule.amount} USDC schedule`}
                  title="Edit schedule"
                  className="rounded-lg p-2 text-muted hover:bg-background-elevated hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setSchedules((current) => current.filter((item) => item.id !== schedule.id))}
                  aria-label={`Cancel ${schedule.amount} USDC schedule`}
                  title="Cancel schedule"
                  className="rounded-lg p-2 text-muted hover:bg-red-400/10 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}