# LYS Developer Execution Plan

Coding standards every contributor (full-time, contractor, AI agent) must follow when working on the LYS platform.

These rules exist because LYS handles high-stakes data: IEP compliance, FERPA / COPPA / NDPR student records, multi-tenant district isolation, and Global Parity Pricing. A single missed `WHERE tenant_id = ?` clause is a cross-tenant data leak.

---

## 1. Database Access — The Storage Gatekeeper

**Rule:** Routes do **not** talk to the database directly. Always go through the storage interface in `server/storage.ts` (or, after the split, `server/storage/<domain>.ts`).

### The bad pattern (banned)

```ts
// In server/routes.ts — DO NOT DO THIS
app.get("/api/students", async (req, res) => {
  const students = await db.select().from(students); // missed tenant_id
  res.json(students);
});
```

### The right pattern

```ts
// In server/storage/students.ts
async getStudentsForTenant(tenantId: string) {
  return db.select()
    .from(students)
    .where(eq(students.tenantId, tenantId)); // tenant check is enforced HERE
}

// In server/routes/students.ts
app.get("/api/students", async (req, res) => {
  const students = await storage.getStudentsForTenant(req.user.tenantId);
  res.json(students);
});
```

### Why
- Tenant isolation, audit logging, and row-level security live in the storage layer.
- A junior dev (or AI agent) using only the storage interface **cannot** accidentally leak data — the only available method already has the security baked in.
- If a route needs a query that doesn't exist yet, **add a method to storage first**, then call it from the route.

### Talking to the team
> "The Database is a Black Box. You do not talk to it directly from the routes. You ask the Storage middleman for what you need. If the Storage layer doesn't have a method for your specific query, build the method in storage first — including the mandatory tenant_id validation — and then call it from your route."

---

## 2. Performance — The Join Over the Loop

**Rule:** No "loop-and-fetch." If you find yourself calling a database method inside a `.map()` or `for` loop, refactor it into a single SQL JOIN or `IN` query.

### The bad pattern (N+1)

```ts
const students = await storage.getAllStudents(tenantId);              // 1 query
for (const s of students) {
  s.org = await storage.getOrgById(s.orgId);                          // 100 more queries
}
```

A 100-row admin list = **101 round trips** to the database. A 5,000-student District Admin view = **5,001 queries**, and the page takes 20+ seconds.

### The right pattern (eager loading)

```ts
const students = await storage.getStudentsWithOrgs(tenantId); // 1 query, JOIN on orgs
```

### Where to look
- Admin list views (Site Admin, District Admin, System Admin)
- Anywhere you build a list and then "decorate" each row with related data

### Talking to the team
> "Check your Storage methods. If you see a loop that calls a database function, refactor it into a single SQL JOIN. We need these pages to stay lightning-fast as we onboard the first cohort of Author Academy teachers and their classes."

---

## 3. API Error Shape — One Standard

**Rule:** Every error response from the server uses this exact shape:

```json
{ "error": "Human-readable error message in plain language." }
```

- Field name is always `error` (not `message`, not `err`, not raw string).
- Value is always a string the toast can display directly.
- HTTP status code carries the machine-readable category (400 / 401 / 403 / 404 / 409 / 422 / 500).

### Server helper (use this, don't roll your own)

```ts
// server/lib/respond.ts
export function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}
```

### Why
- The frontend toast handler reads exactly one field. No more blank toasts because the route returned `{ message: ... }` instead of `{ error: ... }`.

---

## 4. Frontend Data Fetching — Always React Query

**Rule:** Never use raw `fetch()` inside `useEffect()` to load page data. Always use `useQuery` from `@tanstack/react-query`.

### Why
- Built-in caching = no double fetches when components remount.
- Automatic retries on flaky networks.
- Loading and error states for free.
- Invalidation works correctly when mutations happen elsewhere.

The one exception: imperative side-effect calls inside event handlers (logging, beacons, file uploads with progress) can use raw `fetch` because they're not loading display data.

---

## 5. Form Validation — Always zodResolver

**Rule:** Every form uses `react-hook-form` with `zodResolver`. The Zod schema lives in `shared/schema.ts` (or imports from it) so the same validation runs on the client and the server.

### Why
- One schema = same rules on both sides. No "the client said it was valid but the server rejected it" bugs.
- Edge cases (email format, max length, optional vs required) handled by the library, not by hand.

---

## 6. Orphan Route Protocol

We have ~180 server routes that *might* be unused. Don't bulk-delete — that's how you break Forgot Password the day before a demo.

### The protocol
1. **Add a check-in logger.** Wrap each suspect route in middleware that logs the path + timestamp every time it's hit.
2. **Wait 72 hours** while regular use and testing happen.
3. **Review the log.** Any route that stayed silent for 3 days is a delete candidate.
4. **Delete in small batches** (5-10 at a time), verify each batch with a smoke test.
5. **Keep the audit log** of what got deleted, in case anything needs restoring.

### Why
- Data-driven, not guess-based.
- Every removed orphan closes one more "unlocked door" — a security win for FERPA / NDPR compliance.
- Psychologically safe for the team: we're "spring cleaning a successful product," not "blaming anyone for messy code."

---

## 7. File Organization

- **Routes:** `server/routes/<domain>.ts` (e.g. `lessons.ts`, `parent.ts`, `admin.ts`). Main `server/routes.ts` is a dispatcher only and stays under 500 lines.
- **Storage:** `server/storage/<domain>.ts`, mirroring the routes split.
- **Page tabs:** Big admin pages (SystemAdmin, SiteAdmin) put each tab in its own file under `client/src/pages/<page>/tabs/`.
- **Docs:** Feature-specific architecture lives in `docs/<feature>.md`. See `docs/parent-feature.md` for the template.

---

## 8. New Feature Checklist

Before opening a PR for a new feature, confirm:

- [ ] All DB access goes through storage methods (Rule 1)
- [ ] No `.map()` or `for` loop calls a storage method (Rule 2)
- [ ] All error responses use `sendError(res, status, message)` (Rule 3)
- [ ] All page data fetching uses `useQuery` (Rule 4)
- [ ] All forms use `zodResolver` with a shared schema (Rule 5)
- [ ] Tenant ID is included in every query that touches multi-tenant data
- [ ] No new parent-related table without checking `docs/parent-feature.md` first
- [ ] If the feature changes prompt/cache behavior, gate it behind a `feature_flags` row (default off) and include the flag name + retrieval mode in the cache key (see Rule 9)

---

## 9. Feature-Flagged Risky Changes

Anything that changes how prompts are assembled, what gets sent to OpenAI, or how cached responses are keyed must ship behind a feature flag. The legacy path stays the default until an admin toggles the flag from Site Admin → Feature Flags.

### The pattern (canonical example: Bricks/BKD retrieval)

1. **Schema-additive only.** Add new columns/tables; never drop or repurpose existing ones in the same release.
2. **Flag row.** Seed `feature_flags` with `isEnabled: false` at boot (idempotent; create-if-missing).
3. **Read flag with TTL cache.** A 60s in-process cache is enough; do not call the DB on every request.
4. **Branch at the call site, not deep in helpers.** The legacy code path must remain reachable and unchanged.
5. **Cache key includes mode + version.** `lys:...:${retrievalMode}:sv${subjectVersion}` — flag-on and flag-off generations live in separate namespaces, so toggling the flag never serves the wrong shape.
6. **Per-resource versioning beats global cache busts.** When admins edit a subject's canon, bump only that subject's version row.
7. **Attribution + non-fatal writes.** Side-effect inserts (attribution, edit signals) wrap in try/catch and log warnings — they never break the user's request.
8. **Idempotent boot wiring.** `CREATE EXTENSION IF NOT EXISTS`, `seed-if-empty`, `create-flag-if-missing`. Second boot must be a no-op.

### Files to read for the reference implementation
- `server/services/{embeddingService,lessonRetrievalService,lysCanonService,lessonEditCaptureService}.ts`
- `server/openai.ts` — flag check, cache key, attribution
- `server/index.ts::initLessonAiSubsystem` — boot wiring
- `server/storage/lessonAi.ts` — prototype-augmentation pattern (also see Rule 7)

---

## 10. Identity, COPPA & Data-Subject Rights

These rules are non-negotiable — they are the compliance backbone of a K-12 product.

### Self-serve onboarding gate (`server/routes/account.ts`)
- **Birthdate is mandatory for every self-serve onboarding completion, for every role.** Never make it role-conditional — that reopens the bypass where a user picks a non-student role and omits birthdate to skip the age check. Missing birthdate → `birthdate_required` (400).
- **Block under-13 self sign-up entirely.** Any under-13 birthdate (newly provided or already stored) → `coppa_blocked` (403) + a `coppa.self_signup_blocked` audit event. Under-13 users may only be created via a school or homeschool-parent account.
- **Self-serve role is capped.** Only `SELF_SERVE_ONBOARDING_ROLES` (`student`, `educator`, `homeschool_parent`) may be set during onboarding. Anything else → `role_not_allowed` (403) + `onboarding.role_escalation_blocked` audit. Elevated roles (staff/admin/system) are granted only through admin-controlled flows. The onboarding UI must not offer admin roles as selectable options.

### Data-subject requests (`server/routes/dsr.ts`, `server/services/dataSubjectService.ts`)
- **Export** returns the subject's data as JSON. **Erasure** hard-deletes self-serve accounts and anonymizes school-owned student records (never hard-delete a school-owned student).
- **Alert on student subjects.** When the subject is a student, alert school admin(s) and parent(s) via audit events + DSR `resultDetails`.
- **Authorization is tenant-scoped.** Only `site_admin`/`system_admin` get a global override (`isPlatformAdminRole`). Campus/district admins may act only within their managed org sub-tree (admin/owner memberships only — a plain member role grants no scope), plus the subject themselves and active parents/guardians. Do not widen this.

### Retention
- A daily scheduler runs `runRetentionPurge` and removes any account whose 3-year `retentionPurgeAt` has elapsed. **The account-closure/inactivity flow that *sets* `retentionPurgeAt` is the trigger — until that is wired, the purge runner is a no-op safety net, not an active lifecycle control.** Academic marks remain immutable and are out of scope for this purge.

### Keep copy in sync
Any change to the rules above must be reflected in user-facing copy: `client/src/pages/Onboarding.tsx` (birthdate field + role options + error toasts), `client/src/pages/HelpDesk.tsx` (COPPA/role articles), `client/src/pages/DevDocs.tsx` (Governance Rule 5 + COPPA section), and the compliance panels in `client/src/pages/SystemAdmin.tsx`.
