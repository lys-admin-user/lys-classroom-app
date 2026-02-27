# LYS Educational Platform

## Overview
LYS (Laddering Your Success) is an AI-powered educational platform designed to empower educators and students through the "Be-Know-Do" methodology. It offers AI lesson planning, self-discovery assessments, career exploration, goal tracking, and comprehensive educational resources, aiming to bridge academic preparation with real-world success.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
-   **Design System**: Tailwind CSS with custom design tokens (Primary Red, Warm Yellow, Dark Teal).
-   **UI Components**: shadcn/ui library built on Radix UI primitives.
-   **Typography**: Custom font stack featuring Permanent Marker (headers), Oswald (subheaders), and Roboto (body text).

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query, and Vite.
-   **Backend**: Express.js with TypeScript, RESTful JSON API, and Zod for validation.
-   **Data Layer**: PostgreSQL database managed by Drizzle ORM.
-   **Authentication**: Replit Auth with `express-session` and PostgreSQL for session storage.
-   **Security**: Input validation, ownership checks, server-side regeneration of critical IDs, Helmet security headers, rate limiting (express-rate-limit), PII stripping before AI calls, content keyword filtering, audit logging, and parental consent (COPPA) system.
-   **Zero-Trust Data Governance**: 7-rule governance system including immutable success ledger (24-hour edit window), communication safety intercept (PII blocking, cross-tenant lockdown), app-level tenant scoping, data residency stubs (region tagging), COPPA restricted state enforcement, marketplace security, and VPN/fraud 3-strike protection. Admin dashboard tab for governance monitoring.
-   **Monorepo Structure**: `/client`, `/server`, and `/shared` directories.
-   **AI Integration**: OpenAI API for AI-driven features, with mock data fallback.
-   **Real-Time Collaboration**: WebSocket server for live cursor positions, presence, and chat.
-   **Multi-Tenancy**: Supports organizations (School, District, University) with hierarchical role-based access control (system_admin > site_admin > district_admin > campus_admin > educator > homeschool_parent > student), `requireRole()` middleware with DB lookups, and an invitation system.
-   **Automated Standards Ingestion**: Three-tier system for importing educational standards including CSP API, planned CASE Protocol, and LLM extraction.

### Feature Specifications
-   **Free Trial System**: 10-day free trial for all users with layered abuse prevention — IP tracking (stored in database), browser fingerprinting (canvas + device attributes), and Replit user ID binding. Trials reset every 6 months, with a maximum of 5 trials per IP per reset window. Trial users get Pro-level access (unlimited AI lessons, no ads, focus mode). Components: `TrialBanner` (top bar), `TrialCard` (inline), `useTrial` hook. API routes at `/api/trial/*`. Database table: `free_trials`.
-   **Be-Know-Do Framework**: Integrates self-discovery assessments (BE), career exploration (KNOW), and goal setting (DO).
-   **Lesson Plan Rubric System**: Comprehensive rubric with 6 categories and 4 quality levels, used for AI lesson generation and quality scoring.
-   **AI Lesson Plan Caching**: Database-backed cache for AI-generated lesson plans to reduce duplicate API calls.
-   **AI Lesson-Assignment Alignment**: AI Assignment Generator aligns with lesson rubric standards, assessing objectives and incorporating BKD principles.
-   **Scope & Sequence Builder**: Tool for curriculum planning, including pacing tracking and automatic standards extraction.
-   **Self-Discovery & Career Exploration**: Modules for self-assessment and detailed career information. Career Explorer includes 40 careers spanning technology (AI/ML engineer, cloud architect, cybersecurity, drone pilot), healthcare (nursing, dental hygienist, health informatics), business (product manager, marketing, financial analyst), science & environment (sustainability analyst, biotech research associate), creative arts (UX/UI designer, graphic design), skilled trades (plumber, HVAC, welder, auto tech, CDL driver, diesel mechanic, EV/battery tech, robotics tech), public safety (firefighter, EMT/paramedic), personal services (cosmetologist/barber), and more. Education pathway filter allows filtering by No Degree Required, Certification Only, Trade School/Apprenticeship, Associate's Degree, and Bachelor's+.
-   **Hybrid Affiliate Orchestrator**: Full-featured educator affiliate system with: configurable JSON point values (referral_signup: 100, course_completion: 500, daily_login_streak: 5, verified_review: 50, view: 1, share: 5, copy_link: 2, lesson_save: 25, signup: 50), dual wallet (points + cash balances), points-to-cash conversion (100pts = $1.00, 5000pt minimum), student vs pro modes (auto-upgrade at 5 referrals), two-tier commission system (10% tier-2 bonus), AI branded promo content generator (DALL-E 3 images + GPT-4o captions), demo-mode integrations for Rewardful, PartnerStack, and Stripe Connect. Tables: `educator_affiliates`, `referral_events`, `affiliate_rewards`, `affiliate_wallet_transactions`, `affiliate_promo_assets`. API routes at `/api/affiliate/*` and `/api/referral/*`. Frontend: tabbed dashboard (Overview, Wallet, Network, Promo Studio). Service: `server/services/affiliateIntegrations.ts`.
-   **Real-Time Collaboration**: Co-creation of lesson plans with invite codes, role differentiation, chat, and edit history.
-   **Shared Resource Library**: Community platform for educators to share resources.
-   **Educational Standards System**: Incorporates legally-compliant, hierarchical standards into lesson generation, with admin management and user preferences.
-   **Student Digital Portfolio**: Customizable digital portfolios with privacy controls and shareable links.
-   **One-Click Template Library**: For sharing and browsing lesson plan templates.
-   **Student Transfer System**: Campus-level feature for transferring students with a triple confirmation workflow.
-   **Gradebook System**: Manages student grades, calculates letter grades, exports CSV, and integrates with SIS.
-   **Career Alignment**: Maps classes to career fields and displays career readiness scores in the gradebook and parent portal.
-   **Parent Portal**: Free tier portal for parents to track student progress, visualize Be-Know-Do journey, and view career readiness insights.
-   **System Admin Performance Analytics**: Dashboard for tracking performance, goal completion, standards coverage, and student progress.
-   **Granular User Analytics**: Per-user metrics dashboard with churn rate, burn rate, engagement rate, DAU/MAU ratio, cohort retention, feature adoption rates, MRR tracking, and expandable individual user detail views showing join date, login count, content creation stats, BKD journey progress, and subscription data.
-   **Educator Type Classification**: Allows educators to self-select their type for platform usage analytics.
-   **KNOW Resources Management**: Admin-managed curated educational content for the KNOW pillar.
-   **Student Matriculation & Achievement Tracking**: System-level tracking of student progress and achievements.
-   **Onboarding Tour**: Role-aware guided tour for new users.
-   **Scholarship & Mentorship System**: Comprehensive scholarship planning, essay builder, strengths inventory, campus activities tracker, and mentor connection features.
-   **Help Desk**: Searchable knowledge base with 40+ categorized help articles covering common errors (login, AI features, safety, lesson planning, grades, integrations, etc.), quick-link shortcuts, expandable troubleshooting guides, and full article detail views. Accessible to all users via sidebar. Includes System Admin developer documentation (platform architecture, API reference, RBAC, data governance, user management, feature flags, standards ingestion, audit logging, database schema, multi-tenancy, AI integration) and Campus/District Admin troubleshooting guides (member management, role changes, suspensions, invitations, org settings, educator activity, district multi-campus management, student transfers, registration policies).
-   **Developer Documentation**: Dedicated internal dev docs page (`/dev-docs`) restricted to site_admin and system_admin roles. Covers 15 comprehensive sections: Platform Architecture, Database Schema & Data Model, API Endpoints Reference, RBAC System, Security Infrastructure, Zero-Trust Data Governance, COPPA Compliance, AI Integration & Safety, Multi-Tenant Architecture, Authentication & Sessions, Real-Time Collaboration, Payment & Subscription System, SIS Integration, Educational Standards Ingestion, HubSpot CRM, WordPress Integration, and Environment & Troubleshooting. Features searchable content, category filtering, expandable accordion views, and full-page detail views with code blocks and data tables. Accessible via sidebar under System Administration.
-   **Org Admin Self-Service**: Campus and district admins can manage their organizations without needing system admin help. Features include: member management (view, invite, change org/platform roles, suspend/reactivate, remove), org settings (name, address, contact info, registration policies), and educator activity monitoring (login counts, lesson/scope creation stats). District admins manage their district org plus all child campus orgs. Role ceiling enforces that org admins can only assign platform roles up to campus_admin. API routes at `/api/org-admin/*` with `verifyOrgAdminAccess()` authorization.

### Global Architecture
-   **Educational Hierarchy**: Structured organization of students and classes.
-   **Organization Inheritance**: Resources and settings cascade through the hierarchy.
-   **Scope & Sequence Visibility**: Supports personal, campus, district, and system-level scopes.
-   **SIS Integration Inheritance**: Campus/District SIS connections are automatically available to educators.
-   **Global Authority Tree**: Polymorphic hierarchy supporting various educational governance systems.
-   **LYS Milestone Engine**: Tracks Being/Knowing/Doing progress with gatekeeper logic.
-   **Workforce Trends Integration**: Automated sync with BLS Occupational Outlook Handbook data.
-   **Alignment Matrix**: Connects regional gamification weights to workforce data.

### Data Architecture (Journey Tracking)
-   **studentJourneyEntries**: General event log for user activity.
-   **studentJourneyProgress**: Aggregated progress scores per student.
-   **studentJourneyMilestones**: Specific milestone achievements tracked.
-   **studentJourneyActivities**: Detailed activity log for student analytics.

## External Dependencies

### AI Services
-   **OpenAI API**: For AI lesson plan generation and LLM-powered standards extraction.

### Database
-   **PostgreSQL**: Primary data store.

### Key NPM Packages
-   **UI**: `shadcn/ui`, `@radix-ui/react-primitives`.
-   **Forms**: `react-hook-form`, `@hookform/resolvers`.
-   **Date Handling**: `date-fns`.
-   **Session Management**: `express-session`, `connect-pg-simple`.
-   **Icons**: `lucide-react`, `react-icons`.

### Payment Integration
-   **Stripe**: Credit/debit card processing (via Replit's Stripe connector, demo mode until configured).
-   **PayPal**: PayPal checkout via `@paypal/paypal-server-sdk` with lazy-loaded SDK initialization (demo mode until credentials provided).
-   **Purchase Order**: Institutional billing for schools and districts with PO number tracking.
-   **Bank Transfer / ACH**: Direct bank payment for annual plans with reference number generation.
-   **Payment Methods API**: `/api/payment-methods/available` returns available methods with configuration status.

### Ad Monetization (Free Tier)
-   **Revenue Model**: EdTech eCPM-based advertising for free-tier users (excluding K-7 students).
-   **Ad Slot Configuration**: IAB standard sizes.

### Country Affordability Index (CAI) Global Pricing
-   **Purpose**: Equitable, cross-border pricing based on local purchasing power using a custom formula.

### HubSpot CRM Integration
-   **Connection**: Uses Replit's HubSpot connector for contact, company, and deal management.

### WordPress Integration
-   **Features**: Iframe Embeds, Shortcodes, oEmbed, REST API for hosting the LYS platform or individual widgets within WordPress. Includes a downloadable WordPress plugin for integration.

### SIS (Student Information System) Integration
-   **Supported Providers**: Clever, PowerSchool, Canvas LMS, Infinite Campus, Skyward, OneRoster.
-   **Features**: OAuth authentication, student/course import and sync, configurable settings.