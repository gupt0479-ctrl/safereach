import { useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import { OEM_REFERENCE } from "@/data/demo";

const SMS_TEXT = `SAFEREACH EMERGENCY ALERT
Ref: TXV-2847 | Feb 15 2021 03:17 AM

RESIDENT: Maria Alvarez, 58F
STATUS: STRANDED — Cannot self-evacuate
LOCATION: 4821 S Congress Ave, Austin TX 78745
GPS: 30.2672, -97.7431 [LIVE — updated 3:17 AM]

MEDICAL NEEDS (CRITICAL):
• Ventilator — electricity-dependent — ~5h 52min battery remaining
• Power wheelchair — battery 45% (~3h 20min)
• Requires accessible transport (cannot use standard vehicle)
• No caregiver present — lives alone

MATCHED SHELTER:
Dell Seton Medical Shelter
1500 Red River St, Austin TX 78701
(512) 555-0311
Distance: 4.2 miles
Status: OPEN · Generator confirmed running
Shelter notified of incoming resident: YES

HOW TO REACH HER:
• ADA-accessible van required (power wheelchair)
• Front entrance accessible — ramp on south side
• Will not be able to open door — needs assistance
• Call before arrival: she cannot shout

TRANSPORT WINDOW: ~45 minutes before ventilator
critical threshold

EMERGENCY CONTACTS:
Sarah Alvarez (Daughter): (512) 555-0142
James Okafor (Home Health Aide): (512) 555-0198

SAFEREACH PROFILE: verified by Travis County OEM
Registered: January 2021 | ID: USR-001`;

function StatusPill() {
  const { mode } = useDemo();
  const map: Record<string, { text: string; cls: string }> = {
    NORMAL: { text: "Normal", cls: "bg-safe text-navy" },
    WARNING: { text: "Storm Warning Active", cls: "bg-amber text-navy" },
    MATCHING: { text: "Matching", cls: "bg-amber text-navy" },
    MATCHED: { text: "Match Confirmed", cls: "bg-safe text-navy" },
    EVACUATING: { text: "Evacuating", cls: "bg-amber text-navy" },
    CANNOT_EVACUATE: { text: "Cannot Evacuate — OEM Notified", cls: "bg-danger text-white" },
    DISASTER_ACTIVE: { text: "DISASTER ACTIVE", cls: "bg-danger text-white" },
  };
  const m = map[mode] ?? map.NORMAL;
  return (
    <span className={`inline-block rounded-full px-4 py-1.5 text-[15px] font-bold ${m.cls}`}>
      {m.text}
    </span>
  );
}

export function SosScreen() {
  const { sendSos, smsSent } = useDemo();
  const [transmitting, setTransmitting] = useState(false);

  const handleSend = () => {
    setTransmitting(true);
    setTimeout(() => {
      sendSos();
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

      <section className="rounded-card bg-surface p-4 text-[16px] text-white">
        <p>📍 Last known location: 78745, Austin TX</p>
        <p>🫁 Ventilator: ~5h 52min battery remaining</p>
        <p>📡 Transmission status: Active</p>
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
            className="mt-6 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-card bg-danger px-4 text-[18px] font-bold text-white disabled:opacity-70"
          >
            {transmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Transmitting...
              </>
            ) : (
              <>📱 Send Emergency SMS</>
            )}
          </button>
        ) : (
          <div className="mt-6 rounded-card bg-safe px-4 py-4 text-center text-[16px] font-bold text-navy">
            ✓ SMS Sent — Travis County OEM notified at 3:17 AM. Reference: {OEM_REFERENCE}.
          </div>
        )}
      </section>

      <section className="rounded-card border-l-4 border-amber bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            SMS · Travis County Emergency Services
          </div>
          <span className="rounded-full bg-safe/20 px-2 py-0.5 text-[11px] font-bold text-safe">
            Delivered
          </span>
        </div>
        <div className="rounded-card border border-white/15 bg-navy p-4 ring-1 ring-amber/20">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[14px] leading-7 text-white">
{SMS_TEXT}
          </pre>
        </div>
        <p className="mt-2 text-right text-[12px] text-muted-foreground">
          Sent via SafeReach · 03:17 AM
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <a
          href="tel:5125550311"
          className="flex min-h-tap items-center justify-center gap-2 rounded-card border border-white/30 px-4 py-3 text-[15px] font-bold text-white"
        >
          <Phone className="h-4 w-4" /> Call Shelter Directly — (512) 555-0311
        </a>
        <a
          href="tel:5125550142"
          className="flex min-h-tap items-center justify-center gap-2 rounded-card border border-white/30 px-4 py-3 text-[15px] font-bold text-white"
        >
          <Phone className="h-4 w-4" /> Call Sarah (Daughter) — (512) 555-0142
        </a>
        <a
          href="tel:5125559111"
          className="flex min-h-tap items-center justify-center gap-2 rounded-card border border-white/30 px-4 py-3 text-[15px] font-bold text-white"
        >
          <Phone className="h-4 w-4" /> Call Travis County OEM — (512) 555-9111
        </a>
      </div>

      <section className="rounded-card bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safe opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-safe" />
          </span>
          <p className="text-[15px] font-bold text-white">
            📡 Automatic location ping every 15 minutes
          </p>
        </div>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Last ping: 3:17 AM · Next: 3:32 AM
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Emergency services can see this location in real time.
        </p>
      </section>
    </div>
  );
}
