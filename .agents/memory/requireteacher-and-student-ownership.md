---
name: requireTeacher guard & student-record ownership quirk
description: How the student-vs-teacher backend gate works and why student-self reads can't reuse ensureStudentRecordAccess
---

# requireTeacher guard

Teacher-only endpoints in `server/routes/{lessons,classroom,student,curriculum}.ts`
are gated by a per-file `requireTeacher = requireRole("homeschool_parent", ... "system_admin")`
that blocks ONLY the `student` role (level 0). Homeschool parents legitimately use
teaching tools, so they must pass — never gate teacher tools with `requireRole("educator")`.

## The student-record ownership quirk (non-obvious, costs time to rediscover)

`students.userId` is the **educator/owner** who created the roster record — it is NOT
the student's own auth id (`req.user.claims.sub`). Consequently `ensureStudentRecordAccess`
(allows owner / org-admin / site-admin) **cannot** authorize a student reading their *own*
record.

**Why it matters:** `StudentDashboard.tsx` reads the signed-in student's own data via
`GET /api/students/:id` and `GET /api/student-assignments/:studentId`. You cannot protect
those two with `requireTeacher` (blocks the student) NOR with `ensureStudentRecordAccess`
(student isn't the owner) without breaking student self-service. They remain a known
residual IDOR (a logged-in student could read another student's record by guessing the id).

**How to apply:** closing that IDOR requires a real student-account ↔ student-record
ownership mapping (link the student's auth id to their `students` row), then an access
helper that also allows "subject is the requester." Until that exists, leave those two
endpoints `isAuthenticated`-only and document them as residual.

Reads that DO have an owner (educator) consumer and no student-self caller — e.g.
`.../grades`, `.../matriculation`, `.../attendance`, `.../achievements` — correctly use
`ensureStudentRecordAccess`. Per-class teacher reads (rosters, grades, attendance, notes,
grade-categories, class assignments, bkd-insights) are pure-teacher and use `requireTeacher`.
