import * as client from "openid-client";
import memoize from "memoizee";
import { storage } from "../storage";
import { authStorage } from "../replit_integrations/auth/storage";
import { decryptIfPossible } from "./crypto";
import { ROLE_HIERARCHY, type SsoConnection, type UserRole } from "@shared/schema";

// Enterprise SSO (OIDC) service.
//
// This runs alongside the platform's default Replit Auth. Each organization can
// register its own OpenID Connect identity provider (Google Workspace, Azure AD,
// Okta, OneLogin, or any generic OIDC issuer). Users from that org sign in with
// "Sign in with your school", get matched to a connection by email domain, and
// are provisioned (or linked) into a normal LYS user + org membership.
//
// The pure helpers (domain resolution, role sanitization) are exported so they
// can be unit-tested without any network or database.

// Self-serve / SSO-provisioned users may only receive non-privileged roles.
// Elevated roles are granted exclusively through admin flows.
const SSO_PROVISIONABLE_ROLES: UserRole[] = ["student", "educator", "homeschool_parent"];

/**
 * Extract the lowercased domain portion of an email address.
 * Returns null for anything that is not a single well-formed address.
 */
export function emailDomain(email: string | undefined | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return null;
  const [local, domain] = parts;
  if (!local || !domain || domain.includes(" ") || !domain.includes(".")) return null;
  return domain;
}

/**
 * Given an email and the set of enabled SSO connections, find the single
 * connection whose allowedDomains contains the email's domain. Returns null when
 * there is no match. Pure — no IO.
 */
export function resolveSsoConnectionByEmail<T extends { allowedDomains?: string[] | null; enabled?: boolean | null }>(
  email: string,
  connections: T[],
): T | null {
  if (!emailDomain(email)) return null;
  for (const conn of connections) {
    if (conn.enabled === false) continue;
    if (emailMatchesConnection(email, conn)) return conn;
  }
  return null;
}

/**
 * Whether the given email's domain is in a connection's allowedDomains. Used as
 * the authoritative server-side check during callback/provisioning so a user
 * authenticated by the IdP cannot be provisioned into an org they don't belong
 * to. An empty/absent allowedDomains list matches nothing. Pure — no IO.
 */
export function emailMatchesConnection(
  email: string | undefined | null,
  connection: { allowedDomains?: string[] | null },
): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  const domains = (connection.allowedDomains || []).map((d) => d.trim().toLowerCase()).filter(Boolean);
  return domains.includes(domain);
}

/**
 * Clamp a requested provisioning role to the set of allowed non-privileged
 * roles. Anything elevated or unknown falls back to "student".
 */
export function sanitizeProvisionRole(role: string | undefined | null): UserRole {
  if (role && (SSO_PROVISIONABLE_ROLES as string[]).includes(role) && role in ROLE_HIERARCHY) {
    return role as UserRole;
  }
  return "student";
}

// Discovery is relatively expensive, so cache the OIDC config per
// issuer+clientId for an hour. The client secret is read fresh from the (already
// decrypted) connection on each call but does not change discovery results.
const discover = memoize(
  async (issuerUrl: string, clientId: string, clientSecret: string) => {
    return await client.discovery(new URL(issuerUrl), clientId, clientSecret);
  },
  { maxAge: 3600 * 1000, promise: true, normalizer: (args) => `${args[0]}|${args[1]}` },
);

async function getConfigForConnection(connection: SsoConnection): Promise<client.Configuration> {
  const secret = (decryptIfPossible(connection.clientSecret) || "") as string;
  return await discover(connection.issuerUrl, connection.clientId, secret);
}

export interface SsoAuthRequest {
  url: string;
  state: string;
  nonce: string;
  codeVerifier: string;
  connectionId: string;
}

/**
 * Build the provider authorization URL plus the PKCE/state/nonce values that
 * must be stashed in the session and checked on callback.
 */
export async function buildSsoAuthRequest(
  connection: SsoConnection,
  redirectUri: string,
): Promise<SsoAuthRequest> {
  const config = await getConfigForConnection(connection);

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  }).href;

  return { url, state, nonce, codeVerifier, connectionId: connection.id };
}

export interface SsoClaims {
  sub: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

/**
 * Complete the authorization-code exchange and return normalized claims.
 */
export async function handleSsoCallback(
  connection: SsoConnection,
  currentUrl: URL,
  expected: { state: string; nonce: string; codeVerifier: string },
): Promise<SsoClaims> {
  const config = await getConfigForConnection(connection);

  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: expected.codeVerifier,
    expectedState: expected.state,
    expectedNonce: expected.nonce,
  });

  const claims = tokens.claims();
  if (!claims?.sub) {
    throw new Error("SSO token response missing subject claim");
  }

  return {
    sub: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : undefined,
    firstName:
      (typeof claims.given_name === "string" && claims.given_name) ||
      (typeof (claims as any).first_name === "string" && (claims as any).first_name) ||
      undefined,
    lastName:
      (typeof claims.family_name === "string" && claims.family_name) ||
      (typeof (claims as any).last_name === "string" && (claims as any).last_name) ||
      undefined,
    profileImageUrl: typeof claims.picture === "string" ? claims.picture : undefined,
  };
}

/**
 * Link an existing user (matched by email) or provision a new one for the given
 * SSO connection, ensuring an active org membership. Returns the user id to put
 * on the session, or null when the user is unknown and auto-provisioning is off.
 */
export async function provisionSsoUser(
  connection: SsoConnection,
  claims: SsoClaims,
): Promise<string | null> {
  if (!claims.email) {
    throw new Error("SSO provider did not return an email address");
  }

  // Enforce the email-domain allowlist server-side. The lookup endpoint is only
  // a UX hint; this is the authoritative check that prevents a user authenticated
  // by the IdP from being provisioned into an org whose domain they don't belong
  // to (e.g. by hitting the login URL directly).
  if (!emailMatchesConnection(claims.email, connection)) {
    throw new Error("Email domain is not authorized for this SSO connection");
  }

  const existing = await storage.getUserByEmail(claims.email);

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    if (connection.autoProvision === false) {
      return null;
    }
    const created = await authStorage.upsertUser(
      {
        email: claims.email,
        firstName: claims.firstName,
        lastName: claims.lastName,
        profileImageUrl: claims.profileImageUrl,
        role: sanitizeProvisionRole(connection.defaultRole),
      } as any,
      // The email is asserted by a trusted, admin-configured SSO IdP.
      { emailVerified: true },
    );
    userId = created.id;
  }

  // Ensure the user is a member of the connection's organization.
  const membership = await storage.getOrgMembership(connection.organizationId, userId);
  if (!membership) {
    await storage.createOrgMembership({
      organizationId: connection.organizationId,
      userId,
      role: "member",
      status: "active",
    } as any);
  }

  return userId;
}
