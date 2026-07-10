# Editing Workflow — from a change to going live

This explains how an edit travels from the place you make it all the way to the
live website, and the two safe ways to work: **straight on `main`** (for tiny,
low-risk changes) and **on `staging` first** (recommended for anything you want
to test before the public sees it).

It is a companion to the [Safe Editing Guide](safe-editing-guide.md) — that guide
tells you *what* is safe to change; this one tells you *how* your change gets
published.

---

## The big picture

```
  You make an edit  ->  Save it to GitHub  ->  Render builds it  ->  It's live
   (in Replit)          (commit + push)        (a few minutes)      (website)
```

Three things to understand:

1. **Replit** is where the edit is made and previewed.
2. **GitHub** is the storage that holds the official copy of the app. Nothing
   goes live until it is saved ("pushed") to GitHub.
3. **Render** is the host that runs the live website. When GitHub receives a new
   change on the branch it watches, Render automatically rebuilds and publishes.

So yes — **after you make a change, it must be pushed to GitHub for it to go
live on Render.** A change that only exists in the Replit workspace is not live
yet.

> Note: the move to Render is set up in the code but may not be fully switched on
> yet (see [render-clerk-migration.md](render-clerk-migration.md)). The workflow
> below is the same either way — the only difference is which host serves the
> final page.

---

## Key words in plain language

- **Branch** — a separate copy of the app you can change without affecting the
  live one. `main` is the real/live copy. `staging` is a safe practice copy.
- **Commit** — saving a snapshot of your changes with a short note describing
  them (e.g. "Updated hero headline and button color").
- **Push** — sending your saved commits up to GitHub. This is the step that
  actually starts the path to going live.
- **Merge** — copying finished, tested changes from one branch (like `staging`)
  into another (like `main`).

---

## How to push to GitHub from Replit

You do **not** need the command line. In the Replit workspace:

1. Open the **Git / version control panel** (the branching icon in the left tool
   strip).
2. Review the list of changed files so you know what you're publishing.
3. Type a short **commit message** describing the change.
4. Click **Commit**, then **Push**.

If you're unsure, you can also just ask the agent: "commit these changes and push
them to GitHub" — but always read what it's about to publish first.

---

## Workflow A — Editing on `main` (quick, low-risk changes only)

Use this only for small cosmetic edits you're confident about (fixing a typo,
tweaking a color, swapping an image).

1. Make sure you're on the **`main`** branch.
2. Make your visual change (stay inside the safe areas from the Safe Editing
   Guide).
3. **Preview it** in Replit and confirm it looks right.
4. Commit with a clear message and **push to GitHub**.
5. Render picks up the change and republishes in a few minutes. Check the live
   site to confirm.

⚠️ Because `main` is the live copy, a mistake here can show up publicly before
you catch it. For anything bigger than a trivial tweak, use Workflow B.

---

## Workflow B — Editing on `staging` first (recommended)

This lets you test changes safely, then publish them once you're happy.

1. Switch to the **`staging`** branch.
2. Make your change and **preview it** in Replit.
3. Commit and **push `staging` to GitHub**. If a staging site is connected on
   Render, you can view your change there on a private test URL — a rehearsal of
   the real thing, with no risk to the public site.
4. Test thoroughly: click through the affected pages, check on your phone as well
   as your computer, make sure nothing else broke.
5. When you're satisfied, **merge `staging` into `main`** (this is the "move to
   GitHub after testing" step). The simplest way is a **Pull Request** on
   GitHub:
   - On github.com, open a Pull Request from `staging` into `main`.
   - Review the list of changes, then click **Merge**.
6. Once merged into `main`, Render publishes it to the live site automatically.

Think of it as: **practice on `staging` → prove it works → promote to `main` →
it goes live.**

---

## Before every push — quick checklist

- [ ] The change is inside a **safe area** (see the Safe Editing Guide). If it
      touches data, logins, payments, permissions, or a config file — stop and
      ask the developer.
- [ ] You **previewed** it and it looks right.
- [ ] Your **commit message** clearly says what changed.
- [ ] For anything beyond a tiny tweak, you did it on **`staging`** and tested
      before merging to `main`.

---

## If something goes wrong after it's live

Don't panic — nothing is permanent.

- **In Replit**, you can roll back to an earlier checkpoint to undo recent
  changes.
- **In GitHub**, previous commits are all saved, so a developer can revert to the
  last good version quickly.
- If you're unsure, stop pushing more changes and contact your developer with a
  short note of what you did and what looks wrong.

---

## Quick reference

| You want to...                          | Do this                                    |
| --------------------------------------- | ------------------------------------------ |
| Make a tiny, safe fix                   | Workflow A (edit `main`, preview, push)    |
| Make any real change you want to test   | Workflow B (edit `staging`, test, merge)   |
| Publish your change                     | Commit + push to GitHub → Render publishes |
| Move tested changes to the live site    | Merge `staging` into `main` on GitHub      |
| Undo a mistake                          | Roll back in Replit, or ask your developer |
