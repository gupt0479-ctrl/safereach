import { useMemo, useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import { CONTACTS, MARIA, OEM_REFERENCE, SHELTERS } from "@/data/demo";

function telHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, "")}`;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function equipmentLabel(id: string): string {
  const labels: Record<string, string> = {
    ventilator: "Ventilator",
    power_wheelchair: "Power wheelchair",
  };
  return labels[id] ?? id.replace(/_/g, " ");
}

function StatusPill() {
  const { mode } = useDemo();
  const map: Record<string, { text: string; icon: string; cls: string }> = {
    NORMAL: { text: "Normal", icon: "✓", cls: "bg-safe text-navy" },
    WARNING: { text: "Storm Warning Active", icon: "⚠️", cls: "bg-amber text-navy" },
    MATCHING: { text: "Matching", icon: "⏳", cls: "bg-amber text-navy" },
    MATCHED: { text: "Match Confirmed", icon: "✓", cls: "bg-safe text-navy" },
    EVACUATING: { text: "Evacuating", icon: "🚐", cls: "bg-amber text-navy" },
    CANNOT_EVACUATE: { text: "Cannot Evacuate — OEM Notified", icon: "🚨", cls: "bg-danger text-white" },
    DISASTER_ACTIVE: { text: "DISASTER ACTIVE", icon: "🚨", cls: "bg-danger text-white" },
  };
  const m = map[mode] ?? map.NORMAL;
  return (
    <span
      className={`inline-block rounded-full px-4 py-1.5 text-[15px] font-bold ${m.cls}`}
      role="status"
      aria-label={`Current status: ${m.text}`}
    >
      {m.icon} {m.text}
    </span>
  );
}

/** Grey shimmer placeholder for the SMS card while it loads. */
function SmsShimmer() {
  return (
    <div
      className="rounded-card border-l-4 border-amber/40 bg-surface p-5"
      role="status"
      aria-label="Generating emergency SMS content"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          SMS · Travis County Emergency Services
        </div>
        <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[11px] font-bold text-amber">
          ⏳ Generating...
        </span>
      </div>
      <div className="space-y-3 rounded-card border border-white/15 bg-navy p-4">
        {/* Shimmer lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-white/10"
            style={{ width: `${70 + Math.random() * 30}%` }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[14px] text-amber">
        ⏳ Generating emergency SMS via AI...
      </p>
    </div>
  );
}

export function SosScreen() {
  const {
    sendSos,
    smsSent,
    emergencySMS,
    generatingNotifications,
    matchResult,
    communicationResult,
  } = useDemo();
  const [transmitting, setTransmitting] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const shelter = matchResult?.winner ?? SHELTERS[0];
  const primaryContact = CONTACTS[0];
  const pingWindow = useMemo(() => {
    const lastPing = new Date();
    const nextPing = new Date(lastPing.getTime() + 15 * 60 * 1000);
    return {
      last: formatClock(lastPing),
      next: formatClock(nextPing),
    };
  }, []);

  const smsLoading = generatingNotifications && !emergencySMS;
  const generatedAt = communicationResult?.generatedAt
    ? formatClock(new Date(communicationResult.generatedAt))
    : null;

  const handleSend = () => {
    setTransmitting(true);
    setTimeout(() => {
      sendSos();
      setSentAt(formatClock(new Date()));
      setTransmitting(false);
    }, 2000);
  };

  return (
    <div
      className="flex flex-col gap-4 px-4 pb-8 pt-4"
      style={{ background: "linear-gradient(180deg, hsl(var(--navy)) 0%, hsl(7 65% 25% / 0.4) 100%)" }}
    >
      <header>
        <h1 className="text-[28px] font-bold text-white">Emergency Mode</h1>
        <div className="mt-2"><StatusPill /></div>
      </header>

      <section
        className="rounded-card bg-surface p-4 text-[16px] text-white"
        aria-label="Current status summary"
      >
        <p>👤 Resident: {MARIA.name}, {MARIA.age}</p>
        <p>📍 Last known location: {MARIA.address}</p>
        <p>🧭 GPS: {MARIA.lat}, {MARIA.lng}</p>
        <p>🫁 Equipment: {MARIA.equipment.map(equipmentLabel).join(", ")}</p>
        <p>⚡ Ventilator: ~5h 52min battery remaining</p>
        <p>🏥 Confirmed shelter: {shelter.name}</p>
        <p>📡 Transmission status: {emergencySMS ? "Emergency SMS ready" : "Generating emergency SMS"}</p>
      </section>

      <section className="rounded-card border-2 border-danger bg-danger/10 p-6">
        <h2 className="text-center text-[24px] font-bold text-danger">
          🆘 Emergency Alert
        </h2>
        <p className="mt-3 text-[18px] leading-7 text-white">
          Tapping <strong>Send Emergency SMS</strong> will transmit your complete
          emergency profile to Travis County Emergency Services. This includes
          your location, medical needs, equipment status, and the fastest
          way to reach you.
        </p>
        {!smsSent ? (
          <button
            onClick={handleSend}
            disabled={transmitting}
            aria-label={transmitting ? "Transmitting emergency SMS" : "Send emergency SMS to Travis County"}
            className="mt-6 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-card bg-danger px-4 text-[18px] font-bold text-white disabled:opacity-70"
          >
            {transmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Transmitting...
              </>
            ) : (
              <>📱 Send Emergency SMS</>
            )}
          </button>
        ) : (
          <div
            className="mt-6 rounded-card bg-safe px-4 py-4 text-center text-[16px] font-bold text-navy"
            role="status"
            aria-label="SMS sent successfully"
          >
            ✓ SMS Sent — Travis County OEM notified{sentAt ? ` at ${sentAt}` : ""}. Reference: {OEM_REFERENCE}.
          </div>
        )}
      </section>

      {/* SMS Content Card — always visible, shimmer while loading */}
      {smsLoading ? (
        <SmsShimmer />
      ) : (
        <section
          className="rounded-card border-l-4 border-amber bg-surface p-5"
          aria-label="Emergency SMS content"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              SMS · Travis County Emergency Services
            </div>
            <span className="rounded-full bg-safe/20 px-2 py-0.5 text-[11px] font-bold text-safe">
              {smsSent ? "✓ Delivered" : emergencySMS ? "✓ Ready" : "Generating"}
            </span>
          </div>
          <div className="rounded-card border border-white/15 bg-navy p-4 ring-1 ring-amber/20">
            {emergencySMS ? (
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[14px] leading-7 text-white">
{emergencySMS}
              </pre>
            ) : (
              <div className="text-[15px] leading-7 text-white">
                <p className="font-bold text-amber">Emergency SMS packet is being generated.</p>
                <p className="mt-2">
                  SafeReach is preparing Maria's runtime profile, GPS, equipment needs,
                  matched shelter, contacts, and dispatch reference for Travis County Emergency Services.
                </p>
              </div>
            )}
          </div>
          <p className="mt-2 text-right text-[12px] text-muted-foreground">
            Sent via SafeReach{generatedAt ? ` · Generated ${generatedAt}` : ""}
          </p>
        </section>
      )}

      <div className="flex flex-col gap-2">
        <a
          href={telHref(shelter.phone)}
          className="flex min-h-tap items-center justify-center gap-2 rounded-card border border-white/30 px-4 py-3 text-[15px] font-bold text-white"
          aria-label={`Call ${shelter.name} directly at ${shelter.phone}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" /> Call Shelter Directly — {shelter.phone}
        </a>
        <a
          href={telHref(primaryContact.phone)}
          className="flex min-h-tap items-center justify-center gap-2 rounded-card border border-white/30 px-4 py-3 text-[15px] font-bold text-white"
          aria-label={`Call ${primaryContact.name}, ${primaryContact.relationship}, at ${primaryContact.phone}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" /> Call {primaryContact.name.split(" ")[0]} ({primaryContact.relationship}) — {primaryContact.phone}
        </a>
        <a
          href="tel:5125559111"
          className="flex min-h-tap items-center justify-center gap-2 rounded-card border border-white/30 px-4 py-3 text-[15px] font-bold text-white"
          aria-label="Call Travis County OEM at (512) 555-9111"
        >
          <Phone className="h-4 w-4" aria-hidden="true" /> Call Travis County OEM — (512) 555-9111
        </a>
      </div>

      <section className="rounded-card bg-surface p-4" aria-label="Auto-ping status">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safe opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-safe" />
          </span>
          <p className="text-[15px] font-bold text-white">
            📡 Automatic location ping every 15 minutes
          </p>
        </div>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Last ping: {pingWindow.last} · Next: {pingWindow.next}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Emergency services can see this location in real time.
        </p>
      </section>
    </div>
  );
}
