// Shape mirrors NWS API /alerts/active response so the live API can drop in later.
export const DEMO_NWS_ALERT = {
  id: "https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.demo",
  type: "Feature",
  properties: {
    event: "Winter Storm Warning",
    areaDesc: "Travis County, TX",
    headline:
      "Winter Storm Warning issued for Travis County until February 17 at 6:00PM CST",
    description:
      "A severe winter storm is expected to cause widespread power outages in your area within 10 hours. Your ventilator and power wheelchair depend on electricity. You have been matched to a shelter with backup power. Transport is being arranged.",
    severity: "Extreme",
    urgency: "Immediate",
    onset: "2021-02-15T03:00:00-06:00",
    expires: "2021-02-17T18:00:00-06:00",
    status: "Actual",
  },
};

export type NwsAlert = typeof DEMO_NWS_ALERT;

interface NwsFeatureCollection {
  features?: unknown[];
}

function isNwsAlert(value: unknown): value is NwsAlert {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<NwsAlert>;
  return (
    maybe.type === "Feature" &&
    typeof maybe.properties?.event === "string" &&
    typeof maybe.properties?.areaDesc === "string"
  );
}

/**
 * Best-effort live NWS alert fetch for Travis County.
 * Any failure returns the local demo alert so the presentation flow never blocks.
 */
export async function fetchActiveNwsAlert(): Promise<NwsAlert> {
  try {
    const response = await fetch("https://api.weather.gov/alerts/active?zone=TXZ192", {
      headers: {
        Accept: "application/geo+json, application/json",
      },
    });

    if (!response.ok) return DEMO_NWS_ALERT;

    const payload = (await response.json()) as NwsFeatureCollection | unknown;
    const feature = Array.isArray((payload as NwsFeatureCollection).features)
      ? (payload as NwsFeatureCollection).features?.find(isNwsAlert)
      : payload;

    return isNwsAlert(feature) ? feature : DEMO_NWS_ALERT;
  } catch {
    return DEMO_NWS_ALERT;
  }
}
