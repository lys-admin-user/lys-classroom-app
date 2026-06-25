import { describe, it, expect } from "vitest";
import {
  getStateAuthority,
  isOfficialDoeLink,
  US_STATE_AUTHORITIES,
} from "../../shared/usStandardsAuthorities";
import { classifySetSource, catalogTierRank } from "../../shared/standards";

describe("US standards authorities reference data", () => {
  it("covers all 50 states + DC (51 jurisdictions)", () => {
    expect(US_STATE_AUTHORITIES.length).toBe(51);
    const abbrs = new Set(US_STATE_AUTHORITIES.map((a) => a.abbr));
    expect(abbrs.size).toBe(51);
    expect(abbrs.has("TX")).toBe(true);
    expect(abbrs.has("DC")).toBe(true);
  });

  it("getStateAuthority resolves by abbreviation and by full name (case-insensitive)", () => {
    expect(getStateAuthority("TX")?.agency).toMatch(/Texas Education Agency/);
    expect(getStateAuthority("tx")?.abbr).toBe("TX");
    expect(getStateAuthority("Texas")?.abbr).toBe("TX");
    expect(getStateAuthority("ZZ")).toBeUndefined();
    expect(getStateAuthority(null as any)).toBeUndefined();
  });
});

describe("isOfficialDoeLink", () => {
  it("accepts a link on the state's listed official domain", () => {
    expect(isOfficialDoeLink("https://tea.texas.gov/curriculum/teks", "TX")).toBe(true);
  });

  it("accepts generic government / public-education domains", () => {
    expect(isOfficialDoeLink("https://www.somestate.gov/standards", "TX")).toBe(true);
    expect(isOfficialDoeLink("https://foo.k12.ca.us/x", "CA")).toBe(true);
    expect(isOfficialDoeLink("https://foo.state.ny.us/x", "NY")).toBe(true);
  });

  it("rejects a non-official third-party link", () => {
    expect(isOfficialDoeLink("https://commonstandardsproject.com/set/123", "TX")).toBe(false);
    expect(isOfficialDoeLink("https://example.com/standards.pdf", "TX")).toBe(false);
  });

  it("rejects empty / malformed urls", () => {
    expect(isOfficialDoeLink(null, "TX")).toBe(false);
    expect(isOfficialDoeLink("", "TX")).toBe(false);
    expect(isOfficialDoeLink("not a url", "TX")).toBe(false);
  });
});

describe("classifySetSource trust tiers", () => {
  it("manual / pdf_import upload is unverified until verified", () => {
    expect(classifySetSource({ source: "manual" })).toBe("unverified");
    expect(classifySetSource({ source: "pdf_import" })).toBe("unverified");
    expect(
      classifySetSource({ source: "pdf_import", lastVerifiedAt: new Date() }),
    ).toBe("official");
  });

  it("US: CSP set with an official DOE link is official, without is backup", () => {
    expect(
      classifySetSource({
        source: "csp",
        documentUrl: "https://tea.texas.gov/teks",
        stateAbbr: "TX",
        enforceOfficialLink: true,
      }),
    ).toBe("official");
    expect(
      classifySetSource({
        source: "csp",
        documentUrl: "https://commonstandardsproject.com/x",
        stateAbbr: "TX",
        enforceOfficialLink: true,
      }),
    ).toBe("backup");
  });

  it("US: a verified CSP set is official even without an official link", () => {
    expect(
      classifySetSource({
        source: "csp",
        documentUrl: "https://commonstandardsproject.com/x",
        stateAbbr: "TX",
        enforceOfficialLink: true,
        lastVerifiedAt: "2026-01-01T00:00:00Z",
      }),
    ).toBe("official");
  });

  it("international (enforceOfficialLink off): CSP/CASE stays official", () => {
    expect(classifySetSource({ source: "csp" })).toBe("official");
    expect(classifySetSource({ source: "case" })).toBe("official");
  });

  it("unknown source falls back", () => {
    expect(classifySetSource({ source: "something_else" })).toBe("fallback");
    expect(classifySetSource({ source: null })).toBe("fallback");
  });
});

describe("catalogTierRank ordering (DOE wins dedup)", () => {
  it("official outranks backup outranks unverified outranks fallback", () => {
    expect(catalogTierRank("official")).toBeGreaterThan(catalogTierRank("backup"));
    expect(catalogTierRank("backup")).toBeGreaterThan(catalogTierRank("unverified"));
    expect(catalogTierRank("unverified")).toBeGreaterThan(catalogTierRank("fallback"));
  });
});
