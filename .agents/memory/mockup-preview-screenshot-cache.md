---
name: Mockup preview screenshot cache
description: external_url screenshots of mockup-sandbox previews are cached by URL; bust with a query param after edits
---

# Mockup preview screenshots are cached by URL

When verifying a mockup-sandbox component change via the `screenshot` tool
(`type: external_url`) against a `/__mockup/preview/<folder>/<Component>` URL,
the screenshot service returns a **stale cached image** if the same URL was
captured before — even after editing the component file AND restarting the
mockup workflow.

**Symptom:** identical screenshots showing the OLD component, while the file on
disk clearly has the new code.

**Fix:** append a cache-busting query param to the URL, e.g.
`.../RoleRouted?v=2`. The fresh capture then shows the updated component.

**Why:** the external screenshot path caches by exact URL; the file/server were
never the problem. Don't waste cycles re-restarting the workflow or re-curling
modules — just bust the URL.
