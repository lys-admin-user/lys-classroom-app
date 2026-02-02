# LYS Educational Platform

## Overview
LYS (Laddering Your Success) is an AI-powered educational platform designed to empower educators and students using the "Be-Know-Do" methodology. It offers AI lesson planning, self-discovery assessments, career exploration, goal tracking, and educational resources. The platform aims to foster identity-based learning, bridging academic preparation with real-world success, and enhancing the market potential for comprehensive educational tools.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
-   **Design System**: Tailwind CSS with custom design tokens (Primary Red, Warm Yellow, Dark Teal).
-   **UI Components**: shadcn/ui library built on Radix UI primitives.
-   **Typography**: Custom font stack featuring Permanent Marker (headers), Oswald (subheaders), and Roboto (body text).

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state management, and Vite.
-   **Backend**: Express.js with TypeScript, RESTful JSON API (`/api` prefix), and Zod for validation.
-   **Data Layer**: PostgreSQL database managed by Drizzle ORM, with shared schemas and types.
-   **Authentication**: Replit Auth (Google, GitHub, email) with `express-session` and PostgreSQL for session storage.
-   **Security**: Input validation (Zod), ownership checks, and server-side regeneration of critical IDs.
-   **Monorepo Structure**: `/client` (frontend), `/server` (backend), and `/shared` (common code).
-   **AI Integration**: OpenAI API for AI-driven features, with mock data fallback.
-   **Real-Time Collaboration**: WebSocket server for live cursor positions, presence, and chat.
-   **Multi-Tenancy**: Supports organizations (School, District, University) with role-based access control and an invitation system.
-   **Automated Standards Ingestion**: Three-tier system for importing educational standards: CSP API, planned CASE Protocol integration, and LLM extraction with human review.

### Feature Specifications
-   **Be-Know-Do Framework**: Integrates self-discovery assessments (BE), career exploration (KNOW), and goal setting with milestones (DO).
-   **Lesson Plan Rubric System**: Comprehensive rubric with 6 categories (Objectives, Essential Questions, LYS Methodology, Resources, Instructional Input, Lesson Close) and 4 quality levels (Distinguished, Accomplished, Acceptable, Needs Improvement). Located in `shared/lessonRubric.ts`. Rubric reference dialog and quick tips available in Lesson Authoring page. AI lesson generator uses rubric standards. Quality scores calculated server-side during lesson approval.
-   **AI Lesson-Assignment Alignment**: AI Assignment Generator (`server/assignmentGenerator.ts`) is aligned with lesson rubric standards. Assignments directly assess lesson objectives, include BE-KNOW-DO questions with clear balance, connect to the 7 life dimensions for reflections, and use higher-order thinking with educational feedback for distractors. Each question includes standard mappings for objective alignment tracking.
-   **Scope & Sequence Builder**: Tool for educators to plan curricula, create from scratch or import with AI unit extraction.
-   **Self-Discovery Module**: 9-question assessment linking to career exploration.
-   **Career Exploration**: Detailed career information with saving capabilities.
-   **Educator Influence & Affiliate System**: Referral codes, social sharing, and point-based rewards for educators.
-   **Real-Time Collaboration**: Co-creation of lesson plans with invite codes, role differentiation, chat, and edit history.
-   **Shared Resource Library**: Community platform for educators to share resources.
-   **Educational Standards System**: Lesson generator incorporates legally-compliant, hierarchical standards.
-   **Student Digital Portfolio**: Students can create and manage portfolios with customizable themes, privacy controls, shareable links, social sharing, PDF download, and analytics.
-   **One-Click Template Library**: Educators can save and browse community-shared lesson plan templates.
-   **Student Transfer System**: Campus-level feature for transferring students between educators or organizations with triple confirmation workflow (Campus → District → System Admin approval chain). Available at `/transfer-approvals`.
-   **Gradebook System**: Educators and campus admins can manage student grades with categories, automatic letter grade calculation, CSV export, and SIS integration for sharing grades. Includes career alignment tab showing how grades relate to career readiness. Available at `/gradebook`.
-   **Career Alignment**: Classes can be mapped to career fields (STEM, Healthcare, Business, etc.). Gradebook shows career readiness scores based on academic performance. Parent Portal displays career readiness insights alongside saved careers.
-   **Parent Portal**: Free tier with ad support for parents. Parents can search for students by school and student ID to request connections. Educators approve/reject connection requests. Features student progress tracking, Be-Know-Do journey visualization, and career readiness insights. Available at `/parent-portal`.
-   **System Admin Performance Analytics**: Dashboard for tracking educator, campus, and organization performance based on goal completion, standards coverage, and student Be-Know-Do progress. Available at `/site-admin` under the Performance tab.
-   **KNOW Resources Management**: Admin-managed curated educational content (books, ebooks, YouTube channels, podcasts, WhatsApp channels) for the KNOW pillar. Site/system/campus admins can create, edit, and manage resources with categories, target audiences (students, educators, parents), career field alignment, and featured status. Public API for students/educators to browse active resources. Available at `/admin/know-resources`.
-   **Student Matriculation & Achievement Tracking**: System-level tracking of student progress including enrollment, grade progression, transfers, graduation, and withdrawals. Includes system-wide achievement definitions (academic, skill, behavior, extracurricular, career, BKD, custom) with point values and verification workflow. Admins can view matriculation statistics, achievement analytics, and manage system achievements. Available at `/admin/matriculation`.

### Global Architecture
-   **Educational Hierarchy**: Structured organization of students and classes (Country > State/Jurisdiction > District > School/Campus > Class > Student) with validation.
-   **Organization Inheritance**: Resources (Scope & Sequence, SIS Connections) cascade through the hierarchy - District settings apply to all campuses; campus settings apply to all educators.
-   **Scope & Sequence Visibility**: Supports personal, campus, district, and system-level scopes with proper inheritance.
-   **SIS Integration Inheritance**: Campus/District SIS connections are automatically available to educators within that organization hierarchy.
-   **Global Authority Tree**: Polymorphic hierarchy supporting various educational governance systems (bottom_heavy, top_down_unitary, federal_hybrid).
-   **LYS Milestone Engine**: Tracks Being/Knowing/Doing progress with gatekeeper logic, regional multipliers, and alternative pathways.
-   **Workforce Trends Integration**: Weekly automated sync with BLS Occupational Outlook Handbook data for career alignment, salary, and job outlook.
-   **Alignment Matrix**: Connects regional gamification weights to workforce data.

### Data Architecture (Journey Tracking)
-   **studentJourneyEntries**: General event log for any user type (student, educator, admin) - BKD pillar events.
-   **studentJourneyProgress**: Aggregated progress scores per student (BE/KNOW/DO scores).
-   **studentJourneyMilestones**: Specific milestone achievements tracked per student.
-   **studentJourneyActivities**: Detailed activity log tied to journey progress for student analytics.

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
-   **Demo Mode**: Simulation of tier upgrades.
-   **Future**: Stripe integration via Replit's Stripe connector.

### Ad Monetization (Free Tier)
-   **Revenue Model**: EdTech eCPM range of $8-$15 (average $12), with 40 page views/month and 2 ads/screen = ~$0.96/user/month.
-   **Ad Slot Configuration**: IAB standard sizes (leaderboard, medium rectangle, skyscraper, in-feed, native) in `client/src/lib/adConfig.ts`.
-   **Ad Components**: `AdSlot`, `AdSlotSidebar`, `AdSlotInFeed`, `AdSlotHeader`, `AdSlotFooter` in `client/src/components/ads/`.
-   **Tier-Aware Rendering**: Ads only display for free tier users; hidden for Pro/paid tiers and Focus Mode subscribers.
-   **Grade-Level Restriction**: Students below 8th grade (K-7) never see ads for COPPA/child safety compliance.
-   **Sponsor Categories**: Education, Career, EdTech, Tutoring, Scholarships, Test Prep with eCPM multipliers.
-   **Integrated Pages**: Parent Portal with header, sidebar, and in-feed ad slots.

### Country Affordability Index (CAI) Global Pricing
-   **Purpose**: Equitable, cross-border pricing based on local purchasing power using GDP per Capita, Monthly Income, Healthcare Spend, and Cost-of-Living Index.
-   **Formula**: `Adjusted Price = Global Reference Price × (CAI Score + LCSI Adjustment)`.
-   **Coverage**: 120+ countries.

### HubSpot CRM Integration
-   **Connection**: Uses Replit's HubSpot connector.
-   **Capabilities**: Create/update contacts, companies, deals, and sync users.

### WordPress Integration (Full Site Hosting)
-   **Methods**: Iframe Embeds, Shortcodes, oEmbed, REST API.
-   **Full Site Embed**: Host the complete LYS platform in WordPress using `[lys_platform]` shortcode.
-   **Individual Widgets**: 22+ embeddable features (lesson generator, gradebook, portfolios, parent portal, etc.).
-   **WordPress Plugin**: Downloadable from `/api/integrations/wordpress/plugin` - includes all shortcodes, admin settings, theme sync, and auto-resize.
-   **Embed Routes**: All pages available at `/embed/{feature}` (e.g., `/embed/gradebook`, `/embed/parent-portal`).
-   **Theme Sync**: WordPress dark/light mode communicates with embedded LYS via postMessage.
-   **Features**: Sync lesson plans to WordPress as draft posts, embed LYS widgets.

### SIS (Student Information System) Integration
-   **Supported Providers**: Clever, PowerSchool, Canvas LMS, Infinite Campus, Skyward, OneRoster.
-   **Features**: OAuth authentication, manual API token configuration, student/course import and sync, sync history tracking, configurable settings, role-based access.