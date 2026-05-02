import { useDemo } from "@/context/DemoContext";
import { MARIA, SHELTERS } from "@/data/demo";
import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WINNER = SHELTERS[0];
const REJECTED = [
  { name: "Austin Community Center", distance: "1.1mi", reason: "No backup power ✗" },
  { name: "Travis County Expo", distance: "7.8mi", reason: "Not wheelchair accessible ✗" },
  { name: "Pflugerville Rec", distance: "16.2mi", reason: "No transport from ZIP 78745 ✗" },
  { name: "South Austin Senior", distance: "3.1mi", reason: "No backup power ✗" },
];

function PhaseIndicator() {
  const { phase, mode } = useDemo();
  const idx = phase === 1 ? 0 : phase === 1.5 ? 1 : 2;
  const isDisaster = mode === "DISASTER_ACTIVE" || phase === 2;
  const nodes = ["10hrs out", "2hrs out", "During Storm"];
  return (
    <div className="relative flex items-start justify-between gap-2 px-2">
      <div className="absolute left-6 right-6 top-3 h-0.5 bg-white/15" aria-hidden />
      {nodes.map((n, i) => {
        const past = i < idx;
        const active = i === idx;
        return (
          <div key={n} className="relative flex flex-1 flex-col items-center">
            <div
              className={cn(
                "z-10 grid h-7 w-7 place-items-center rounded-full border-2 text-[12px] font-bold",
                past
                  ? "border-safe bg-safe text-navy"
                  : active && isDisaster && i === 2
                    ? "border-danger bg-danger text-white animate-pulse"
                    : active
                      ? "border-amber bg-amber text-navy"
                      : "border-white/25 bg-navy text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <div className="mt-1.5 text-[12px] font-bold text-white">{n}</div>
          </div>
        );
      })}
    </div>
  );
}

function CapabilityBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-safe bg-navy px-3 py-1 text-[14px] font-semibold text-safe">
      {children}
    </span>
  );
}

function MatchedShelterCard({ extraBadge }: { extraBadge?: string }) {
  return (
    <div className="relative rounded-card border-l-4 border-safe bg-surface p-5 shadow-lg">
      <span className="absolute right-3 top-3 rounded-full bg-safe px-2 py-1 text-[12px] font-bold text-navy">
        BEST MATCH
      </span>
      <h2 className="text-[24px] font-bold leading-tight text-white">{WINNER.name}</h2>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {WINNER.address} · {WINNER.distanceMiles} miles away
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <CapabilityBadge>⚡ 72hr Generator</CapabilityBadge>
        <CapabilityBadge>♿ Fully Accessible</CapabilityBadge>
        <CapabilityBadge>🫁 Medical Oxygen</CapabilityBadge>
        {extraBadge && <CapabilityBadge>{extraBadge}</CapabilityBadge>}
      </div>
      <p className="mt-3 text-[14px] font-semibold text-safe">
        {WINNER.capacityUsed} / {WINNER.capacityTotal} spots — Space Available
      </p>
    </div>
  );
}

function WhyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border-l-4 border-info bg-white p-5 shadow-lg">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Why SafeReach chose this shelter
      </div>
      <p className="text-[16px] leading-relaxed text-navy">{children}</p>
    </div>
  );
}

function OtherShelters() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[48px] w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3 text-left text-[14px] font-semibold text-muted-foreground"
        aria-expanded={open}
        aria-label={open ? "Hide other evaluated shelters" : "Show other evaluated shelters"}
      >
        <span>▾ 4 other shelters evaluated</span>
        <ChevronDown
          className={cn("h-4 w-4 transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {REJECTED.map((r) => (
            <li
              key={r.name}
              className="rounded-card border border-muted bg-navy p-3 text-[14px]"
            >
              <div className="font-bold text-white">{r.name}</div>
              <div className="text-muted-foreground">
                {r.distance} — {r.reason}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Phase1() {
  const { transportConfirmed, setTransportConfirmed, appendNotification } = useDemo();
  const handleConfirm = () => {
    if (transportConfirmed) return;
    setTransportConfirmed(true);
    appendNotification({
      id: `notif_confirm_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      recipient: "Travis County OEM + Dell Seton Shelter",
      method: "SMS",
      message: "Maria confirmed she will be ready for ADA pickup. Transport scheduled.",
      status: "sent",
    });
  };
  return (
    <>
      <p className="text-[14px] text-muted-foreground">
        10 hours until impact — Best shelter match for your needs.
      </p>
      <MatchedShelterCard />
      <WhyCard>
        Austin Community Center is 1.1 miles away — but has no backup power.
        Your ventilator would fail. Dell Seton Medical Shelter is 4.2 miles
        away with a 72-hour generator, wheelchair access, and medical oxygen.
        With 10 hours to spare, transport can reach you in time.{" "}
        <strong>This shelter keeps you alive. The closer one does not.</strong>
      </WhyCard>

      <section className="rounded-card bg-surface p-4">
        <div className="text-[16px] font-bold text-white">
          ♿ Accessible Transport Confirmed
        </div>
        <p className="mt-1 text-[16px] text-muted-foreground">
          ADA van arrives at your location in approximately 8h 30min.
        </p>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Driver will call 30 minutes before arrival.
        </p>
        <button
          onClick={handleConfirm}
          disabled={transportConfirmed}
          className={cn(
            "mt-3 min-h-btn w-full rounded-card px-4 font-bold transition",
            transportConfirmed
              ? "bg-safe/40 text-white"
              : "bg-safe text-navy",
          )}
        >
          {transportConfirmed
            ? "✓ Confirmed — Transport Scheduled"
            : "✓ Confirm I'll Be Ready"}
        </button>
      </section>

      <section className="rounded-card bg-surface p-4">
        <div className="text-[14px] text-muted-foreground">
          Direct line — always available during emergency:
        </div>
        <a
          href="tel:5125550311"
          className="mt-1 inline-flex min-h-[48px] items-center text-[22px] font-bold text-amber"
          aria-label="Call shelter direct line at (512) 555-0311"
        >
          (512) 555-0311
        </a>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Shelter has been notified of your arrival and medical needs.
        </p>
      </section>

      <OtherShelters />
    </>
  );
}

function Phase15() {
  const { mode } = useDemo();
  const matching = mode === "MATCHING";
  const [transportCut, setTransportCut] = useState(false);
  return (
    <>
      <div className="rounded-card border border-amber bg-amber/15 p-3">
        <p className="text-[16px] font-bold text-amber">
          ⏱ 2 hours remaining — Match formula updated. Proximity is now critical.
        </p>
      </div>

      {matching ? (
        <div className="flex flex-col items-center gap-3 rounded-card bg-surface p-6">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
          <p className="text-[15px] text-muted-foreground">
            Re-calculating match for 2-hour window...
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-card bg-surface px-3 py-2">
            <span className="text-[14px] text-muted-foreground">
              Demo: simulate transport unavailable
            </span>
            <button
              onClick={() => setTransportCut((v) => !v)}
              aria-pressed={transportCut}
              aria-label="Toggle simulated transport unavailable state"
              className={cn(
                "min-h-[48px] min-w-[64px] rounded-full px-3 py-1 text-[13px] font-bold",
                transportCut ? "bg-danger text-white" : "bg-white/10 text-white",
              )}
            >
              {transportCut ? "ON" : "OFF"}
            </button>
          </div>

          {transportCut ? (
            <div className="rounded-card border border-danger bg-danger/15 p-4">
              <p className="text-[16px] font-bold text-danger">
                ⚠ Transport window closing. Emergency services have been notified
                of your location. Do not attempt to travel alone.
              </p>
              <p className="mt-2 text-[15px] text-white">
                Nearest reachable shelter: <strong>Austin Community Center</strong> (1.1mi)
                — emergency generator being confirmed.
              </p>
              <a
                href="tel:5125559111"
                className="mt-3 block min-h-btn rounded-card bg-danger px-4 py-3 text-center font-bold text-white"
              >
                Call Travis County OEM — (512) 555-9111
              </a>
            </div>
          ) : (
            <>
              <MatchedShelterCard extraBadge="⏱ Reachable in Time" />
              <WhyCard>
                With 2 hours until impact, we recalculated your match prioritizing
                what you can still reach. Dell Seton Medical Shelter remains your
                best option — 4.2 miles, accessible transport confirmed for 1h 45min
                from now. Your transport window has not closed. If it does,
                we will re-match automatically.
              </WhyCard>

              <section className="rounded-card bg-surface p-4">
                <p className="text-[22px] font-bold text-amber">
                  🚐 ADA van ETA: 1h 45min
                </p>
                <p className="mt-1 text-[15px] text-amber">
                  Your transport window closes in approximately 30 minutes.
                </p>
                <button
                  type="button"
                  className="mt-3 min-h-btn w-full rounded-card bg-safe px-4 font-bold text-navy"
                >
                  ✓ I'm Ready — Confirm Pickup Now
                </button>
              </section>

              <OtherShelters />
            </>
          )}
        </>
      )}
    </>
  );
}

function BatteryRow({
  icon, label, pct, time, color, warn,
}: { icon: string; label: string; pct: number; time: string; color: string; warn?: string }) {
  return (
    <div>
      <div className="text-[18px] font-bold text-white">
        {icon} {label}
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="mt-1 text-[16px] font-bold" style={{ color }}>
        {time}
      </p>
      {warn && <p className="text-[14px] text-danger">{warn}</p>}
    </div>
  );
}

function formatBatteryTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s remaining`;
}

function FormulaMetric({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: "danger" | "amber" | "info" | "safe";
}) {
  const toneClass = {
    danger: "bg-danger",
    amber: "bg-amber",
    info: "bg-info",
    safe: "bg-safe",
  }[tone];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold text-white">{label}</span>
        <span className="text-[16px] font-black text-white">{percent}%</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-white/10"
        aria-label={`${label} contributes ${percent} percent`}
      >
        <div className={cn("h-full rounded-full", toneClass)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Phase2FormulaCard() {
  return (
    <div className="rounded-card border border-white/10 bg-surface p-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Phase 2 Triage Formula
      </div>
      <p className="mb-4 text-[15px] text-white">
        Survival mode prioritizes emergency dispatch, not shelter search.
      </p>
      <div className="space-y-3">
        <FormulaMetric label="Equipment urgency" percent={35} tone="danger" />
        <FormulaMetric label="Disability tier" percent={30} tone="amber" />
        <FormulaMetric label="Last check-in" percent={20} tone="info" />
        <FormulaMetric label="Nearby resources" percent={15} tone="safe" />
      </div>
    </div>
  );
}

function Phase2() {
  const { checkedIn, setCheckedIn, transportConfirmed } = useDemo();
  const stranded = !transportConfirmed;
  const [ventilatorSeconds, setVentilatorSeconds] = useState(5 * 60 * 60 + 52 * 60);
  const [wheelchairSeconds, setWheelchairSeconds] = useState(3 * 60 * 60 + 20 * 60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVentilatorSeconds((seconds) => Math.max(0, seconds - 1));
      setWheelchairSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div className="rounded-card border border-danger bg-danger/20 p-4">
        <p className="text-[18px] font-bold text-danger">
          🚨 DISASTER ACTIVE — Power outage confirmed in your area
        </p>
        <p className="text-[14px] text-white">February 15, 2021 · 3:14 AM</p>
        <p className="text-[12px] text-muted-foreground">
          Last grid status update: 4 minutes ago
        </p>
        <p className="mt-2 text-[14px] font-semibold text-white">
          {stranded
            ? "Path: STRANDED — transport pickup was not confirmed before impact."
            : "Path: SHELTERED — pickup was confirmed; you are at Dell Seton."}
        </p>
        <p className="text-[12px] text-muted-foreground">
          Toggle this from Phase 1's "Confirm I'll Be Ready" button.
        </p>
      </div>

      <div className="rounded-card border-l-4 border-danger bg-surface p-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Equipment Battery Status
        </div>
        <div className="space-y-4">
          <BatteryRow
            icon="🫁"
            label="Ventilator"
            pct={78}
            color="hsl(var(--amber))"
            time={formatBatteryTime(ventilatorSeconds)}
            warn="⚠ Connect to backup power source immediately if available."
          />
          <BatteryRow
            icon="♿"
            label="Power Wheelchair"
            pct={45}
            color="hsl(var(--safe))"
            time={formatBatteryTime(wheelchairSeconds)}
          />
        </div>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Emergency services have your equipment status.
        </p>
      </div>

      <div className="rounded-card bg-surface p-4">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Shelter Status — Disaster Mode
        </div>
        <p className="mb-3 text-[14px] text-muted-foreground">
          Dell Seton remains the confirmed safe power location while emergency services track Maria's status.
        </p>
        <div className="rounded-card border border-safe/40 bg-navy p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[18px] font-bold text-white">Dell Seton Medical Shelter</h3>
            <span className="rounded-full bg-safe px-2 py-0.5 text-[11px] font-bold text-navy">
              CONFIRMED OPEN
            </span>
          </div>
          <p className="text-[14px] text-safe">Generator running — confirmed 4:02 AM</p>
          <p className="mt-1 text-[15px] text-white">
            ⚡ Charging stations available for medical equipment
          </p>
          <p className="text-[15px] text-white">
            Medical staff on site — oxygen supply confirmed
          </p>
        </div>
      </div>

      <Phase2FormulaCard />

      {stranded ? (
        <div className="rounded-card border border-danger bg-danger/15 p-4">
          <p className="text-[18px] font-bold text-danger">
            🚨 You have not reached the shelter. Emergency services notified.
          </p>
          <p className="mt-1 text-[14px] text-white">
            Last known location: 78745 · Transmitted 4:03 AM
          </p>
          <p className="text-[14px] text-white">
            Welfare check dispatched — ETA ~22 minutes
          </p>
          <button
            type="button"
            className="mt-3 min-h-btn w-full rounded-card bg-danger px-4 font-bold text-white"
          >
            Send My Location Again
          </button>
        </div>
      ) : checkedIn ? (
        <div className="rounded-card border border-safe bg-safe/10 p-4">
          <p className="text-[16px] font-bold text-safe">
            ✓ Checked in at Dell Seton — Feb 15, 4:47 AM
          </p>
        </div>
      ) : (
        <button
          onClick={() => setCheckedIn(true)}
          className="min-h-btn w-full rounded-card bg-safe px-4 font-bold text-navy"
        >
          Check In Now
        </button>
      )}
    </>
  );
}

export function ShelterScreen() {
  const { phase, mode } = useDemo();
  const isDisaster = mode === "DISASTER_ACTIVE" || phase === 2;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
      <h1 className="text-[24px] font-bold text-white">My Shelter Match</h1>
      <PhaseIndicator />
      {isDisaster ? <Phase2 /> : phase === 1.5 ? <Phase15 /> : <Phase1 />}
    </div>
  );
}
