# LYS Educational Platform

## Overview
LYS (Laddering Your Success) is an AI-powered educational platform designed to empower educators and students through the "Be-Know-Do" methodology. It offers AI lesson planning, self-discovery assessments, career exploration, goal tracking, and comprehensive educational resources, aiming to bridge academic preparation with real-world success. The platform targets sustainable growth by providing equitable access to quality education.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
-   **Design System**: Tailwind CSS with custom design tokens.
-   **UI Components**: shadcn/ui library built on Radix UI primitives.
-   **Typography**: Custom font stack featuring Permanent Marker (headers), Oswald (subheaders), and Roboto (body text).

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query, and Vite.
-   **Backend**: Express.js with TypeScript, RESTful JSON API, and Zod for validation.
-   **Data Layer**: PostgreSQL database managed by Drizzle ORM.
-   **Authentication**: Replit Auth with `express-session` and PostgreSQL for session storage.
-   **Security**: Comprehensive measures including input validation, ownership checks, PII stripping, content filtering, audit logging, and a parental consent (COPPA) system. A Zero-Trust Data Governance model is implemented with 7 rules focusing on data immutability, communication safety, tenant scoping, data residency, and fraud protection.
-   **FERPA Pre-LLM Sanitization** (`server/services/piiSanitizer.ts`): Strips emails, phones, SSNs, student IDs, addresses, DOBs, and student names from free-text fields before they're sent to OpenAI. Wired into both `server/openai.ts` (lesson topic/course/unit) and `server/assignmentGenerator.ts` (accommodationNotes). The accommodation-notes textarea on the Assignments page shows a visible FERPA-safe notice. Name detection uses capitalized-token heuristics with case-sensitive name patterns + case-insensitive prefix words to avoid false positives on academic content.
-   **Exec KPIs Tab** (System Admin): New `/api/admin/exec-metrics` endpoint + "Exec KPIs" tab showing 12-week signup and lesson-creation trends, free→paid conversion rate, paid-churn proxy (60d-old paid accounts dormant 30d), active unbound trials (warm leads), and unconverted guest IPs (top-of-funnel that haven't even started a trial).
-   **Monorepo Structure**: Organized into `/client`, `/server`, and `/shared`.
-   **AI Integration**: Utilizes OpenAI API for AI-driven features.
-   **Real-Time Collaboration**: WebSocket server for live features like cursor positions, presence, and chat.
-   **Multi-Tenancy**: Supports various organizational structures (School, District, Charter Network) with hierarchical role-based access control and an invitation system.
-   **Automated Standards Ingestion**: Three-tier system for importing educational standards via CSP API, CASE Protocol, and LLM extraction.

### Feature Specifications
-   **Free Trial System**: 10-day free trial with abuse prevention mechanisms (IP tracking, browser fingerprinting, Replit user ID binding).
-   **Be-Know-Do Framework**: Integrates self-discovery, career exploration, and goal setting.
-   **AI Lesson Plan System**: AI-generated lesson plans based on a comprehensive rubric, with database-backed caching and alignment to assignments.
-   **Scope & Sequence Builder**: Tool for curriculum planning and standards integration.
-   **Career Exploration**: Modules for self-assessment and detailed career information, with filters by education pathway.
-   **Hybrid Affiliate Orchestrator**: Educator affiliate system with configurable point values, dual wallet, points-to-cash conversion, two-tier commission, and AI branded promo content generation.
-   **Shared Resource Library**: Community platform for educators to share resources.
-   **Educational Standards System**: Incorporates legally-compliant, hierarchical standards into lesson generation.
-   **Student Digital Portfolio**: Customizable digital portfolios with privacy controls.
-   **Student Transfer System**: Campus-level student transfer with triple confirmation.
-   **Gradebook System**: Manages grades, calculates letter grades, exports CSV, and integrates with SIS.
-   **Parent Portal v2**: Free family connect portal with magic invite links (`/parent-connect` public route, `lys_pending_magic_token` localStorage key for unauthenticated flows), 1-to-1 messaging, class-wide broadcast announcements, quiet hours, and portfolio oversight with teacher flagging. All educator roles (educator through district_admin) see Parent Portal in sidebar.
-   **Admin Analytics**: Dashboards for system performance, goal completion, user engagement, and granular user metrics.
-   **Scholarship & Mentorship System**: Tools for scholarship planning, essay building, and mentor connections.
-   **Help Desk**: Searchable knowledge base and troubleshooting guides for users and administrators.
-   **Developer Documentation**: Internal documentation for site_admin and system_admin roles covering architecture, APIs, security, and integration details.
-   **Org Admin Self-Service**: Tools for campus and district admins to manage their organizations and members.
-   **RSS Content Ingestion System**: System admin Content Hub for managing and ingesting RSS feeds, categorizing content for various platform features, with an approval workflow.
-   **Upcoming Deadlines Widget**: Dashboard widget on both educator and student dashboards showing this week's deadlines from goals (targetDate) and assignments (dueDate).
-   **Student → Teacher Messaging Widget**: Student dashboard card showing messaging threads with teachers via the parent-messages thread API.
-   **New Educator Checklist**: First-time educator onboarding checklist on the educator dashboard.
-   **Marketplace Wishlist & Category Filters**: Users can save marketplace items to a personal wishlist (bookmark toggle on each card); category filter pills (Lesson Plans, SEL, STEM, etc.) above the marketplace grid; backed by marketplace_wishlists table.
-   **PD RSS Feed Integration**: Professional Development Courses tab now shows curated articles from approved RSS content (prefers `professional_development`/`educator_tools` tagged items, falls back to all approved content). Two-section layout: LYS Courses above, Curated Articles below.
-   **SIS Coming Soon Labels**: SIS Integration page has an info banner and disabled/badged SelectItems for non-Clever providers (PowerSchool, Canvas LMS, Infinite Campus, Skyward, OneRoster). Only Clever is live.
-   **Demo Walkthrough Updated**: DemoVideoModal now has 22 slides including a new LYS Marketplace slide with wishlist demo, updated PD slide with RSS article section, and updated SIS slide reflecting Clever-only live status.
-   **Collaboration Video Conferencing**: Collaboration sessions now include a "Meet" tab in the sidebar with: embedded Jitsi Meet (in-app video, no account needed), "Open Zoom" and "Open WhatsApp" external launch buttons (open new tab), and a host-only configuration panel to paste Zoom URLs, WhatsApp group links, and YouTube recording URLs. Schema: `zoomUrl`, `whatsappLink`, `youtubeUrl` columns on `collaboration_sessions`. Route: `PATCH /api/collaboration/sessions/:id/meeting`.
-   **Quarterly Scholarship Auto-Scraper**: Automated scraper that pulls scholarship listings from the top 500 US institutions (sourced from US Dept of Ed College Scorecard) on a 90-day cadence. Polite fetching (robots.txt, 1 req/sec/domain serial queue with per-redirect-hop re-check, identifying User-Agent), `gpt-4o-mini` JSON extraction, sha256 hash-compare to skip unchanged pages (~$1/quarter target). All scraped scholarships land as **inactive** with `community` trust — system_admin approval required. Schema: `institutions`, `scholarship_scrape_runs` tables + `sourceInstitutionId`, `sourceUrl`, `lastSeenAt`, `scrapeRunId` provenance columns on `know_resources`. Code: `server/scholarshipScraper/{fetcher,discoverUrls,scraper,scheduler,seedInstitutions}.ts`. UI: "Auto-Scrape" tab in `KnowResourcesAdmin.tsx`. Routes: `/api/admin/scholarship-scrape/*` (system_admin only). Optional `DATA_GOV_API_KEY` env var refreshes the full top-500 list from College Scorecard; otherwise an 88-school starter JSON ships in-box. First scrape runs ~30s after boot if no run history exists.

### Global Architecture
-   **Educational Hierarchy**: Structured organization from country to school level, supporting various governance systems.
-   **Organization Inheritance**: Resources and settings cascade through the hierarchy.
-   **Scope & Sequence Visibility**: Supports personal, campus, district, and system-level scopes.
-   **SIS Integration Inheritance**: Campus/District SIS connections are automatically available to educators.
-   **LYS Milestone Engine**: Tracks Being/Knowing/Doing progress.
-   **Workforce Trends Integration**: Automated sync with BLS Occupational Outlook Handbook data.
-   **Alignment Matrix**: Connects regional gamification weights to workforce data.

### Data Architecture (Journey Tracking)
-   **studentJourneyEntries**: General event log.
-   **studentJourneyProgress**: Aggregated progress scores.
-   **studentJourneyMilestones**: Specific milestone achievements.
-   **studentJourneyActivities**: Detailed activity log.
-   **marketplaceItems**: LYS Marketplace products (eBooks, mini courses, guides, templates, workshops, resource packs). Priced in cents (0 = free). Audience enum: students/educators/parents/all. Published by system_admin only.
-   **marketplacePurchases**: Records of users claiming/purchasing marketplace items.
-   **savedScholarships**: Scholarship bookmarks saved by users, linked to ScholarshipPlanner.

## External Dependencies

### AI Services
-   **OpenAI API**: For AI lesson plan generation and LLM-powered standards extraction.

### Database
-   **PostgreSQL**: Primary data store.

### Payment Integration
-   **Stripe**: Credit/debit card processing.
-   **PayPal**: PayPal checkout.
-   **Purchase Order**: Institutional billing.
-   **Bank Transfer / ACH**: Direct bank payment.

### CRM Integration
-   **HubSpot CRM**: For contact, company, and deal management.

### CMS Integration
-   **WordPress**: For iframe embeds, shortcodes, oEmbed, and REST API integration to host LYS components.

### SIS (Student Information System) Integration
-   **Supported Providers**: Clever, PowerSchool, Canvas LMS, Infinite Campus, Skyward, OneRoster.
-   **Features**: OAuth authentication, student/course import and sync.

### Monetization
-   **Ad Monetization**: EdTech eCPM-based advertising for free-tier users.
-   **Country Affordability Index (CAI)**: Global pricing model based on local purchasing power.