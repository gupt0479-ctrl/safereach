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
