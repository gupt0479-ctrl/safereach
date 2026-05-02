import { Shield, Siren } from "lucide-react";
import { useDemo, formatCountdown } from "@/context/DemoContext";
import { MapView } from "./MapView";
import { AISummaryCard, ActiveAlertCard, HelpStatusCard } from "./MapPanels";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function StatusPill() {
  const { mode } = useDemo();
  if (mode === "DISASTER_ACTIVE") {
    return (
      <span className="rounded-full bg-danger px-3 py-1 text-[13px] font-bold text-white">
        🚨 Emergency
      </span>
    );
  }
  if (mode === "NORMAL") {
    return (
      <span className="rounded-full bg-safe px-3 py-1 text-[13px] font-bold text-navy">
        ✓ Normal
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber px-3 py-1 text-[13px] font-bold text-navy">
      ⚠ Warning
    </span>
  );
}

function MapHeader() {
  const { mode, countdown } = useDemo();
  const showTimer = mode !== "NORMAL";
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex min-h-[72px] items-center justify-between gap-3 px-4 py-3"
      style={{
        background: "rgba(11, 31, 58, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-safe/15">
          <Shield className="h-5 w-5 text-safe" aria-hidden />
        </span>
        <span className="text-[18px] font-bold tracking-tight text-white">SafeReach</span>
      </div>

      <div className="pointer-events-auto flex flex-col items-center text-center">
        {showTimer ? (
          <>
            <div className="font-mono text-[24px] font-bold leading-none text-amber tabular-nums">
              {formatCountdown(countdown)}
            </div>
            <div className="mt-0.5 text-[14px] text-white">February 15, 2021</div>
          </>
        ) : (
          <div className="text-[14px] font-semibold text-white">February 15, 2021</div>
        )}
      </div>

      <div className="pointer-events-auto pt-1">
        <StatusPill />
      </div>
    </div>
  );
}

function isWarningBannerVisible(mode: string): boolean {
  return (
    mode === "WARNING" ||
    mode === "MATCHING" ||
    mode === "MATCHED" ||
    mode === "EVACUATING" ||
    mode === "CANNOT_EVACUATE" ||
    mode === "DISASTER_ACTIVE"
  );
}

function WarningBanner() {
  const { mode, setView } = useDemo();

  if (!isWarningBannerVisible(mode)) return null;

  return (
    <section
      role="alert"
      aria-label="Winter storm emergency actions"
      className="absolute inset-x-0 z-[492] border-y border-amber/40 bg-amber px-3 py-2 shadow-xl"
      style={{
        bottom: `calc(64px + 60px + env(safe-area-inset-bottom))`,
        minHeight: 96,
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[18px] font-black leading-tight text-navy sm:text-[22px]">
            Winter Storm Warning Active
          </p>
          <p className="mt-0.5 text-[15px] font-bold leading-snug text-navy">
            Maria needs backup power and accessible transport.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setView("shelter")}
            className="min-h-[56px] rounded-card bg-navy px-5 text-[18px] font-black text-white shadow-md"
          >
            Get to Safety
          </button>
          <button
            type="button"
            onClick={() => setView("sos")}
            className="min-h-[56px] rounded-card bg-danger px-5 text-[18px] font-black text-white shadow-md"
          >
            S.O.S
          </button>
        </div>
      </div>
    </section>
  );
}

function LeftPanel() {
  const [open, setOpen] = useState(true);
  const { mode } = useDemo();
  const bannerVisible = isWarningBannerVisible(mode);
  const panelBottom = bannerVisible
    ? `calc(64px + 60px + 96px + env(safe-area-inset-bottom))`
    : `calc(64px + 56px + env(safe-area-inset-bottom))`;
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Collapse details panel" : "Expand details panel"}
        className={cn(
          "absolute z-[490] grid h-12 w-12 place-items-center rounded-r-card bg-surface text-white shadow-lg ring-1 ring-white/10 transition-all md:hidden",
          open ? "left-[calc(min(85vw,340px))]" : "left-0",
        )}
        style={{ top: "55%" }}
      >
        {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      <aside
        className={cn(
          "absolute left-0 top-[120px] z-[480] w-[min(85vw,340px)] overflow-y-auto bg-navy/85 p-3 backdrop-blur-md transition-transform md:w-[300px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ bottom: panelBottom, paddingBottom: 12 }}
      >
        <div className="flex flex-col gap-3">
          <AISummaryCard />
          <ActiveAlertCard />
          <HelpStatusCard />
        </div>
      </aside>
    </>
  );
}

function DemoStrip() {
  const { mode, setMode, setView, runMatch, reset, phase, setPhase } = useDemo();

  const triggerWarning = () => {
    if (mode === "NORMAL") {
      setMode("WARNING");
    }
  };
  const twoOut = () => {
    if (mode === "NORMAL") return;
    setPhase(1.5);
    runMatch(1.5);
    setView("shelter");
  };
  const stormActive = () => {
    if (mode === "NORMAL") return;
    setPhase(2);
    setMode("DISASTER_ACTIVE");
  };

  const canFF = mode !== "NORMAL";
  const canStorm = mode !== "NORMAL" && phase >= 1.5;

  return (
    <div
      className="absolute inset-x-0 z-[490] flex items-center gap-1 bg-amber/95 px-2 py-1.5"
      style={{ bottom: `calc(64px + env(safe-area-inset-bottom))`, minHeight: 48 }}
    >
      <button
        onClick={triggerWarning}
        disabled={mode !== "NORMAL"}
        className="min-h-[48px] flex-1 rounded-card bg-navy px-2 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        🌨 Trigger Warning
      </button>
      <button
        onClick={twoOut}
        disabled={!canFF}
        className="min-h-[48px] flex-1 rounded-card bg-navy px-2 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        ⏩ 2hrs Out
      </button>
      <button
        onClick={stormActive}
        disabled={!canStorm}
        className="min-h-[48px] flex-1 rounded-card bg-danger px-2 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        ⚡ Storm Active
      </button>
      <button
        onClick={reset}
        className="min-h-[48px] min-w-[48px] rounded-card bg-navy/40 px-2 py-2 text-[12px] font-bold text-white"
        aria-label="Reset demo"
      >
        ↺
      </button>
    </div>
  );
}

function FloatingSos() {
  const { setView, mode } = useDemo();
  const pulsing = mode === "DISASTER_ACTIVE";
  const bannerVisible = isWarningBannerVisible(mode);
  return (
    <button
      onClick={() => setView("sos")}
      aria-label="Open emergency SOS"
      className={cn(
        "absolute z-[495] grid h-[72px] w-[72px] place-items-center rounded-full bg-danger text-white shadow-xl ring-4 ring-danger/30",
        pulsing && "animate-sos-pulse",
      )}
      style={{
        right: 16,
        bottom: bannerVisible
          ? `calc(64px + 60px + 96px + env(safe-area-inset-bottom))`
          : `calc(64px + 56px + env(safe-area-inset-bottom))`,
      }}
    >
      <Siren className="h-7 w-7" aria-hidden />
      <span className="absolute bottom-2 text-[12px] font-bold leading-none">S.O.S</span>
    </button>
  );
}

export function MapScreen() {
  return (
    <div className="absolute inset-0">
      <MapView />
      <MapHeader />
      <WarningBanner />
      <LeftPanel />
      <DemoStrip />
      <FloatingSos />
    </div>
  );
}
