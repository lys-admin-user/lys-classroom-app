import type { InsertHrRole } from "@shared/schema";
import { GENERATED_HR_ROLES } from "./rolesGenerated";

// Seed roles for the Team Hub directory.
//
// IMPORTANT: Only roles we have REAL, source documentation for are seeded here.
// We do NOT fabricate duties, KPIs, or evaluation criteria for roles we lack
// source material for. The full 38-role set is transcribed faithfully from the
// LYS Comprehensive Roles & Operational Directory and lives in
// `rolesGenerated.ts` (regenerate with `npx tsx scripts/ingest-lys-roles.ts`).
// Admins can still add new roles, and adjust/increase KPIs and SOPs, through the
// in-app role editor — those edits live in the DB and are never overwritten by
// re-seeding (the seeder is idempotent by stable id).
//
// Seeded rows carry stable slug ids so `reportsToId` can reference them, and
// are marked isSeed=true by the seeder.
export type SeedHrRole = InsertHrRole & { id: string };

const MANUAL_SEED_HR_ROLES: SeedHrRole[] = [
  {
    id: "study-abroad-srm",
    title: "Sales & Relationship Manager — Study Abroad",
    department: "Global Exchange & Study Abroad (N.E.S.T.)",
    horizon: "future",
    employmentType: "Unspecified",
    reportsToId: null,
    sortOrder: 100,
    summary:
      "The LYS Global Exchange & Study Abroad Program Team is responsible for establishing the foundational systems, partnerships, and operational readiness required to launch the Laddering Your Success (LYS) Study Abroad initiative. This initiative connects American institutions — particularly Historically Black Colleges and Universities (HBCUs) — with partners in West and North Africa to foster cultural exchange, mutual learning, and the teaching of the LYS Be–Know–Do (BKD) methodology. The program serves as a bridge between American educational institutions and African organizations, supporting academic collaboration, cultural immersion, and professional development. During the pre-launch phase (2025–2026), the team focuses on building scalable systems, securing partnerships, and developing the program curriculum and infrastructure necessary for launch readiness by 2026. Operational Priority: Establish a solid foundation for global educational exchange through strategic planning, partnership development, compliance readiness, and alignment with the LYS mission and core values of Commitment, Wisdom, and Compassion. LYS serves as a mediator for educational institutions and programs in both the US and Africa, offering its transformational BKD methodology to enrollees.",
    bkdBe:
      "Embody cultural empathy, leadership, and integrity. Demonstrate professionalism and cultural humility in all partner, vendor, and institutional interactions.",
    bkdKnow:
      "Master program design, compliance, and global partnerships. Understand study abroad logistics, accreditation requirements, and partnership management.",
    bkdDo:
      "Execute structured outreach, development, and reporting. Develop systems and workflows that drive progress toward launch readiness and long-term sustainability.",
    kpis: [
      { name: "Operational — Daily response time to partner and vendor inquiries", target: "within 24 hours" },
      { name: "Operational — New partner or vendor leads logged", target: "minimum 2 per day" },
      { name: "Operational — Daily updates in project management/CRM system", target: "100%" },
      { name: "Operational — Weekly readiness meetings held with summary reports" },
      { name: "Partnership & Outreach — New HBCU or institutional partnerships", target: "3–5 per quarter" },
      { name: "Partnership & Outreach — MoUs signed with African universities, high schools, or NGOs", target: "5–10 per quarter" },
      { name: "Partnership & Outreach — Partnership meetings or webinars", target: "minimum 2 per week" },
      { name: "Partnership & Outreach — Partnership retention rate", target: "≥ 85% annually" },
      { name: "Program Infrastructure — Global Operations Manual completed", target: "within 90 days pre-launch" },
      { name: "Program Infrastructure — Vendor database of approved partners", target: "minimum 10 established" },
      { name: "Program Infrastructure — Travel, legal, and insurance documents compliant", target: "100% before launch" },
      { name: "Program Infrastructure — CRM and communication systems operational", target: "by mid-2025" },
      { name: "Financial & Compliance — Budget reconciliation", target: "100% within ±5% variance per quarter" },
      { name: "Financial & Compliance — Contracts, waivers, and insurance forms verified and archived", target: "pre-launch" },
      { name: "Financial & Compliance — Quarterly financial reports submitted on time" },
      { name: "Marketing & Visibility — Public-facing feature (webinar/blog/podcast)", target: "1 per semester" },
      { name: "Marketing & Visibility — Social engagement growth", target: "+10% per month" },
      { name: "Marketing & Visibility — Marketing materials and outreach decks completed", target: "by Q2 2025" },
    ],
    sops: {
      daily: [
        "Respond to all student, partner, and vendor messages within 24 hours.",
        "Log all communications, leads, and expenses in CRM or project tracker.",
        "Monitor vendor and travel updates; confirm safety and visa status changes.",
        "Share daily updates in internal team communication channel.",
      ],
      weekly: [
        "Conduct weekly readiness and strategy meetings with leadership.",
        "Review partnership and vendor progress; update milestone tracker.",
        "Submit Weekly Readiness Report summarizing progress and challenges.",
        "Verify budget updates and document compliance logs.",
      ],
      monthly: [
        "Finalize and sign at least one partnership MoU per month.",
        "Conduct vendor and partnership performance reviews.",
        "Publish one monthly program development update (internal or public).",
        "Submit Monthly Operations Report to leadership.",
      ],
      semester: [
        "Host at least one virtual or in-person partnership roundtable with institutions.",
        "Evaluate program readiness milestones and update SOP manual.",
        "Prepare pre-launch orientation or pilot planning documents.",
      ],
      yearly: [
        "Conduct annual strategic review and publish the Global Exchange Impact Report.",
        "Review all partnerships and vendor agreements for renewal or expansion.",
        "Host Annual LYS Global Exchange Strategy Retreat.",
      ],
    },
    tools: [
      "Partner & Vendor CRM Tracker",
      "Budget and Expense Tracker (QuickBooks or Sheets)",
      "Trip Logistics & Compliance Dashboard",
      "LYS Be–Know–Do Training Materials for Cultural Exchange Staff",
      "Communication and Reporting Templates",
    ],
    evaluationChecklist: [
      "100% readiness score before launch (infrastructure, partners, budget)",
      "10+ vetted and approved partners in Africa and the U.S.",
      "85%+ partnership renewal and satisfaction rate",
      "Program operations manual finalized and approved by leadership",
      "Annual report and readiness presentation completed by Q4 2025",
    ],
    onboardingTemplate: [],
  },
];

// Full directory = the manually-curated role(s) above + the 38 roles transcribed
// from the source document. Deduped by stable id (manual entries win).
const seen = new Set(MANUAL_SEED_HR_ROLES.map((r) => r.id));
export const SEED_HR_ROLES: SeedHrRole[] = [
  ...MANUAL_SEED_HR_ROLES,
  ...GENERATED_HR_ROLES.filter((r) => !seen.has(r.id)),
];
