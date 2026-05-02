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

export interface CommunicationResult {
  notifications: Notification[];
  emergencySMS: string;
  generatedAt: string;
  evacuationChoice: "confirmed" | "cannot";
  referenceCode: "TXV-2847";
}

function fmt(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// --- Fallback generators using runtime values ---

function fallbackUserAlert(user: User, match: MatchResult): string {
  return (
    `Winter Storm Warning issued for Travis County. ` +
    `Your ventilator depends on electricity. ` +
    `You have been matched to ${match.winner.name}. ` +
    `Transport arranged. Reference: ${OEM_REFERENCE}.`
  );
}

function fallbackContactMessage(user: User, match: MatchResult, contacts: Contact[]): string {
  return (
    `${user.name} has been matched to ${match.winner.name} ` +
    `(${match.winner.distanceMiles} miles). ` +
    `ADA transport arranged — ETA 8h 30min. ` +
    `Shelter direct line: ${match.winner.phone}. ` +
    `Reference: ${OEM_REFERENCE}.`
  );
}

function fallbackShelterIntake(user: User, match: MatchResult, contacts: Contact[]): string {
  return (
    `INCOMING RESIDENT: ${user.name}, ${user.age}F.\n` +
    `Equipment: Ventilator (continuous power required), Power Wheelchair (charging required).\n` +
    `Transport: ADA van, ETA 8h 30min. Entrance: south ramp, wheelchair accessible.\n` +
    `Communication: Large text alerts only — no audio.\n` +
    `Emergency contact: ${contacts[0]?.name} ${contacts[0]?.phone}.\n` +
    `Reference: ${OEM_REFERENCE}.`
  );
}

function fallbackOemFlag(
  user: User,
  match: MatchResult,
  evacuationChoice: "confirmed" | "cannot",
): string {
  if (evacuationChoice === "cannot") {
    return (
      `PRIORITY WELFARE CHECK — ${user.name}, ${user.age}F, ${user.zip}.\n` +
      `Ventilator-dependent. Cannot self-evacuate. Lives alone.\n` +
      `Address: 4821 S Congress Ave, Austin TX 78745.\n` +
      `GPS: 30.2672, -97.7431.\n` +
      `Equipment: Ventilator (~5h 52min battery), Power wheelchair (45%).\n` +
      `Dispatch ADA-accessible vehicle immediately.\n` +
      `Reference: ${OEM_REFERENCE}.`
    );
  }
  return (
    `Match confirmed: ${user.name} → ${match.winner.name}.\n` +
    `Transport: ADA van arranged. Ventilator-dependent.\n` +
    `Reference: ${OEM_REFERENCE}.`
  );
}

function fallbackEmergencySMS(
  user: User,
  match: MatchResult,
  contacts: Contact[],
  evacuationChoice: "confirmed" | "cannot",
): string {
  const status = evacuationChoice === "cannot" ? "STRANDED — Cannot self-evacuate" : "EVACUATING — Transport confirmed";
  return (
    `SAFEREACH EMERGENCY ALERT\n` +
    `Ref: ${OEM_REFERENCE} | Feb 15 2021 03:17 AM\n\n` +
    `RESIDENT: ${user.name}, ${user.age}F\n` +
    `STATUS: ${status}\n` +
    `LOCATION: 4821 S Congress Ave, Austin TX 78745\n` +
    `GPS: 30.2672, -97.7431 [LIVE — updated 3:17 AM]\n\n` +
    `MEDICAL NEEDS (CRITICAL):\n` +
    `• Ventilator — electricity-dependent — ~5h 52min battery remaining\n` +
    `• Power wheelchair — battery 45% (~3h 20min)\n` +
    `• Requires accessible transport (cannot use standard vehicle)\n` +
    `• No caregiver present — lives alone\n\n` +
    `MATCHED SHELTER:\n` +
    `${match.winner.name}\n` +
    `${match.winner.address}\n` +
    `${match.winner.phone}\n` +
    `Distance: ${match.winner.distanceMiles} miles\n` +
    `Status: OPEN · Generator confirmed running\n` +
    `Shelter notified of incoming resident: YES\n\n` +
    `HOW TO REACH HER:\n` +
    `• ADA-accessible van required (power wheelchair)\n` +
    `• Front entrance accessible — ramp on south side\n` +
    `• Will not be able to open door — needs assistance\n` +
    `• Call before arrival: she cannot shout\n\n` +
    `TRANSPORT WINDOW: ~45 minutes before ventilator\n` +
    `critical threshold\n\n` +
    `EMERGENCY CONTACTS:\n` +
    `${contacts.map((c) => `${c.name} (${c.relationship}): ${c.phone}`).join("\n")}\n\n` +
    `SAFEREACH PROFILE: verified by Travis County OEM\n` +
    `Registered: January 2021 | ID: USR-001`
  );
}

// --- Claude API call helper ---

async function callClaude(
  prompt: string,
  maxTokens: number,
): Promise<string | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" && text.length > 5 ? text : null;
  } catch {
    return null;
  }
}

export async function runCommunicationAgent(
  match: MatchResult,
  user: User,
  contacts: Contact[],
  evacuationChoice: "confirmed" | "cannot" | null,
): Promise<CommunicationResult> {
  const now = new Date();
  const choice = evacuationChoice ?? "confirmed";
  const contactNames = contacts.map((c) => `${c.name} (${c.relationship})`).join(", ");
  const status = choice === "cannot" ? "STRANDED — Cannot self-evacuate" : "EVACUATING — Transport confirmed";

  // Build 5 Claude prompts
  const prompts: { prompt: string; maxTokens: number }[] = [
    // 1. User alert
    {
      prompt: `You are SafeReach emergency system. Write a large-text alert for ${user.name}, ${user.age}F, ventilator-dependent. Winter Storm Warning for Travis County. Matched to ${match.winner.name} (${match.winner.distanceMiles} mi, ${match.winner.generatorHours}h generator). Transport arranged. Reference ${OEM_REFERENCE}. 3 short sentences. Most urgent fact first.`,
      maxTokens: 100,
    },
    // 2. Contact message
    {
      prompt: `Write a brief SMS to ${contactNames} about ${user.name}. She has been matched to ${match.winner.name}. ADA transport ETA 8h 30min. Shelter phone: ${match.winner.phone}. Reference: ${OEM_REFERENCE}. Keep under 80 tokens. Reassuring but factual.`,
      maxTokens: 80,
    },
    // 3. Shelter intake
    {
      prompt: `Write a clinical shelter intake notification for ${match.winner.name}. Incoming: ${user.name}, ${user.age}F. Equipment: Ventilator (continuous power), Power Wheelchair. Transport: ADA van ETA 8h 30min. South ramp entrance. Communication: large text only. Emergency contact: ${contacts[0]?.name} ${contacts[0]?.phone}. Reference: ${OEM_REFERENCE}. Clinical format.`,
      maxTokens: 180,
    },
    // 4. OEM flag
    {
      prompt: choice === "cannot"
        ? `Write a PRIORITY WELFARE CHECK for Travis County OEM. ${user.name}, ${user.age}F, ${user.zip}. Ventilator-dependent, cannot self-evacuate, lives alone. Address: 4821 S Congress Ave, Austin TX 78745. GPS: 30.2672, -97.7431. Equipment: Ventilator ~5h 52min battery, Power wheelchair 45%. Dispatch ADA vehicle. Reference: ${OEM_REFERENCE}.`
        : `Write an OEM confirmation: ${user.name} matched to ${match.winner.name}. ADA transport arranged. Ventilator-dependent. Reference: ${OEM_REFERENCE}. Brief official format.`,
      maxTokens: 120,
    },
    // 5. Emergency SMS packet
    {
      prompt: `Write a complete emergency SMS data packet for county emergency services about ${user.name}, ${user.age}F. Status: ${status}. Address: 4821 S Congress Ave, Austin TX 78745. GPS: 30.2672, -97.7431. Equipment: Ventilator (electricity-dependent, ~5h 52min battery), Power wheelchair (45%, ~3h 20min). Cannot use standard vehicle — ADA van required. Lives alone, no caregiver. Matched shelter: ${match.winner.name}, ${match.winner.address}, ${match.winner.phone}, ${match.winner.distanceMiles} mi, generator running. How to reach: south ramp, cannot open door, call before arrival. Emergency contacts: ${contacts.map((c) => `${c.name} (${c.relationship}): ${c.phone}`).join(", ")}. SafeReach ID: USR-001. Reference: ${OEM_REFERENCE}. Format as structured emergency dispatch document.`,
      maxTokens: 400,
    },
  ];

  // Fire all 5 Claude calls in parallel
  const results = await Promise.all(
    prompts.map((p) => callClaude(p.prompt, p.maxTokens)),
  );

  // Build notifications with Claude text or fallback
  const notifications: Notification[] = [];

  // 1. User alert
  notifications.push({
    id: "notif_user",
    timestamp: fmt(now),
    recipient: user.name,
    method: "Large Text Alert",
    message: results[0] ?? fallbackUserAlert(user, match),
    status: "sent",
  });

  // 2. Contact message (one notification per contact)
  const contactMsg = results[1] ?? fallbackContactMessage(user, match, contacts);
  contacts.forEach((c, i) => {
    notifications.push({
      id: `notif_contact_${i}`,
      timestamp: fmt(new Date(now.getTime() + 500)),
      recipient: `${c.name} (${c.relationship})`,
      method: c.method === "phone_sms" ? "Phone + SMS" : "SMS",
      message: contactMsg,
      status: "sent",
    });
  });

  // 3. Shelter intake
  notifications.push({
    id: "notif_shelter",
    timestamp: fmt(new Date(now.getTime() + 800)),
    recipient: match.winner.name,
    method: "Shelter Intake System",
    message: results[2] ?? fallbackShelterIntake(user, match, contacts),
    status: "sent",
  });

  // 4. OEM flag
  notifications.push({
    id: "notif_oem",
    timestamp: fmt(new Date(now.getTime() + 900)),
    recipient: "Travis County OEM Dashboard",
    method: "OEM System",
    message: results[3] ?? fallbackOemFlag(user, match, choice),
    status: choice === "cannot" ? "escalated" : "sent",
  });

  // 5. Emergency SMS log entry (the full SMS is stored separately)
  const emergencySMS = results[4] ?? fallbackEmergencySMS(user, match, contacts, choice);
  notifications.push({
    id: "notif_emergency_sms",
    timestamp: fmt(new Date(now.getTime() + 1000)),
    recipient: "Travis County Emergency Services",
    method: "Emergency SMS Packet",
    message: `Emergency SMS packet generated and ready for transmission. Reference: ${OEM_REFERENCE}.`,
    status: "sent",
  });

  return {
    notifications,
    emergencySMS,
    generatedAt: now.toISOString(),
    evacuationChoice: choice,
    referenceCode: "TXV-2847",
  };
}
