import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { encryptIfPossible } from "../services/crypto";
import { verifyOrgAdminAccess } from "./_helpers";
import { logAuditEvent } from "../services/auditLog";
import {
  buildSsoAuthRequest,
  handleSsoCallback,
  provisionSsoUser,
  resolveSsoConnectionByEmail,
  emailDomain,
} from "../services/ssoService";
import type { SsoConnection } from "@shared/schema";

// Roles that may be assigned to SSO-provisioned users (non-privileged only).
const PROVISIONABLE_ROLES = ["student", "educator", "homeschool_parent"] as const;

const upsertSsoSchema = z.object({
  displayName: z.string().min(1).max(200),
  provider: z.enum(["google", "azure", "okta", "onelogin", "generic"]).default("generic"),
  issuerUrl: z.string().url(),
  clientId: z.string().min(1),
  clientSecret: z.string().optional(),
  allowedDomains: z.array(z.string().min(1)).default([]),
  defaultRole: z.enum(PROVISIONABLE_ROLES).default("student"),
  autoProvision: z.boolean().default(true),
  enabled: z.boolean().default(true),
});

// Strip secrets before returning a connection to clients.
function publicSsoConnection(conn: SsoConnection) {
  return {
    ...conn,
    clientSecret: conn.clientSecret ? "[ENCRYPTED]" : null,
  };
}

function callbackRedirectUri(req: any, connectionId: string): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}/api/sso/callback/${connectionId}`;
}

export function registerSsoRoutes(app: Express): void {
  // ── Public sign-in flow ─────────────────────────────────────────────────────

  // Look up whether an email domain maps to an enterprise SSO connection. Used by
  // the "Sign in with your school" entry to decide whether to offer SSO.
  app.get("/api/sso/lookup", async (req, res) => {
    try {
      const email = String(req.query.email || "");
      const domain = emailDomain(email);
      if (!domain) {
        res.json({ found: false });
        return;
      }
      const connections = await storage.getEnabledSsoConnections();
      const match = resolveSsoConnectionByEmail(email, connections);
      if (!match) {
        res.json({ found: false });
        return;
      }
      res.json({ found: true, connectionId: match.id, displayName: match.displayName });
    } catch (error) {
      console.error("SSO lookup failed:", error);
      res.status(500).json({ error: "SSO lookup failed" });
    }
  });

  // Begin the OIDC authorization-code flow for a connection.
  app.get("/api/sso/login/:connectionId", async (req: any, res) => {
    try {
      const { connectionId } = req.params;
      const connection = await storage.getSsoConnection(connectionId);
      if (!connection || !connection.enabled) {
        res.redirect("/?sso_error=not_found");
        return;
      }

      const redirectUri = callbackRedirectUri(req, connectionId);
      const authReq = await buildSsoAuthRequest(connection, redirectUri);

      // Stash the transaction in the session for callback verification.
      req.session.ssoTx = {
        connectionId,
        state: authReq.state,
        nonce: authReq.nonce,
        codeVerifier: authReq.codeVerifier,
        redirectUri,
      };

      res.redirect(authReq.url);
    } catch (error) {
      console.error("SSO login failed:", error);
      res.redirect("/?sso_error=login_failed");
    }
  });

  // OIDC callback: verify, provision/link the user, establish a session.
  app.get("/api/sso/callback/:connectionId", async (req: any, res) => {
    try {
      const { connectionId } = req.params;
      const tx = req.session?.ssoTx;
      if (!tx || tx.connectionId !== connectionId) {
        res.redirect("/?sso_error=invalid_state");
        return;
      }

      const connection = await storage.getSsoConnection(connectionId);
      if (!connection || !connection.enabled) {
        res.redirect("/?sso_error=not_found");
        return;
      }

      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const currentUrl = new URL(`${proto}://${host}${req.originalUrl}`);

      const claims = await handleSsoCallback(connection, currentUrl, {
        state: tx.state,
        nonce: tx.nonce,
        codeVerifier: tx.codeVerifier,
      });

      const userId = await provisionSsoUser(connection, claims);
      delete req.session.ssoTx;

      if (!userId) {
        res.redirect("/?sso_error=not_provisioned");
        return;
      }

      // Build a passport session user compatible with isAuthenticated. SSO users
      // do not carry Replit refresh tokens, so the session simply expires with
      // the cookie (1 week) and they re-authenticate via SSO.
      const sessionUser: any = {
        claims: {
          sub: userId,
          email: claims.email,
          first_name: claims.firstName,
          last_name: claims.lastName,
        },
        access_token: undefined,
        refresh_token: undefined,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        sso: { connectionId, organizationId: connection.organizationId },
      };

      req.login(sessionUser, async (err: any) => {
        if (err) {
          console.error("SSO session establishment failed:", err);
          res.redirect("/?sso_error=session_failed");
          return;
        }
        await logAuditEvent({
          userId,
          action: "login_success",
          category: "auth",
          severity: "info",
          details: { method: "enterprise_sso", connectionId, organizationId: connection.organizationId },
        }).catch(() => {});
        res.redirect("/");
      });
    } catch (error) {
      console.error("SSO callback failed:", error);
      res.redirect("/?sso_error=callback_failed");
    }
  });

  // ── Admin configuration (org-scoped) ────────────────────────────────────────

  // List SSO connections for an organization.
  app.get("/api/organizations/:orgId/sso", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      if (!(await verifyOrgAdminAccess(userId, orgId))) {
        res.status(403).json({ error: "Insufficient permissions for this organization" });
        return;
      }
      const connections = await storage.getSsoConnectionsByOrg(orgId);
      res.json(connections.map(publicSsoConnection));
    } catch (error) {
      console.error("Failed to list SSO connections:", error);
      res.status(500).json({ error: "Failed to list SSO connections" });
    }
  });

  // Create an SSO connection for an organization.
  app.post("/api/organizations/:orgId/sso", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      if (!(await verifyOrgAdminAccess(userId, orgId))) {
        res.status(403).json({ error: "Insufficient permissions for this organization" });
        return;
      }
      const validated = upsertSsoSchema.parse(req.body);
      if (!validated.clientSecret) {
        res.status(400).json({ error: "clientSecret is required when creating a connection" });
        return;
      }
      const created = await storage.createSsoConnection({
        organizationId: orgId,
        displayName: validated.displayName,
        provider: validated.provider,
        issuerUrl: validated.issuerUrl,
        clientId: validated.clientId,
        clientSecret: encryptIfPossible(validated.clientSecret) as string,
        allowedDomains: validated.allowedDomains.map((d) => d.trim().toLowerCase()),
        defaultRole: validated.defaultRole,
        autoProvision: validated.autoProvision,
        enabled: validated.enabled,
      } as any);

      await logAuditEvent({
        userId,
        action: "sso.connection_created",
        category: "admin_action",
        severity: "info",
        resourceType: "sso_connection",
        resourceId: created.id,
        details: { organizationId: orgId, issuerUrl: validated.issuerUrl },
      }).catch(() => {});

      res.json(publicSsoConnection(created));
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid SSO configuration", details: error.errors });
        return;
      }
      console.error("Failed to create SSO connection:", error);
      res.status(500).json({ error: "Failed to create SSO connection" });
    }
  });

  // Update an SSO connection.
  app.patch("/api/sso/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const connection = await storage.getSsoConnection(id);
      if (!connection) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      if (!(await verifyOrgAdminAccess(userId, connection.organizationId))) {
        res.status(403).json({ error: "Insufficient permissions for this organization" });
        return;
      }
      const validated = upsertSsoSchema.partial().parse(req.body);

      const updates: Partial<SsoConnection> = {};
      if (validated.displayName !== undefined) updates.displayName = validated.displayName;
      if (validated.provider !== undefined) updates.provider = validated.provider;
      if (validated.issuerUrl !== undefined) updates.issuerUrl = validated.issuerUrl;
      if (validated.clientId !== undefined) updates.clientId = validated.clientId;
      if (validated.clientSecret) updates.clientSecret = encryptIfPossible(validated.clientSecret) as string;
      if (validated.allowedDomains !== undefined) {
        updates.allowedDomains = validated.allowedDomains.map((d) => d.trim().toLowerCase());
      }
      if (validated.defaultRole !== undefined) updates.defaultRole = validated.defaultRole;
      if (validated.autoProvision !== undefined) updates.autoProvision = validated.autoProvision;
      if (validated.enabled !== undefined) updates.enabled = validated.enabled;

      const updated = await storage.updateSsoConnection(id, updates);

      await logAuditEvent({
        userId,
        action: "sso.connection_updated",
        category: "admin_action",
        severity: "info",
        resourceType: "sso_connection",
        resourceId: id,
        details: { organizationId: connection.organizationId },
      }).catch(() => {});

      res.json(updated ? publicSsoConnection(updated) : null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid SSO configuration", details: error.errors });
        return;
      }
      console.error("Failed to update SSO connection:", error);
      res.status(500).json({ error: "Failed to update SSO connection" });
    }
  });

  // Delete an SSO connection.
  app.delete("/api/sso/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const connection = await storage.getSsoConnection(id);
      if (!connection) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      if (!(await verifyOrgAdminAccess(userId, connection.organizationId))) {
        res.status(403).json({ error: "Insufficient permissions for this organization" });
        return;
      }
      await storage.deleteSsoConnection(id);
      await logAuditEvent({
        userId,
        action: "sso.connection_deleted",
        category: "admin_action",
        severity: "warning",
        resourceType: "sso_connection",
        resourceId: id,
        details: { organizationId: connection.organizationId },
      }).catch(() => {});
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete SSO connection:", error);
      res.status(500).json({ error: "Failed to delete SSO connection" });
    }
  });

  // Test that a connection's issuer is reachable and discovery succeeds.
  app.post("/api/sso/connections/:id/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const connection = await storage.getSsoConnection(id);
      if (!connection) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      if (!(await verifyOrgAdminAccess(userId, connection.organizationId))) {
        res.status(403).json({ error: "Insufficient permissions for this organization" });
        return;
      }
      // A successful auth-request build proves discovery + client config work.
      await buildSsoAuthRequest(connection, callbackRedirectUri(req, id));
      res.json({ success: true, message: "OIDC discovery succeeded" });
    } catch (error: any) {
      res.json({ success: false, message: error?.message || "OIDC discovery failed" });
    }
  });
}
