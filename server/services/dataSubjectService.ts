// Data Subject Requests (GDPR/CCPA) + COPPA support.
//
// Implements: data export (machine-readable JSON), and deletion with two
// strategies decided by ownership:
//   - Self-serve accounts  -> HARD delete (rows removed)
//   - School-owned students -> ANONYMIZE (PII stripped, record retained for the
//     school's referential integrity)
// When the subject is a student, both the school admin(s) and the linked
// parent(s)/guardian(s) are alerted (recorded as audit events + captured in the
// request's resultDetails, since there is no per-user notification primitive).
import { db } from "../db";
import {
  users,
  students,
  lessons,
  goals,
  educatorProfiles,
  userPreferences,
  parentStudentLinks,
  organizationMemberships,
  organizations,
  dataSubjectRequests,
  type DataSubjectRequest,
} from "@shared/schema";
import { and, eq, lte, inArray, or, isNotNull } from "drizzle-orm";
import { logAuditEvent } from "./auditLog";
import { isCoppaRestricted } from "./dataGovernance";

export const MIN_SELF_SIGNUP_AGE = 13;

// Platform-level admins with GLOBAL override across all tenants. Lower admin
// tiers (campus/district) are scoped to their own organization sub-tree instead
// — see getActorManagedOrgIds / canActOnSubject.
const PLATFORM_ADMIN_ROLES = new Set(["site_admin", "system_admin"]);

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  return PLATFORM_ADMIN_ROLES.has((role || "") as string);
}

// Walk the organization tree downward from a set of root org ids.
async function getDescendantOrgIds(rootOrgIds: string[]): Promise<Set<string>> {
  const result = new Set<string>();
  const queue = [...rootOrgIds];
  while (queue.length) {
    const current = queue.shift()!;
    const children = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, current));
    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}

// The set of organization ids an actor administers. School/campus admins manage
// just their own org; district/network admins manage their org plus all
// descendants. Returns an empty set for non-admin members.
async function getActorManagedOrgIds(actorId: string, actorRole: string): Promise<Set<string>> {
  const memberships = await db
    .select({ organizationId: organizationMemberships.organizationId, role: organizationMemberships.role })
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, actorId));

  const managed = new Set<string>();
  const districtRoots: string[] = [];

  // Only memberships where the actor is an org admin/owner grant management
  // scope. A plain "member" membership — even for a platform district_admin —
  // must NOT expand DSR scope into that org's tree, or an admin in tenant A who
  // happens to be a member of tenant B could reach tenant B's subjects.
  for (const m of memberships) {
    const isOrgAdmin = m.role === "admin" || m.role === "owner";
    if (!isOrgAdmin) continue;
    const [org] = await db
      .select({ id: organizations.id, type: organizations.type })
      .from(organizations)
      .where(eq(organizations.id, m.organizationId))
      .limit(1);
    if (!org) continue;
    if (org.type === "school" || org.type === "campus") {
      managed.add(org.id);
    }
    if (org.type === "district" || org.type === "network" || org.type === "charter_network") {
      districtRoots.push(org.id);
    }
  }

  for (const root of districtRoots) managed.add(root);
  const descendants = await getDescendantOrgIds(districtRoots);
  descendants.forEach((id) => managed.add(id));
  return managed;
}

// The set of organization ids a subject belongs to (as an enrolled student
// record and/or via org memberships).
async function getSubjectOrgIds(subjectUserId: string): Promise<Set<string>> {
  const orgIds = new Set<string>();
  const studentRows = await db
    .select({ organizationId: students.organizationId })
    .from(students)
    .where(and(eq(students.userId, subjectUserId), isNotNull(students.organizationId)));
  for (const r of studentRows) if (r.organizationId) orgIds.add(r.organizationId);

  const memberRows = await db
    .select({ organizationId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, subjectUserId));
  for (const r of memberRows) orgIds.add(r.organizationId);
  return orgIds;
}

// The set of user ids that belong to any of the given organizations (enrolled
// students + members). Used to scope admin DSR listings to a tenant sub-tree.
export async function getUserIdsInOrgs(orgIds: Set<string>): Promise<Set<string>> {
  const ids = new Set<string>();
  if (orgIds.size === 0) return ids;
  const orgList = Array.from(orgIds);
  const studentRows = await db
    .select({ userId: students.userId })
    .from(students)
    .where(inArray(students.organizationId, orgList));
  for (const r of studentRows) if (r.userId) ids.add(r.userId);

  const memberRows = await db
    .select({ userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(inArray(organizationMemberships.organizationId, orgList));
  for (const r of memberRows) ids.add(r.userId);
  return ids;
}

export async function getActorDsrScope(
  actorId: string,
  actorRole: string,
): Promise<{ isPlatformAdmin: boolean; managedOrgIds: Set<string> }> {
  if (isPlatformAdminRole(actorRole)) {
    return { isPlatformAdmin: true, managedOrgIds: new Set() };
  }
  return { isPlatformAdmin: false, managedOrgIds: await getActorManagedOrgIds(actorId, actorRole) };
}

export function isUnderCoppaAge(birthdate: Date | null | undefined): boolean {
  return isCoppaRestricted(birthdate);
}

export async function setUserBirthdate(userId: string, birthdate: Date): Promise<void> {
  await db.update(users).set({ birthdate, updatedAt: new Date() }).where(eq(users.id, userId));
}

// Is the subject a school-owned student record (enrolled under an organization)?
async function getSchoolOwnedStudent(subjectUserId: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.userId, subjectUserId), isNotNull(students.organizationId)))
    .limit(1);
  return student;
}

async function isStudentSubject(subjectUserId: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, subjectUserId)).limit(1);
  if (user?.role === "student") return true;
  const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId, subjectUserId)).limit(1);
  return !!student;
}

// Permission: the actor may act on the subject's data if they ARE the subject,
// are an active linked parent/guardian, are a platform admin (global override),
// or are a campus/district admin whose managed organization sub-tree contains
// the subject. Crucially, a campus/district admin in tenant A can NOT reach a
// subject that lives only in tenant B.
export async function canActOnSubject(
  actorId: string,
  actorRole: string,
  subjectUserId: string,
): Promise<boolean> {
  if (actorId === subjectUserId) return true;
  if (isPlatformAdminRole(actorRole)) return true;

  const [link] = await db
    .select({ id: parentStudentLinks.id })
    .from(parentStudentLinks)
    .where(
      and(
        eq(parentStudentLinks.parentUserId, actorId),
        eq(parentStudentLinks.studentUserId, subjectUserId),
        eq(parentStudentLinks.status, "active"),
      ),
    )
    .limit(1);
  if (link) return true;

  // Campus/district admins are scoped to their own organization sub-tree.
  if (actorRole === "campus_admin" || actorRole === "district_admin") {
    const managed = await getActorManagedOrgIds(actorId, actorRole);
    if (managed.size === 0) return false;
    const subjectOrgs = await getSubjectOrgIds(subjectUserId);
    for (const orgId of Array.from(subjectOrgs)) {
      if (managed.has(orgId)) return true;
    }
  }
  return false;
}

// Gather a machine-readable export of everything tied to the subject.
export async function exportUserData(subjectUserId: string): Promise<Record<string, any>> {
  const [user] = await db.select().from(users).where(eq(users.id, subjectUserId)).limit(1);
  const sanitizedUser = user
    ? { ...user, mfaSecret: user.mfaSecret ? "[REDACTED]" : null }
    : null;

  const [prefs, userLessons, userGoals, profile, studentRecords, parentLinks] = await Promise.all([
    db.select().from(userPreferences).where(eq(userPreferences.userId, subjectUserId)),
    db.select().from(lessons).where(eq(lessons.userId, subjectUserId)),
    db.select().from(goals).where(eq(goals.userId, subjectUserId)),
    db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, subjectUserId)),
    db.select().from(students).where(eq(students.userId, subjectUserId)),
    db
      .select()
      .from(parentStudentLinks)
      .where(
        or(
          eq(parentStudentLinks.studentUserId, subjectUserId),
          eq(parentStudentLinks.parentUserId, subjectUserId),
        ),
      ),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    subjectUserId,
    user: sanitizedUser,
    preferences: prefs,
    lessons: userLessons,
    goals: userGoals,
    educatorProfile: profile,
    studentRecords,
    parentLinks,
  };
}

// Hard delete: remove the subject's rows. The schema does not enforce DB-level
// FKs, so we explicitly clear the main personal tables then the user row.
async function hardDeleteUser(subjectUserId: string): Promise<void> {
  await db.delete(lessons).where(eq(lessons.userId, subjectUserId));
  await db.delete(goals).where(eq(goals.userId, subjectUserId));
  await db.delete(educatorProfiles).where(eq(educatorProfiles.userId, subjectUserId));
  await db.delete(userPreferences).where(eq(userPreferences.userId, subjectUserId));
  await db.delete(students).where(eq(students.userId, subjectUserId));
  await db
    .delete(parentStudentLinks)
    .where(
      or(
        eq(parentStudentLinks.studentUserId, subjectUserId),
        eq(parentStudentLinks.parentUserId, subjectUserId),
      ),
    );
  await db.delete(users).where(eq(users.id, subjectUserId));
}

// Anonymize: strip PII from the user + student record but keep the rows so the
// school's class rosters / historical references stay intact.
async function anonymizeUser(subjectUserId: string): Promise<void> {
  const now = new Date();
  await db
    .update(users)
    .set({
      email: null,
      firstName: "Redacted",
      lastName: "Student",
      birthdate: null,
      profileImageUrl: null,
      mfaSecret: null,
      mfaEnabled: false,
      accountStatus: "anonymized",
      anonymizedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, subjectUserId));
  await db
    .update(students)
    .set({
      firstName: "Redacted",
      lastName: "Student",
      email: null,
      birthDate: null,
      studentId: null,
      notes: null,
      updatedAt: now,
    })
    .where(eq(students.userId, subjectUserId));
}

// Find the people to alert when a student's data is exported/deleted: linked
// active parents/guardians + the admins of the student's organization.
async function findStudentAlertRecipients(subjectUserId: string): Promise<{
  parentUserIds: string[];
  adminUserIds: string[];
  organizationId: string | null;
}> {
  const parents = await db
    .select({ parentUserId: parentStudentLinks.parentUserId })
    .from(parentStudentLinks)
    .where(
      and(
        eq(parentStudentLinks.studentUserId, subjectUserId),
        eq(parentStudentLinks.status, "active"),
      ),
    );

  const [student] = await db
    .select({ organizationId: students.organizationId })
    .from(students)
    .where(eq(students.userId, subjectUserId))
    .limit(1);

  let adminUserIds: string[] = [];
  const organizationId = student?.organizationId ?? null;
  if (organizationId) {
    // Organization membership roles are member/admin/owner (distinct from the
    // platform role hierarchy). School admins are the admin/owner members.
    const admins = await db
      .select({ userId: organizationMemberships.userId, role: organizationMemberships.role })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, organizationId));
    adminUserIds = admins
      .filter((a) => a.role === "admin" || a.role === "owner")
      .map((a) => a.userId);
  }

  return {
    parentUserIds: parents.map((p) => p.parentUserId),
    adminUserIds,
    organizationId,
  };
}

async function alertStudentDataSubjectAction(
  subjectUserId: string,
  action: "export" | "delete",
  actorId: string,
): Promise<{ parentUserIds: string[]; adminUserIds: string[] }> {
  const { parentUserIds, adminUserIds, organizationId } = await findStudentAlertRecipients(subjectUserId);
  const recipients = Array.from(new Set([...parentUserIds, ...adminUserIds]));
  await Promise.all(
    recipients.map((recipientId) =>
      logAuditEvent({
        userId: recipientId,
        action: `dsr.student_${action}_alert`,
        category: "security",
        severity: "warning",
        resourceType: "user",
        resourceId: subjectUserId,
        organizationId: organizationId ?? undefined,
        details: { subjectUserId, action, actorId },
      }),
    ),
  );
  return { parentUserIds, adminUserIds };
}

export interface DeletionResult {
  strategy: "hard_delete" | "anonymize";
  alertedParents: string[];
  alertedAdmins: string[];
}

export async function processDeletion(params: {
  subjectUserId: string;
  actorId: string;
}): Promise<DeletionResult> {
  const { subjectUserId, actorId } = params;
  const subjectIsStudent = await isStudentSubject(subjectUserId);

  // Alert BEFORE deletion so parent/student links are still resolvable.
  let alertedParents: string[] = [];
  let alertedAdmins: string[] = [];
  if (subjectIsStudent) {
    const alerted = await alertStudentDataSubjectAction(subjectUserId, "delete", actorId);
    alertedParents = alerted.parentUserIds;
    alertedAdmins = alerted.adminUserIds;
  }

  const schoolOwned = await getSchoolOwnedStudent(subjectUserId);
  let strategy: DeletionResult["strategy"];
  if (schoolOwned) {
    await anonymizeUser(subjectUserId);
    strategy = "anonymize";
  } else {
    await hardDeleteUser(subjectUserId);
    strategy = "hard_delete";
  }

  return { strategy, alertedParents, alertedAdmins };
}

// DSR record bookkeeping.
export async function createDataSubjectRequest(input: {
  type: "export" | "delete";
  subjectUserId: string;
  requestedBy: string;
  requestedByRole?: string;
  scope?: "self" | "school";
  organizationId?: string;
  reason?: string;
}): Promise<DataSubjectRequest> {
  const [row] = await db
    .insert(dataSubjectRequests)
    .values({
      type: input.type,
      subjectUserId: input.subjectUserId,
      requestedBy: input.requestedBy,
      requestedByRole: input.requestedByRole ?? null,
      scope: input.scope ?? "self",
      organizationId: input.organizationId ?? null,
      reason: input.reason ?? null,
    })
    .returning();
  return row;
}

export async function completeDataSubjectRequest(
  id: string,
  status: "completed" | "failed" | "rejected",
  resultDetails: Record<string, any>,
): Promise<void> {
  await db
    .update(dataSubjectRequests)
    .set({ status, resultDetails, completedAt: new Date() })
    .where(eq(dataSubjectRequests.id, id));
}

export async function listDataSubjectRequests(filters?: {
  subjectUserId?: string;
  status?: string;
}): Promise<DataSubjectRequest[]> {
  const conditions = [];
  if (filters?.subjectUserId) conditions.push(eq(dataSubjectRequests.subjectUserId, filters.subjectUserId));
  if (filters?.status) conditions.push(eq(dataSubjectRequests.status, filters.status as any));
  return db
    .select()
    .from(dataSubjectRequests)
    .where(conditions.length ? and(...conditions) : undefined);
}

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user;
}

// Retention purge: accounts closed/anonymized more than RETENTION_YEARS ago are
// permanently removed. `retentionPurgeAt` is set when an account is closed; this
// runner deletes any whose purge date has passed.
export const RETENTION_YEARS = 3;

export async function runRetentionPurge(now: Date = new Date()): Promise<{ purged: number; ids: string[] }> {
  const due = await db
    .select({ id: users.id })
    .from(users)
    .where(and(isNotNull(users.retentionPurgeAt), lte(users.retentionPurgeAt, now)));

  const ids = due.map((u) => u.id);
  for (const id of ids) {
    await hardDeleteUser(id);
    await logAuditEvent({
      userId: "system-retention-purge",
      action: "dsr.retention_purge",
      category: "system",
      severity: "warning",
      resourceType: "user",
      resourceId: id,
      details: { retentionYears: RETENTION_YEARS },
    });
  }
  return { purged: ids.length, ids };
}
