# Guardrail Override Log

A running record of every time the "check with your developer" pause was
overridden and protected-area work went ahead. Newest entries at the top.

Each entry records: when it happened, what was asked, which protected area it
touched, how the person proceeded past the pause, what was actually changed,
and where to look to undo it.

> This log is itself part of the protected guardrail material — entries are
> appended by the agent only. Do not edit or delete past entries.

---

## Entry template

```
## [YYYY-MM-DD HH:MM] — <short title of the change>
- **Requested by:** (how they proceeded: confirmed they are the developer / said developer signed off / chose to proceed anyway)
- **Request (their words):** "..."
- **Protected area(s):** payments · database schema · server code · auth · roles · config · feature flags
- **What was changed:** files/features actually touched
- **Rollback:** checkpoint created after the work (see the checkpoint list in Replit)
```

---

_No overrides recorded yet._
