import { Shield, Siren, Map as MapIcon, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { useDemo, formatCountdown } from "@/context/DemoContext";
import { AISummaryCard, ActiveAlertCard, HelpStatusCard } from "./MapPanels";
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

function HomeHeader() {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-4">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-safe/15">
          <Shield className="h-5 w-5 text-safe" aria-hidden />
        </span>
        <span className="text-[18px] font-bold tracking-tight text-white">SafeReach</span>
      </div>
      <div className="text-[14px] font-semibold text-white">February 15, 2021</div>
      <StatusPill />
    </header>
  );
}

function AlertHero() {
  const { mode, countdown } = useDemo();

  if (mode === "NORMAL") {
    return (
      <section className="rounded-card border border-safe/30 bg-safe/10 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 shrink-0 text-safe" aria-hidden />
          <div>
            <h1 className="text-[22px] font-bold leading-tight text-white">All Clear</h1>
            <p className="text-[14px] text-white/80">No active alerts in Travis County, TX.</p>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "DISASTER_ACTIVE") {
    return (
      <section className="rounded-card border border-danger bg-danger/15 p-5">
        <div className="flex items-start gap-3">
          <Zap className="h-7 w-7 shrink-0 text-danger" aria-hidden />
          <div className="flex-1">
            <h1 className="text-[22px] font-bold leading-tight text-danger">DISASTER ACTIVE</h1>
            <p className="text-[15px] font-semibold text-white">Power outage confirmed</p>
            <p className="mt-1 text-[13px] text-white/80">
              Travis County, TX · Emergency services notified
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-amber bg-amber/10 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-7 w-7 shrink-0 text-amber" aria-hidden />
        <div className="flex-1">
          <h1 className="text-[22px] font-bold leading-tight text-amber">Winter Storm Warning</h1>
          <p className="text-[14px] text-white">Travis County, TX · Power outages expected</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-[32px] font-bold leading-none text-white tabular-nums">
              {formatCountdown(countdown)}
            </span>
            <span className="text-[12px] uppercase tracking-widest text-white/70">to onset</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrimaryActions() {
  const { setView, mode, dismissLanding } = useDemo();
  const sosPulse = mode === "DISASTER_ACTIVE";

  const go = (v: "shelter" | "sos" | "map" | "profile") => {
    setView(v);
    dismissLanding();
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => go("shelter")}
        className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card bg-amber px-6 text-[20px] font-bold text-navy shadow-lg transition-transform active:scale-[0.99]"
      >
        <Shield className="h-7 w-7" aria-hidden />
        Get to Safety
      </button>
      <button
        onClick={() => go("sos")}
        className={cn(
          "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card bg-danger px-6 text-[20px] font-bold text-white shadow-lg ring-4 ring-danger/30 transition-transform active:scale-[0.99]",
          sosPulse && "animate-sos-pulse",
        )}
      >
        <Siren className="h-7 w-7" aria-hidden />
        S.O.S
      </button>
    </div>
  );
}

function ContextCards() {
  const { mode } = useDemo();
  if (mode === "NORMAL") {
    return <AISummaryCard />;
  }
  return (
    <div className="flex flex-col gap-3">
      <HelpStatusCard />
      <ActiveAlertCard />
    </div>
  );
}

function ViewMapButton() {
  const { setView, dismissLanding } = useDemo();
  return (
    <button
      onClick={() => {
        setView("map");
        dismissLanding();
      }}
      className="flex min-h-tap w-full items-center justify-center gap-2 rounded-card border border-white/15 bg-surface/50 px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-surface"
    >
      <MapIcon className="h-5 w-5" aria-hidden />
      View Map — shelter & family locations
    </button>
  );
}

export function HomeScreen() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <HomeHeader />
      <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-5">
        <AlertHero />
        <PrimaryActions />
        <ContextCards />
        <ViewMapButton />
      </div>
    </div>
  );
}
