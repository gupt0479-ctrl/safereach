import type { Contact, User } from "@/data/demo";
import type { MatchResult } from "@/agents/matchingAgent";

export type NotificationStatus = "sent" | "pending" | "escalated";

export interface Notification {
  id: string;
  timestamp: string;
  recipient: string;
  method: string;
  message: string;
  status: NotificationStatus;
}

export interface CommunicationResult {
  notifications: Notification[];
  generatedAt: string;
  evacuationChoice: "confirmed" | "cannot" | null;
  referenceCode: string;
  emergencySMS: string;
}

async function callClaude(
  prompt: string,
  fallback: string,
  maxTokens: number = 200,
): Promise<string> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      console.warn(`Claude API error: ${response.status}`);
      return fallback;
    }
    const data = await response.json();
    const block = data.content?.find(
      (b: { type: string }) => b.type === "text",
    );
    const text = block?.text?.trim();
    return text || fallback;
  } catch (err) {
    console.warn("Claude API network error:", err);
    return fallback;
  }
}

async function generateUserAlert(
  match: MatchResult,
  user: User,
): Promise<string> {
  const fallback = `${user.name}, you have been matched to ${match.winner.name}. Please proceed to the shelter immediately. Bring all required medications and equipment.`;
  return callClaude(
    `Write a plain-language 3-sentence alert for ${user.name} about their shelter assignment to ${match.winner.name}.`,
    fallback,
    100,
  );
}

async function generateContactMessage(
  match: MatchResult,
  user: User,
): Promise<string> {
  const fallback = `${user.name} has been matched to ${match.winner.name} (${match.winner.address}). Please coordinate support and transportation immediately.`;
  return callClaude(
    `Write a 2-3 sentence SMS-style message for a contact about ${user.name}'s shelter match to ${match.winner.name}.`,
    fallback,
    80,
  );
}

async function generateShelterIntake(
  match: MatchResult,
  user: User,
): Promise<string> {
  const fallback = [
    `INTAKE NOTIFICATION`,
    `Resident: ${user.name}`,
    `Disabilities: ${user.disabilities.join(", ")}`,
    `Equipment: ${user.equipment.join(", ")}`,
    `Transport: ${user.requiresAccessibleTransport ? "Accessible transport required" : "Standard transport"}`,
  ].join("\n");
  return callClaude(
    `Write a structured intake notification for shelter staff about incoming resident ${user.name}.`,
    fallback,
    180,
  );
}

async function generateOEMFlag(
  match: MatchResult,
  user: User,
  evacuationChoice: "confirmed" | "cannot" | null,
): Promise<string> {
  if (evacuationChoice === "cannot") {
    const fallback = `PRIORITY WELFARE CHECK — ${user.name} cannot evacuate. Matched to ${match.winner.name}. Immediate field response required.`;
    return callClaude(
      `Write a PRIORITY WELFARE CHECK OEM flag for ${user.name} who cannot evacuate, matched to ${match.winner.name}.`,
      fallback,
      120,
    );
  }
  const fallback = `Match confirmed: ${user.name} → ${match.winner.name}. Evacuation status: confirmed.`;
  return callClaude(
    `Write a routine match confirmation OEM flag for ${user.name} matched to ${match.winner.name}.`,
    fallback,
    120,
  );
}

async function generateEmergencySMS(
  match: MatchResult,
  user: User,
  contacts: Contact[],
  evacuationChoice: "confirmed" | "cannot" | null,
): Promise<string> {
  const fallback = [
    `TRAVIS COUNTY EMERGENCY SERVICES — DATA PACKET`,
    `EVACUEE: ${user.name} | Age: ${user.age} | Transport: ${user.requiresAccessibleTransport ? "Accessible Required" : "Standard"}`,
    `SHELTER: ${match.winner.name} | ${match.winner.address}`,
    `DISABILITIES: ${user.disabilities.join(", ")}`,
    `EQUIPMENT: ${user.equipment.join(", ")}`,
    `CONTACTS: ${contacts[0]?.name} (${contacts[0]?.relationship}), ${contacts[1]?.name} (${contacts[1]?.relationship})`,
    `EVACUATION STATUS: ${evacuationChoice === "confirmed" ? "Confirmed" : "CANNOT EVACUATE — WELFARE CHECK REQUIRED"}`,
    `REF: TXV-2847`,
  ].join("\n");
  return callClaude(
    `Write a complete emergency data packet for Travis County Emergency Services for evacuee ${user.name}.`,
    fallback,
    400,
  );
}

export async function runCommunicationAgent(
  match: MatchResult,
  user: User,
  contacts: Contact[],
  evacuationChoice: "confirmed" | "cannot" | null,
): Promise<CommunicationResult> {
  const now = Date.now();

  const [userAlert, contactMsg, shelterIntake, oemFlag, emergencySMS] =
    await Promise.all([
      generateUserAlert(match, user),
      generateContactMessage(match, user),
      generateShelterIntake(match, user),
      generateOEMFlag(match, user, evacuationChoice),
      generateEmergencySMS(match, user, contacts, evacuationChoice),
    ]);

  const toTimestamp = (offset: number): string =>
    new Date(now + offset).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const notifications: Notification[] = [
    {
      id: "notif_user",
      timestamp: toTimestamp(0),
      recipient: user.name,
      method: user.commMode,
      message: userAlert,
      status: "sent",
    },
    {
      id: "notif_sarah",
      timestamp: toTimestamp(400),
      recipient: contacts[0].name,
      method: "SMS",
      message: contactMsg,
      status: "sent",
    },
    {
      id: "notif_james",
      timestamp: toTimestamp(700),
      recipient: contacts[1].name,
      method: "SMS",
      message: contactMsg,
      status: "sent",
    },
    {
      id: "notif_shelter",
      timestamp: toTimestamp(900),
      recipient: match.winner.name,
      method: "Email",
      message: shelterIntake,
      status: "sent",
    },
    {
      id: "notif_oem",
      timestamp: toTimestamp(1100),
      recipient: "Travis County OEM Dashboard",
      method: "OEM Dashboard",
      message: oemFlag,
      status: evacuationChoice === "cannot" ? "escalated" : "sent",
    },
  ];

  return {
    notifications,
    generatedAt: new Date().toISOString(),
    evacuationChoice,
    referenceCode: "TXV-2847",
    emergencySMS,
  };
}
