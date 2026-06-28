import type { HrRole, InsertHrOnboardingTask } from "@shared/schema";

export type DerivedOnboardingTask = Omit<InsertHrOnboardingTask, "employeeId">;

// Build a role-tailored onboarding checklist. When a role carries an explicit
// onboardingTemplate we use it verbatim; otherwise we derive a sensible
// timeline from the role's REAL data (its tools and first SOP duties) plus
// generic Day-1 provisioning steps. Nothing role-specific is invented — the
// derived steps only reference the role's own documented tools/SOPs.
export function deriveOnboardingTasks(role: HrRole): DerivedOnboardingTask[] {
  if (Array.isArray(role.onboardingTemplate) && role.onboardingTemplate.length > 0) {
    return role.onboardingTemplate.map((t, i) => ({
      title: t.title,
      description: t.description ?? null,
      phase: t.phase,
      category: t.category,
      status: "todo",
      dueOffsetDays: t.dueOffsetDays,
      sortOrder: i,
    }));
  }

  const tasks: DerivedOnboardingTask[] = [];
  let order = 0;
  const add = (
    phase: string,
    category: string,
    title: string,
    dueOffsetDays: number,
    description?: string,
  ) => {
    tasks.push({ title, description: description ?? null, phase, category, status: "todo", dueOffsetDays, sortOrder: order++ });
  };

  const W1 = "Week 1: Orientation";
  add(W1, "Accounts & Access", "Set up your LYS app login & profile", 1);
  add(W1, "Accounts & Access", "Get your Google Workspace account (email, calendar, drive)", 1);
  add(W1, "Accounts & Access", "Join the team communication channels", 1);
  add(W1, "BE-KNOW-DO", "Complete the Our Foundation onboarding modules", 3, "Mission, Vision, and the LYS Be-Know-Do method.");
  add(W1, "BE-KNOW-DO", "Review your role's Be-Know-Do focus", 3, `BE: ${role.bkdBe || "—"}`);

  const W1b = "Week 1: Tools & Templates";
  for (const tool of role.tools ?? []) {
    add(W1b, "Tools", `Get access & training: ${tool}`, 5);
  }

  const W2 = "Week 2: First Deliverables";
  for (const sop of (role.sops?.daily ?? []).slice(0, 3)) {
    add(W2, "First Deliverables", `Start daily SOP: ${sop}`, 8);
  }
  for (const sop of (role.sops?.weekly ?? []).slice(0, 2)) {
    add(W2, "First Deliverables", `Begin weekly SOP: ${sop}`, 10);
  }

  const W3 = "Week 3: Ramp & Review";
  add(W3, "First Deliverables", "Review your KPIs and set your first targets", 14);
  add(W3, "First Deliverables", "30-day check-in with your manager", 21);

  return tasks;
}
