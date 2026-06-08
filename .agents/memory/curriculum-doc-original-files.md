---
name: Curriculum doc original-file storage
description: Why uploaded curriculum source files live in Postgres bytea (not object storage) for the moderation side-by-side viewer
---

Original uploaded curriculum files (PDF/HTML) are persisted in Postgres as a
`bytea` column on `curriculum_documents` (`originalFileBytes`), served to the
admin moderation viewer through a server-proxy endpoint that sets the stored
mime type + a strict CSP for HTML. The right pane renders PDFs natively in an
iframe and HTML in a sandboxed iframe. Bytes never leak to general API callers
(stripped in the service layer); only sys-admins can fetch the file endpoint.

**Why:** A task proposed migrating this storage to Replit Object Storage
(signed URLs + PDF.js). The user explicitly chose to keep files in the database
to avoid enabling a paid cloud service, since the side-by-side comparison
already works end-to-end. Decision date: 2026-06-08.

**How to apply:** Don't re-introduce object storage for these files unless the
user revisits the cost tradeoff. The 20MB multer cap keeps blobs bounded. If
DB bloat becomes a real problem, that's the trigger to reopen the object-storage
migration — confirm with the user first.
