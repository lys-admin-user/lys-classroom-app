# The Parent Feature Ecosystem

The "Parent/Guardian" feature in the LYS platform currently spans 8 distinct tables. This is **by design** to separate relationships, compliance, and communication.

## THE GOLDEN RULE

**Do not create a new parent-related table.** If a new parent feature is requested, you must first attempt to integrate it into one of these existing domains via:

- a new column on an existing table
- an enum value update
- a JSONB metadata field

---

## 1. The Core Relationship (The Anchor)

Everything starts here. A user is not a "parent" to a student until this link exists.

### `parent_student_links`
- **Purpose:** Maps the many-to-many relationship between a Parent account and a Student account.
- **Use For:** Verifying access rights. (e.g., Does User A have permission to view Student B's Success metrics?)

---

## 2. Access & Compliance (The Gates)

Because we deal with COPPA / FERPA, onboarding and legal permission have their own dedicated tables.

### `parent_invitations`
- **Purpose:** Handles the onboarding lifecycle. Tracks when a teacher/student invites a parent to the platform, the unique token, and whether it was accepted, expired, or revoked.

### `parental_consents`
- **Purpose:** The legal ledger. Tracks COPPA age-gate approvals, terms of service agreements, and permissions for the student to use the "Safety Suite" messaging tools.

---

## 3. Communication (The Safety Suite)

We separate 1-to-1 messaging from 1-to-Many announcements for data archiving and auditing purposes.

### `parent_message_threads` & `parent_messages`
- **Purpose:** Direct, two-way communication (e.g., Parent ↔ Teacher or Parent ↔ Mentor).
- **Use For:** Any feature requiring back-and-forth dialogue or the Review Queue approval process.

### `parent_broadcast_posts`
- **Purpose:** One-way, 1-to-Many announcements (e.g., District Admin → All Parents, or Teacher → Class Parents).
- **Use For:** Newsletters, system alerts, or general class updates.

---

## 4. Monitoring & Settings (The Experience)

How parents consume data and how they interact with Success tracking.

### `parent_progress_notes`
- **Purpose:** Stores the qualitative feedback attached to a student's "Success / Not Yet" marks.
- **Use For:** Whenever a parent needs to view teacher feedback, dispute a mark, or leave an encouraging note for the student's portfolio.

### `parent_notification_preferences`
- **Purpose:** Stores the parent's opt-ins (SMS vs. Email, frequency of updates, push notifications).
- **Use For:** Routing logic. **Check this table before firing any automated email/SMS to a parent.**

---

## How to Handle Future Feature Requests

Map new requests to the existing structure instead of adding tables:

| Request | Right answer | Wrong answer |
|---|---|---|
| "Parents need to approve a field trip." | Add a new `type` enum value to `parental_consents`. | Build a `field_trip_approvals` table. |
| "Parents need to RSVP to events." | Add an `rsvp` JSONB column to `parent_broadcast_posts`. | Build a `parent_rsvps` table. |
| "Parents need a private channel with the principal." | Use existing `parent_message_threads` with a thread `category` enum value. | Build a `principal_messages` table. |
