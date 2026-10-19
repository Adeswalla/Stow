"use client";

import { useEffect, useState } from "react";
import { PartyPopper, Share2, Volume2, VolumeX, X } from "lucide-react";
import { formatStroopsAmount } from "@/lib/currency";

const MILESTONES = [100, 75, 50, 25];
const SOUND_PREFERENCE_KEY = "stow-celebration-sound-enabled";

interface GoalMilestoneCelebrationProps {
  goalId: string;
  goalName: string;
  currentAmount: string;
  targetAmount: string;
  percentage: number;
}

function playCelebrationSound() {
  try {
    const context = new window.AudioContext();
    const notes = [523.25, 659.25, 783.99];
    const playNotes = () => {
      const startAt = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const noteStart = startAt + index * 0.14;

        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.17);
      });

      window.setTimeout(() => void context.close(), 600);
    };

    if (context.state === "suspended") {
      void context.resume().then(playNotes).catch(() => void context.close());
    } else {
      playNotes();
    }
  } catch {
    // Audio is optional and may be unavailable in some browsers.
  }
}

export default function GoalMilestoneCelebration({
  goalId,
  goalName,
  currentAmount,
  targetAmount,
  percentage,
}: GoalMilestoneCelebrationProps) {
  const [milestone, setMilestone] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let soundShouldPlay = false;
    try {
      soundShouldPlay = window.localStorage.getItem(SOUND_PREFERENCE_KEY) === "true";
      setSoundEnabled(soundShouldPlay);
    } catch {
      setSoundEnabled(false);
    }

    const reachedMilestone = MILESTONES.find((value) => percentage >= value);
    if (!reachedMilestone) return;

    const storageKey = `stow-goal-milestone:${goalId}:${reachedMilestone}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, "celebrated");
    } catch {
      // Continue showing the celebration when browser storage is unavailable.
    }
    setMilestone(reachedMilestone);
    if (soundShouldPlay) playCelebrationSound();
  }, [goalId, percentage]);

  if (milestone === null) return null;

  const handleSoundToggle = () => {
    const enabled = !soundEnabled;
    setSoundEnabled(enabled);
    try {
      window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
    } catch {
      // The current session still honors the selected preference.
    }
    if (enabled) playCelebrationSound();
  };

  const handleShare = async () => {
    setShareMessage("");
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) {
      setShareMessage("This browser could not create the achievement card.");
      return;
    }

    context.fillStyle = "#071b1a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0d3b35";
    context.beginPath();
    context.arc(1100, 80, 250, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#2dd4bf";
    context.lineWidth = 3;
    context.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
    context.textAlign = "center";
    context.fillStyle = "#8ceadd";
    context.font = "600 26px sans-serif";
    context.fillText("STOW  /  SAVINGS MILESTONE", 600, 120);
    context.fillStyle = "#f3f8f4";
    context.font = "700 96px sans-serif";
    context.fillText(`${milestone}%`, 600, 270);
    context.fillStyle = "#8ceadd";
    context.font = "500 28px sans-serif";
    context.fillText("OF THE WAY THERE", 600, 320);
    context.fillStyle = "#f3f8f4";
    context.font = "600 42px sans-serif";
    context.fillText(goalName, 600, 410, 960);
    context.fillStyle = "#b7c9c4";
    context.font = "400 25px sans-serif";
    context.fillText(
      `${formatStroopsAmount(currentAmount)} / ${formatStroopsAmount(targetAmount)} XLM`,
      600,
      470,
    );

    const image = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!image) {
      setShareMessage("This browser could not create the achievement card.");
      return;
    }

    const file = new File([image], "stow-savings-milestone.png", {
      type: "image/png",
    });
    const shareData = {
      files: [file],
      title: `${milestone}% savings milestone`,
      text: `I reached ${milestone}% of my ${goalName} savings goal on Stow.`,
    };

    try {
      if (
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    const imageUrl = URL.createObjectURL(image);
    const download = document.createElement("a");
    download.href = imageUrl;
    download.download = "stow-savings-milestone.png";
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
    setShareMessage("Achievement card downloaded, ready to share.");
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4">
      <section
        aria-labelledby="milestone-title"
        aria-modal="true"
        className="animate-rise relative w-full max-w-lg overflow-hidden rounded-2xl border border-brand/30 bg-background shadow-2xl"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Close milestone celebration"
          onClick={() => setMilestone(null)}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-muted transition-colors hover:bg-white/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative overflow-hidden bg-[#0d302c] px-6 pb-7 pt-10 text-center sm:px-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border border-brand/20" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-36 w-36 rounded-full border border-amber-300/20" />
          <PartyPopper
            className="animate-float mx-auto mb-4 h-10 w-10 text-amber-300"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold uppercase text-brand">
            Savings milestone
          </p>
          <h2 id="milestone-title" className="mt-3 text-3xl font-semibold text-white">
            {milestone}% reached!
          </h2>
          <p className="mx-auto mt-2 max-w-sm break-words text-sm text-white/75">
            You&apos;re making great progress on {goalName}.
          </p>
          <div className="mx-auto mt-6 max-w-sm border-y border-white/15 py-4">
            <p className="text-xl font-semibold text-white">
              {formatStroopsAmount(currentAmount)} / {formatStroopsAmount(targetAmount)} XLM
            </p>
            <p className="mt-1 text-xs text-white/60">saved toward your goal</p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-muted" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted" aria-hidden="true" />
              )}
              <span className="text-sm font-medium text-foreground">
                Celebration sound
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              aria-label="Celebration sound"
              onClick={handleSoundToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 ${soundEnabled ? "bg-brand" : "bg-border"}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${soundEnabled ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-[#06211e] transition-colors hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share achievement card
          </button>
          {shareMessage && (
            <p role="status" className="text-center text-xs text-muted">
              {shareMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}