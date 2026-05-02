import { useDemo } from "@/context/DemoContext";

function aiSummary(mode: string): string {
  if (mode === "DISASTER_ACTIVE") {
    return "Maria, power has failed in your area. Your ventilator battery has approximately 5 hours 52 minutes remaining. Emergency services have been notified of your location and needs. Stay where you are. Help is en route.";
  }
  if (mode === "WARNING" || mode === "MATCHING" || mode === "MATCHED" || mode === "EVACUATING") {
    return "Maria, a Winter Storm Warning is active for Travis County. Power outages are expected within hours. Your matched shelter has 72 hours of backup power. ADA transport is confirmed and tracking toward your home.";
  }
  return "Maria, your ventilator and power wheelchair are electricity-dependent. A Winter Storm Warning is active for Travis County. Your pre-matched shelter has backup power for 72 hours. Transport is confirmed — an ADA van will reach you before the storm hits.";
}

export function AISummaryCard() {
  const { mode } = useDemo();
  return (
    <div className="rounded-card bg-surface p-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber">
        AI Summary
      </div>
      <p className="text-base leading-7 text-white">{aiSummary(mode)}</p>
    </div>
  );
}

export function ActiveAlertCard() {
  const { mode } = useDemo();
  if (mode === "NORMAL") {
    return (
      <div className="rounded-card bg-surface p-4">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Active Alert
        </div>
        <p className="text-base text-muted-foreground">No active alerts.</p>
      </div>
    );
  }
  return (
    <div className="rounded-card border border-amber bg-amber/10 p-4">
      <div className="text-[18px] font-bold text-amber">Winter Storm Warning</div>
      <div className="text-base text-white">Travis County, TX</div>
      <p className="mt-1 text-[14px] text-white/90">
        A severe winter storm is expected to cause widespread power outages within
        10 hours. Ventilator and power wheelchair users are at critical risk…
      </p>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Issued: Feb 14 11:00pm · Expires: Feb 17 6:00pm
      </p>
    </div>
  );
}

export function HelpStatusCard() {
  const { phase, mode } = useDemo();

  let line: { text: string; cls: string };
  if (mode === "DISASTER_ACTIVE" || phase === 2) {
    line = { text: "🚨 Emergency services dispatched — last ping 4min ago", cls: "text-danger" };
  } else if (phase === 1.5) {
    line = { text: "⏰ Transport ETA recalculated — 1h 45min", cls: "text-amber" };
  } else {
    line = { text: "🚐 ADA Transport confirmed — arrives in ~8h 30min", cls: "text-safe" };
  }

  return (
    <div className="rounded-card bg-surface p-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Help Status
      </div>
      <p className={`text-base font-semibold ${line.cls}`}>{line.text}</p>
      <p className="mt-2 text-base text-white">Shelter: Dell Seton Medical Shelter</p>
      <a
        href="tel:5125550311"
        className="mt-1 inline-block text-base font-bold text-amber"
      >
        (512) 555-0311
      </a>
    </div>
  );
}
