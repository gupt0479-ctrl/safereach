import type { Contact, User } from "@/data/demo";
import { OEM_REFERENCE } from "@/data/demo";
import type { MatchResult } from "@/agents/matchingAgent";

export interface Notification {
  id: string;
  timestamp: string;
  recipient: string;
  method: string;
  message: string;
  status: "sent" | "pending" | "escalated";
}

function fmt(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function runCommunicationAgent(
  match: MatchResult,
  user: User,
  contacts: Contact[],
  evacuationChoice: "confirmed" | "cannot" | null,
): Notification[] {
  const now = new Date();
  const out: Notification[] = [];

  out.push({
    id: "notif_user",
    timestamp: fmt(now),
    recipient: user.name,
    method: "Large Text Alert",
    message: `Winter Storm Warning issued for Travis County. Your ventilator depends on electricity. You have been matched to ${match.winner.name}. Transport arranged. Reference: ${OEM_REFERENCE}.`,
    status: "sent",
  });

  contacts.forEach((c, i) => {
    out.push({
      id: `notif_contact_${i}`,
      timestamp: fmt(new Date(now.getTime() + 500)),
      recipient: `${c.name} (${c.relationship})`,
      method: c.method === "phone_sms" ? "Phone + SMS" : "SMS",
      message: `${user.name} has been matched to ${match.winner.name}. Transport arranged. Shelter: ${match.winner.phone}. Reference: ${OEM_REFERENCE}.`,
      status: "sent",
    });
  });

  out.push({
    id: "notif_shelter",
    timestamp: fmt(new Date(now.getTime() + 800)),
    recipient: match.winner.name,
    method: "Shelter Intake System",
    message: `Incoming: ${user.name}, ${user.age}F. Equipment: Ventilator (power required), Power Wheelchair. Transport ETA: 8h 30min. Communication: Large text. Emergency contact: ${contacts[0]?.name} ${contacts[0]?.phone}.`,
    status: "sent",
  });

  out.push({
    id: "notif_oem",
    timestamp: fmt(new Date(now.getTime() + 900)),
    recipient: "Travis County OEM Dashboard",
    method: "OEM System",
    message:
      evacuationChoice === "cannot"
        ? `PRIORITY WELFARE CHECK — ${user.name}, ${user.zip}. Ventilator-dependent. Cannot self-evacuate. Immobile. Reference: ${OEM_REFERENCE}.`
        : `Match confirmed: ${user.name} → ${match.winner.name}. Transport required. Ventilator-dependent. Reference: ${OEM_REFERENCE}.`,
    status: evacuationChoice === "cannot" ? "escalated" : "sent",
  });

  return out;
}
