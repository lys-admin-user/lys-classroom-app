import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  AlertTriangle,
  Shield,
  Key,
  BookOpen,
  Users,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  ExternalLink,
  ArrowLeft,
  GraduationCap,
  Lock,
  FileText,
  Globe,
  Wifi,
  Clock,
  RefreshCw,
  Code,
  Building,
  UserCog,
  Mail,
  Database,
  Activity,
  ShieldCheck,
  Network,
  Wrench,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  severity: "info" | "warning" | "error";
  symptom: string;
  explanation: string;
  steps: string[];
  relatedArticles?: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: "auth-login-fail",
    title: "Unable to Log In",
    category: "authentication",
    tags: ["login", "sign in", "access", "account", "password"],
    severity: "error",
    symptom: "You see an \"Unauthorized\" message or get redirected to the login page repeatedly.",
    explanation: "This usually happens when your session has expired, or there's a temporary connection issue with the authentication service. Your data is safe and this is typically easy to resolve.",
    steps: [
      "Refresh the page using the browser refresh button",
      "Clear your browser cookies for this site",
      "Try logging in with a different browser or incognito/private window",
      "If the issue persists, wait a few minutes and try again",
      "Contact your campus administrator if you still cannot access your account",
    ],
  },
  {
    id: "auth-session-expired",
    title: "Session Expired",
    category: "authentication",
    tags: ["session", "timeout", "logged out", "expired", "kicked out"],
    severity: "warning",
    symptom: "You're suddenly logged out while using the platform, or see a \"Session Expired\" message.",
    explanation: "For security, your session automatically expires after a period of inactivity. This protects your account from unauthorized access, especially on shared computers.",
    steps: [
      "Log in again using your regular credentials",
      "If you were working on something, don't worry \u2014 your saved work should still be there",
      "Check if you have the platform open in multiple tabs, as this can sometimes cause session conflicts",
    ],
  },
  {
    id: "auth-role-denied",
    title: "Access Denied \u2014 Insufficient Permissions",
    category: "authentication",
    tags: ["forbidden", "403", "permission", "role", "access denied", "not authorized"],
    severity: "error",
    symptom: "You see a \"403 Forbidden\" or \"Access Denied\" message when trying to use a feature.",
    explanation: "Different features are available to different user roles (student, educator, campus admin, etc.). This message means your current role doesn't have access to the feature you're trying to use.",
    steps: [
      "Check your current role in the Settings page",
      "If you believe you should have access, contact your campus or district administrator",
      "Administrators can upgrade your role through the People management section",
      "Some features are only available with certain subscription plans",
    ],
  },
  {
    id: "ai-lesson-fail",
    title: "AI Lesson Generation Failed",
    category: "ai-features",
    tags: ["lesson", "AI", "generate", "error", "openai", "timeout", "lesson plan"],
    severity: "error",
    symptom: "The AI lesson generator shows an error message or the loading spinner never stops.",
    explanation: "The AI lesson generator relies on an external AI service. Failures can happen due to high demand, network issues, or if the input is too complex. Your previous lessons are not affected.",
    steps: [
      "Try generating the lesson again \u2014 temporary issues often resolve on their own",
      "Simplify your prompt or reduce the number of standards/objectives selected",
      "Check if other AI features are working \u2014 if not, the AI service may be temporarily down",
      "If the issue continues, try again in 15\u201330 minutes",
      "Contact your administrator if the problem persists across multiple attempts",
    ],
  },
  {
    id: "ai-content-blocked",
    title: "Content Blocked by Safety Filter",
    category: "ai-features",
    tags: ["blocked", "filter", "content", "moderation", "flagged", "keyword", "safety"],
    severity: "warning",
    symptom: "Your message or content was blocked with a message about safety or content filtering.",
    explanation: "LYS has built-in content safety filters that protect all users, especially students. These filters check for inappropriate language, personal information, and other safety concerns. This is part of our commitment to keeping the platform safe for everyone.",
    steps: [
      "Review your content for any language that might trigger safety filters",
      "Remove any personal information (phone numbers, addresses, SSN) from your input",
      "Rephrase your content using educational, age-appropriate language",
      "If you believe your content was blocked incorrectly, contact your administrator to review",
    ],
  },
  {
    id: "ai-pii-stripped",
    title: "Personal Information Removed from AI Request",
    category: "ai-features",
    tags: ["PII", "personal", "information", "privacy", "data", "stripped", "removed"],
    severity: "info",
    symptom: "You see a notice that personal information was removed before sending to the AI service.",
    explanation: "To protect your privacy, LYS automatically detects and removes personal information (like names, emails, phone numbers) before sending content to external AI services. This is a safety feature, not an error. The AI will still generate useful content without the personal details.",
    steps: [
      "This is expected behavior \u2014 no action needed",
      "Your personal information is kept safe and never sent to external services",
      "The AI-generated content will use placeholder names instead",
      "You can add specific names back into the generated content afterward",
    ],
  },
  {
    id: "coppa-consent-required",
    title: "Parental Consent Required",
    category: "safety",
    tags: ["COPPA", "parental", "consent", "under 13", "child", "minor", "parent"],
    severity: "warning",
    symptom: "You see a message asking for parental consent, or certain features are restricted.",
    explanation: "LYS complies with COPPA (Children's Online Privacy Protection Act) which requires parental consent for users under 13. Until consent is provided, some features may be limited to ensure your safety.",
    steps: [
      "Ask your parent or guardian to provide consent through the platform",
      "Go to Settings and look for the \"Parental Consent\" section",
      "Enter your parent/guardian's email address to send them a consent request",
      "Once they approve, you'll have full access to age-appropriate features",
      "Your campus administrator can also help with the consent process",
    ],
  },
  {
    id: "coppa-features-limited",
    title: "Some Features Are Limited (Under-13 User)",
    category: "safety",
    tags: ["restricted", "limited", "features", "young", "student", "under 13", "K-7"],
    severity: "info",
    symptom: "Certain features appear grayed out or unavailable on your account.",
    explanation: "For users under 13, some features are intentionally limited to comply with child safety laws. This includes restrictions on messaging, certain AI features, and data sharing. These restrictions exist to keep younger users safe.",
    steps: [
      "This is normal for accounts identified as under-13 users",
      "Ask your teacher or parent if you need help with a restricted feature",
      "Once parental consent is obtained, additional features may become available",
      "Ad-free experience is provided for K-7 students automatically",
    ],
  },
  {
    id: "scope-sequence-save",
    title: "Scope & Sequence Changes Not Saving",
    category: "lesson-planning",
    tags: ["scope", "sequence", "save", "lost", "changes", "pacing"],
    severity: "error",
    symptom: "Changes to your scope and sequence don't appear to save, or you see an error when trying to save.",
    explanation: "This can happen if you've been editing for a long time and your session expired, or if there's a network interruption. Your most recent auto-saved version should still be available.",
    steps: [
      "Check your internet connection",
      "Try refreshing the page \u2014 your last auto-saved version should load",
      "If you're editing a shared scope, another user may be editing at the same time",
      "Try saving smaller sections at a time instead of making many changes at once",
      "Export your current work as a backup before making large changes",
    ],
  },
  {
    id: "rubric-low-score",
    title: "Understanding Low Lesson Plan Quality Scores",
    category: "lesson-planning",
    tags: ["rubric", "score", "quality", "low", "lesson", "rating", "improve"],
    severity: "info",
    symptom: "Your lesson plan received a lower quality score than expected.",
    explanation: "Lesson plan quality is measured across 6 categories: objectives alignment, student engagement, differentiation, assessment integration, BKD methodology, and real-world connections. A lower score in any category suggests room for improvement in that area.",
    steps: [
      "Review the detailed score breakdown to see which categories need improvement",
      "Focus on the lowest-scoring category first for the biggest improvement",
      "Add clear, measurable learning objectives aligned to standards",
      "Include differentiation strategies for diverse learners",
      "Connect lesson content to Be-Know-Do methodology",
      "Add real-world examples and career connections to boost relevance",
    ],
  },
  {
    id: "org-membership-issue",
    title: "Not Seeing My Organization or Campus",
    category: "organization",
    tags: ["organization", "campus", "school", "missing", "not showing", "join", "enrollment"],
    severity: "warning",
    symptom: "Your school or campus doesn't appear in your account, or you can't access campus-specific resources.",
    explanation: "You need to be added to an organization by an administrator to see its content and resources. If you recently joined, it may take a moment for your membership to be processed.",
    steps: [
      "Check with your campus administrator to confirm you've been added",
      "Ask your admin to send you an organization invitation",
      "If you received an invitation, check your email and accept it",
      "Try logging out and logging back in to refresh your memberships",
      "If you're a new user, complete the onboarding process first",
    ],
  },
  {
    id: "transfer-pending",
    title: "Student Transfer Not Processing",
    category: "organization",
    tags: ["transfer", "student", "pending", "approval", "move", "campus"],
    severity: "warning",
    symptom: "A student transfer request appears to be stuck in pending status.",
    explanation: "Student transfers require a triple confirmation: the sending campus admin, the receiving campus admin, and a district-level confirmation. The transfer won't complete until all three parties approve.",
    steps: [
      "Check the Transfer Approvals page to see the current status",
      "Contact the other campus admin to confirm they've approved their part",
      "District admins can check district-level approval status",
      "Each approval step has a notification sent \u2014 check email for pending requests",
      "Transfers can be cancelled and resubmitted if there's an issue",
    ],
  },
  {
    id: "gradebook-calculation",
    title: "Grade Calculations Seem Incorrect",
    category: "grades",
    tags: ["grade", "calculation", "wrong", "percentage", "letter", "gradebook", "GPA"],
    severity: "warning",
    symptom: "The calculated grade percentage or letter grade doesn't match what you expected.",
    explanation: "Grades are calculated based on the weighted categories configured for each class. If assignment weights or categories aren't set up correctly, calculations may appear off. Also, ungraded assignments can affect the calculation depending on settings.",
    steps: [
      "Check the grade category weights in your class settings",
      "Verify that all assignments have been graded (ungraded ones may count as zero)",
      "Look for any extra credit or dropped lowest grade settings",
      "Compare the individual assignment scores to confirm data entry is correct",
      "If using SIS integration, check if grades synced correctly from the external system",
    ],
  },
  {
    id: "sis-sync-fail",
    title: "SIS Integration Not Syncing",
    category: "integration",
    tags: ["SIS", "sync", "Clever", "PowerSchool", "Canvas", "integration", "import", "connection"],
    severity: "error",
    symptom: "Student or course data from your SIS (Clever, PowerSchool, Canvas, etc.) isn't updating.",
    explanation: "SIS integrations rely on external connections that can temporarily lose connectivity. Common causes include expired API tokens, changes to the SIS configuration, or scheduled maintenance windows.",
    steps: [
      "Check the SIS Integration page for connection status",
      "Verify the API credentials haven't expired in your SIS provider",
      "Try manually triggering a sync from the SIS Integration page",
      "If using Clever, check their status page for any outages",
      "Contact your IT department to verify firewall rules aren't blocking the connection",
      "Re-authorize the connection if the status shows \"Disconnected\"",
    ],
  },
  {
    id: "collaboration-join-fail",
    title: "Can't Join a Collaboration Session",
    category: "collaboration",
    tags: ["collaboration", "invite", "join", "code", "session", "real-time", "co-create"],
    severity: "warning",
    symptom: "You enter an invite code but can't join a collaboration session, or the session appears empty.",
    explanation: "Collaboration sessions use real-time connections that require both users to be online. Issues can arise from expired invite codes, network restrictions, or if the session creator has ended the session.",
    steps: [
      "Verify the invite code is correct and hasn't expired",
      "Make sure the session creator is still online and has the session active",
      "Try refreshing the page and entering the code again",
      "Check if your school network blocks WebSocket connections (ask IT if unsure)",
      "Create a new invite code if the current one isn't working",
    ],
  },
  {
    id: "portfolio-share-broken",
    title: "Shared Portfolio Link Not Working",
    category: "portfolio",
    tags: ["portfolio", "share", "link", "public", "broken", "access", "view"],
    severity: "warning",
    symptom: "Someone can't view your portfolio using the shared link you sent them.",
    explanation: "Portfolio sharing has privacy controls that determine who can see your portfolio. If the link isn't working, the privacy settings may need adjustment, or the link may have been regenerated.",
    steps: [
      "Open your Portfolio and check the sharing/privacy settings",
      "Make sure the portfolio is set to \"Public\" or \"Anyone with link\"",
      "Generate a fresh share link and send the new one",
      "Check if specific sections of the portfolio have their own privacy restrictions",
      "The viewer doesn't need a LYS account to view a public portfolio",
    ],
  },
  {
    id: "page-loading-slow",
    title: "Pages Loading Slowly",
    category: "performance",
    tags: ["slow", "loading", "performance", "spinner", "stuck", "frozen", "lag"],
    severity: "info",
    symptom: "Pages take a long time to load or the loading spinner keeps spinning.",
    explanation: "Slow loading can be caused by your internet connection, browser cache issues, or heavy data on certain pages. The dashboard and analytics pages load more data and may take longer on slower connections.",
    steps: [
      "Check your internet connection speed",
      "Try clearing your browser cache and cookies",
      "Close other browser tabs that might be using bandwidth",
      "Try using a different browser (Chrome, Firefox, Edge)",
      "If on mobile, switch from cellular data to WiFi if available",
      "Large data views like analytics may load faster if you narrow the date range",
    ],
  },
  {
    id: "data-not-showing",
    title: "Dashboard Shows No Data",
    category: "performance",
    tags: ["empty", "no data", "blank", "dashboard", "missing", "nothing"],
    severity: "info",
    symptom: "Your dashboard or analytics page appears empty with no data displayed.",
    explanation: "If you're new to the platform or recently joined an organization, your dashboard will start empty and populate as you use features. For educators, student data appears after students are enrolled and begin activities.",
    steps: [
      "If you're a new user, start by completing some activities (self-discovery, career exploration, etc.)",
      "Educators: verify that students are enrolled in your class",
      "Check that you're looking at the correct date range or time period",
      "Try the refresh button if available on the page",
      "Your progress will appear as you complete activities and milestones",
    ],
  },
  {
    id: "fraud-strike-warning",
    title: "Account Flagged for Suspicious Activity",
    category: "safety",
    tags: ["fraud", "suspicious", "strike", "flagged", "warning", "VPN", "blocked"],
    severity: "error",
    symptom: "You received a warning about suspicious activity on your account, or your access has been restricted.",
    explanation: "LYS uses a 3-strike fraud protection system. Suspicious activity (like using VPN/proxy services, rapid account switching, or unusual login patterns) can trigger warnings. After 3 strikes, account access may be temporarily limited.",
    steps: [
      "Disconnect any VPN or proxy services before accessing the platform",
      "Use only your own account \u2014 sharing accounts can trigger fraud detection",
      "If you're on a school network, ask IT if they use a proxy that might cause this",
      "Contact your campus administrator to review and potentially clear the warning",
      "System administrators can review fraud strikes in the Safety & Security panel",
    ],
  },
  {
    id: "success-mark-edit",
    title: "Can't Edit a Success Mark",
    category: "grades",
    tags: ["success", "mark", "edit", "locked", "finalized", "immutable", "24 hours"],
    severity: "info",
    symptom: "You're unable to edit a success mark that was previously editable.",
    explanation: "Success marks become permanent (finalized) 24 hours after they are created. This is part of the platform's data integrity system to ensure student achievements are protected from accidental or unauthorized changes.",
    steps: [
      "Check if the mark was created more than 24 hours ago \u2014 if so, it's now finalized",
      "To correct a finalized mark, contact your campus or district administrator",
      "Administrators can view finalized marks in the Safety & Security governance panel",
      "New success marks can still be added at any time",
      "The 24-hour edit window is designed to protect student achievement records",
    ],
  },
  {
    id: "standards-not-loading",
    title: "Educational Standards Not Appearing",
    category: "lesson-planning",
    tags: ["standards", "TEKS", "Common Core", "loading", "missing", "curriculum"],
    severity: "warning",
    symptom: "Educational standards aren't showing up when creating or editing lesson plans.",
    explanation: "Standards are loaded from external databases and may take time to import for your state or jurisdiction. If your school hasn't configured standards yet, they need to be imported by an administrator first.",
    steps: [
      "Check with your campus admin to confirm standards have been imported for your state",
      "Go to Settings and verify your state/jurisdiction preferences are set correctly",
      "If standards are being imported, wait for the import to complete (this can take a few minutes)",
      "Try searching for standards by keyword instead of browsing categories",
      "System administrators can import new standards from the Standards Admin page",
    ],
  },
  {
    id: "sysadmin-platform-architecture",
    title: "Platform Architecture Overview",
    category: "system-admin",
    tags: ["architecture", "developer", "system admin", "tech stack", "monorepo", "API", "infrastructure"],
    severity: "info",
    symptom: "You need to understand the overall technical architecture of the LYS platform.",
    explanation: "LYS is a full-stack TypeScript monorepo with three main directories: /client (React 18 + Vite frontend), /server (Express.js backend), and /shared (shared types, schemas, and models). The frontend uses Wouter for routing, TanStack React Query for data fetching, and shadcn/ui components built on Radix UI. The backend is a RESTful JSON API with Zod validation, PostgreSQL via Drizzle ORM, and express-session for authentication. Real-time features use WebSocket connections for collaboration.",
    steps: [
      "Frontend code lives in /client/src — pages are in /pages, reusable UI in /components, hooks in /hooks",
      "Backend routes are defined in /server/routes.ts — all API endpoints start with /api/",
      "Database schema and shared types are in /shared/schema.ts using Drizzle ORM definitions",
      "Authentication uses Replit Auth with sessions stored in PostgreSQL via connect-pg-simple",
      "The storage layer (/server/storage.ts) abstracts all database operations — routes should always use this interface",
      "Real-time collaboration uses WebSocket connections for live cursor positions, presence, and chat",
      "Environment variables and secrets are managed through Replit's built-in secret management",
    ],
  },
  {
    id: "sysadmin-api-reference",
    title: "API Endpoints Reference",
    category: "system-admin",
    tags: ["API", "endpoints", "REST", "routes", "developer", "backend", "HTTP"],
    severity: "info",
    symptom: "You need a reference for the platform's API endpoints and their usage.",
    explanation: "All API endpoints are defined in /server/routes.ts and follow RESTful conventions. Authentication is required for most endpoints via session cookies. Admin endpoints require role-based access control checks. The API returns JSON responses with appropriate HTTP status codes.",
    steps: [
      "Auth endpoints: GET /api/auth/user (current user), POST /api/auth/logout (sign out) — authentication is handled via Replit Auth",
      "Lesson endpoints: GET/POST /api/lessons, GET /api/lessons/:id, POST /api/ai/lesson (AI generation)",
      "Organization endpoints: GET/POST /api/organizations, GET /api/organizations/:id/members, POST /api/organizations/:id/invite",
      "Org-Admin self-service: GET /api/org-admin/my-orgs, GET/PATCH /api/org-admin/orgs/:orgId/members, /settings, /activity",
      "Admin endpoints: GET /api/admin/analytics, /users, /organizations, /billing, /affiliates, /user-analytics, /content-library",
      "Standards endpoints: GET /api/standards, /api/standards/states/:country, POST /api/standards/import",
      "Student Journey: GET/POST /api/student-journey/entries, /progress, /milestones, /activities",
      "All mutation requests validate input with Zod schemas before processing",
    ],
  },
  {
    id: "sysadmin-rbac-roles",
    title: "Role-Based Access Control (RBAC) System",
    category: "system-admin",
    tags: ["RBAC", "roles", "permissions", "access control", "hierarchy", "authorization", "middleware"],
    severity: "info",
    symptom: "You need to understand how roles, permissions, and access control work across the platform.",
    explanation: "LYS uses a 7-level hierarchical role system: student < homeschool_parent < educator < campus_admin < district_admin < site_admin < system_admin. Access control is enforced server-side using requireRole() middleware that checks the user's role against the minimum required role. Organization membership adds a second layer with org-level roles (member, admin, owner). The role ceiling principle ensures org admins can only assign platform roles up to campus_admin level.",
    steps: [
      "Platform roles (highest to lowest): system_admin, site_admin, district_admin, campus_admin, educator, homeschool_parent, student",
      "requireRole('campus_admin') middleware blocks any user with a role lower than campus_admin",
      "Organization roles (member, admin, owner) control access within an org — separate from platform roles",
      "verifyOrgAdminAccess() checks both org membership role AND platform role for org-admin endpoints",
      "Role ceiling: Org admins can promote members up to campus_admin only — not site_admin or higher",
      "District admins automatically manage all child campus organizations via getChildOrganizations()",
      "System admins and site admins bypass most org-level checks and can access all organizations",
    ],
  },
  {
    id: "sysadmin-data-governance",
    title: "Zero-Trust Data Governance System",
    category: "system-admin",
    tags: ["governance", "zero-trust", "data", "security", "compliance", "audit", "COPPA", "PII"],
    severity: "info",
    symptom: "You need to understand the 7-rule data governance system and how to monitor it.",
    explanation: "LYS implements a 7-rule Zero-Trust Data Governance framework designed for educational environments. This system protects student data, enforces compliance, and provides auditability. The governance dashboard in the System Admin panel shows real-time status of all rules.",
    steps: [
      "Rule 1 — Immutable Success Ledger: Student achievements (success marks) become permanent after a 24-hour edit window to prevent tampering",
      "Rule 2 — Communication Safety Intercept: All content is scanned for PII (personal identifiable information) which is stripped before AI processing, and cross-tenant data leakage is blocked",
      "Rule 3 — App-Level Tenant Scoping: All database queries are scoped to the user's organization/tenant to prevent data leakage between schools",
      "Rule 4 — Data Residency Stubs: Region tagging on data records supports future geographic data residency requirements",
      "Rule 5 — COPPA Restricted State: Users under 13 have restricted feature access until verified parental consent is obtained",
      "Rule 6 — Marketplace Security: Shared resources and templates are scanned for safety before being published",
      "Rule 7 — VPN/Fraud 3-Strike Protection: Suspicious activity (VPN use, rapid switching, unusual patterns) triggers a warning system with account restrictions after 3 strikes",
      "Monitor all governance rules from the System Admin > Governance tab dashboard",
    ],
  },
  {
    id: "sysadmin-user-management",
    title: "System-Wide User Management",
    category: "system-admin",
    tags: ["users", "management", "create", "delete", "roles", "tier", "system admin", "bulk"],
    severity: "info",
    symptom: "You need to manage users at the system level, including role changes, tier upgrades, and account actions.",
    explanation: "System administrators have full control over all user accounts on the platform. This includes changing platform roles, subscription tiers, viewing detailed analytics per user, and managing organization memberships. The User Analytics dashboard provides per-user metrics including engagement rates, content creation stats, BKD journey progress, and subscription data.",
    steps: [
      "Navigate to System Admin > Users to see all platform users with search and filter options",
      "Click any user to see detailed analytics: login count, lessons created, goals, journey progress, affiliate stats",
      "Change a user's platform role from the user detail view — changes take effect immediately",
      "Change subscription tiers (free, pro, campus, enterprise) from the Billing section or user detail view",
      "The User Analytics tab shows platform-wide metrics: churn rate, MRR, DAU/MAU ratio, cohort retention, and feature adoption",
      "Use the People tab in any organization view to manage org-level memberships and roles",
      "Audit logs track all role changes, tier changes, and administrative actions for compliance",
    ],
  },
  {
    id: "sysadmin-feature-flags",
    title: "Feature Flags & Platform Configuration",
    category: "system-admin",
    tags: ["feature flags", "configuration", "toggles", "settings", "enable", "disable", "platform"],
    severity: "info",
    symptom: "You need to enable, disable, or configure platform features using feature flags.",
    explanation: "Feature flags allow system administrators to enable or disable specific platform features without code changes. This is useful for gradual rollouts, A/B testing, or temporarily disabling features that have issues. Feature flags are managed from the System Admin dashboard and take effect immediately for all users.",
    steps: [
      "Navigate to System Admin > Feature Flags to view all available toggles",
      "Each flag shows its current state (enabled/disabled), description, and which user roles it affects",
      "Toggle a feature on or off — changes apply immediately across the platform",
      "Use feature flags to control access to beta features before full rollout",
      "AI features can be toggled independently (lesson generation, assignment generation, standards extraction)",
      "Safety features (PII stripping, content filtering, fraud detection) can be configured but not fully disabled",
      "Changes to feature flags are logged in the audit trail for accountability",
    ],
  },
  {
    id: "sysadmin-standards-ingestion",
    title: "Educational Standards Ingestion & Management",
    category: "system-admin",
    tags: ["standards", "ingestion", "import", "TEKS", "Common Core", "CSP", "curriculum", "API"],
    severity: "info",
    symptom: "You need to import, manage, or troubleshoot educational standards in the platform.",
    explanation: "LYS uses a three-tier system for importing educational standards: (1) CSP API for direct state standards, (2) planned CASE Protocol integration, and (3) LLM-powered extraction as a fallback. Standards are hierarchical and organized by state/jurisdiction, subject, and grade level. The Standards Admin page allows system admins to import, review, and manage all standards.",
    steps: [
      "Navigate to Standards Admin (/standards-admin) to view and manage all imported standards",
      "Use the Import function to fetch standards from the CSP API for supported states",
      "Supported states are populated dynamically via the CSP API — check the Standards Admin page for the current list",
      "Standards are stored hierarchically: State > Subject > Grade Level > Standard Code > Description",
      "AI lesson generation automatically uses standards from the educator's configured state",
      "If CSP API import fails, the LLM extraction fallback can process standards from documents",
      "Review imported standards for accuracy before making them available to educators",
      "Standards can be deactivated without deletion if they become outdated",
    ],
  },
  {
    id: "sysadmin-audit-logging",
    title: "Audit Logging & Security Monitoring",
    category: "system-admin",
    tags: ["audit", "logging", "security", "monitoring", "compliance", "tracking", "events"],
    severity: "info",
    symptom: "You need to review audit logs, track security events, or investigate user activity.",
    explanation: "LYS maintains audit logs for significant platform actions. This includes user authentication events, role changes, content modifications, data exports, and administrative actions. Audit logs support compliance (COPPA, FERPA awareness) and security investigations, and include timestamps, user IDs, action types, and affected resources.",
    steps: [
      "Access audit logs from the System Admin > Governance tab",
      "Logs capture: user login/logout, role changes, content creation/deletion, data exports, admin actions",
      "Filter logs by date range, user, action type, or resource to find specific events",
      "All PII stripping events are logged with before/after hashes (not actual PII) for verification",
      "Content moderation actions (blocked content, safety filter triggers) are logged with context",
      "Organization membership changes (invites, removals, role changes) are tracked per-org",
      "Fraud detection events (VPN warnings, strike counts) are logged with IP metadata",
      "Export audit logs for external compliance reporting or security reviews",
    ],
  },
  {
    id: "sysadmin-database-schema",
    title: "Database Schema & Data Model Reference",
    category: "system-admin",
    tags: ["database", "schema", "tables", "Drizzle", "PostgreSQL", "data model", "migrations"],
    severity: "info",
    symptom: "You need to understand the database schema, table relationships, or data model.",
    explanation: "LYS uses PostgreSQL managed by Drizzle ORM. The schema is defined in /shared/schema.ts and includes tables for users, organizations, memberships, lessons, goals, assignments, standards, student journey tracking, and more. All schema changes must go through Drizzle migrations to maintain data integrity. The database uses UUIDs for most primary keys and includes proper foreign key relationships.",
    steps: [
      "Core tables: users, organizations, organization_memberships, lessons, goals, assignments",
      "Journey tracking: studentJourneyEntries (event log), studentJourneyProgress (aggregated scores), studentJourneyMilestones, studentJourneyActivities",
      "Standards: educational_standards (hierarchical with state, subject, grade, code, description)",
      "Multi-tenancy: organization_memberships links users to orgs with both org-role and platform-role context",
      "Session management: sessions table for express-session with connect-pg-simple",
      "All schema definitions live in /shared/schema.ts — never modify the database directly",
      "Use 'npm run db:push' to apply schema changes during development",
      "The storage interface (/server/storage.ts) provides typed CRUD methods for all tables",
    ],
  },
  {
    id: "sysadmin-multi-tenancy",
    title: "Multi-Tenant Architecture & Organization Hierarchy",
    category: "system-admin",
    tags: ["multi-tenant", "organizations", "hierarchy", "district", "campus", "school", "isolation"],
    severity: "info",
    symptom: "You need to understand how multi-tenancy, organization hierarchy, and data isolation work.",
    explanation: "LYS supports a hierarchical organization structure: Districts contain Campuses (schools), and Universities operate independently. Each organization has its own members, settings, and resources. Data isolation ensures users in one organization cannot access another's data unless explicitly shared. District-level administrators can manage all child campus organizations. Resources and SIS integrations cascade through the hierarchy.",
    steps: [
      "Organization types: school (campus), district, university — each with a parentOrganizationId for hierarchy",
      "District orgs have child campus orgs linked via parentOrganizationId",
      "Data isolation: queries are scoped to the user's organization memberships by default",
      "Resources cascade: district-level resources are available to all child campuses",
      "SIS integrations cascade: a district SIS connection is available to all campus educators",
      "Organization tiers (free, campus, enterprise) determine available features for all org members",
      "Creating a new org: POST /api/organizations with type, name, and optional parentOrganizationId",
      "System admins can view and manage all organizations from the Admin > Organizations tab",
    ],
  },
  {
    id: "sysadmin-ai-integration",
    title: "AI Service Integration & Configuration",
    category: "system-admin",
    tags: ["AI", "OpenAI", "API key", "configuration", "lesson generation", "LLM", "mock", "fallback"],
    severity: "info",
    symptom: "You need to configure, troubleshoot, or understand the AI service integration.",
    explanation: "LYS integrates with OpenAI's API for AI-powered lesson generation, assignment creation, and standards extraction. The system includes a mock data fallback when the API key is not configured, allowing the platform to function without AI. AI requests are processed through a safety pipeline that strips PII, applies content filters, and caches results to reduce API costs. Rate limiting prevents excessive API usage.",
    steps: [
      "The OPENAI_API_KEY secret must be configured in Replit's secrets manager for AI features to work",
      "Without an API key, the platform uses mock/template responses for lesson generation",
      "PII is automatically stripped from all content before being sent to OpenAI",
      "AI lesson plans are cached in the database — identical requests return cached results",
      "Free tier includes 5 AI lessons/month; Pro and above include unlimited AI lessons (configured in pricing tiers)",
      "Content safety filters check AI outputs before returning them to users",
      "Monitor AI usage from the System Admin > Analytics dashboard",
      "The AI integration code is in the server routes — search for '/api/ai/' endpoints",
    ],
  },
  {
    id: "admin-member-management",
    title: "Managing Organization Members",
    category: "campus-district-admin",
    tags: ["members", "add", "remove", "manage", "people", "campus admin", "district admin", "org admin"],
    severity: "info",
    symptom: "You need to add, remove, or manage members in your campus or district organization.",
    explanation: "Campus and district admins can manage their organization's members through the People tab. This includes viewing all members, inviting new ones, changing roles, suspending accounts, and removing members. District admins can manage members across all campuses in their district.",
    steps: [
      "Go to your admin dashboard (Campus Admin or District Admin page) and click the People tab",
      "To invite a new member: click 'Invite Member', enter their email and select a role, then send the invitation",
      "To change a member's organization role: use the role dropdown next to their name (member, admin, owner)",
      "To change a member's platform role: use the platform role dropdown (student, educator, campus_admin — up to your own level)",
      "To suspend a member: click the suspend button — they'll lose access but their data is preserved",
      "To reactivate a suspended member: click the reactivate button to restore their access",
      "To remove a member: click remove — a confirmation dialog will appear since this action cannot be undone",
      "District admins: use the organization selector to switch between managing the district and individual campuses",
    ],
  },
  {
    id: "admin-role-changes-not-working",
    title: "Role Changes Not Taking Effect",
    category: "campus-district-admin",
    tags: ["role", "change", "not working", "permission", "denied", "ceiling", "upgrade", "campus admin"],
    severity: "warning",
    symptom: "You changed a member's role but they still can't access certain features, or you see an error when trying to assign a role.",
    explanation: "Role changes have restrictions based on your own admin level. Campus and district admins can only assign platform roles up to campus_admin — you cannot promote someone to site_admin or system_admin. Additionally, the member may need to log out and log back in for role changes to take full effect in their session.",
    steps: [
      "Verify you're changing the correct role type: organization role (member/admin/owner) vs. platform role (student/educator/campus_admin)",
      "Check the role ceiling: you can only assign platform roles up to campus_admin, not site_admin or higher",
      "Ask the member to log out and log back in — their session needs to refresh to pick up the new role",
      "If you see 'Forbidden' or 'Access Denied', your own role may not be high enough for this action",
      "District admins can assign campus_admin roles to members in child campus organizations",
      "To promote someone to site_admin or system_admin, contact a system administrator",
      "Check the People tab to confirm the role change was actually saved",
    ],
  },
  {
    id: "admin-suspended-user-issues",
    title: "Suspended Member Can Still Access Platform",
    category: "campus-district-admin",
    tags: ["suspend", "suspended", "access", "still active", "block", "deactivate", "reactivate"],
    severity: "warning",
    symptom: "A member you suspended still appears to have access to the platform or organization resources.",
    explanation: "When you suspend a member, their organization membership is marked as suspended, but their active session may continue until it expires. The suspension blocks new logins and API access, but an existing browser session might remain active for a short period. Full suspension takes effect once their current session expires.",
    steps: [
      "Verify the suspension was applied: check the People tab — suspended members show a 'Suspended' badge",
      "The member's current session will expire naturally (typically within a few hours)",
      "For immediate effect, a system admin can invalidate the user's session from the admin panel",
      "Suspended members cannot log in again until reactivated by an admin",
      "Suspended members' data (lessons, grades, portfolios) is preserved and accessible to admins",
      "To permanently remove access, use the Remove Member action instead of suspend",
      "District admins can suspend members across all managed campuses",
    ],
  },
  {
    id: "admin-invitation-issues",
    title: "Organization Invitations Not Working",
    category: "campus-district-admin",
    tags: ["invite", "invitation", "email", "join", "not received", "expired", "pending", "link"],
    severity: "warning",
    symptom: "Members report they didn't receive their invitation, or the invitation link doesn't work.",
    explanation: "Organization invitations are sent to the email address provided during the invite process. Common issues include typos in the email address, spam filters blocking the invitation, or the invitation link expiring. Invitations are valid for a limited time and can be resent if needed.",
    steps: [
      "Double-check the email address you entered — typos are the most common cause of failed invitations",
      "Ask the member to check their spam/junk folder for the invitation email",
      "Try resending the invitation from the People tab — each resend generates a fresh link",
      "Verify the member doesn't already have an account with a different email address",
      "If the member has a LYS account, they can join directly if your organization allows open registration",
      "Check your organization's registration policy in the Settings tab — it may be set to invitation-only",
      "If invitations consistently fail, check with your IT department about email filtering",
    ],
  },
  {
    id: "admin-org-settings-not-saving",
    title: "Organization Settings Not Saving",
    category: "campus-district-admin",
    tags: ["settings", "save", "organization", "not saving", "error", "update", "name", "address"],
    severity: "error",
    symptom: "Changes to your organization's settings (name, address, contact info) don't save, or you see an error.",
    explanation: "Organization settings include the org name, address, phone, website, and registration policies. Save failures typically happen due to network issues, session expiration, or validation errors (like a required field being empty). Your unsaved changes will remain in the form until you navigate away.",
    steps: [
      "Check for validation errors — the organization name field is required and cannot be empty",
      "Ensure all phone numbers and email addresses are in valid formats",
      "Try refreshing the page and making your changes again",
      "If your session has expired, log in again and return to the Settings tab",
      "Check your internet connection — settings require a successful API call to save",
      "The 'Registration Policy' dropdown controls whether new members need an invitation or can join freely",
      "If the error persists, try a different browser or clear your browser cache",
    ],
  },
  {
    id: "admin-educator-activity",
    title: "Understanding Educator Activity Reports",
    category: "campus-district-admin",
    tags: ["activity", "reports", "educator", "monitoring", "stats", "login", "lessons", "usage"],
    severity: "info",
    symptom: "You need to understand what the educator activity reports show and how to use them.",
    explanation: "The Activity tab in the admin dashboard shows usage statistics for educators in your organization. This includes login frequency, number of lessons created, scope and sequence plans built, and last activity dates. These reports help you understand which educators are actively using the platform and who might need additional support or training.",
    steps: [
      "Navigate to your admin dashboard and click the Activity tab to see educator statistics",
      "Key metrics shown: total logins, lessons created, scope & sequence plans, and last active date",
      "Educators with low activity may benefit from additional training or onboarding support",
      "The reports update in real-time as educators use the platform",
      "District admins: use the organization selector to view activity for specific campuses",
      "Activity data helps identify power users who could serve as peer mentors or trainers",
      "Export activity data for reporting to district leadership or school board presentations",
    ],
  },
  {
    id: "admin-district-campus-management",
    title: "District Admin: Managing Multiple Campuses",
    category: "campus-district-admin",
    tags: ["district", "campus", "multiple schools", "child organizations", "hierarchy", "manage"],
    severity: "info",
    symptom: "As a district admin, you need to manage multiple campuses, view cross-campus data, or understand your management scope.",
    explanation: "District administrators automatically have management access to their district organization plus all child campus organizations. This means you can view members, change settings, monitor activity, and manage roles across all campuses in your district without needing separate admin access to each one. The platform automatically detects your district admin role and shows all available organizations.",
    steps: [
      "Your District Admin dashboard shows all campuses in your district with an organization selector",
      "Use the organization dropdown to switch between managing different campuses",
      "Member management works the same for each campus — you can add, remove, change roles, and suspend members",
      "Settings can be customized per-campus — each campus can have its own registration policy and contact info",
      "Activity reports can be viewed per-campus to compare educator engagement across schools",
      "Resources shared at the district level are automatically available to all campus members",
      "Student transfers between campuses in your district go through you for district-level approval",
      "You can promote campus members up to campus_admin role in any campus you manage",
    ],
  },
  {
    id: "admin-student-transfer-troubleshooting",
    title: "Student Transfer Approval Issues",
    category: "campus-district-admin",
    tags: ["transfer", "student", "approval", "stuck", "pending", "triple confirmation", "campus", "district"],
    severity: "warning",
    symptom: "A student transfer between campuses is stuck, pending, or not completing properly.",
    explanation: "Student transfers require a triple confirmation workflow: (1) the sending campus admin approves, (2) the receiving campus admin approves, and (3) the district admin provides final confirmation. All three approvals must be completed for the transfer to process. If any party hasn't approved, the transfer stays in pending status.",
    steps: [
      "Check the Transfer Approvals page to see which approval step is pending",
      "Contact the other campus admin directly to ask them to review and approve the transfer",
      "District admins: check your pending approvals — your confirmation is the final step",
      "Each approval step sends a notification — the pending party may have missed it",
      "If a transfer has been pending for too long, the sending admin can cancel and resubmit it",
      "Verify the receiving campus has capacity and the student's records are complete",
      "After all three approvals, the student's enrollment automatically updates to the new campus",
      "Student data (grades, portfolio, journey progress) transfers with the student record",
    ],
  },
  {
    id: "admin-cant-see-all-members",
    title: "Not Seeing All Organization Members",
    category: "campus-district-admin",
    tags: ["members", "missing", "not showing", "incomplete", "list", "people", "count"],
    severity: "warning",
    symptom: "The member list in your organization appears incomplete or is missing some people you expect to see.",
    explanation: "The member list shows users who have accepted their invitation and are active members. Pending invitations, recently removed members, and users from other organizations in the hierarchy won't appear in a specific org's member list. District admins need to switch between organizations to see members of different campuses.",
    steps: [
      "Check if the missing person has a pending invitation that hasn't been accepted yet",
      "Verify you're viewing the correct organization — use the org selector if you manage multiple orgs",
      "Recently removed or transferred members won't appear in the active member list",
      "Suspended members still appear in the list with a 'Suspended' badge",
      "If a member was added to a different campus in your district, switch to that org's view",
      "Check with a system admin if the member's account exists but isn't showing in any organization",
      "Members must complete their account registration before they appear in the organization list",
    ],
  },
  {
    id: "admin-registration-policy",
    title: "Configuring Organization Registration Policy",
    category: "campus-district-admin",
    tags: ["registration", "policy", "open", "invitation only", "join", "sign up", "enrollment", "settings"],
    severity: "info",
    symptom: "You need to control how new members can join your organization — open enrollment vs. invitation-only.",
    explanation: "Each organization has a registration policy that determines how new members join. 'Open' allows anyone to request to join, while 'Invitation Only' requires an admin to send an invitation. The policy can be changed at any time from the Settings tab. This helps control who has access to your organization's resources and data.",
    steps: [
      "Go to your admin dashboard and click the Settings tab",
      "Find the 'Registration Policy' dropdown to see the current setting",
      "Choose 'Open' to allow anyone to request membership (useful for large organizations or events)",
      "Choose 'Invitation Only' to require admin approval for every new member (recommended for most schools)",
      "The policy change takes effect immediately — no restart or refresh needed",
      "Existing members are not affected when you change the policy",
      "District admins can set different policies for each campus in their district",
      "Consider using 'Invitation Only' for campuses with student data to maintain COPPA compliance",
    ],
  },
  {
    id: "affiliate-getting-started",
    title: "Getting Started with Educator Influence",
    category: "affiliate",
    tags: ["affiliate", "referral", "rewards", "points", "educator influence", "earn", "share"],
    severity: "info",
    symptom: "You want to learn how the Educator Influence program works and how to start earning rewards.",
    explanation: "The Educator Influence program lets you earn points by sharing LYS with other educators and students. When someone signs up through your referral link, you earn points that can be converted to real cash. Every educator automatically gets a referral code when they join. You start in 'Student' mode and automatically upgrade to 'Pro' mode once you get 5 referrals, unlocking additional features like cash payouts.",
    steps: [
      "Navigate to 'Educator Influence' in the sidebar to view your dashboard",
      "Your unique referral link and code are shown on the Overview tab",
      "Share your referral link with colleagues, students, or on social media",
      "You earn points for different actions: 100 pts for a signup, 500 pts for a course completion, 50 pts for a verified review, and more",
      "Track your earnings, views, shares, and referrals in real-time on the Overview tab",
      "Once you reach 50,000 points ($50), you can convert points to cash in the Wallet tab",
      "After 5 referrals, you automatically upgrade to Pro mode for enhanced features",
    ],
    relatedArticles: ["affiliate-wallet", "affiliate-promo-studio", "affiliate-network"],
  },
  {
    id: "affiliate-wallet",
    title: "Using the Affiliate Wallet",
    category: "affiliate",
    tags: ["wallet", "points", "cash", "convert", "payout", "balance", "money", "earnings"],
    severity: "info",
    symptom: "You want to understand how to convert your earned points to cash and request payouts.",
    explanation: "The Wallet tab shows your dual balance — points and cash. Points are earned through referral activities and can be converted to cash at a rate of 1,000 points = $1.00. You need a minimum of 50,000 points ($50) to convert. Once converted, cash can be paid out to your bank account via Stripe Connect. All transactions are logged in your transaction history.",
    steps: [
      "Go to Educator Influence and click the 'Wallet' tab",
      "View your current points balance and cash balance at the top",
      "To convert points: Click 'Convert Points to Cash' (requires minimum 50,000 points)",
      "Enter the number of points you want to convert — the calculator shows the cash equivalent",
      "To request a payout: Click 'Request Payout' (available in Pro mode, minimum $50 cash balance)",
      "Review your transaction history at the bottom for a complete record of earnings, conversions, and payouts",
      "Cash payouts are processed via Stripe Connect — you'll need to set up your account the first time",
    ],
    relatedArticles: ["affiliate-getting-started", "affiliate-network"],
  },
  {
    id: "affiliate-network",
    title: "Building Your Affiliate Network",
    category: "affiliate",
    tags: ["network", "tier-2", "sub-affiliate", "referral", "commission", "team", "invite"],
    severity: "info",
    symptom: "You want to learn about the two-tier affiliate system and how to earn bonuses from sub-affiliates.",
    explanation: "The Network tab shows your two-tier affiliate structure. You can invite other educators to join as your sub-affiliates. When they earn points, you automatically receive a 10% bonus on their earnings. This is a great way to multiply your rewards — the more active sub-affiliates you have, the more passive income you earn.",
    steps: [
      "Go to Educator Influence and click the 'Network' tab",
      "Copy your tier-2 invite link and share it with other educators",
      "When someone joins through your tier-2 link, they become your sub-affiliate",
      "You earn a 10% bonus on all points your sub-affiliates earn — this is credited automatically",
      "View your sub-affiliate list and their activity on the Network tab",
      "Your tier-2 earnings total is shown separately so you can track passive income",
      "There's no limit to how many sub-affiliates you can have",
    ],
    relatedArticles: ["affiliate-getting-started", "affiliate-wallet"],
  },
  {
    id: "affiliate-promo-studio",
    title: "Creating Promotional Content",
    category: "affiliate",
    tags: ["promo", "marketing", "image", "caption", "DALL-E", "AI", "branded", "social media", "share"],
    severity: "info",
    symptom: "You want to create professional branded images and captions to promote LYS on social media.",
    explanation: "The Promo Studio tab lets you generate AI-powered promotional content using DALL-E 3 for images and GPT-4o for captions. Enter a course or topic name, and the system creates a professional branded banner image with a matching social media caption. You can download the images and copy the captions to share on LinkedIn, Twitter, Facebook, or any platform.",
    steps: [
      "Go to Educator Influence and click the 'Promo Studio' tab",
      "Enter a course name or topic you want to promote",
      "Click 'Generate Promo Pack' to create a branded image and caption",
      "Wait a moment for the AI to generate your content",
      "Click the download button to save the banner image",
      "Click 'Copy Caption' to copy the social media text to your clipboard",
      "Share the image and caption on your preferred social media platforms",
      "All generated assets are saved in your gallery for future use",
    ],
    relatedArticles: ["affiliate-getting-started"],
  },
  {
    id: "affiliate-points-not-showing",
    title: "Points Not Appearing After Referral",
    category: "affiliate",
    tags: ["points", "missing", "not showing", "referral", "earn", "reward", "bug", "issue"],
    severity: "warning",
    symptom: "Someone signed up through your referral link but you don't see the points in your dashboard.",
    explanation: "Points are awarded when the referred user completes specific actions (signup, lesson save, course completion). If you shared your link but don't see points yet, the person may not have completed their registration. Points are tracked in real-time, but there can be a brief delay. Make sure the person used your exact referral link — if they navigated to the site directly, the referral won't be tracked.",
    steps: [
      "Verify that the person clicked your exact referral link to visit LYS",
      "Check that they completed their account registration (just visiting isn't enough for signup points)",
      "Refresh your Educator Influence dashboard to see the latest data",
      "Check the different point types: views (1 pt), shares (5 pts), signups (50-100 pts)",
      "Note that some actions like 'course completion' (500 pts) happen later as the user engages",
      "If points still aren't appearing after 24 hours, contact support with your referral code",
    ],
    relatedArticles: ["affiliate-getting-started", "affiliate-wallet"],
  },
  {
    id: "trial-getting-started",
    title: "Starting Your Free Trial",
    category: "trial",
    tags: ["trial", "free trial", "start", "activate", "10 days", "pro", "upgrade", "try"],
    severity: "info",
    symptom: "You want to try LYS Pro features for free before deciding on a subscription.",
    explanation: "LYS offers a 10-day free trial that gives you full Pro-level access. This includes unlimited AI lesson generation, no advertisements, and focus mode. The trial starts the moment you activate it and lasts exactly 10 days. You don't need a credit card to start — just click the trial activation button.",
    steps: [
      "Look for the trial banner at the top of the page or a trial card on the dashboard",
      "Click 'Start Free Trial' to activate your 10-day Pro access",
      "Your trial begins immediately — the banner will show how many days you have remaining",
      "During the trial, you get unlimited AI lesson generation",
      "All advertisements are removed during your trial period",
      "Focus Mode is available to minimize distractions",
      "Before your trial ends, visit the Pricing page to choose a subscription plan",
      "Your lessons and data are preserved whether or not you subscribe after the trial",
    ],
    relatedArticles: ["trial-expiring", "trial-features"],
  },
  {
    id: "trial-features",
    title: "What's Included in the Free Trial",
    category: "trial",
    tags: ["trial", "features", "pro", "included", "access", "unlimited", "benefits"],
    severity: "info",
    symptom: "You want to know exactly what features are available during your free trial.",
    explanation: "The free trial gives you the same access as a Pro subscription for 10 days. This is designed to let you experience the full power of LYS before committing to a paid plan. All your work during the trial is saved and accessible after the trial ends, regardless of your subscription decision.",
    steps: [
      "Unlimited AI Lesson Generation — create as many AI-powered lessons as you need",
      "Ad-Free Experience — no advertisements or promotional banners",
      "Focus Mode — clean, distraction-free interface for lesson planning",
      "Advanced Analytics — detailed insights into your teaching patterns",
      "All standard features remain available (Self-Discovery, Career Explorer, Scope & Sequence, etc.)",
      "After the trial, you'll return to the Free tier unless you subscribe",
      "Free tier still gives you 3 AI lessons per month and full access to non-AI features",
      "Visit the Pricing page anytime to compare plans and subscribe",
    ],
    relatedArticles: ["trial-getting-started", "trial-expiring"],
  },
  {
    id: "trial-expiring",
    title: "My Trial Is Expiring Soon",
    category: "trial",
    tags: ["trial", "expiring", "ending", "days left", "subscribe", "upgrade", "renew"],
    severity: "warning",
    symptom: "Your trial banner shows only a few days remaining and you want to keep your Pro features.",
    explanation: "When your trial is about to expire, you'll see a countdown in the trial banner. Your data and lessons are never deleted — they'll still be available after the trial ends. To continue with Pro features, you'll need to subscribe to a paid plan. If you don't subscribe, you'll automatically switch to the Free tier with basic access.",
    steps: [
      "Check the trial banner at the top of the page to see how many days remain",
      "Go to the Pricing page (Plans & Pricing in the sidebar) to review subscription options",
      "Choose the plan that best fits your needs (Pro, Campus, or Enterprise)",
      "Complete your payment to continue with uninterrupted Pro access",
      "If you let the trial expire, you'll still have access to all your saved lessons and data",
      "Free tier gives you 3 AI lessons per month — enough for occasional use",
      "You can subscribe at any time after your trial ends to restore Pro features",
    ],
    relatedArticles: ["trial-getting-started", "trial-features"],
  },
  {
    id: "trial-not-working",
    title: "Free Trial Not Activating",
    category: "trial",
    tags: ["trial", "not working", "error", "can't start", "unavailable", "blocked", "problem"],
    severity: "error",
    symptom: "You click 'Start Free Trial' but it doesn't activate, or you see a message that you're not eligible.",
    explanation: "The trial system has limits to prevent abuse. Each IP address can start up to 5 trials per 6-month period. If you've previously used a trial, you may need to wait until the next eligibility window. Being logged in helps ensure your trial is properly linked to your account.",
    steps: [
      "Make sure you're logged in to your LYS account before starting the trial",
      "Check if you've previously used a trial — each account gets limited trials per 6-month period",
      "If you see 'Not Eligible,' your IP address may have reached the trial limit",
      "Try logging in from a different network if you're on a shared school network",
      "Wait for the eligibility window to reset (the status page shows when you'll be eligible again)",
      "If you believe this is an error, contact your campus administrator or support",
    ],
    relatedArticles: ["trial-getting-started", "auth-login-fail"],
  },
];

const categories = [
  { id: "all", label: "All Topics", icon: HelpCircle },
  { id: "authentication", label: "Login & Access", icon: Key },
  { id: "ai-features", label: "AI Features", icon: Sparkles },
  { id: "safety", label: "Safety & Privacy", icon: Shield },
  { id: "lesson-planning", label: "Lesson Planning", icon: BookOpen },
  { id: "organization", label: "Organizations", icon: Users },
  { id: "grades", label: "Grades & Marks", icon: GraduationCap },
  { id: "integration", label: "Integrations", icon: Globe },
  { id: "collaboration", label: "Collaboration", icon: Users },
  { id: "portfolio", label: "Portfolios", icon: FileText },
  { id: "performance", label: "Performance", icon: Clock },
  { id: "affiliate", label: "Educator Influence", icon: Activity },
  { id: "trial", label: "Free Trial", icon: Clock },
  { id: "system-admin", label: "System Admin Docs", icon: Code },
  { id: "campus-district-admin", label: "Admin Troubleshooting", icon: Building },
];

const quickLinks = [
  { label: "Login issues?", articleId: "auth-login-fail", icon: Key },
  { label: "AI lesson failed?", articleId: "ai-lesson-fail", icon: Sparkles },
  { label: "Content blocked?", articleId: "ai-content-blocked", icon: Shield },
  { label: "COPPA consent", articleId: "coppa-consent-required", icon: Lock },
  { label: "Grades look wrong?", articleId: "gradebook-calculation", icon: GraduationCap },
  { label: "Page loading slowly?", articleId: "page-loading-slow", icon: Loader2 },
  { label: "Platform architecture?", articleId: "sysadmin-platform-architecture", icon: Code },
  { label: "Managing members?", articleId: "admin-member-management", icon: Building },
  { label: "Earn rewards?", articleId: "affiliate-getting-started", icon: Activity },
  { label: "Start free trial?", articleId: "trial-getting-started", icon: Clock },
];

export default function HelpDesk() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = useMemo(() => {
    let articles = helpArticles;

    if (selectedCategory !== "all") {
      articles = articles.filter(a => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.symptom.toLowerCase().includes(query) ||
        a.explanation.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return articles;
  }, [searchQuery, selectedCategory]);

  const severityConfig = {
    error: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30", icon: XCircle, label: "Error" },
    warning: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: AlertTriangle, label: "Warning" },
    info: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30", icon: Info, label: "Info" },
  };

  if (selectedArticle) {
    const config = severityConfig[selectedArticle.severity];
    const SeverityIcon = config.icon;

    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSelectedArticle(null)}
          data-testid="button-back-to-help"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Desk
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <SeverityIcon className={`h-6 w-6 mt-1 ${
                selectedArticle.severity === "error" ? "text-red-600" :
                selectedArticle.severity === "warning" ? "text-amber-600" : "text-blue-600"
              }`} />
              <div className="flex-1">
                <CardTitle className="font-oswald text-2xl" data-testid="text-article-title">{selectedArticle.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className={config.color}>{config.label}</Badge>
                  <Badge variant="outline">{categories.find(c => c.id === selectedArticle.category)?.label}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-oswald text-lg mb-2">What You're Seeing</h3>
              <p className="text-muted-foreground font-roboto" data-testid="text-article-symptom">{selectedArticle.symptom}</p>
            </div>

            <div>
              <h3 className="font-oswald text-lg mb-2">Why This Happens</h3>
              <p className="text-muted-foreground font-roboto" data-testid="text-article-explanation">{selectedArticle.explanation}</p>
            </div>

            <div>
              <h3 className="font-oswald text-lg mb-3">How to Fix It</h3>
              <div className="space-y-3">
                {selectedArticle.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3" data-testid={`step-${i}`}>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-lys-teal/10 text-lys-teal font-bold text-sm shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="font-roboto text-sm pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-marker text-4xl text-lys-red" data-testid="text-help-title">Help Desk</h1>
        <p className="text-muted-foreground font-roboto text-lg max-w-2xl mx-auto">
          Find answers to common questions and troubleshoot issues quickly
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for help... (e.g., 'login', 'AI lesson', 'grades')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
          data-testid="input-help-search"
        />
      </div>

      {!searchQuery && selectedCategory === "all" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map(link => {
            const article = helpArticles.find(a => a.id === link.articleId);
            const Icon = link.icon;
            return (
              <Card
                key={link.articleId}
                className="cursor-pointer hover:border-lys-teal/50 transition-colors"
                onClick={() => article && setSelectedArticle(article)}
                data-testid={`quick-link-${link.articleId}`}
              >
                <CardContent className="p-3 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-lys-teal" />
                  <p className="text-xs font-roboto font-medium">{link.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-lys-teal hover:bg-lys-teal/90" : ""}
              data-testid={`filter-category-${cat.id}`}
            >
              <Icon className="h-4 w-4 mr-1" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-roboto text-muted-foreground">No help articles match your search.</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse by category.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                data-testid="button-clear-search"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map(article => {
            const config = severityConfig[article.severity];
            const SeverityIcon = config.icon;
            const isExpanded = expandedArticle === article.id;
            const categoryInfo = categories.find(c => c.id === article.category);

            return (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                data-testid={`help-article-${article.id}`}
              >
                <CardContent className="p-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    data-testid={`button-expand-${article.id}`}
                  >
                    <SeverityIcon className={`h-5 w-5 mt-0.5 shrink-0 ${
                      article.severity === "error" ? "text-red-600" :
                      article.severity === "warning" ? "text-amber-600" : "text-blue-600"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-oswald text-base font-medium">{article.title}</h3>
                        <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                        {categoryInfo && <Badge variant="outline" className="text-xs">{categoryInfo.label}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground font-roboto line-clamp-2">{article.symptom}</p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4 ml-8">
                      <div>
                        <h4 className="font-oswald text-sm font-medium mb-1">Why This Happens</h4>
                        <p className="text-sm text-muted-foreground font-roboto">{article.explanation}</p>
                      </div>
                      <div>
                        <h4 className="font-oswald text-sm font-medium mb-2">Steps to Resolve</h4>
                        <ol className="space-y-1.5">
                          {article.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-roboto">
                              <span className="text-lys-teal font-bold shrink-0">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedArticle(article); }}
                        data-testid={`button-view-full-${article.id}`}
                      >
                        View Full Article
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {filteredArticles.length > 0 && (
        <p className="text-center text-sm text-muted-foreground font-roboto">
          Showing {filteredArticles.length} of {helpArticles.length} help articles
        </p>
      )}

      <Card className="bg-lys-teal/5 border-lys-teal/20">
        <CardContent className="py-6 text-center">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 text-lys-teal" />
          <h3 className="font-oswald text-lg mb-1">Still Need Help?</h3>
          <p className="text-sm text-muted-foreground font-roboto max-w-md mx-auto">
            If you can't find the answer you're looking for, reach out to your campus administrator or contact your district support team for further assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
