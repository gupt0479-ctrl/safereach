import { CheckCircle2 } from "lucide-react";
import { CONTACTS, MARIA, OEM_REFERENCE } from "@/data/demo";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/utils";

const EQUIPMENT_META: Record<string, { icon: string; label: string; sub: string; subCls: string }> = {
  ventilator: {
    icon: "🫁",
    label: "Ventilator",
    sub: "Electricity required 24/7",
    subCls: "text-danger",
  },
  power_wheelchair: {
    icon: "♿",
    label: "Power Wheelchair",
    sub: "Electricity required",
    subCls: "text-muted-foreground",
  },
};

function buildEquipmentGrid() {
  const equipment = MARIA.equipment.map((id) => (
    EQUIPMENT_META[id] ?? {
      icon: "⚕",
      label: id.replace(/_/g, " "),
      sub: "Medical equipment",
      subCls: "text-muted-foreground",
    }
  ));

  if (!MARIA.canSelfEvacuate) {
    equipment.push({
      icon: "🚗",
      label: "Cannot Self-Evacuate",
      sub: MARIA.requiresAccessibleTransport ? "ADA transport required" : "Transport assistance required",
      subCls: "text-amber",
    });
  }

  if (MARIA.commMode === "large_text") {
    equipment.push({
      icon: "💬",
      label: "Large Text Alerts",
      sub: "No audio-only notifications",
      subCls: "text-muted-foreground",
    });
  }

  return equipment;
}

function Toggle({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[16px] text-white">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          on ? "bg-safe" : "bg-white/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </div>
  );
}

function ContactCard({
  name, role, phone, distance, notified,
}: { name: string; role: string; phone: string; distance: string; notified: boolean }) {
  return (
    <article className="rounded-card bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-safe" />
        <span className="text-[14px] font-semibold text-white">
          Safe · {distance}
        </span>
      </div>
      <h3 className="mt-1 text-[18px] font-bold text-white">{name}</h3>
      <p className="text-[14px] text-muted-foreground">{role}</p>
      <a
        href={`tel:${phone.replace(/\D/g, "")}`}
        className="mt-1 inline-flex min-h-[48px] items-center text-[16px] font-bold text-amber"
        aria-label={`Call ${name} at ${phone}`}
      >
        {phone}
      </a>
      {notified && (
        <div className="mt-2 rounded-card bg-safe/10 p-2">
          <span className="inline-block rounded-full bg-safe px-2 py-0.5 text-[11px] font-bold text-navy">
            Notified ✓
          </span>
          <p className="mt-1 text-[13px] text-white">
            Notified at 3:15 AM — Shelter match confirmed, transport arranged.
          </p>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`tel:${phone.replace(/\D/g, "")}`}
          className="flex min-h-tap items-center justify-center rounded-card bg-safe px-3 text-[14px] font-bold text-navy"
        >
          Call {name.split(" ")[0]}
        </a>
        <button
          type="button"
          className="flex min-h-tap items-center justify-center rounded-card border border-white/30 px-3 text-[14px] font-bold text-white"
          aria-label={`Send update to ${name}`}
        >
          Send Update
        </button>
      </div>
    </article>
  );
}

export function ProfileScreen() {
  const { notifications, mode, generatingNotifications } = useDemo();
  const notifiedAll = mode !== "NORMAL" && notifications.length > 0;
  const equipment = buildEquipmentGrid();

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
      <header>
        <h1 className="text-[24px] font-bold text-white">
          {MARIA.name.split(" ")[0]}'s Emergency Profile
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Managed by Travis County OEM
        </p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-safe/15 px-3 py-1">
          <CheckCircle2 className="h-4 w-4 text-safe" />
          <span className="text-[13px] font-bold text-safe">
            Verified by OEM Medical Staff · Jan 2021
          </span>
        </div>
      </header>

      {/* Personal Info */}
      <section className="rounded-card bg-surface p-5">
        <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
          Personal Information
        </h2>
        <dl className="space-y-1 text-[16px] text-white">
          <div><span className="text-muted-foreground">Full name:</span> {MARIA.name}</div>
          <div><span className="text-muted-foreground">Age:</span> {MARIA.age}</div>
          <div><span className="text-muted-foreground">Home address:</span> 4821 S Congress Ave, Austin TX 78745</div>
          <div><span className="text-muted-foreground">ZIP:</span> {MARIA.zip}</div>
          <div><span className="text-muted-foreground">County:</span> Travis County</div>
        </dl>
      </section>

      {/* Equipment */}
      <section>
        <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
          My Equipment & Needs
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {equipment.map((e) => (
            <div key={e.label} className="rounded-card bg-navy p-4 ring-1 ring-white/10">
              <div className="text-[20px]">{e.icon}</div>
              <div className="mt-1 text-[16px] font-bold text-white">{e.label}</div>
              <div className={cn("text-[14px]", e.subCls)}>{e.sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-card bg-surface p-4">
          <div className="text-[14px] text-muted-foreground">Additional medical notes:</div>
          <p className="mt-1 text-[16px] text-white">
            Requires ventilator connection within 6 hours of battery depletion.
            Power chair must be charged daily. Allergic to latex.
          </p>
        </div>
      </section>

      {/* Communication */}
      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
          How I receive alerts
        </h2>
        <div className="divide-y divide-white/10">
          <Toggle on label="Large text alerts" />
          <Toggle on label="Flash screen for urgent alerts" />
          <Toggle on={false} label="Audio readout of alerts" />
          <Toggle on label="SMS notifications to emergency contacts" />
        </div>
      </section>

      {/* Emergency contacts & family */}
      <section>
        <h2 className="text-[20px] font-bold text-white">Emergency Contacts & Family</h2>
        <p className="mb-4 mt-1 text-[14px] text-muted-foreground">
          These people are notified automatically when an alert is triggered.
        </p>
        <div className="space-y-3">
          {CONTACTS.map((c) => (
            <ContactCard
              key={c.id}
              name={c.name}
              role={`${c.relationship} · ${c.id === "contact_001" ? "Primary emergency contact" : "Secondary contact"}`}
              phone={c.phone}
              distance={`${c.distanceMiles} miles away`}
              notified={notifiedAll}
            />
          ))}
          <button
            type="button"
            className="min-h-[48px] w-full rounded-card border border-amber bg-amber/10 px-4 font-bold text-amber"
            aria-label="Add emergency contact, visual placeholder only"
          >
            + Add Emergency Contact
          </button>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
            Recent Notifications Sent
          </h3>
          {generatingNotifications ? (
            <div
              className="rounded-card border border-amber bg-amber/10 p-3"
              role="status"
              aria-label="Generating notifications"
            >
              <p className="text-[14px] font-bold text-amber">
                ⏳ Generating notifications...
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                AI is creating personalized alerts for your contacts, shelter, and emergency services.
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <p className="rounded-card border border-dashed border-border bg-surface p-3 text-[14px] text-muted-foreground">
              Notifications will appear here when an alert is active.
            </p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-card bg-surface p-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-mono font-bold text-white">{n.timestamp}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                        n.status === "escalated"
                          ? "bg-danger/20 text-danger"
                          : "bg-safe/20 text-safe",
                      )}
                    >
                      {n.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-white">{n.recipient}</div>
                  <div className="text-[13px] text-muted-foreground">{n.method}</div>
                  <div className="mt-1 text-[14px] text-white/90">{n.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* emPOWER footer */}
      <div className="rounded-card border border-muted bg-navy p-4">
        <div className="text-[14px] font-bold text-white">⚡ Risk Profile Data</div>
        <p className="mt-1 text-[14px] text-white">
          Your profile is cross-referenced with HHS emPOWER — Travis County
          has 4,200+ electricity-dependent Medicare beneficiaries.
        </p>
        <p className="mt-1 text-[12px] italic text-muted-foreground">
          Source: U.S. Dept. of Health & Human Services · Reference {OEM_REFERENCE}
        </p>
      </div>
    </div>
  );
}
