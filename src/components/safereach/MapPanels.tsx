import { useDemo } from "@/context/DemoContext";
import { MARIA, SHELTERS } from "@/data/demo";
import type { Shelter } from "@/data/demo";

function telHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, "")}`;
}

function formatAlertTime(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function aiSummary(mode: string, shelter: Shelter): string {
  if (mode === "DISASTER_ACTIVE") {
    return `${MARIA.name.split(" ")[0]}, power has failed in your area. Your ventilator battery has approximately 5 hours 52 minutes remaining. Emergency services have your location, equipment needs, and confirmed power shelter. Stay where you are unless dispatch tells you otherwise.`;
  }
  if (mode === "WARNING" || mode === "MATCHING" || mode === "MATCHED" || mode === "EVACUATING") {
    return `${MARIA.name.split(" ")[0]}, a Winter Storm Warning is active for Travis County. Power outages are expected within hours. ${shelter.name} has ${shelter.generatorHours} hours of backup power, and ADA transport is tracking toward your home.`;
  }
  return `${MARIA.name.split(" ")[0]}, your ventilator and power wheelchair are electricity-dependent. SafeReach is monitoring Travis County alerts and has a backup-power shelter ready if conditions worsen.`;
}

export function AISummaryCard() {
  const { mode, matchResult } = useDemo();
  const shelter = matchResult?.winner ?? SHELTERS[0];
  return (
    <div className="rounded-card bg-surface p-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber">
        AI Summary
      </div>
      <p className="text-base leading-7 text-white">{aiSummary(mode, shelter)}</p>
    </div>
  );
}

export function ActiveAlertCard() {
  const { mode, nwsAlert } = useDemo();
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
  const { properties } = nwsAlert;
  const issued = formatAlertTime(properties.onset);
  const expires = formatAlertTime(properties.expires);
  return (
    <div className="rounded-card border border-amber bg-amber/10 p-4">
      <div className="text-[18px] font-bold text-amber">{properties.event}</div>
      <div className="text-base text-white">{properties.areaDesc}</div>
      <p className="mt-1 text-[14px] text-white/90">
        {properties.description}
      </p>
      {(issued || expires) && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {issued ? `Issued: ${issued}` : "Issued: active now"}
          {expires ? ` · Expires: ${expires}` : ""}
        </p>
      )}
    </div>
  );
}

export function HelpStatusCard() {
  const { phase, mode, matchResult, communicationResult } = useDemo();
  const shelter = matchResult?.winner ?? SHELTERS[0];

  let line: { text: string; cls: string };
  if (mode === "DISASTER_ACTIVE" || phase === 2) {
    const dispatchStatus =
      communicationResult?.evacuationChoice === "cannot"
        ? "Priority welfare check dispatched"
        : "Emergency services have your live status";
    line = { text: `🚨 ${dispatchStatus} — ${shelter.name} remains open`, cls: "text-danger" };
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
      <p className="mt-2 text-base text-white">Shelter: {shelter.name}</p>
      <a
        href={telHref(shelter.phone)}
        className="mt-1 inline-flex min-h-[48px] items-center text-base font-bold text-amber"
        aria-label={`Call ${shelter.name} at ${shelter.phone}`}
      >
        {shelter.phone}
      </a>
    </div>
  );
}
