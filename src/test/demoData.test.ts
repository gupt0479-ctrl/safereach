import { describe, it, expect } from "vitest";
import { MARIA, SHELTERS, CONTACTS, OEM_REFERENCE } from "@/data/demo";
import { EMPOWER_ZIPS, EMPOWER_TOTAL_COUNTY } from "@/data/zipOverlay";
import { DEMO_NWS_ALERT } from "@/data/nwsAlert";

describe("demo data integrity", () => {
  describe("Maria profile", () => {
    it("should be electricity-dependent", () => {
      expect(MARIA.electricityDependent).toBe(true);
    });

    it("should have ventilator and power wheelchair", () => {
      expect(MARIA.equipment).toContain("ventilator");
      expect(MARIA.equipment).toContain("power_wheelchair");
    });

    it("should not be able to self-evacuate", () => {
      expect(MARIA.canSelfEvacuate).toBe(false);
    });

    it("should use large text communication mode", () => {
      expect(MARIA.commMode).toBe("large_text");
    });

    it("should be OEM verified", () => {
      expect(MARIA.verifiedByOEM).toBe(true);
    });

    it("should have valid GPS coordinates in Austin TX", () => {
      expect(MARIA.lat).toBeGreaterThan(30);
      expect(MARIA.lat).toBeLessThan(31);
      expect(MARIA.lng).toBeGreaterThan(-98);
      expect(MARIA.lng).toBeLessThan(-97);
    });
  });

  describe("shelters", () => {
    it("should have exactly 5 shelters", () => {
      expect(SHELTERS.length).toBe(5);
    });

    it("shelter_001 (Dell Seton) should have all capabilities", () => {
      const ds = SHELTERS.find((s) => s.id === "shelter_001")!;
      expect(ds.backupPower).toBe(true);
      expect(ds.wheelchairAccessible).toBe(true);
      expect(ds.medicalOxygen).toBe(true);
      expect(ds.transportFromZip78745).toBe(true);
    });

    it("shelter_002 (Austin Community Center) should lack backup power", () => {
      const acc = SHELTERS.find((s) => s.id === "shelter_002")!;
      expect(acc.backupPower).toBe(false);
    });

    it("all shelters should have valid capacity data", () => {
      for (const s of SHELTERS) {
        expect(s.capacityTotal).toBeGreaterThan(0);
        expect(s.capacityUsed).toBeGreaterThanOrEqual(0);
        expect(s.capacityUsed).toBeLessThan(s.capacityTotal);
      }
    });
  });

  describe("contacts", () => {
    it("should have 2 emergency contacts", () => {
      expect(CONTACTS.length).toBe(2);
    });

    it("Sarah should be the daughter", () => {
      expect(CONTACTS[0].name).toBe("Sarah Alvarez");
      expect(CONTACTS[0].relationship).toBe("Daughter");
    });

    it("James should be the home health aide", () => {
      expect(CONTACTS[1].name).toBe("James Okafor");
      expect(CONTACTS[1].relationship).toBe("Home Health Aide");
    });
  });

  describe("OEM reference", () => {
    it("should be TXV-2847", () => {
      expect(OEM_REFERENCE).toBe("TXV-2847");
    });
  });

  describe("emPOWER data", () => {
    it("should have 5 ZIP codes", () => {
      expect(EMPOWER_ZIPS.length).toBe(5);
    });

    it("should include Maria's ZIP 78745", () => {
      expect(EMPOWER_ZIPS.some((z) => z.zip === "78745")).toBe(true);
    });

    it("county total should be 4200+", () => {
      expect(EMPOWER_TOTAL_COUNTY).toBeGreaterThanOrEqual(4200);
    });
  });

  describe("NWS alert", () => {
    it("should be a Winter Storm Warning", () => {
      expect(DEMO_NWS_ALERT.properties.event).toBe("Winter Storm Warning");
    });

    it("should cover Travis County", () => {
      expect(DEMO_NWS_ALERT.properties.areaDesc).toContain("Travis County");
    });

    it("should have Extreme severity", () => {
      expect(DEMO_NWS_ALERT.properties.severity).toBe("Extreme");
    });
  });
});
