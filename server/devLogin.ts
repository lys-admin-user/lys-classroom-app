// Development-only login switcher.
//
// This lets a developer sign in as any seeded test role (see
// `scripts/seed-test-users.ts`) WITHOUT going through Replit OIDC, so the full
// app can be audited across every user type locally.
//
// SECURITY: This is a real authentication bypass and must NEVER be reachable on
// the published/deployed site. It is hard-gated three ways:
//   1. `registerDevLogin` only mounts when `isDevLoginEnabled()` is true.
//   2. Every handler re-checks `isDevLoginEnabled()` (defense in depth).
//   3. The gate is false whenever REPLIT_DEPLOYMENT === "1" (the deployed site)
//      or NODE_ENV === "production".
import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEV_ROLES = [
  "student",
  "homeschool_parent",
  "educator",
  "staff",
  "campus_admin",
  "district_admin",
  "site_admin",
  "system_admin",
] as const;

export function isDevLoginEnabled(): boolean {
  return (
    process.env.REPLIT_DEPLOYMENT !== "1" &&
    process.env.NODE_ENV !== "production"
  );
}

function buildSessionUser(u: { id: string; email: string | null; firstName: string | null; lastName: string | null }) {
  const oneWeek = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  return {
    // Mirrors the shape produced by Replit OIDC so isAuthenticated + every
    // `req.user.claims.sub` reader works unchanged.
    claims: {
      sub: u.id,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      exp: oneWeek,
    },
    access_token: "dev-access-token",
    refresh_token: "dev-refresh-token",
    expires_at: oneWeek,
  };
}

export function registerDevLogin(app: Express) {
  if (!isDevLoginEnabled()) return;

  // eslint-disable-next-line no-console
  console.warn(
    "[dev-login] Development login switcher ENABLED at /api/dev/login — never serve this on production.",
  );

  // Simple self-contained role picker UI (dev-only, so the route gating IS the
  // access control — no need to thread it through the client build).
  app.get("/api/dev/login", (_req, res) => {
    if (!isDevLoginEnabled()) return res.status(404).end();
    const buttons = DEV_ROLES.map(
      (r) =>
        `<button data-role="${r}" onclick="login('${r}')">${r.replace(/_/g, " ")}</button>`,
    ).join("");
    res.set("Content-Type", "text/html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>LYS Dev Login</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{background:#1e293b;padding:32px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.4);max-width:420px;width:100%}
  h1{font-size:18px;margin:0 0 4px}p{color:#94a3b8;font-size:13px;margin:0 0 20px}
  button{display:block;width:100%;margin:8px 0;padding:12px 16px;border:1px solid #334155;border-radius:10px;background:#0f172a;color:#e2e8f0;font-size:14px;text-align:left;cursor:pointer;text-transform:capitalize}
  button:hover{background:#334155}
  .logout{margin-top:16px;border-color:#7f1d1d;color:#fca5a5}
  #msg{margin-top:12px;font-size:13px;color:#fbbf24;min-height:18px}
</style></head>
<body><div class="card">
  <h1>LYS Development Login</h1>
  <p>Pick a role to sign in as a seeded test account. Development only.</p>
  ${buttons}
  <button class="logout" onclick="logout()">Log out</button>
  <div id="msg"></div>
</div>
<script>
  async function login(role){
    document.getElementById('msg').textContent='Signing in as '+role+'…';
    const r=await fetch('/api/dev/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})});
    if(r.ok){window.location.href='/';}else{const t=await r.text();document.getElementById('msg').textContent='Failed: '+t;}
  }
  async function logout(){await fetch('/api/dev/logout',{method:'POST'});document.getElementById('msg').textContent='Logged out.';}
</script>
</body></html>`);
  });

  async function loginAs(req: any, role: string): Promise<{ status: number; body: any }> {
    if (!DEV_ROLES.includes(role as (typeof DEV_ROLES)[number])) {
      return { status: 400, body: { message: "Unknown role" } };
    }
    const id = `dev-${role}`;
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      return {
        status: 404,
        body: { message: `Seed test users first: npx tsx scripts/seed-test-users.ts (missing ${id})` },
      };
    }
    const sessionUser = buildSessionUser(user);
    await new Promise<void>((resolve, reject) =>
      req.login(sessionUser as any, (err: any) => (err ? reject(err) : resolve())),
    );
    return { status: 200, body: { ok: true, id, role } };
  }

  app.post("/api/dev/login", async (req, res) => {
    if (!isDevLoginEnabled()) return res.status(404).end();
    try {
      const { status, body } = await loginAs(req, String(req.body?.role ?? ""));
      res.status(status).json(body);
    } catch {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Convenience: GET that logs in then redirects home, so a browser (or the
  // screenshot tool) can switch role by visiting a single URL.
  app.get("/api/dev/login/:role", async (req, res) => {
    if (!isDevLoginEnabled()) return res.status(404).end();
    // Optional same-origin relative path to land on after login (e.g.
    // ?next=/lesson-generator), so a single navigation can authenticate AND
    // open a target page — handy for stateless screenshot auditing.
    const rawNext = String(req.query.next ?? "/");
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
    try {
      const { status } = await loginAs(req, String(req.params.role));
      if (status !== 200) return res.status(status).redirect("/api/dev/login");
      res.redirect(next);
    } catch {
      res.redirect("/api/dev/login");
    }
  });

  app.post("/api/dev/logout", (req, res) => {
    if (!isDevLoginEnabled()) return res.status(404).end();
    req.logout(() => res.json({ ok: true }));
  });
}
