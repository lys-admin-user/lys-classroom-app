import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_PRICES } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Server,
  Database,
  Shield,
  Lock,
  Code,
  Globe,
  Cpu,
  FileText,
  Users,
  Building2,
  Eye,
  Zap,
  AlertTriangle,
  BookOpen,
  Layers,
  Network,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { Link } from "wouter";

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  content: DocContent[];
}

interface DocContent {
  heading: string;
  body: string;
  code?: string;
  language?: string;
  items?: string[];
  table?: { headers: string[]; rows: string[][] };
  warning?: string;
  note?: string;
}

const docSections: DocSection[] = [
  {
    id: "architecture",
    title: "Platform Architecture",
    icon: Layers,
    category: "Core",
    content: [
      {
        heading: "Monorepo Structure",
        body: "LYS is a full-stack TypeScript monorepo with three main directories. All code shares types and validation schemas, ensuring type safety from database to UI.",
        items: [
          "/client — React 18 frontend with Vite bundler, Wouter routing, TanStack React Query, and shadcn/ui components",
          "/server — Express.js backend with RESTful JSON API, Drizzle ORM, and WebSocket support",
          "/shared — Shared TypeScript types, Drizzle schema definitions, and validation models used by both client and server",
        ],
      },
      {
        heading: "Frontend Architecture",
        body: "The frontend uses a component-based architecture with page-level routing. State management is handled through TanStack React Query for server state and React hooks for local state.",
        items: [
          "Pages: /client/src/pages/ — each file represents a top-level route",
          "Components: /client/src/components/ — reusable UI components, organized by feature",
          "Hooks: /client/src/hooks/ — custom React hooks (use-auth, use-tier, use-toast, use-mobile)",
          "Lib: /client/src/lib/ — utility functions, query client configuration, ad config",
          "Routing: Wouter (lightweight alternative to React Router) — routes defined in App.tsx",
          "Data fetching: TanStack React Query v5 with object-form queries and default fetcher",
          "UI library: shadcn/ui built on Radix UI primitives with Tailwind CSS styling",
        ],
      },
      {
        heading: "Backend Architecture",
        body: "The backend is an Express.js server that serves both the API and the Vite-built frontend. All database operations go through a storage interface abstraction.",
        items: [
          "Entry point: server/index.ts — Express app setup, middleware, and server initialization",
          "Routes: server/routes.ts — all API endpoint definitions",
          "Storage: server/storage.ts — IStorage interface and DatabaseStorage implementation",
          "Services: server/services/ — business logic (PII sanitizer, content filter, audit log, data governance, BLS sync)",
          "Auth: server/replit_integrations/auth/ — Replit Auth OIDC integration",
          "AI: server/openai.ts — OpenAI API integration with mock fallback",
          "WebSocket: server/websocket.ts — real-time collaboration server",
          "Vite: server/vite.ts — Vite dev server integration (DO NOT MODIFY)",
        ],
      },
      {
        heading: "Design System",
        body: "LYS uses a custom design system built on Tailwind CSS with specific brand colors and typography.",
        items: [
          "Primary Red (lys-red): Brand accent color for BE pillar and primary CTAs",
          "Warm Yellow (lys-yellow): KNOW pillar accent and highlight color",
          "Dark Teal (lys-teal): DO pillar accent and success indicators",
          "Typography: Permanent Marker (headers/logo), Oswald (subheaders), Roboto (body text)",
          "Components: shadcn/ui with custom theme tokens defined in client/src/index.css",
          "Icons: lucide-react for UI icons, react-icons/si for brand/company logos",
          "Dark mode: Supported via class-based toggle on document root element",
        ],
      },
    ],
  },
  {
    id: "database",
    title: "Database Schema & Data Model",
    icon: Database,
    category: "Core",
    content: [
      {
        heading: "Database Overview",
        body: "LYS uses PostgreSQL managed by Drizzle ORM. The schema is defined in /shared/schema.ts. All migrations are handled through Drizzle's push mechanism. Never modify the database directly — always update the schema file and run db:push.",
        warning: "Schema changes must go through /shared/schema.ts and 'npm run db:push'. Direct SQL modifications will cause drift between code and database state.",
      },
      {
        heading: "Core Tables",
        body: "The primary tables that drive the platform's core functionality.",
        table: {
          headers: ["Table", "Purpose", "Key Columns", "Relationships"],
          rows: [
            ["users", "User accounts and profiles", "id (PK), email, role, tier, loginCount, onboardingCompleted", "Referenced by lessons, goals, memberships, journey data"],
            ["organizations", "Schools, districts, charter networks, university systems", "id (PK), slug, type (school/district/network/charter_network/...), parentOrganizationId", "Self-referential hierarchy; supports ISDs, CMO/EMO networks, single campuses"],
            ["organization_memberships", "User-to-org links", "id (PK), organizationId (FK), userId (FK), role (member/admin/owner)", "Joins users to organizations with org-level roles"],
            ["lessons", "Generated lesson plans", "id (PK), userId (FK), shareId, subject, gradeLevel, topic", "Linked to user; shareable via shareId"],
            ["goals", "Student action plans", "id (PK), userId (FK), title, status, progress", "Linked to user account"],
            ["assignments", "Class assignments", "id (PK), userId (FK), lessonId, title, dueDate", "Linked to lesson and creator"],
            ["sessions", "Express session storage", "sid (PK), sess (JSON), expire", "Used by connect-pg-simple for session persistence"],
          ],
        },
      },
      {
        heading: "Student Journey Tables",
        body: "These tables track student progress through the Be-Know-Do methodology. They form the backbone of the platform's educational analytics.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["student_journey_entries", "General event log for user activity", "id, studentId, entryType, category (be/know/do), data (JSONB)"],
            ["student_journey_progress", "Aggregated progress scores per student", "id, studentId, beScore, knowScore, doScore, overallScore, currentFocus"],
            ["student_journey_milestones", "Specific milestone achievements", "id, studentId, title, category, status, targetValue, currentValue, pointsEarned"],
            ["student_journey_activities", "Detailed activity log for analytics", "id, studentId, activityType, title, category, pointsEarned, metadata (JSONB)"],
          ],
        },
      },
      {
        heading: "Educational Standards Tables",
        body: "Standards are organized hierarchically to support multi-state, multi-subject lesson alignment.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["standard_sets", "Groupings of standards by state/jurisdiction", "id, name, state, jurisdiction, subject, gradeLevel"],
            ["educational_standards", "Individual standard codes and descriptions", "id, standardSetId (FK), code, description, gradeLevel, subject"],
          ],
        },
      },
      {
        heading: "Governance & Safety Tables",
        body: "Tables supporting data governance, safety compliance, and audit trails.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["parental_consents", "COPPA consent records", "id, studentUserId, parentEmail, consentGiven, verifiedAt"],
            ["safety_vault", "Intercepted PII and safety events", "id, userId, eventType, content, metadata"],
            ["audit_logs", "Platform-wide audit trail (SHA-256 hash chain)", "id, userId, action, resourceType, resourceId, metadata, timestamp, hash, prevHash"],
          ],
        },
      },
      {
        heading: "Integration & SSO Tables",
        body: "Tables backing SIS/rostering connections and per-organization enterprise single sign-on. Secrets (client secrets, access tokens) are encrypted at rest with AES-256-GCM.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["sis_connections", "SIS / rostering provider connections", "id, userId, provider (clever/oneroster/classlink/...), baseUrl, accessToken (enc), clientId, clientSecret (enc), tokenUrl"],
            ["sso_connections", "Per-org enterprise SSO (OIDC) providers", "id, organizationId (FK), provider, issuerUrl, clientId, clientSecret (enc), allowedDomains[], defaultRole, autoProvision, enabled"],
          ],
        },
      },
      {
        heading: "Storage Interface Pattern",
        body: "All database operations MUST go through the IStorage interface defined in server/storage.ts. Routes should never write raw SQL or direct Drizzle queries. The storage layer provides typed CRUD methods for every table.",
        code: `interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getLessons(userId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  // ... typed methods for all tables
}`,
        language: "typescript",
      },
    ],
  },
  {
    id: "api-reference",
    title: "API Endpoints Reference",
    icon: Code,
    category: "Core",
    content: [
      {
        heading: "API Conventions",
        body: "All API endpoints are defined in server/routes.ts and follow RESTful conventions. Responses use JSON format with appropriate HTTP status codes. Authentication is required for most endpoints via session cookies.",
        items: [
          "Base path: All endpoints start with /api/",
          "Auth: Session-based via Replit Auth — cookies sent automatically",
          "Validation: Request bodies validated with Zod schemas before processing",
          "Errors: JSON responses with { message: string } format and appropriate status codes",
          "Pagination: List endpoints support ?limit and ?offset query parameters where applicable",
        ],
      },
      {
        heading: "Authentication Endpoints",
        body: "Handles user authentication via Replit Auth OIDC flow.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/auth/user", "No", "Returns current authenticated user or 401"],
            ["POST", "/api/auth/logout", "Yes", "Destroys session and logs user out"],
            ["POST", "/api/onboarding/skip", "Yes", "Increments onboarding skip count"],
            ["POST", "/api/onboarding/complete", "Yes", "Marks onboarding as completed"],
          ],
        },
      },
      {
        heading: "Enterprise SSO (OIDC) Endpoints",
        body: "Per-organization single sign-on via OpenID Connect, running alongside the default Replit Auth. Each org admin registers their identity provider (Google Workspace, Azure AD, Okta, OneLogin, or generic OIDC). Users sign in with their school email, are matched to a connection by email domain, and are provisioned/linked with a non-privileged role. Degrades gracefully when no connection matches.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/sso/lookup?email=", "No", "Resolve an email domain to an SSO connection (drives 'Sign in with your school')"],
            ["GET", "/api/sso/login/:connectionId", "No", "Begin the OIDC authorization-code flow (PKCE + state + nonce)"],
            ["GET", "/api/sso/callback/:connectionId", "No", "OIDC callback: verify, provision/link user, establish session"],
            ["GET", "/api/organizations/:orgId/sso", "Org admin", "List SSO connections for an org (secrets masked)"],
            ["POST", "/api/organizations/:orgId/sso", "Org admin", "Create an SSO connection (client secret encrypted at rest)"],
            ["PATCH", "/api/sso/connections/:id", "Org admin", "Update an SSO connection"],
            ["DELETE", "/api/sso/connections/:id", "Org admin", "Delete an SSO connection"],
            ["POST", "/api/sso/connections/:id/test", "Org admin", "Verify the issuer is reachable and OIDC discovery succeeds"],
          ],
        },
      },
      {
        heading: "Lesson & AI Endpoints",
        body: "Manages lesson plans and AI-powered generation.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/lessons", "Yes", "List user's saved lessons"],
            ["POST", "/api/lessons", "Yes", "Save a new lesson plan"],
            ["GET", "/api/lessons/:id", "Yes", "Get a specific lesson by ID"],
            ["DELETE", "/api/lessons/:id", "Yes", "Delete a lesson"],
            ["POST", "/api/lessons/generate", "Yes", "Generate AI lesson plan (rate limited: 5/min)"],
            ["POST", "/api/lessons/generate-stream", "Yes", "Generate AI lesson plan with SSE phase/delta streaming"],
            ["POST", "/api/lessons/generate-guest", "No", "Guest AI generation (email-gated; 5/month shared with practice per guest bucket)"],
            ["POST", "/api/assignments/generate", "Yes", "Generate AI assignment (rate limited: 5/min)"],
            ["POST", "/api/assignments/generate-stream", "Yes", "Generate AI assignment with SSE phase/delta streaming"],
            ["POST", "/api/practice/generate", "No", "Generate student practice set (email-gated; shares the 5/month guest bucket)"],
          ],
        },
      },
      {
        heading: "SIS & Rostering Endpoints",
        body: "Student Information System integration and automated rostering. Clever is fully live; OneRoster 1.1 and ClassLink are supported via OAuth2 client-credentials (clientId/clientSecret/tokenUrl, secret encrypted at rest). PowerSchool, Canvas, Infinite Campus, and Skyward are Coming Soon.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/integrations/sis/providers", "No", "List supported SIS/rostering providers and their status"],
            ["GET", "/api/integrations/sis/connections", "Yes", "List the user's SIS connections (secrets masked)"],
            ["POST", "/api/integrations/sis/connections", "Yes", "Create a SIS connection (client secret/access token encrypted)"],
            ["PATCH", "/api/integrations/sis/connections/:id", "Yes", "Update a SIS connection"],
            ["DELETE", "/api/integrations/sis/connections/:id", "Yes", "Delete a SIS connection"],
            ["POST", "/api/integrations/sis/connections/:id/test", "Yes", "Test connectivity (resolves token for client-credentials providers)"],
            ["POST", "/api/integrations/sis/connections/:id/sync", "Yes", "Run a roster sync (users, teachers, classes, orgs)"],
            ["GET", "/api/integrations/sis/connections/:id/history", "Yes", "View sync history for a connection"],
            ["GET", "/api/integrations/sis/connections/:id/students", "Yes", "List rostered students from the provider"],
            ["GET", "/api/integrations/sis/connections/:id/courses", "Yes", "List rostered courses/classes from the provider"],
          ],
        },
      },
      {
        heading: "Organization Endpoints",
        body: "Manages organizations (schools, ISDs, charter networks/CMO/EMOs, general networks), memberships, and invitations.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/organizations", "Yes", "List user's organizations"],
            ["POST", "/api/organizations", "Yes", "Create new organization (campus_admin+)"],
            ["GET", "/api/organizations/:id", "Yes", "Get organization details"],
            ["GET", "/api/organizations/:id/members", "Yes", "List organization members"],
            ["POST", "/api/organizations/:id/invite", "Yes", "Invite member to organization"],
          ],
        },
      },
      {
        heading: "Org-Admin Self-Service Endpoints",
        body: "Allows campus, district, and charter network admins to manage their organizations (single-campus charters, ISDs, CMO/EMO networks) without system admin assistance.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/org-admin/my-orgs", "Yes", "List orgs the user can admin"],
            ["GET", "/api/org-admin/orgs/:orgId/members", "Yes", "List members of managed org"],
            ["PATCH", "/api/org-admin/orgs/:orgId/members/:memberId", "Yes", "Update member role (role ceiling enforced)"],
            ["DELETE", "/api/org-admin/orgs/:orgId/members/:memberId", "Yes", "Remove member from org"],
            ["GET", "/api/org-admin/orgs/:orgId/settings", "Yes", "Get org settings"],
            ["PATCH", "/api/org-admin/orgs/:orgId/settings", "Yes", "Update org settings"],
            ["GET", "/api/org-admin/orgs/:orgId/activity", "Yes", "View educator activity for org"],
          ],
        },
      },
      {
        heading: "System Admin Endpoints",
        body: "Platform-wide administrative endpoints. Require site_admin or system_admin role.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/admin/analytics", "site_admin+", "Platform-wide analytics and metrics"],
            ["GET", "/api/admin/users", "site_admin+", "List all platform users with search/filter"],
            ["GET", "/api/admin/organizations", "site_admin+", "List all organizations"],
            ["GET", "/api/admin/billing", "site_admin+", "Billing and subscription data"],
            ["GET", "/api/admin/affiliates", "site_admin+", "Affiliate program data"],
            ["GET", "/api/admin/user-analytics", "site_admin+", "Detailed per-user analytics"],
            ["GET", "/api/admin/content-library", "site_admin+", "Manage content library items"],
          ],
        },
      },
      {
        heading: "Student Journey Endpoints",
        body: "Track student progress through the Be-Know-Do methodology.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/my-journey", "Yes", "Get current user's journey data"],
            ["GET", "/api/student-journey/:studentId", "Yes", "Get specific student's journey (educators+)"],
            ["POST", "/api/student-journey/entries", "Yes", "Log a journey event"],
            ["POST", "/api/student-journey/milestones", "Yes", "Create a milestone"],
            ["PATCH", "/api/student-journey/milestones/:id", "Yes", "Update milestone progress"],
          ],
        },
      },
      {
        heading: "Standards & Curriculum Endpoints",
        body: "Educational standards management and curriculum tools.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/standards", "No", "Search available standards"],
            ["GET", "/api/standards/states/:country", "No", "List states/jurisdictions for a country"],
            ["POST", "/api/standards/import", "site_admin+", "Import standards from CSP API"],
            ["POST", "/api/standards/auto-match", "Yes", "AI-powered standards alignment"],
            ["GET", "/api/scopes", "Yes", "List user's scope & sequence documents"],
            ["POST", "/api/scopes", "Yes", "Create new scope & sequence"],
          ],
        },
      },
    ],
  },
  {
    id: "rbac",
    title: "Role-Based Access Control (RBAC)",
    icon: Shield,
    category: "Security",
    content: [
      {
        heading: "Role Hierarchy",
        body: "LYS uses a 7-level hierarchical role system. Higher roles inherit all permissions of lower roles. Role checks compare numeric levels, so a campus_admin (level 3) passes any check requiring educator (level 2) or below.",
        table: {
          headers: ["Role", "Level", "Scope", "Key Permissions"],
          rows: [
            ["student", "0", "Own data only", "View own journey, take assessments, explore careers, build portfolio"],
            ["homeschool_parent", "1", "Own + children", "All student permissions plus lesson generation, gradebook, scope & sequence"],
            ["educator", "2", "Own classes", "All parent permissions plus classroom management, assignments, collaboration, SIS"],
            ["campus_admin", "3", "Single campus", "All educator permissions plus org member management, standards admin, transfer approvals. Manages a single-campus charter or one school within an ISD/charter network."],
            ["district_admin", "4", "District / charter network + campuses", "All campus admin permissions plus cross-campus management, district or charter network analytics. Manages Traditional ISDs, Multi-State Charter Networks (CMO/EMO), or general networks with child campuses."],
            ["site_admin", "5", "Platform-wide", "All district permissions plus system dashboard, user management, billing, standards import. Oversees all client structures (single-campus charters, ISDs, charter networks)."],
            ["system_admin", "6", "Full system", "All permissions including feature flags, governance, technical configuration. Full control over all organization types and hierarchies."],
          ],
        },
      },
      {
        heading: "Server-Side Middleware",
        body: "Access control is enforced server-side using middleware functions. These must be applied to every protected route.",
        code: `// Authentication check
app.get("/api/lessons", isAuthenticated, handler);

// Role-based check (user must be at least this role)
app.get("/api/admin/users", isAuthenticated, requireRole("site_admin"), handler);

// Convenience aliases
const requireCampusAdmin = requireRole("campus_admin");
const requireDistrictAdmin = requireRole("district_admin");
const requireSiteAdmin = requireRole("site_admin");
const requireSystemAdmin = requireRole("system_admin");`,
        language: "typescript",
        warning: "Never rely on frontend role checks alone. All authorization MUST be enforced server-side via middleware. Frontend checks are for UI display only.",
      },
      {
        heading: "Organization Roles vs Platform Roles",
        body: "Users have TWO types of roles that operate independently. Platform roles determine what features a user can access. Organization roles determine what a user can do within a specific organization.",
        table: {
          headers: ["Type", "Values", "Where Stored", "Purpose"],
          rows: [
            ["Platform Role", "student, homeschool_parent, educator, campus_admin, district_admin, site_admin, system_admin", "users.role", "Controls feature access across the platform"],
            ["Organization Role", "member, admin, owner", "organization_memberships.role", "Controls what a user can do within a specific org"],
          ],
        },
      },
      {
        heading: "Role Ceiling Enforcement",
        body: "When org admins change a member's platform role, the role ceiling restricts them to only assign roles up to campus_admin. This prevents privilege escalation — an org admin (whether managing an ISD, charter network, or single campus) cannot create site_admins or system_admins.",
        items: [
          "Campus admins can set roles: student, homeschool_parent, educator, campus_admin",
          "District admins (ISD and charter network admins) can set roles: student, homeschool_parent, educator, campus_admin (same ceiling)",
          "Only site_admin and system_admin can assign site_admin or higher roles",
          "Role ceiling is enforced in the org-admin PATCH endpoint for member role changes",
          "Charter network (CMO/EMO) admins use district_admin role and follow the same ceiling rules as traditional ISD admins",
        ],
      },
      {
        heading: "Org Admin Authorization",
        body: "The verifyOrgAdminAccess() function checks both organization membership role AND platform role before allowing org-admin operations. This applies uniformly to ISD district admins, charter network (CMO/EMO) admins, and general network admins.",
        code: `// verifyOrgAdminAccess checks:
// 1. User has org membership with role 'admin' or 'owner'
// 2. OR user is a district_admin whose district/charter_network/network is parent of this org
// 3. OR user is site_admin/system_admin (bypasses org checks)

// getAdminManagedOrgIds returns:
// - All orgs where user has admin/owner membership
// - Plus child orgs if user is a district admin (ISD, charter network, or general network)`,
        language: "typescript",
      },
    ],
  },
  {
    id: "security",
    title: "Security Infrastructure",
    icon: Lock,
    category: "Security",
    content: [
      {
        heading: "Security Middleware Stack",
        body: "The server applies multiple layers of security middleware in server/index.ts.",
        table: {
          headers: ["Middleware", "Configuration", "Purpose"],
          rows: [
            ["Helmet", "CSP and COEP disabled for dev compatibility; all other protections active", "HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)"],
            ["API Rate Limiter", "200 requests per 15 minutes for /api/* routes", "Prevents API abuse and brute-force attacks"],
            ["Auth Rate Limiter", "20 requests per 15 minutes for login/register endpoints", "Protects authentication endpoints"],
            ["AI Rate Limiter", "5 requests per minute for /api/lessons/generate and /api/assignments/generate", "Prevents excessive AI API usage and cost"],
            ["Session Security", "httpOnly, secure, sameSite: 'lax' cookies via connect-pg-simple", "Prevents XSS cookie theft, CSRF protection"],
          ],
        },
      },
      {
        heading: "PII Sanitization Pipeline",
        body: "All user content is processed through a PII sanitization pipeline before being sent to external AI services. The pipeline is defined in server/services/piiSanitizer.ts.",
        items: [
          "Email addresses: Detected and redacted via regex pattern matching",
          "Phone numbers: US and international formats detected and stripped",
          "Social Security Numbers: SSN patterns (XXX-XX-XXXX) are redacted",
          "Student IDs: Common student ID formats are detected and removed",
          "Physical addresses: Street address patterns are sanitized",
          "Dates of birth: DOB patterns are identified and stripped",
          "sanitizeForAI(): Deep-cleanses entire objects (recursively) before LLM calls",
          "All PII stripping events are logged to the safety vault with before/after hashes (not actual PII)",
        ],
        warning: "NEVER bypass the PII sanitizer when sending data to OpenAI. Always use sanitizePromptText() or sanitizeForAI() before external API calls.",
      },
      {
        heading: "Content Filtering",
        body: "User-generated content is filtered for safety using server/services/contentFilter.ts. The system uses keyword detection with educational exceptions to avoid false positives.",
        items: [
          "HARMFUL_KEYWORDS: List of violence, drug, and inappropriate content terms",
          "EDUCATIONAL_EXCEPTIONS: Allows legitimate educational content (e.g., 'drug education', 'war history')",
          "Severity levels: low (warning), medium (flag for review), high (auto-block)",
          "Student messages are auto-blocked if high-severity content is detected",
          "Content filter results include confidence scores and matched terms",
          "Filtered content is logged in the safety vault for admin review",
        ],
      },
      {
        heading: "Audit Logging",
        body: "The platform maintains comprehensive audit logs for compliance and security monitoring, defined in server/services/auditLog.ts.",
        items: [
          "Categories: authentication, data_access, data_modify, security, admin_action",
          "Logged events: login/logout, role changes, content creation/deletion, data exports, PII blocks, fraud strikes",
          "Each log entry includes: userId, action, resourceType, resourceId, metadata (JSONB), timestamp",
          "Audit logs are queryable from the System Admin > Governance tab",
          "Logs support filtering by date range, user, action type, and resource",
          "Export capability for external compliance reporting",
        ],
      },
    ],
  },
  {
    id: "data-governance",
    title: "Zero-Trust Data Governance",
    icon: Eye,
    category: "Security",
    content: [
      {
        heading: "7-Rule Framework Overview",
        body: "LYS implements a Zero-Trust Data Governance framework with 7 rules designed specifically for educational environments. These rules protect student data, enforce compliance, and provide auditability. The governance dashboard in the System Admin panel shows real-time status of all rules.",
      },
      {
        heading: "Rule 1: Immutable Success Ledger",
        body: "Student achievements (success marks) become permanent records after a 24-hour edit window. This prevents retroactive grade tampering and ensures the integrity of student accomplishment records.",
        items: [
          "New achievements can be edited or deleted within 24 hours of creation",
          "After 24 hours, records are locked and cannot be modified or deleted",
          "Provides a tamper-proof history of student accomplishments",
          "Admins can view but not modify locked records",
        ],
      },
      {
        heading: "Rule 2: Communication Safety Intercept",
        body: "All student communications are scanned for PII before processing. Cross-tenant data leakage is blocked to prevent information from one school reaching another.",
        items: [
          "checkMessagePII() scans messages for personal identifiable information",
          "Messages containing PII are blocked and logged to the safety vault",
          "Cross-tenant lockdown prevents data from leaking between organizations",
          "Intercepted messages are available for admin review in the governance dashboard",
        ],
      },
      {
        heading: "Rule 3: App-Level Tenant Scoping",
        body: "All database queries are automatically scoped to the user's organization or tenant. This prevents users in one school from accessing data belonging to another school.",
        items: [
          "Query scoping is applied at the storage layer, not the route layer",
          "Users can only see data associated with their organization memberships",
          "System admins and site admins can bypass tenant scoping when necessary",
          "Tenant isolation is tested via ownership checks on every data access",
        ],
      },
      {
        heading: "Rule 4: Data Residency Stubs",
        body: "Region tagging on data records supports future geographic data residency requirements. Records can be tagged with their data region for compliance with local regulations.",
      },
      {
        heading: "Rule 5: COPPA Restricted State",
        body: "Under-13 users cannot self-register: self-serve onboarding requires a birthdate for every role and blocks any under-13 sign-up (coppa_blocked). Under-13 accounts may only be created via a school or homeschool-parent account, where they have restricted feature access until verified parental consent is obtained. The isCoppaRestricted() function checks the user's birthdate to determine restriction status.",
        items: [
          "Self-serve onboarding requires a birthdate for ALL roles, then blocks under-13 sign-up entirely",
          "Under-13 users can only be added by a school or homeschool-parent account",
          "Birthdate comparison determines if user is under 13",
          "Restricted users cannot access AI features, messaging, or certain social features",
          "Parental consent records are stored in the parental_consents table",
          "Consent must include parent email, verification, and explicit consent flag",
          "COPPA status is checked on relevant API endpoints before processing",
        ],
      },
      {
        heading: "Rule 6: Marketplace Security",
        body: "Shared resources and lesson templates are scanned for safety before being published to the community marketplace. Content must pass safety checks before becoming publicly available.",
      },
      {
        heading: "Rule 7: VPN/Fraud 3-Strike Protection",
        body: "Suspicious activity triggers a warning system with account restrictions after 3 strikes.",
        items: [
          "Strike triggers: VPN detection, rapid account switching, unusual access patterns, geo-IP anomalies",
          "Strike 1: Warning notification to user",
          "Strike 2: Enhanced monitoring and temporary feature restrictions",
          "Strike 3: Account suspension requiring admin review to restore",
          "Strike events are logged with IP metadata in audit logs",
          "System admins can view and manage strikes from the Governance dashboard",
        ],
      },
    ],
  },
  {
    id: "coppa",
    title: "COPPA Compliance System",
    icon: AlertTriangle,
    category: "Security",
    content: [
      {
        heading: "Overview",
        body: "COPPA (Children's Online Privacy Protection Act) compliance is enforced for users under 13. The system tracks birthdate, restricts features, and manages parental consent workflows.",
      },
      {
        heading: "Implementation Details",
        body: "COPPA restrictions are checked at both the API and UI levels to ensure consistent enforcement.",
        items: [
          "isCoppaRestricted(birthdate): Returns true if user is under 13 based on birthdate field",
          "Restricted features: AI lesson generation, messaging/chat, community sharing, portfolio publishing",
          "Parental consent flow: Parent receives email → clicks verification link → consent recorded",
          "parental_consents table stores: studentUserId, parentEmail, consentGiven, verifiedAt",
          "Once consent is verified, COPPA restrictions are lifted for that student",
          "If a user turns 13 while using the platform, restrictions are automatically lifted",
        ],
      },
      {
        heading: "Data Collection Restrictions",
        body: "Under COPPA, the platform limits what data is collected from users under 13.",
        items: [
          "No behavioral tracking or analytics for COPPA-restricted users",
          "No third-party data sharing (including AI services) without parental consent",
          "Ad monetization is completely disabled for K-7 students (regardless of consent)",
          "Profile information is minimal — no photos, bio, or social features",
        ],
      },
      {
        heading: "Self-Serve Onboarding Gate",
        body: "POST /api/onboarding/complete enforces the COPPA gate for self-registration (server/routes/account.ts).",
        items: [
          "Birthdate is mandatory for every self-serve completion (any role) — a missing birthdate returns birthdate_required (400)",
          "An under-13 birthdate (newly provided or already stored) returns coppa_blocked (403) and writes a coppa.self_signup_blocked audit event",
          "Self-serve role is restricted to student, educator, or homeschool_parent (SELF_SERVE_ONBOARDING_ROLES); any other role returns role_not_allowed (403) and audits onboarding.role_escalation_blocked",
          "Elevated roles (staff/admin/system) are granted only through admin-controlled flows, never at sign-up",
        ],
      },
      {
        heading: "Data Subject Requests (DSR) & Retention",
        body: "GDPR/CCPA data-subject rights are served by /api/dsr/* (server/routes/dsr.ts, server/services/dataSubjectService.ts).",
        items: [
          "Export returns the subject's data as JSON",
          "Erasure hard-deletes self-serve accounts and anonymizes school-owned student records",
          "When the subject is a student, school admin(s) and parent(s) are alerted via audit events + DSR resultDetails",
          "Authorization is tenant-scoped: only site_admin/system_admin have a global override; campus/district admins act only within their managed org sub-tree (admin/owner memberships), plus the subject and active parents/guardians",
          "Retention: a daily scheduler runs runRetentionPurge and removes any account whose 3-year retentionPurgeAt has elapsed; the account-closure/inactivity flow that sets retentionPurgeAt is the trigger (until fully wired, the purge runner is a no-op safety net)",
        ],
      },
    ],
  },
  {
    id: "ai-integration",
    title: "AI Integration & Safety",
    icon: Cpu,
    category: "Integration",
    content: [
      {
        heading: "OpenAI Integration",
        body: "LYS integrates with OpenAI's API for AI-powered lesson generation, assignment creation, and educational standards extraction. The integration code lives in server/openai.ts.",
        items: [
          "API key: OPENAI_API_KEY must be set in Replit secrets for live AI features",
          "Without API key: Platform uses mock/template responses (fully functional without AI)",
          "Model: Uses GPT models for lesson generation and standards alignment",
          "Rate limiting: 5 AI requests per minute per user (enforced by AI rate limiter middleware)",
        ],
      },
      {
        heading: "AI Safety Pipeline",
        body: "Every AI request passes through a multi-stage safety pipeline before reaching OpenAI.",
        items: [
          "Stage 1 — Content Filter: User input checked for harmful content via contentFilter.ts",
          "Stage 2 — PII Strip: sanitizePromptText() removes all personal identifiable information",
          "Stage 3 — Prompt Construction: Sanitized input wrapped in structured educational prompts",
          "Stage 4 — API Call: Request sent to OpenAI with appropriate model and parameters",
          "Stage 5 — Response Filter: AI output checked for safety before returning to user",
          "Stage 6 — Cache: Successful responses cached in database to reduce duplicate API calls",
        ],
      },
      {
        heading: "Lesson Plan Caching",
        body: "AI-generated lesson plans are cached to reduce API costs and improve response times. Cache keys are based on the input parameters (subject, grade, topic, standards).",
        items: [
          "Cache lookup happens before AI call — identical requests return cached results instantly",
          "Cache includes the full generated lesson plan with rubric scores",
          "Cache entries are stored in the database, not in memory (persists across restarts)",
          "No automatic cache expiration — cached plans remain until manually cleared",
        ],
      },
      {
        heading: "Tier-Based Usage Limits",
        body: "AI lesson generation is limited based on user subscription tier.",
        table: {
          headers: ["Tier", "AI Lessons/Month", "Guest Access"],
          rows: [
            ["Guest (not logged in)", "3 total (IP-based)", "Basic generation only"],
            ["Free", "5 per month", "Standard generation"],
            ["Pro", "Unlimited", "Priority generation"],
            ["Campus", "Unlimited", "Priority + batch generation"],
            ["Enterprise", "Unlimited", "Full API access"],
          ],
        },
      },
      {
        heading: "Bricks/BKD Retrieval Upgrade (feature-flagged)",
        body: "Gated behind the `new_lesson_retrieval` feature flag (OFF by default). When enabled, the lesson generator uses semantic exemplar retrieval instead of the legacy SQL filter, plus a DB-backed LYS canon. With the flag off, behavior is byte-identical to the legacy path.",
        items: [
          "Embeddings: text-embedding-3-small, stored as jsonb number[] arrays on master_lessons (whole-lesson) and master_lesson_sections (per-section). Lazy-embedded on first retrieval — no upfront batch cost.",
          "Score-weighted: only master_lessons with qualityScore ≥ 85 are eligible exemplars.",
          "Highlight reel: cosine ranks per-section snippets by section type (anticipatorySet, modeling, etc.) and assembles a curated reference block — instead of pasting whole exemplar lessons.",
          "DB-backed canon: lys_canon_entries table replaces the hardcoded reference. Auto-migrated from server/lysReference.ts on first boot; the file remains the in-process fallback if DB read fails.",
          "Per-subject versioning: subject_canon_versions table — admin canon writes bump the version for that subject only, so cache keys invalidate per-subject (math/ela/science/social_studies/_global).",
          "Attribution: lesson_generation_attribution row written for every generation — records which exemplars + section IDs + canon entries fed the prompt and the final rubric score, for offline correlation.",
          "Edit feedback: lesson_edit_signals captures per-section diffs between generated and saved lesson plans. Default-on for individuals; opt-in per org via lesson_ai_org_settings.",
          "Cache key: now `lys:...:${retrievalMode}:sv${subjectVersion}` — flag-on and flag-off generations live in separate cache namespaces, and per-subject canon edits invalidate only the affected subject's keys.",
        ],
      },
      {
        heading: "Bricks/BKD Files & Endpoints",
        body: "Where the new retrieval system lives in the codebase, and how to operate it.",
        code: `// Services
server/services/embeddingService.ts        // OpenAI embed + cosine + lazy embed
server/services/lessonRetrievalService.ts  // Semantic top-K + highlight reel
server/services/lysCanonService.ts         // DB canon + seed + per-subject bump
server/services/lessonEditCaptureService.ts// Per-section diff + org opt-out

// Storage (prototype-augmentation pattern)
server/storage/lessonAi.ts                 // 16 methods on DatabaseStorage

// Wiring
server/openai.ts                           // Flag check + cache key + attribution
server/routes/lessons.ts                   // /api/lessons/save fires capture
server/index.ts::initLessonAiSubsystem()   // Boot: vector ext, seed canon + flag

// Admin endpoints (isAuthenticated + isSiteAdmin)
GET    /api/admin/canon-entries
POST   /api/admin/canon-entries           // auto-bumps subject version
PATCH  /api/admin/canon-entries/:id       // auto-bumps subject version
DELETE /api/admin/canon-entries/:id       // auto-bumps subject version
GET    /api/admin/lesson-attribution/top
PATCH  /api/admin/orgs/:orgId/ai-training // editCaptureEnabled per org`,
        language: "typescript",
        warning: "Toggle the `new_lesson_retrieval` feature flag from Site Admin → Feature Flags. Leave it OFF until you've populated master_lessons with qualityScore≥85 exemplars; otherwise retrieval will fall back to legacy.",
      },
    ],
  },
  {
    id: "multi-tenancy",
    title: "Multi-Tenant Architecture",
    icon: Building2,
    category: "Architecture",
    content: [
      {
        heading: "Client Structure Mapping",
        body: "LYS serves three primary client structures based on governance, funding, and operational scale. All organization types map to one of these structures.",
        table: {
          headers: ["Client Structure", "Org Type", "Tier", "Description"],
          rows: [
            ["Single-Campus Charter", "school / campus", `Campus ($${PLAN_PRICES.campus}/mo)`, "Independent 'boutique' school. No parent org. Full customization, makes own rules."],
            ["Traditional ISD", "district > school/campus", `Enterprise ($${PLAN_PRICES.enterprise}/mo)`, "Geographically bound, locally governed by elected board. Standardized calendar/curriculum. All districts are Enterprise tier regardless of size."],
            ["Charter Network (CMO/EMO)", "charter_network > school/campus", `Enterprise ($${PLAN_PRICES.enterprise}/mo)`, "Central HQ managing schools across states (e.g., KIPP, IDEA, Green Dot). CMOs are non-profit, EMOs are for-profit. Supports unified master dashboard OR per-state management."],
            ["General Network", "network > district/school", `Enterprise ($${PLAN_PRICES.enterprise}/mo)`, "Multi-school networks not charter-specific (e.g., university systems, consortiums)."],
          ],
        },
      },
      {
        heading: "Organization Hierarchy",
        body: "LYS supports a hierarchical organization structure: country > state/jurisdiction > network/charter_network > district > school/campus. Networks and charter networks sit above districts to model multi-state operations.",
        table: {
          headers: ["Org Type", "Parent", "Description"],
          rows: [
            ["network", "None or country/state", "General multi-school network or consortium"],
            ["charter_network", "None or country/state", "CMO/EMO managing charter schools across states"],
            ["district", "None, network, or charter_network", "Traditional ISD or geographically bound district"],
            ["school / campus", "District, network, charter_network, or none", "Individual school; standalone or under a parent org"],
            ["university", "None or network", "Independent higher-education institution"],
          ],
        },
      },
      {
        heading: "Data Isolation",
        body: "Data isolation ensures users in one organization cannot access another organization's data. This is critical for educational privacy compliance.",
        items: [
          "All data queries are scoped to user's organization memberships by default",
          "Users can belong to multiple organizations (e.g., educator at two campuses)",
          "Organization-scoped data: members, classes, students, grades, assignments",
          "User-scoped data: lessons, goals, portfolio, journey progress (belong to user, not org)",
          "System admins bypass tenant scoping for administrative purposes",
        ],
      },
      {
        heading: "Resource Cascade",
        body: "Resources and settings cascade downward through the organization hierarchy for ISDs, charter networks (CMO/EMO), and general networks alike.",
        items: [
          "District-level and charter network-level resources are automatically available to all child campuses",
          "District and charter network SIS integrations cascade to campus educators",
          "Organization tier (free/campus/enterprise) determines available features for all members",
          "District and charter network admins can view analytics aggregated across all child campuses",
          "Charter network admins can choose unified master dashboard or per-state management views",
          "Campus-level settings can override some district or network defaults",
        ],
      },
    ],
  },
  {
    id: "authentication",
    title: "Authentication & Sessions",
    icon: Users,
    category: "Architecture",
    content: [
      {
        heading: "Replit Auth Integration",
        body: "LYS uses Replit Auth via OpenID Connect (OIDC) for authentication. The integration is configured in server/replit_integrations/auth/replitAuth.ts.",
        items: [
          "Users authenticate through Replit's OIDC flow — no custom password storage",
          "First login creates a user record via upsertUser() in the storage layer",
          "Session is established with express-session and stored in PostgreSQL via connect-pg-simple",
          "Session cookies: httpOnly (no JS access), secure (HTTPS only), sameSite: 'lax' (CSRF protection)",
          "User data is available server-side via req.user after authentication middleware",
        ],
      },
      {
        heading: "Session Management",
        body: "Sessions are stored in PostgreSQL for persistence across server restarts.",
        items: [
          "Session store: connect-pg-simple using the 'sessions' table",
          "Session secret: SESSION_SECRET environment variable (Replit secret)",
          "Session lifetime: Configurable, defaults to standard express-session settings",
          "Logout: POST /api/auth/logout destroys session and clears cookie",
          "Multiple sessions: Users can have active sessions across multiple devices",
        ],
      },
      {
        heading: "Frontend Auth Hook",
        body: "The useAuth() hook in client/src/hooks/use-auth.ts provides authentication state to all components.",
        code: `const { user, isAuthenticated, isLoading } = useAuth();

// user: Full user object or null
// isAuthenticated: Boolean — true if logged in
// isLoading: Boolean — true while checking auth status`,
        language: "typescript",
      },
    ],
  },
  {
    id: "websocket",
    title: "Real-Time Collaboration",
    icon: Network,
    category: "Architecture",
    content: [
      {
        heading: "WebSocket Server",
        body: "LYS includes a WebSocket server for real-time collaboration features. The server is defined in server/websocket.ts and handles live cursor positions, user presence, and chat.",
        items: [
          "Protocol: WebSocket (ws://) with token-based authentication",
          "Features: Live cursor positions, user presence indicators, real-time chat, edit history",
          "Rooms: Collaboration sessions use invite codes to create isolated rooms",
          "Presence: Users see who else is viewing/editing the same lesson plan",
          "Chat: In-session messaging with content filtering applied",
          "Role differentiation: Owners have full edit rights, collaborators have limited permissions",
        ],
      },
      {
        heading: "Collaboration Flow",
        body: "Educators can collaborate on lesson plans in real-time using invite codes.",
        items: [
          "Creator generates an invite code for a lesson plan",
          "Collaborators join via the code on the /collaboration page",
          "WebSocket connection established with token authentication",
          "Changes are broadcast to all connected users in the same room",
          "Edit history is preserved for review and rollback",
          "Session ends when all users disconnect",
        ],
      },
    ],
  },
  {
    id: "payments",
    title: "Payment & Subscription System",
    icon: Globe,
    category: "Integration",
    content: [
      {
        heading: "Payment Methods",
        body: "LYS supports multiple payment methods to accommodate different institutional needs.",
        table: {
          headers: ["Method", "Integration", "Status", "Use Case"],
          rows: [
            ["Stripe (Credit/Debit)", "Replit Stripe connector", "Demo mode until configured", "Individual subscriptions"],
            ["PayPal", "@paypal/paypal-server-sdk (lazy-loaded)", "Demo mode until credentials provided", "Alternative individual payment"],
            ["Purchase Order", "Custom implementation", "Active", "Institutional billing for schools/districts"],
            ["Bank Transfer / ACH", "Custom implementation", "Active", "Annual plans with reference number tracking"],
          ],
        },
      },
      {
        heading: "Subscription Tiers",
        body: "Users and organizations have subscription tiers that control feature access and usage limits.",
        table: {
          headers: ["Tier", "Target", "Key Features"],
          rows: [
            ["Free", "Individual users", "Basic access, 5 AI lessons/month, ad-supported"],
            ["Pro", "Individual educators", "Unlimited AI, no ads, focus mode, advanced analytics"],
            ["Campus", "Single-campus charters / Schools", "All Pro features + org management, SIS integration, collaboration"],
            ["Enterprise", "ISDs / Charter Networks (CMO/EMO) / Universities", "All Campus features + multi-campus management, master dashboard, per-state management, priority support, custom branding"],
          ],
        },
      },
      {
        heading: "Country Affordability Index (CAI)",
        body: "LYS uses a Country Affordability Index for equitable global pricing based on local purchasing power. Prices are adjusted using a custom formula that considers GDP per capita, cost of living, and education spending ratios.",
      },
      {
        heading: "Ad Monetization",
        body: "Free-tier users see educational advertisements as part of the platform's revenue model.",
        items: [
          "Ad slots follow IAB standard sizes (leaderboard, medium rectangle, in-feed, native card)",
          "eCPM-based pricing using EdTech advertising rates",
          "K-7 students are NEVER shown ads regardless of tier (COPPA compliance)",
          "Pro and above tiers are completely ad-free",
          "Focus Mode (Pro feature) removes all ads and distracting elements",
          "Ad components: AdSlot.tsx (full-featured), AdBanner.tsx (legacy/simple), FocusModeUpsell.tsx",
        ],
      },
    ],
  },
  {
    id: "sis-integration",
    title: "SIS Integration System",
    icon: Zap,
    category: "Integration",
    content: [
      {
        heading: "Supported Providers",
        body: "LYS integrates with major Student Information Systems to import student rosters, class schedules, and course data.",
        table: {
          headers: ["Provider", "Auth Method", "Features"],
          rows: [
            ["Clever", "OAuth 2.0", "Student import, course sync, roster management"],
            ["PowerSchool", "OAuth 2.0", "Student/course import, grade sync"],
            ["Canvas LMS", "OAuth 2.0", "Course import, assignment sync"],
            ["Infinite Campus", "OAuth 2.0", "Student/course import"],
            ["Skyward", "OAuth 2.0", "Student/course import"],
            ["OneRoster", "OAuth 2.0 / API Key", "Standards-based data exchange"],
          ],
        },
      },
      {
        heading: "Integration Cascade",
        body: "SIS connections cascade through the organization hierarchy. A district-level or charter network-level SIS connection is automatically available to all campus educators within that organization.",
        items: [
          "Campus-level: SIS configured for a single school or single-campus charter, available to all educators at that campus",
          "District-level: SIS configured at ISD district, cascades to all child campuses",
          "Charter network-level: SIS configured at CMO/EMO network, cascades to all child campuses across states",
          "Educator view: Educators see SIS data from their campus or parent district/charter network",
          "Sync frequency: Configurable per integration (daily, weekly, manual)",
          "Data mapping: Configurable field mapping between SIS and LYS data models",
        ],
      },
    ],
  },
  {
    id: "standards",
    title: "Educational Standards Ingestion",
    icon: BookOpen,
    category: "Integration",
    content: [
      {
        heading: "Three-Tier Ingestion System",
        body: "LYS uses a three-tier approach to importing educational standards into the platform.",
        items: [
          "Tier 1 — CSP API: Direct integration with the Common Standards Project API for state-level standards. Primary source for TEKS, Common Core, NGSS, and other state standards.",
          "Tier 2 — CASE Protocol (Planned): Competency and Academic Standards Exchange protocol for structured standards data from participating publishers.",
          "Tier 3 — LLM Extraction: Fallback method using AI to extract standards from documents when API sources are unavailable. Processes PDFs and text documents to identify standard codes, descriptions, and hierarchical relationships.",
        ],
      },
      {
        heading: "Standards Data Model",
        body: "Standards are stored hierarchically to support multi-state, multi-subject lesson alignment.",
        items: [
          "Standard Sets: Group standards by state, subject, and grade level",
          "Individual Standards: Code, description, grade level, subject, parent standard (for hierarchy)",
          "Alignment: AI-powered matching of lesson topics to relevant standards via /api/standards/auto-match",
          "User preferences: Educators can set their default state/jurisdiction for automatic standards alignment",
          "Admin management: System admins import, review, and activate standards from Standards Admin page",
        ],
      },
    ],
  },
  {
    id: "hubspot",
    title: "HubSpot CRM Integration",
    icon: Globe,
    category: "Integration",
    content: [
      {
        heading: "Overview",
        body: "LYS integrates with HubSpot CRM for contact, company, and deal management. The connection uses Replit's HubSpot connector for authentication.",
        items: [
          "Contact sync: User signups can create HubSpot contacts for sales pipeline tracking",
          "Company records: Organizations (schools, ISDs, charter networks/CMO/EMOs) mapped to HubSpot companies",
          "Deal tracking: Subscription upgrades and institutional purchases tracked as deals",
          "Pipeline management: Sales stages for lead → trial → purchase → renewal",
        ],
      },
    ],
  },
  {
    id: "wordpress",
    title: "WordPress Integration",
    icon: Globe,
    category: "Integration",
    content: [
      {
        heading: "Embedding Options",
        body: "LYS can be embedded within WordPress sites using multiple methods.",
        items: [
          "Iframe Embeds: Full page or widget embedded via iframe with responsive sizing",
          "Shortcodes: WordPress shortcode support for embedding specific LYS components",
          "oEmbed: Auto-embed support for LYS URLs pasted into WordPress editors",
          "REST API: WordPress plugin can communicate with LYS API for data exchange",
          "Downloadable Plugin: WordPress plugin available for simplified integration setup",
          "Embed routes: /embed/* paths serve stripped-down versions of components for iframe use",
        ],
      },
    ],
  },
  {
    id: "affiliate-orchestrator",
    title: "Hybrid Affiliate Orchestrator",
    icon: Zap,
    category: "Integration",
    content: [
      {
        heading: "Overview",
        body: "The Hybrid Affiliate Orchestrator is a full-featured educator referral and rewards system. Educators earn points through referrals, content sharing, and engagement, which can be converted to cash and paid out via Stripe Connect.",
        items: [
          "Dual wallet: Separate points balance and cash balance per affiliate",
          "Configurable point values: JSON-based point config for each action type",
          "Points-to-cash conversion: 100 points = $1.00, minimum 5,000 points ($50) to convert",
          "Two-tier commission: Affiliates earn 10% bonus on their sub-affiliates' earnings",
          "Student vs Pro modes: Auto-upgrade to Pro at 5 referrals for enhanced features",
          "AI promo content: DALL-E 3 image generation + GPT-4o captions for branded marketing",
          "External integrations: Demo-mode stubs for Rewardful, PartnerStack, and Stripe Connect",
        ],
      },
      {
        heading: "Point Configuration",
        body: "Each action type earns a configurable number of points. Values are defined in AFFILIATE_POINT_CONFIG in shared/schema.ts.",
        table: {
          headers: ["Action", "Points", "Trigger"],
          rows: [
            ["referral_signup", "100", "New user signs up via referral link"],
            ["course_completion", "500", "Referred user completes a course"],
            ["daily_login_streak", "5", "Affiliate logs in consecutively"],
            ["verified_review", "50", "Affiliate submits a verified platform review"],
            ["view", "1", "Referral link is viewed"],
            ["share", "5", "Referral link is shared"],
            ["copy_link", "2", "Referral link is copied"],
            ["lesson_save", "25", "Referred user saves a lesson"],
            ["signup", "50", "General signup attribution"],
          ],
        },
      },
      {
        heading: "Affiliate API Endpoints",
        body: "All affiliate endpoints require authentication. Wallet and conversion operations are restricted to the affiliate's own data.",
        table: {
          headers: ["Method", "Path", "Description"],
          rows: [
            ["GET", "/api/affiliate/dashboard", "Affiliate stats, recent events, and rewards"],
            ["GET", "/api/affiliate/wallet", "Points balance, cash balance, and transaction history"],
            ["POST", "/api/affiliate/convert", "Convert points to cash (5,000 pt minimum)"],
            ["POST", "/api/affiliate/payout", "Request cash payout via Stripe Connect (demo mode)"],
            ["GET", "/api/affiliate/tier2", "Sub-affiliate list and tier-2 earnings"],
            ["POST", "/api/affiliate/promo/generate", "Generate AI branded promo image + caption"],
            ["GET", "/api/affiliate/promos", "List generated promo assets"],
            ["GET", "/api/affiliate/config", "Public endpoint returning point config and conversion rates"],
            ["GET", "/api/affiliate/integrations", "External integration status (Rewardful, PartnerStack, Stripe)"],
            ["POST", "/api/referral/track", "Track a referral event and award points"],
          ],
        },
      },
      {
        heading: "Database Tables",
        body: "The affiliate system uses five tables in the database.",
        items: [
          "educator_affiliates — Core affiliate profile with referral code, points, cash balance, mode (student/pro), parent affiliate link, and external platform IDs",
          "referral_events — Individual referral event log with event type, points earned, and metadata",
          "affiliate_rewards — Reward records for milestone achievements and tier-2 commissions",
          "affiliate_wallet_transactions — Ledger of all wallet operations (points earned, redeemed, cash conversions, payouts, tier-2 commissions)",
          "affiliate_promo_assets — AI-generated promotional images and captions stored per affiliate",
        ],
      },
      {
        heading: "Two-Tier Commission System",
        body: "Affiliates can invite sub-affiliates who earn points independently. The parent affiliate receives a 10% tier-2 bonus on all points earned by their sub-affiliates.",
        items: [
          "Sub-affiliates join via a tier-2 invite link containing the parent's referral code",
          "When a sub-affiliate earns points, 10% bonus is automatically credited to the parent",
          "Tier-2 bonuses are logged as wallet transactions and added to the parent's totalPoints",
          "The tier2EarningsTotal field on educator_affiliates tracks lifetime tier-2 earnings",
          "Sub-affiliate relationships are stored via parentAffiliateId on the educator_affiliates table",
        ],
      },
      {
        heading: "External Integrations (Demo Mode)",
        body: "The affiliate system includes demo-mode stubs for three external platforms in server/services/affiliateIntegrations.ts. These log placeholder messages until real API keys are configured.",
        items: [
          "Rewardful: Referral tracking and commission management (set REWARDFUL_API_KEY to enable)",
          "PartnerStack: Partner ecosystem management (set PARTNERSTACK_API_KEY to enable)",
          "Stripe Connect: Real cash payouts to affiliate bank accounts (set STRIPE_CONNECT_SECRET to enable)",
          "All integrations check for API key presence and fall back to demo mode gracefully",
        ],
      },
    ],
  },
  {
    id: "free-trial",
    title: "Free Trial System",
    icon: Eye,
    category: "Core",
    content: [
      {
        heading: "Overview",
        body: "LYS offers a 10-day free trial that gives users Pro-level access. The trial system includes layered abuse prevention to limit trial farming while remaining accessible to legitimate users.",
        items: [
          "Trial duration: 10 days from activation",
          "Trial access level: Full Pro-tier features (unlimited AI lessons, no ads, focus mode)",
          "Trial limit: 5 trials per IP address per 6-month reset window",
          "User binding: Authenticated users must have their trial bound to their user ID",
          "Automatic expiry: Trials are checked against their end date on every status request",
        ],
      },
      {
        heading: "Abuse Prevention",
        body: "The trial system uses three layers of abuse prevention to limit trial farming.",
        items: [
          "Layer 1 — IP Tracking: Trials are tracked by IP address with a maximum of 5 per IP per 6-month window. IP records are stored in the free_trials database table.",
          "Layer 2 — Browser Fingerprinting: Canvas and device attributes are hashed to create a browser fingerprint. This prevents same-device multi-account trial abuse.",
          "Layer 3 — User ID Binding: For authenticated users, trials are bound to the Replit user ID. A user can only have one active trial at a time.",
        ],
      },
      {
        heading: "API Endpoints",
        body: "Trial status and management endpoints.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/trial/status", "No", "Check trial eligibility and current status (IP-based for guests)"],
            ["POST", "/api/trial/start", "No", "Start a new trial (creates record with IP and optional fingerprint)"],
            ["POST", "/api/trial/bind", "Yes", "Bind an IP-based trial to the authenticated user"],
          ],
        },
      },
      {
        heading: "Frontend Integration",
        body: "The trial system integrates with the frontend through hooks and components.",
        items: [
          "useTrial hook (client/src/hooks/use-trial.ts): Provides trial status, time remaining, and start/bind functions",
          "useTier hook (client/src/hooks/use-tier.ts): Returns effective tier — checks hasActiveTrial from /api/educator-profile to determine if user should get Pro access",
          "TrialBanner component (client/src/components/TrialBanner.tsx): Top-bar banner showing trial status and days remaining",
          "TrialCard component: Inline card for promoting trial activation on relevant pages",
          "Trial status is returned in /api/educator-profile as hasActiveTrial field to avoid duplicate API calls",
        ],
      },
      {
        heading: "Database Table",
        body: "Trial records are stored in the free_trials table.",
        items: [
          "id (UUID): Primary key",
          "ipAddress: IP address that started the trial",
          "fingerprint: Optional browser fingerprint hash",
          "userId: Optional — set when trial is bound to an authenticated user",
          "trialStartDate / trialEndDate: 10-day window timestamps",
          "isActive: Boolean flag (can be manually deactivated by admin)",
          "abuseFlags: Integer counter for suspicious activity",
          "metadata: JSONB field storing userAgent, timezone, screenResolution, language",
          "resetWindowStart: Timestamp for the 6-month rolling window",
        ],
      },
    ],
  },
  {
    id: "environment",
    title: "Environment & Configuration",
    icon: Server,
    category: "Operations",
    content: [
      {
        heading: "Environment Variables",
        body: "Critical environment variables needed for the platform to function.",
        table: {
          headers: ["Variable", "Required", "Purpose"],
          rows: [
            ["DATABASE_URL", "Yes", "PostgreSQL connection string (auto-configured by Replit)"],
            ["SESSION_SECRET", "Yes", "Secret for signing session cookies"],
            ["OPENAI_API_KEY", "No", "OpenAI API key for AI features (uses mock fallback without it)"],
            ["REPL_ID", "Auto", "Replit environment identifier"],
            ["REPLIT_DB_URL", "Auto", "Replit database URL (auto-configured)"],
          ],
        },
      },
      {
        heading: "Running the Platform",
        body: "The platform runs as a single process serving both frontend and backend.",
        items: [
          "Development: 'npm run dev' starts Express + Vite dev server on port 5000",
          "The Vite dev server is integrated into Express (server/vite.ts) — do not run separately",
          "Hot module replacement (HMR) is active in development for frontend changes",
          "Backend changes require server restart (handled by tsx watch mode)",
          "Production: 'npm run build' creates optimized bundles, then 'npm start' serves them",
        ],
        warning: "NEVER modify server/vite.ts, vite.config.ts, or drizzle.config.ts. These files are configured correctly and changes will break the build system.",
      },
      {
        heading: "Database Operations",
        body: "Common database operations for development and maintenance.",
        items: [
          "Schema push: 'npm run db:push' applies schema changes to the database",
          "Schema definition: All tables defined in /shared/schema.ts using Drizzle ORM",
          "Storage interface: /server/storage.ts provides typed CRUD methods for all tables",
          "Direct SQL: Avoid direct SQL — use the storage interface for all operations",
          "Migrations: Drizzle handles schema diffing and migration generation automatically",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Guide",
    icon: FileText,
    category: "Operations",
    content: [
      {
        heading: "Common Issues",
        body: "Frequently encountered issues and their resolutions.",
        table: {
          headers: ["Issue", "Cause", "Resolution"],
          rows: [
            ["AI features return template/mock data", "OPENAI_API_KEY not set", "Add API key to Replit secrets"],
            ["Session not persisting", "SESSION_SECRET not set or sessions table missing", "Verify secret exists; run db:push to create sessions table"],
            ["User sees 401 on all API calls", "Session expired or cookie not sent", "Clear cookies and re-authenticate; check sameSite cookie settings"],
            ["Org admin can't see members", "User doesn't have admin/owner role in org_membership", "Verify org membership role in database"],
            ["Standards import fails", "CSP API unreachable or rate limited", "Check network; retry after delay; use LLM extraction fallback"],
            ["WebSocket connection fails", "Port mismatch or token expired", "Check WebSocket server is running; verify token generation"],
            ["Schema push fails", "Conflicting column types or missing dependencies", "Review schema changes; check for breaking changes in column types"],
            ["Rate limit hit", "Too many requests in time window", "Wait for rate limit window to reset (15 min for API, 1 min for AI)"],
          ],
        },
      },
      {
        heading: "Debugging Checklist",
        body: "Steps to follow when investigating an issue.",
        items: [
          "1. Check server logs for error messages and stack traces",
          "2. Verify environment variables are set correctly in Replit secrets",
          "3. Check database connectivity — can you query the sessions table?",
          "4. Verify the user's role and org membership — are middleware checks passing?",
          "5. Check browser console for frontend errors (network tab for API failures)",
          "6. Review audit logs for security-related events (PII blocks, fraud strikes)",
          "7. Test the specific API endpoint directly (curl or Postman) to isolate frontend vs backend issues",
          "8. Check rate limit status — has the user exceeded request limits?",
        ],
      },
      {
        heading: "Performance Monitoring",
        body: "Key metrics to monitor for platform health.",
        items: [
          "API response times: Monitor via server logs (response time logged per request)",
          "Database query performance: Watch for slow queries in PostgreSQL logs",
          "AI API latency: OpenAI calls can take 5-15 seconds; cache hits are instant",
          "WebSocket connections: Monitor active connection count for capacity planning",
          "Memory usage: Watch for memory leaks in long-running WebSocket connections",
          "Session table size: Prune expired sessions periodically for database performance",
        ],
      },
    ],
  },
  {
    id: "rss-content-ingestion",
    title: "RSS Content Ingestion",
    icon: Globe,
    category: "Integration",
    content: [
      {
        heading: "Overview",
        body: "The RSS Content Ingestion system allows system administrators to manage RSS feeds from podcasts and blogs. Content from these feeds is automatically ingested and analyzed for metadata, including BKD pillar detection and placement suggestions. Approved content is routed to various platform surfaces such as KNOW Resources, AI Lessons, My Journey (featured), and Mentor Connect.",
        items: [
          "System admins add and manage RSS feed sources (podcast and blog feeds)",
          "Content is auto-fetched from feeds with configurable fetch intervals",
          "Metadata analysis extracts title, description, author, publication date, and keywords",
          "BKD pillar (Be, Know, Do) is auto-detected from content metadata keywords",
          "Placement type is suggested based on content characteristics (know_resource, ai_lesson, featured, mentor_connect)",
          "All ingested content enters a pending approval queue for system admin review",
        ],
      },
      {
        heading: "Database Tables",
        body: "The RSS ingestion system uses two primary database tables.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["rss_feeds", "Stores RSS feed source configurations", "id, feedUrl, title, description, feedType (podcast/blog), isActive, fetchIntervalMinutes, lastFetchedAt"],
            ["rss_content_items", "Stores individual content items ingested from feeds", "id, feedId (FK), title, description, contentUrl, author, publishedAt, status (pending/approved/rejected), placementType, bkdPillar, metadata (JSONB)"],
          ],
        },
      },
      {
        heading: "API Endpoints",
        body: "All RSS admin endpoints require site_admin or system_admin role. Content recommendation endpoints are available to authenticated users.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/admin/rss-feeds", "site_admin+", "List all configured RSS feeds"],
            ["POST", "/api/admin/rss-feeds", "site_admin+", "Add a new RSS feed source"],
            ["PATCH", "/api/admin/rss-feeds/:id", "site_admin+", "Update an RSS feed configuration"],
            ["DELETE", "/api/admin/rss-feeds/:id", "site_admin+", "Remove an RSS feed source"],
            ["GET", "/api/admin/rss-feeds/:id/fetch", "site_admin+", "Check fetch status for a feed"],
            ["POST", "/api/admin/rss-feeds/:id/fetch", "site_admin+", "Trigger manual content fetch for a feed"],
            ["GET", "/api/admin/rss-content", "site_admin+", "List all ingested content items with filtering"],
            ["PATCH", "/api/admin/rss-content/:id", "site_admin+", "Update content item status or placement"],
            ["GET", "/api/admin/rss-content/pending-count", "site_admin+", "Get count of content items awaiting approval"],
            ["GET", "/api/content-recommendations", "Yes", "Get approved content recommendations for the current user"],
            ["GET", "/api/mentor-content-recommendations", "Yes", "Get mentor-specific content recommendations"],
          ],
        },
      },
      {
        heading: "Placement Types",
        body: "Each ingested content item is assigned a placement type that determines where it appears on the platform.",
        table: {
          headers: ["Placement Type", "Surface", "Description"],
          rows: [
            ["know_resource", "KNOW Resources", "Content appears in the KNOW resource library as supplemental educational material"],
            ["ai_lesson", "AI Lessons", "Approved content is injected as supplemental resources during AI lesson generation"],
            ["featured", "My Journey", "Content is featured on the student My Journey page as recommended reading/listening"],
            ["mentor_connect", "Mentor Connect", "Content is surfaced in Mentor Connect as discussion starters or reference material"],
          ],
        },
      },
      {
        heading: "BKD Pillar Auto-Detection",
        body: "The system automatically detects the relevant BKD (Be-Know-Do) pillar for each ingested content item by analyzing metadata keywords in the title, description, and tags.",
        items: [
          "BE pillar: Detected from keywords related to identity, values, character, self-awareness, social-emotional learning",
          "KNOW pillar: Detected from keywords related to academic content, knowledge, curriculum, standards, facts, concepts",
          "DO pillar: Detected from keywords related to skills, careers, projects, hands-on learning, real-world application",
          "If no clear pillar is detected, the content defaults to KNOW and is flagged for manual review",
          "Admins can override the auto-detected pillar during the approval process",
        ],
      },
      {
        heading: "Approval Workflow",
        body: "All ingested content goes through a system admin approval workflow before appearing on the platform.",
        items: [
          "New content enters with status 'pending' and is added to the approval queue",
          "System admins review pending content from the RSS Content management page",
          "Admins can approve content (status changes to 'approved') or reject it (status changes to 'rejected')",
          "During approval, admins can adjust the suggested placement type and BKD pillar",
          "The pending count badge on the admin dashboard shows how many items await review",
          "Only approved content is visible to end users through recommendation endpoints",
        ],
      },
      {
        heading: "AI Lesson Integration",
        body: "Content items approved with the ai_lesson placement type are integrated into the AI lesson generation pipeline as supplemental resources.",
        items: [
          "When generating AI lessons, the system queries approved ai_lesson content relevant to the lesson topic",
          "Matching content is injected into the lesson plan as supplemental resources with source attribution",
          "Content relevance is determined by BKD pillar alignment, subject matter keywords, and grade level suitability",
          "Educators see the supplemental resources listed in the generated lesson with links to the original content",
          "This enriches AI-generated lessons with curated podcast episodes, blog articles, and other real-world resources",
        ],
      },
    ],
  },
  {
    id: "sysadmin-scholarship-scraper-architecture",
    title: "Quarterly Scholarship Scraper",
    icon: Globe,
    category: "Integration",
    content: [
      {
        heading: "Overview",
        body: "Automated quarterly scraper that pulls scholarship listings from the top 500 US institutions (sourced from the US Dept of Ed College Scorecard). Each institution's scholarship page is fetched politely (1 req/sec/domain, robots.txt respected, identifying user-agent), and gpt-4o-mini extracts structured listings. All scraped scholarships land as inactive with 'community' trust and require system_admin approval before students see them. Target cost: under $1 per full quarterly run, achieved by sha256-hashing page text and skipping LLM calls when content has not changed.",
        items: [
          "Top 500 US institutions sourced from College Scorecard (set DATA_GOV_API_KEY); ships with an 88-school starter pack JSON for first-boot use",
          "One-time per-institution URL discovery uses up to 1 LLM call to pick the best scholarship index URL among homepage candidates",
          "Per-institution scrape: robots.txt → fetch → strip HTML → hash compare → LLM extract → upsert as is_active=false, trustLevel='community', autoImported=true",
          "Manual redirect following: robots.txt and the 1 req/sec throttle are re-checked on every redirect hop; the per-host throttle uses a serial promise queue (race-safe under concurrency)",
          "Quarterly schedule: a daily-tick setInterval (Node's setInterval cannot hold values >24.8 days) checks if 90 days have elapsed since the last run before triggering",
          "First-run bootstrap: ~30s after server boot, if the scrape_runs table is empty, the scheduler kicks off a discover-URLs pass + full scrape automatically",
          "Deactivation safety: scholarships missing from a re-scrape are auto-deactivated, but ONLY for institutions that actually scraped+extracted successfully this run — transient fetch/extraction failures never wipe approved listings",
        ],
      },
      {
        heading: "Database Tables",
        body: "Two new tables plus four provenance columns added to the existing know_resources table.",
        table: {
          headers: ["Table / Column", "Purpose", "Key Fields"],
          rows: [
            ["institutions", "One row per US institution we may scrape", "id, ipedsId, name, websiteUrl, scholarshipUrl, state, sector, enrollment, scholarshipUrlDiscoveryStatus, lastScrapedAt, lastScrapeStatus, lastScrapeError, lastContentHash, lastScrapeScholarshipsFound, isActive"],
            ["scholarship_scrape_runs", "One row per scrape run (manual or scheduled)", "id, status (running/completed/failed), triggerType, triggeredBy, startedAt, finishedAt, institutionsTotal/Scraped/Skipped/Failed, scholarshipsFound/Updated/Deactivated, errorMessage"],
            ["know_resources.sourceInstitutionId", "FK back to the institution this resource was scraped from", "varchar (nullable for non-scraped resources)"],
            ["know_resources.sourceUrl", "Canonical source page where the scholarship was found", "text"],
            ["know_resources.lastSeenAt", "Updated to NOW each scrape that confirms the listing still exists", "timestamp"],
            ["know_resources.scrapeRunId", "FK to the scrape run that last touched this resource", "varchar"],
          ],
        },
      },
      {
        heading: "API Endpoints",
        body: "All scraper admin endpoints require isAuthenticated + requireSystemAdmin.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/admin/scholarship-scrape/runs", "system_admin", "List recent scrape runs (most recent first)"],
            ["GET", "/api/admin/scholarship-scrape/institutions", "system_admin", "List institutions ordered by enrollment desc"],
            ["POST", "/api/admin/scholarship-scrape/run", "system_admin", "Trigger a full scrape now (returns 409 if one is already in progress)"],
            ["POST", "/api/admin/scholarship-scrape/seed-institutions", "system_admin", "Refresh institutions from College Scorecard (DATA_GOV_API_KEY) or built-in JSON"],
            ["POST", "/api/admin/scholarship-scrape/discover-urls", "system_admin", "Discover scholarship URLs for institutions with discoveryStatus='pending'. Body: { limit?: number }"],
            ["POST", "/api/admin/scholarship-scrape/institutions/:id/refresh-url", "system_admin", "Re-discover the scholarship URL for one institution"],
            ["DELETE", "/api/admin/scholarship-scrape/institutions/:id", "system_admin", "Soft-delete (deactivate) an institution from future scrapes"],
          ],
        },
      },
      {
        heading: "Files",
        body: "All scraper code lives under server/scholarshipScraper/.",
        items: [
          "fetcher.ts — Polite HTTP fetcher (robots.txt, 1 req/sec/domain serial queue, manual redirect following with per-hop robots+throttle re-check, identifying UA: 'LYS-Scholarship-Bot/1.0 (+https://ladderingyoursuccess.com/bot; info@ladderingyoursuccess.com)')",
          "discoverUrls.ts — Per-institution URL discovery: scan homepage links for 'scholarships/financial aid/awards' keywords; if multiple candidates, gpt-4o-mini picks the best one (max 1 LLM call per institution)",
          "scraper.ts — Per-institution scrape loop, gpt-4o-mini JSON extraction with discriminated success/failure result, hash-compare skip path",
          "scheduler.ts — Daily tick (setInterval ≤24.8 day limit), 90-day gating, first-boot bootstrap kicker, idempotent guard against duplicate scheduling",
          "seedInstitutions.ts — Loads from institutionSeed.json on first boot if institutions table is empty; seedInstitutionsFromScorecard() refreshes from api.data.gov when DATA_GOV_API_KEY is set",
          "institutionSeed.json — 88-school starter pack covering all sectors (public, private nonprofit, HBCUs, MSIs)",
        ],
      },
      {
        heading: "Cost & Compliance Notes",
        body: "Designed to keep both LLM cost and external load minimal.",
        items: [
          "Cost: gpt-4o-mini at ~$0.0015 per institution × 500 = ~$0.75/quarter when most pages are unchanged (hash skip); first run is closer to ~$1",
          "Robots.txt is parsed for both '*' and 'lys-scholarship-bot' user-agent blocks; longest-match allow vs disallow",
          "1 req/sec/domain enforced via per-host promise queue; safe under concurrent calls to the same host",
          "Page text capped at 12,000 chars before LLM to bound token cost",
          "No retries on transient failures — failed institutions are skipped this run and retried next quarter",
        ],
      },
      {
        heading: "Admin UI",
        body: "Surfaced as a new 'Auto-Scrape' tab inside KnowResourcesAdmin.tsx. Includes stats cards (institutions count, with-URL count, last scrape date, last-run new scholarships), seed/discover/run buttons with confirmation dialogs, recent scrape runs list (auto-refreshing every 5s), and an institutions table with discovery + scrape status badges.",
      },
    ],
  },
  {
    id: "parent-portal-v2",
    title: "Parent Portal v2 — Family Connect System",
    icon: Users,
    category: "Architecture",
    content: [
      {
        heading: "Overview",
        body: "Parent Portal v2 adds a full Family Connect layer on top of the read-only BKD progress view. Educators send magic invite links to parents, who accept the connection via /parent-connect. Once linked, teachers can send class-wide announcements (broadcast posts), 1-to-1 messages, enforce quiet hours for notifications, and flag student portfolio items for administrator review.",
        items: [
          "Route: /parent-portal — requires authentication; educators and parents both access this page (role-specific rendering)",
          "Route: /parent-connect — PUBLIC route (no auth wrapper); accepts ?token= query param",
          "Magic invite tokens stored in: parentInvitationTokens table (schema.ts)",
          "Parent ↔ student ↔ educator relationship: parentLinks table",
          "Communications: parentMessages (1-to-1) and classAnnouncements (broadcast) tables",
          "Quiet hours: quietHours table, per educator/class — enforced at notification-send time",
          "Portfolio flags: portfolioFlags table — flagged by teachers, reviewed by campus admins",
        ],
      },
      {
        heading: "Magic Invite Link Flow",
        body: "Teachers generate a per-student invite link from the Classroom > Communications tab. The token is a UUID stored in parentInvitationTokens with a 30-day TTL and a used flag.",
        items: [
          "Teacher triggers: POST /api/parent-portal/invitations/generate — body: { studentId, classId }",
          "Server creates token (UUID), inserts into parentInvitationTokens with expiresAt = now + 30 days",
          "Shareable link: https://<domain>/parent-connect?token=<uuid>",
          "ParentConnect.tsx reads token from URL and calls: POST /api/parent-portal/invitations/accept with { token }",
          "If unauthenticated: token stored in localStorage key lys_pending_magic_token, user redirected to /api/login?returnTo=/parent-connect",
          "After login, ParentConnect.tsx reads localStorage token, clears it, and fires the accept call",
          "Accept endpoint: validates token not expired/used, creates parentLinks row, marks token as used",
          "Already-linked state: 409 from server, UI shows 'already connected' message",
          "Expired/invalid token: 400/404 from server, UI prompts parent to request a new link",
        ],
      },
      {
        heading: "Communications Hub (Teacher Side)",
        body: "Educators access the Communications tab inside the Classroom page. From here they can compose broadcast announcements, view and reply to 1-to-1 parent messages, configure quiet hours, and see the invite parent button per student.",
        items: [
          "Broadcast announcements: POST /api/parent-portal/announcements — visible to all parents connected to that class",
          "1-to-1 messages: GET/POST /api/parent-portal/messages/:parentUserId — threaded conversation, scoped per educator",
          "Quiet hours: GET/PUT /api/parent-portal/quiet-hours — startTime/endTime stored in HH:MM format (24h UTC)",
          "Quiet hours enforcement: notification service checks current UTC time against stored window before dispatching",
          "Invite Parent button per student: POST /api/parent-portal/invitations/generate — returns { inviteUrl }",
          "Portfolio oversight: GET /api/parent-portal/flagged-portfolios — lists flagged items for this educator's students",
        ],
      },
      {
        heading: "Parent-Side View",
        body: "Once a parent accepts an invite they see the Parent Portal, which is organized into tabs: Overview (BKD journey), Messages (1-to-1), Announcements (broadcast), and Portfolio.",
        items: [
          "GET /api/parent-portal/children — returns list of linked students for the authenticated parent",
          "GET /api/parent-portal/progress/:studentId — BKD journey scores, top career matches, recent milestones",
          "GET /api/parent-portal/announcements?classId=<id> — broadcast posts from teacher",
          "GET /api/parent-portal/messages — all 1-to-1 threads for this parent",
          "GET /api/parent-portal/portfolio/:studentId — student portfolio items viewable by parent",
          "Homeschool parents (role: homeschool_parent) also see educator features (lesson generator, etc.) — dual view",
        ],
      },
      {
        heading: "Portfolio Flagging",
        body: "Teachers can flag portfolio items they deem inappropriate. Flags are stored in portfolioFlags and appear in the campus admin Safety & Security panel.",
        items: [
          "POST /api/portfolio/:itemId/flag — body: { reason, notes } — teacher endpoint",
          "GET /api/admin/portfolio-flags — campus_admin+ endpoint to list pending flags",
          "PATCH /api/admin/portfolio-flags/:flagId — resolve or dismiss a flag",
          "Client: PortfolioView.tsx shows a flag icon button for educators/admins on each portfolio item",
          "Flag reasons: inappropriate_content, privacy_concern, academic_integrity, other",
          "All flag actions are audit logged with userId, itemId, reason, and resolution",
        ],
      },
      {
        heading: "Database Tables",
        body: "Parent Portal v2 adds the following tables to /shared/schema.ts.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["parentInvitationTokens", "Magic invite tokens for parent connections", "id, token (UUID), studentId, educatorId, classId, expiresAt, used"],
            ["parentLinks", "Accepted parent ↔ student ↔ educator connections", "id, parentUserId, studentId, educatorId, linkedAt"],
            ["parentMessages", "1-to-1 messages between parents and teachers", "id, senderId, receiverId, content, readAt, createdAt"],
            ["classAnnouncements", "Broadcast announcements from teacher to class parents", "id, educatorId, classId, title, body, createdAt"],
            ["quietHours", "Per-educator notification quiet window", "id, educatorId, startTime (HH:MM), endTime (HH:MM), timezone"],
            ["portfolioFlags", "Teacher-submitted flags on student portfolio items", "id, flaggedBy, portfolioItemId, reason, notes, status, resolvedAt"],
          ],
        },
      },
    ],
  },
  {
    id: "marketplace",
    title: "LYS Marketplace & Saved Scholarships",
    icon: ShoppingBag,
    category: "Core",
    content: [
      {
        heading: "Overview",
        body: "The LYS Marketplace is a curated storefront of educational products published by LYS system admins. It surfaces inside the KNOW Resources page (under the 'LYS Marketplace' tab) and inside Professional Development (under the 'LYS Courses' tab filtered by audience). The Saved Scholarships system lets any authenticated user bookmark scholarship resources to their Scholarship Planner with a single click.",
        items: [
          "Products: eBooks, mini courses, guides, templates, workshops, resource packs",
          "Pricing: cents integer (0 = free). Free items are claimed via POST /api/marketplace/:id/claim",
          "Audience enum: students | educators | parents | all — controls which surfaces render the item",
          "BKD Targets enum: student_be | student_know | student_do | educator_be | educator_know | educator_do",
          "Publisher restriction: only system_admin and site_admin roles can create/update/delete marketplace items",
          "Ownership tracking: marketplacePurchases table links userId ↔ itemId with amountPaid and status",
          "Saved Scholarships: resourceId is a namespaced string — 'know-<uuid>' for knowResources rows, bare UUID for resources rows",
        ],
      },
      {
        heading: "Database Tables",
        body: "Three new tables in shared/schema.ts support the marketplace and saved scholarships systems.",
        table: {
          headers: ["Table", "Purpose", "Key Columns"],
          rows: [
            ["marketplaceItems", "Marketplace product catalog", "id (UUID), title, description, itemType, audience, bkdTargets (text[]), price (int, cents), coverImageUrl, contentUrl, externalUrl, author, authorBio, tags (text[]), careerFields (text[]), pageCount, durationMinutes, featured (bool), isActive (bool), stripeProductId, stripePriceId, publishedBy (userId), createdAt, updatedAt"],
            ["marketplacePurchases", "User ownership/claim records", "id (UUID), userId, itemId (FK marketplaceItems), amountPaid (int), stripePaymentIntentId, paypalOrderId, status (pending|completed|refunded), createdAt"],
            ["savedScholarships", "Scholarship bookmarks per user", "id (UUID), userId, resourceId (namespaced string), resourceTitle, resourceAmount, resourceDeadline, resourceUrl, notes, createdAt"],
          ],
        },
      },
      {
        heading: "API Endpoints — Public Browsing",
        body: "All marketplace endpoints require authentication (isAuthenticated middleware). The browse endpoint automatically enriches each item with an 'owned' boolean for the requesting user.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/marketplace", "any authenticated", "List active items. Query params: audience, itemType. Returns items with owned:boolean field"],
            ["GET", "/api/marketplace/:id", "any authenticated", "Single item detail with owned flag"],
            ["POST", "/api/marketplace/:id/claim", "any authenticated", "Claim a free item (price must be 0). Creates marketplacePurchases record. Idempotent."],
          ],
        },
      },
      {
        heading: "API Endpoints — Admin CRUD",
        body: "Admin marketplace management is restricted to system_admin and site_admin roles.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/admin/marketplace", "system_admin, site_admin", "List ALL items including inactive"],
            ["POST", "/api/admin/marketplace", "system_admin, site_admin", "Create a new marketplace item. publishedBy is auto-set from req.user.id"],
            ["PATCH", "/api/admin/marketplace/:id", "system_admin, site_admin", "Update any field. updatedAt is auto-set by storage layer"],
            ["DELETE", "/api/admin/marketplace/:id", "system_admin, site_admin", "Permanently delete an item"],
          ],
        },
      },
      {
        heading: "API Endpoints — Saved Scholarships",
        body: "Scholarship bookmarks are user-scoped and do not require any special role.",
        table: {
          headers: ["Method", "Path", "Auth", "Description"],
          rows: [
            ["GET", "/api/saved-scholarships", "any authenticated", "List all bookmarked scholarships for the current user"],
            ["POST", "/api/saved-scholarships", "any authenticated", "Save a scholarship. Body: { resourceId, resourceTitle, resourceAmount?, resourceDeadline?, resourceUrl?, notes? }. Deduplicates by resourceId."],
            ["DELETE", "/api/saved-scholarships/:resourceId", "any authenticated", "Remove a scholarship bookmark. resourceId must be URL-encoded."],
          ],
        },
      },
      {
        heading: "Storage Interface Methods",
        body: "All marketplace and saved-scholarship operations are wired through the IStorage interface in server/storage.ts, ensuring the MemoryStorage and DatabaseStorage implementations stay in sync.",
        code: `// Marketplace Items
getMarketplaceItems(filters?: { audience?: string; itemType?: string; isActive?: boolean }): Promise<MarketplaceItem[]>
getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined>
createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>
updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined>
deleteMarketplaceItem(id: string): Promise<boolean>

// Marketplace Purchases
getUserPurchases(userId: string): Promise<MarketplacePurchase[]>
hasPurchased(userId: string, itemId: string): Promise<boolean>
createPurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase>

// Saved Scholarships
getSavedScholarships(userId: string): Promise<SavedScholarship[]>
saveScholarship(data: InsertSavedScholarship): Promise<SavedScholarship>
unsaveScholarship(userId: string, resourceId: string): Promise<boolean>
isSavedScholarship(userId: string, resourceId: string): Promise<boolean>`,
        language: "typescript",
      },
      {
        heading: "Frontend Architecture",
        body: "The marketplace surfaces in two locations. Resources.tsx renders the 'LYS Marketplace' tab alongside the Resource Library. ProfessionalDevelopment.tsx renders a 'LYS Courses' tab that fetches marketplace items filtered to audience='educators'.",
        items: [
          "Resources.tsx: Top-level Tabs ('Resource Library' | 'LYS Marketplace'). Marketplace tab has search, featured section, and all-items grid. MarketplaceCard is a co-located sub-component.",
          "ProfessionalDevelopment.tsx: 'LYS Courses' tab renders PDCoursesTab (a co-located sub-component) which fetches /api/marketplace?audience=educators",
          "Scholarship bookmark: Each scholarship card in Resources.tsx has an inline bookmark Button (Bookmark / BookmarkCheck icon). Toggling calls POST or DELETE /api/saved-scholarships. savedIds Set is derived from the /api/saved-scholarships query.",
          "Claim mutation: Uses apiRequest('POST', '/api/marketplace/:id/claim', {}). On success, invalidates ['/api/marketplace'] query to refresh owned status.",
          "Item detail dialog: Shows full metadata — authorBio, bkdTargets, durationMinutes, pageCount, tags, and access/claim/purchase CTA buttons.",
        ],
      },
      {
        heading: "Role-Aware Assignments (Student Classroom View)",
        body: "The Classroom / Assignments page (client/src/pages/Assignments.tsx) renders differently based on the authenticated user's role. No separate route is used — role-aware rendering gates UI elements.",
        items: [
          "isStudent = user?.role === 'student'",
          "isParent = user?.role === 'parent'",
          "Students: defaultValue of the Tabs is 'saved' (My Assignments tab). AI Generate and Create New tabs are completely hidden.",
          "Parents: Same as students — Tabs default to 'saved', generator tabs hidden.",
          "Page heading changes: 'My Assignments' for students/parents, 'Assignment Generator' for educators.",
          "Description line is role-specific: students see 'View and complete your assigned work', parents see 'View your student's assignments'.",
          "isPaidUser gating: Pro upgrade banner only shown to non-paid, non-student, non-parent users.",
        ],
        warning: "Do not add separate routes for student vs educator classroom views. All role differentiation is handled by conditional rendering inside the single Assignments.tsx component.",
      },
      {
        heading: "Publishing Marketplace Content",
        body: "Only system_admin and site_admin can publish marketplace items. There is no educator self-publishing workflow at this time — the LYS Author educator framework is planned for a future release.",
        items: [
          "Publish via POST /api/admin/marketplace with isActive: true",
          "Set featured: true to surface the item in the 'Featured' section of the marketplace grid",
          "audience field controls which page surface renders the item: 'educators' → PD LYS Courses tab; 'students' or 'all' → main Marketplace tab",
          "price: 0 = free (claim flow). price > 0 = paid (routes to purchase email). Stripe/PayPal integration is available via stripeProductId and stripePriceId fields for future webhook-based fulfillment.",
          "contentUrl: Direct link to downloadable content (PDF, ZIP, external LMS). Shown via 'Access Content' button after claim.",
          "externalUrl: Optional fallback link for items without direct content hosting.",
        ],
      },
    ],
  },
];

const categories = [
  { id: "all", label: "All Sections" },
  { id: "Core", label: "Core Platform" },
  { id: "Security", label: "Security & Compliance" },
  { id: "Architecture", label: "Architecture" },
  { id: "Integration", label: "Integrations" },
  { id: "Operations", label: "Operations" },
];

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg border bg-muted/50 dark:bg-muted/20">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-xs text-muted-foreground font-mono">{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          data-testid="button-copy-code"
        >
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-2 text-left font-oswald font-medium text-foreground/80 border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-b-0 hover:bg-muted/20">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 font-roboto text-foreground/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionContent({ section }: { section: DocSection }) {
  return (
    <div className="space-y-8">
      {section.content.map((block, index) => (
        <div key={index} className="space-y-3">
          <h3 className="font-oswald text-lg font-medium text-foreground">{block.heading}</h3>
          <p className="font-roboto text-sm text-muted-foreground leading-relaxed">{block.body}</p>

          {block.warning && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm font-roboto text-destructive/90">{block.warning}</p>
            </div>
          )}

          {block.note && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <FileText className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-sm font-roboto text-teal-600 dark:text-teal-400">{block.note}</p>
            </div>
          )}

          {block.items && (
            <ul className="space-y-1.5 ml-1">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-roboto text-muted-foreground">
                  <span className="text-lys-teal mt-1 shrink-0">&#8226;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {block.code && (
            <CodeBlock code={block.code} language={block.language} />
          )}

          {block.table && (
            <DocTable headers={block.table.headers} rows={block.table.rows} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DevDocs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const userRole = user?.role || "student";
  const isSystemAdmin = userRole === "system_admin" || userRole === "site_admin";

  const filteredSections = docSections.filter((section) => {
    const matchesCategory = activeCategory === "all" || section.category === activeCategory;
    if (!matchesCategory) return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    if (section.title.toLowerCase().includes(query)) return true;
    if (section.category.toLowerCase().includes(query)) return true;

    return section.content.some(
      (block) =>
        block.heading.toLowerCase().includes(query) ||
        block.body.toLowerCase().includes(query) ||
        block.items?.some((item) => item.toLowerCase().includes(query)) ||
        block.code?.toLowerCase().includes(query) ||
        block.table?.rows.some((row) => row.some((cell) => cell.toLowerCase().includes(query)))
    );
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedSection = activeSection
    ? docSections.find((s) => s.id === activeSection)
    : null;

  if (!isSystemAdmin) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-oswald text-xl mb-2">Access Restricted</h2>
            <p className="text-muted-foreground font-roboto mb-4">
              Developer documentation is available to System Administrators only.
            </p>
            <Button asChild variant="outline">
              <Link href="/" data-testid="link-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedSection) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection(null)}
            data-testid="button-back-docs"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Badge variant="outline" className="text-xs">{selectedSection.category}</Badge>
          <h1 className="font-oswald text-2xl font-bold">{selectedSection.title}</h1>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <SectionContent section={selectedSection} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Code className="h-6 w-6 text-lys-teal" />
          <h1 className="font-oswald font-semibold tracking-tight text-3xl text-lys-red" data-testid="text-dev-docs-title">
            Developer Documentation
          </h1>
        </div>
        <p className="text-muted-foreground font-roboto">
          Internal technical reference for the LYS platform. Covers architecture, security, APIs, integrations, and operations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 font-roboto"
            data-testid="input-search-docs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="text-xs"
              data-testid={`button-category-${cat.id}`}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredSections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-roboto text-muted-foreground">
                No documentation sections match your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);

            return (
              <Card
                key={section.id}
                className="overflow-hidden transition-colors hover:border-lys-teal/30"
                data-testid={`card-doc-${section.id}`}
              >
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-lys-teal/10 shrink-0">
                    <Icon className="h-5 w-5 text-lys-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-oswald text-base font-medium">{section.title}</h3>
                      <Badge variant="secondary" className="text-[10px]">{section.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-roboto mt-0.5">
                      {section.content.length} topic{section.content.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection(section.id);
                      }}
                      data-testid={`button-view-${section.id}`}
                    >
                      Full View
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <>
                    <Separator />
                    <div className="p-4 bg-muted/5">
                      <ScrollArea className="max-h-[600px]">
                        <SectionContent section={section} />
                      </ScrollArea>
                    </div>
                  </>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
