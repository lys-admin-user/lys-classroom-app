// US state standards-authority reference data.
//
// Derived from the "US State Curriculum Standards Reference Guide" — one row per
// US jurisdiction mapping the state's standards-issuing authority (the DOE), the
// short standards name teachers recognize (TEKS, B.E.S.T., SOL, ...), the
// subject framework names, and a best-effort allow-list of the authority's
// official web domain(s).
//
// This file is the backbone of the "Official DOE vs. backup" policy:
//   - `getStateAuthority(abbr)` powers the teacher-facing authority label and
//     seeds the `authorities` table.
//   - `isOfficialDoeLink(url, abbr)` decides whether a standard set's source
//     link is genuinely an official DOE source. A set only counts as
//     authoritative ("Official (DOE)") when its link clears this check OR a site
//     admin has manually verified it.
//
// The official-domain list is a best-effort ALLOW-LIST, not an authority of
// record. A link only clears the check when its host matches THE SELECTED
// STATE's official domain(s), or a state-scoped public-school host for that same
// state (`*.k12.<abbr>.us` / `*.state.<abbr>.us`). A generic federal `.gov` or
// another state's domain is deliberately NOT treated as official — that would
// over-promote cross-state / non-authority links. Anything that does not clear
// the check stays "backup" until a site admin verifies it — never fabricated as
// official.

export interface StateAuthority {
  /** USPS abbreviation, e.g. "TX". */
  abbr: string;
  /** State name, e.g. "Texas". */
  state: string;
  /** Standards-issuing authority (department of education), e.g. "Texas Education Agency". */
  agency: string;
  /** Short standards name teachers recognize, e.g. "TEKS". */
  standardsName: string;
  /** Best-effort allow-list of the authority's official domain(s) (host suffixes). */
  officialDomains: string[];
  frameworks: {
    ela: string;
    math: string;
    science: string;
    cte: string;
  };
}

export const US_STATE_AUTHORITIES: StateAuthority[] = [
  { abbr: "AL", state: "Alabama", agency: "Alabama State Department of Education", standardsName: "Alabama Course of Study", officialDomains: ["alsde.edu", "alabamaachieves.org"], frameworks: { ela: "Alabama Course of Study", math: "Alabama Course of Study", science: "Alabama Course of Study (NGSS-aligned)", cte: "Alabama CTE Plan of Study" } },
  { abbr: "AK", state: "Alaska", agency: "Alaska Department of Education & Early Development", standardsName: "Alaska Standards", officialDomains: ["education.alaska.gov"], frameworks: { ela: "Alaska English/Language Arts", math: "Alaska Mathematics Standards", science: "Alaska Science Standards", cte: "Alaska Career & College Readiness" } },
  { abbr: "AZ", state: "Arizona", agency: "Arizona Department of Education", standardsName: "Arizona Academic Standards", officialDomains: ["azed.gov"], frameworks: { ela: "Arizona's English Language Arts", math: "Arizona's Mathematics Standards", science: "Arizona Science Standards", cte: "Arizona CTE Program Standards" } },
  { abbr: "AR", state: "Arkansas", agency: "Arkansas Department of Education", standardsName: "Arkansas Academic Standards", officialDomains: ["dese.ade.arkansas.gov", "arkansased.gov"], frameworks: { ela: "Arkansas English Language Arts", math: "Arkansas Mathematics Standards", science: "Arkansas K-12 Science Standards (NGSS)", cte: "Arkansas CTE Career Clusters" } },
  { abbr: "CA", state: "California", agency: "California Department of Education", standardsName: "CA CCSS", officialDomains: ["cde.ca.gov"], frameworks: { ela: "CA CCSS for ELA", math: "CA CCSS for Mathematics", science: "California NGSS", cte: "California Career Ready Standards" } },
  { abbr: "CO", state: "Colorado", agency: "Colorado Department of Education", standardsName: "Colorado Academic Standards", officialDomains: ["cde.state.co.us"], frameworks: { ela: "Colorado Academic Standards (CAS)", math: "Colorado Academic Standards (CAS)", science: "CAS (NGSS-aligned)", cte: "Colorado Postsecondary & Workforce Readiness (PWR)" } },
  { abbr: "CT", state: "Connecticut", agency: "Connecticut State Department of Education", standardsName: "CT Core Standards", officialDomains: ["portal.ct.gov", "ct.gov"], frameworks: { ela: "CT Core Standards (CCSS)", math: "CT Core Standards (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "CT Career Pathways" } },
  { abbr: "DE", state: "Delaware", agency: "Delaware Department of Education", standardsName: "Delaware Standards", officialDomains: ["doe.k12.de.us", "education.delaware.gov"], frameworks: { ela: "Delaware Common Core (CCSS)", math: "Delaware Common Core (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Delaware Program of Study" } },
  { abbr: "FL", state: "Florida", agency: "Florida Department of Education", standardsName: "B.E.S.T. Standards", officialDomains: ["fldoe.org", "cpalms.org"], frameworks: { ela: "B.E.S.T. Standards (ELA)", math: "B.E.S.T. Standards (Math)", science: "Next Generation Sunshine State Standards", cte: "Florida CAPE" } },
  { abbr: "GA", state: "Georgia", agency: "Georgia Department of Education", standardsName: "Georgia Standards of Excellence", officialDomains: ["gadoe.org"], frameworks: { ela: "Georgia K-12 English Language Arts", math: "Georgia K-12 Mathematics", science: "Georgia Standards of Excellence (GSE)", cte: "Georgia CTAE" } },
  { abbr: "HI", state: "Hawaii", agency: "Hawaii State Department of Education", standardsName: "Hawaii Common Core", officialDomains: ["hawaiipublicschools.org"], frameworks: { ela: "Hawaii Common Core (CCSS)", math: "Hawaii Common Core (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Hawaii Career Pathways" } },
  { abbr: "ID", state: "Idaho", agency: "Idaho State Department of Education", standardsName: "Idaho Content Standards", officialDomains: ["sde.idaho.gov"], frameworks: { ela: "Idaho Content Standards (CCSS-derived)", math: "Idaho Content Standards (CCSS-derived)", science: "Idaho Science Standards", cte: "Idaho CTE Program Standards" } },
  { abbr: "IL", state: "Illinois", agency: "Illinois State Board of Education", standardsName: "Illinois Learning Standards", officialDomains: ["isbe.net"], frameworks: { ela: "Illinois Common Core (CCSS)", math: "Illinois Common Core (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Illinois College & Career Readiness" } },
  { abbr: "IN", state: "Indiana", agency: "Indiana Department of Education", standardsName: "Indiana Academic Standards", officialDomains: ["in.gov", "doe.in.gov"], frameworks: { ela: "Indiana Academic Standards", math: "Indiana Academic Standards", science: "Indiana Academic Standards (NGSS-aligned)", cte: "Indiana Next Level Programs of Study (NLPS)" } },
  { abbr: "IA", state: "Iowa", agency: "Iowa Department of Education", standardsName: "Iowa Core", officialDomains: ["educate.iowa.gov", "educateiowa.gov"], frameworks: { ela: "Iowa Core (CCSS)", math: "Iowa Core (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Iowa CTE Service Areas" } },
  { abbr: "KS", state: "Kansas", agency: "Kansas State Department of Education", standardsName: "Kansas Standards", officialDomains: ["ksde.org", "ksde.gov"], frameworks: { ela: "Kansas Standards (CCSS-derived)", math: "Kansas Standards (CCSS-derived)", science: "Next Generation Science Standards (NGSS)", cte: "Kansas Individual Plans of Study (IPS)" } },
  { abbr: "KY", state: "Kentucky", agency: "Kentucky Department of Education", standardsName: "Kentucky Academic Standards (KAS)", officialDomains: ["education.ky.gov"], frameworks: { ela: "Kentucky Academic Standards (KAS)", math: "Kentucky Academic Standards (KAS)", science: "Kentucky Academic Standards (NGSS)", cte: "Kentucky CTE Career Pathways" } },
  { abbr: "LA", state: "Louisiana", agency: "Louisiana Department of Education", standardsName: "Louisiana Student Standards", officialDomains: ["louisianabelieves.com", "doe.louisiana.gov"], frameworks: { ela: "Louisiana Student Standards", math: "Louisiana Student Standards", science: "Louisiana Student Standards for Science", cte: "Jump Start Louisiana" } },
  { abbr: "ME", state: "Maine", agency: "Maine Department of Education", standardsName: "Maine Learning Results", officialDomains: ["maine.gov"], frameworks: { ela: "Maine Learning Results", math: "Maine Learning Results", science: "Next Generation Science Standards (NGSS)", cte: "Maine CTE Programs" } },
  { abbr: "MD", state: "Maryland", agency: "Maryland State Department of Education", standardsName: "Maryland College & Career Ready", officialDomains: ["marylandpublicschools.org"], frameworks: { ela: "Maryland College & Career Ready", math: "Maryland College & Career Ready", science: "Next Generation Science Standards (NGSS)", cte: "Maryland CTE Programs of Study" } },
  { abbr: "MA", state: "Massachusetts", agency: "Massachusetts Department of Elementary and Secondary Education", standardsName: "MA Curriculum Frameworks", officialDomains: ["doe.mass.edu"], frameworks: { ela: "MA Curriculum Frameworks (CCSS-derived)", math: "MA Curriculum Frameworks (CCSS-derived)", science: "MA Science & Technology/Engineering", cte: "MassCore Program" } },
  { abbr: "MI", state: "Michigan", agency: "Michigan Department of Education", standardsName: "Michigan Merit Curriculum", officialDomains: ["michigan.gov"], frameworks: { ela: "Michigan Merit Curriculum (CCSS)", math: "Michigan Merit Curriculum (CCSS)", science: "Michigan Science Standards (NGSS)", cte: "Michigan Career Pathways" } },
  { abbr: "MN", state: "Minnesota", agency: "Minnesota Department of Education", standardsName: "Minnesota Academic Standards", officialDomains: ["education.mn.gov"], frameworks: { ela: "Minnesota Academic Standards", math: "Minnesota Academic Standards", science: "Minnesota Academic Standards (Science)", cte: "Minnesota Career Fields & Pathways" } },
  { abbr: "MS", state: "Mississippi", agency: "Mississippi Department of Education", standardsName: "MS College- and Career-Readiness", officialDomains: ["mdek12.org"], frameworks: { ela: "MS College- and Career-Readiness", math: "MS College- and Career-Readiness", science: "MS College- and Career-Readiness (Science)", cte: "Mississippi CTE Pathways" } },
  { abbr: "MO", state: "Missouri", agency: "Missouri Department of Elementary and Secondary Education", standardsName: "Missouri Learning Standards", officialDomains: ["dese.mo.gov"], frameworks: { ela: "Missouri Learning Standards", math: "Missouri Learning Standards", science: "Missouri Learning Standards (Science)", cte: "Missouri CTE Programs" } },
  { abbr: "MT", state: "Montana", agency: "Montana Office of Public Instruction", standardsName: "Montana Content Standards", officialDomains: ["opi.mt.gov"], frameworks: { ela: "Montana Common Core", math: "Montana Common Core", science: "Next Generation Science Standards (NGSS)", cte: "Montana CTE Career Pathways" } },
  { abbr: "NE", state: "Nebraska", agency: "Nebraska Department of Education", standardsName: "Nebraska College & Career Ready", officialDomains: ["education.ne.gov"], frameworks: { ela: "Nebraska College & Career Ready", math: "Nebraska College & Career Ready", science: "Nebraska College & Career Ready (Science)", cte: "Nebraska Career Education (NCE)" } },
  { abbr: "NV", state: "Nevada", agency: "Nevada Department of Education", standardsName: "Nevada Academic Content Standards", officialDomains: ["doe.nv.gov"], frameworks: { ela: "Nevada Academic Content (CCSS)", math: "Nevada Academic Content (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Nevada CTE Course Catalogs" } },
  { abbr: "NH", state: "New Hampshire", agency: "New Hampshire Department of Education", standardsName: "NH College & Career Ready", officialDomains: ["education.nh.gov"], frameworks: { ela: "NH College & Career Ready (CCSS)", math: "NH College & Career Ready (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "NH Career Pathways" } },
  { abbr: "NJ", state: "New Jersey", agency: "New Jersey Department of Education", standardsName: "NJ Student Learning Standards (NJSLS)", officialDomains: ["nj.gov", "state.nj.us"], frameworks: { ela: "NJ Student Learning Standards (NJSLS)", math: "NJ Student Learning Standards (NJSLS)", science: "NJSLS - Science (NGSS)", cte: "NJ CTE Programs of Study" } },
  { abbr: "NM", state: "New Mexico", agency: "New Mexico Public Education Department", standardsName: "New Mexico Standards", officialDomains: ["ped.nm.gov", "webnew.ped.state.nm.us"], frameworks: { ela: "NM Common Core State Standards", math: "NM Common Core State Standards", science: "NM STEM Ready! Science Standards (NGSS)", cte: "NM Career Clusters" } },
  { abbr: "NY", state: "New York", agency: "New York State Education Department", standardsName: "Next Generation Learning Standards", officialDomains: ["nysed.gov"], frameworks: { ela: "Next Generation Learning Standards", math: "Next Generation Learning Standards", science: "NYS Science Learning Standards (NGSS)", cte: "NYS CDOS" } },
  { abbr: "NC", state: "North Carolina", agency: "North Carolina Department of Public Instruction", standardsName: "NC Standard Course of Study", officialDomains: ["dpi.nc.gov"], frameworks: { ela: "NC Standard Course of Study", math: "NC Standard Course of Study", science: "NC Essential Standards (Science)", cte: "NC CTE Pathways" } },
  { abbr: "ND", state: "North Dakota", agency: "North Dakota Department of Public Instruction", standardsName: "ND Content Standards", officialDomains: ["nd.gov"], frameworks: { ela: "ND Content Standards", math: "ND Content Standards", science: "ND Science Content Standards", cte: "ND Career & Technical Education" } },
  { abbr: "OH", state: "Ohio", agency: "Ohio Department of Education and Workforce", standardsName: "Ohio's Learning Standards", officialDomains: ["education.ohio.gov", "ode.ohio.gov"], frameworks: { ela: "Ohio's Learning Standards (CCSS)", math: "Ohio's Learning Standards (CCSS)", science: "Ohio's Learning Standards (Science)", cte: "Ohio Career-Technical Education" } },
  { abbr: "OK", state: "Oklahoma", agency: "Oklahoma State Department of Education", standardsName: "Oklahoma Academic Standards (OAS)", officialDomains: ["sde.ok.gov"], frameworks: { ela: "Oklahoma Academic Standards (OAS)", math: "Oklahoma Academic Standards (OAS)", science: "OAS - Science", cte: "Oklahoma CareerTech" } },
  { abbr: "OR", state: "Oregon", agency: "Oregon Department of Education", standardsName: "Oregon State Standards", officialDomains: ["oregon.gov"], frameworks: { ela: "Oregon State Standards (CCSS)", math: "Oregon State Standards (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Oregon CTE Programs of Study" } },
  { abbr: "PA", state: "Pennsylvania", agency: "Pennsylvania Department of Education", standardsName: "PA Core Standards", officialDomains: ["education.pa.gov", "pa.gov", "pdesas.org"], frameworks: { ela: "PA Core Standards", math: "PA Core Standards", science: "PA Academic Standards for Science", cte: "PA Career Education and Work (CEW)" } },
  { abbr: "RI", state: "Rhode Island", agency: "Rhode Island Department of Education", standardsName: "RI Core Standards", officialDomains: ["ride.ri.gov"], frameworks: { ela: "RI Core Standards (CCSS)", math: "RI Core Standards (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "RI CTE Programs" } },
  { abbr: "SC", state: "South Carolina", agency: "South Carolina Department of Education", standardsName: "SC College- and Career-Ready", officialDomains: ["ed.sc.gov"], frameworks: { ela: "SC College-and-Career-Ready", math: "SC College-and-Career-Ready", science: "SC Academic Standards and Performance Indicators", cte: "SC CTE Career Clusters" } },
  { abbr: "SD", state: "South Dakota", agency: "South Dakota Department of Education", standardsName: "SD Content Standards", officialDomains: ["doe.sd.gov"], frameworks: { ela: "SD Content Standards (CCSS-derived)", math: "SD Content Standards (CCSS-derived)", science: "SD Science Standards", cte: "SD Career & Technical Education" } },
  { abbr: "TN", state: "Tennessee", agency: "Tennessee Department of Education", standardsName: "TN Academic Standards", officialDomains: ["tn.gov"], frameworks: { ela: "TN State Standards", math: "TN State Standards", science: "TN Academic Standards for Science", cte: "TN CTE Career Clusters & Pathways" } },
  { abbr: "TX", state: "Texas", agency: "Texas Education Agency", standardsName: "TEKS", officialDomains: ["tea.texas.gov", "texreg.sos.state.tx.us", "sos.state.tx.us"], frameworks: { ela: "TEKS (Texas Essential Knowledge & Skills)", math: "TEKS", science: "TEKS (Science)", cte: "CCMR (College, Career, & Military Readiness)" } },
  { abbr: "UT", state: "Utah", agency: "Utah State Board of Education", standardsName: "Utah Core Standards", officialDomains: ["schools.utah.gov", "uen.org"], frameworks: { ela: "Utah Core Standards", math: "Utah Core Standards", science: "Utah Science with Engineering Education (SEEd)", cte: "Utah CTE Career Pathways" } },
  { abbr: "VT", state: "Vermont", agency: "Vermont Agency of Education", standardsName: "Vermont Standards", officialDomains: ["education.vermont.gov"], frameworks: { ela: "Vermont Common Core (CCSS)", math: "Vermont Common Core (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "Vermont Career Pathways" } },
  { abbr: "VA", state: "Virginia", agency: "Virginia Department of Education", standardsName: "SOL (Standards of Learning)", officialDomains: ["doe.virginia.gov"], frameworks: { ela: "SOL (Standards of Learning)", math: "SOL", science: "SOL (Science)", cte: "Virginia CTE Resource Center (VERS)" } },
  { abbr: "WA", state: "Washington", agency: "Washington Office of Superintendent of Public Instruction", standardsName: "WA State Learning Standards", officialDomains: ["ospi.k12.wa.us"], frameworks: { ela: "WA State Learning Standards (CCSS)", math: "WA State Learning Standards (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "WA CTE Program Standards" } },
  { abbr: "WV", state: "West Virginia", agency: "West Virginia Department of Education", standardsName: "WV College- and Career-Readiness", officialDomains: ["wvde.us", "wvde.state.wv.us"], frameworks: { ela: "WV College- and Career-Readiness", math: "WV College- and Career-Readiness", science: "WV College- and Career-Readiness (NGSS)", cte: "WV CTE Career Technical Education" } },
  { abbr: "WI", state: "Wisconsin", agency: "Wisconsin Department of Public Instruction", standardsName: "Wisconsin Academic Standards", officialDomains: ["dpi.wi.gov"], frameworks: { ela: "Wisconsin Academic Standards (CCSS)", math: "Wisconsin Academic Standards (CCSS)", science: "Wisconsin Standards for Science (NGSS)", cte: "Wisconsin CTE Career Pathways" } },
  { abbr: "WY", state: "Wyoming", agency: "Wyoming Department of Education", standardsName: "Wyoming Content & Performance Standards", officialDomains: ["edu.wyoming.gov"], frameworks: { ela: "Wyoming Content & Performance Standards", math: "Wyoming Content & Performance Standards", science: "Wyoming Science Standards (NGSS)", cte: "Wyoming Career & Technical Education" } },
  { abbr: "DC", state: "District of Columbia", agency: "Office of the State Superintendent of Education", standardsName: "DC Common Core", officialDomains: ["osse.dc.gov"], frameworks: { ela: "DC Common Core (CCSS)", math: "DC Common Core (CCSS)", science: "Next Generation Science Standards (NGSS)", cte: "DC CTE Programs" } },
];

const BY_ABBR: Record<string, StateAuthority> = Object.fromEntries(
  US_STATE_AUTHORITIES.map((a) => [a.abbr.toUpperCase(), a]),
);
const BY_STATE: Record<string, StateAuthority> = Object.fromEntries(
  US_STATE_AUTHORITIES.map((a) => [a.state.toLowerCase(), a]),
);

/** Look up a state's authority by USPS abbreviation ("TX") or full name ("Texas"). */
export function getStateAuthority(abbrOrName: string | null | undefined): StateAuthority | undefined {
  if (!abbrOrName) return undefined;
  const key = abbrOrName.trim();
  return BY_ABBR[key.toUpperCase()] ?? BY_STATE[key.toLowerCase()];
}

/** Extract a lowercase hostname from a URL string, or null when unparseable. */
function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return u.hostname.toLowerCase();
  } catch {
    // Tolerate bare hostnames / paths without a scheme.
    const m = url.trim().toLowerCase().match(/^(?:https?:\/\/)?([^/?#]+)/);
    return m ? m[1] : null;
  }
}

function hostMatches(host: string, domain: string): boolean {
  const d = domain.toLowerCase();
  return host === d || host.endsWith("." + d);
}

/**
 * State-scoped public-school host patterns (`*.k12.<abbr>.us`,
 * `*.state.<abbr>.us`) for THIS state only. These are domains only that state's
 * public schools/government can hold, so they count as official for that state —
 * but a different state's `k12`/`state.us` host does not. A bare federal `.gov`
 * is intentionally excluded: it cannot be scoped to a state and the allow-list
 * already carries each state's real `.gov` authority domain.
 */
function isStateScopedPublicHost(host: string, abbr: string): boolean {
  const a = abbr.toLowerCase();
  if (!/^[a-z]{2}$/.test(a)) return false;
  return hostMatches(host, `k12.${a}.us`) || hostMatches(host, `state.${a}.us`);
}

/**
 * True when `url` is an official DOE source for the given state. A standard set
 * only counts as authoritative ("Official (DOE)") when this returns true OR a
 * site admin has manually verified it. Matching is STATE-SCOPED: the host must
 * belong to the selected state's authority, not merely be a government domain.
 */
export function isOfficialDoeLink(
  url: string | null | undefined,
  abbrOrName: string | null | undefined,
): boolean {
  const host = hostOf(url);
  if (!host) return false;
  const authority = getStateAuthority(abbrOrName);
  if (!authority) return false;
  if (authority.officialDomains.some((d) => hostMatches(host, d))) {
    return true;
  }
  return isStateScopedPublicHost(host, authority.abbr);
}
