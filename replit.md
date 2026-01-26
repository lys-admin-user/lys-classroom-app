# LYS Educational Platform

## Overview
LYS (Laddering Your Success) is an AI-powered educational platform designed to empower educators and students through the "Be-Know-Do" methodology. It offers AI lesson planning, self-discovery assessments, career exploration, goal tracking, and educational resources. The platform's vision is to foster identity-based learning, bridging the gap between academic preparation and real-world success, thereby enhancing market potential for comprehensive educational tools.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
-   **Design System**: Tailwind CSS with custom design tokens (Primary Red #EE4E23, Warm Yellow #F8D842, Dark Teal #016371).
-   **UI Components**: shadcn/ui library built on Radix UI primitives.
-   **Typography**: Custom font stack featuring Permanent Marker (headers), Oswald (subheaders), and Roboto (body text).

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state management, and Vite as the build tool.
-   **Backend**: Express.js with TypeScript, RESTful JSON API (`/api` prefix), and Zod for validation.
-   **Data Layer**: PostgreSQL database managed by Drizzle ORM. All schemas and Zod validation are in `shared/schema.ts`, with shared types accessible via `@shared/*` alias.
-   **Authentication**: Replit Auth supporting Google, GitHub, and email login, with `express-session` and PostgreSQL for session storage.
-   **Security**: Robust input validation using Zod, ownership checks for data modification, and server-side regeneration of critical IDs (e.g., milestone IDs) to prevent injection attacks.
-   **Monorepo Structure**: `/client` for frontend, `/server` for backend, and `/shared` for common code.
-   **AI Integration**: Utilizes OpenAI API for AI-driven features like lesson plan generation, with a fallback to mock data if the API key is unavailable.
-   **Real-Time Collaboration**: WebSocket server for features like live cursor positions, presence tracking, and chat in collaboration sessions.
-   **Multi-Tenancy**: Supports organizations (School, District, University) with role-based access control (Owner, Admin, Member) and an invitation system.
-   **Automated Standards Ingestion**: A three-tier system for importing educational standards:
    1.  **CSP API**: Integration with `api.commonstandardsproject.com` for official standards.
    2.  **(Future) CASE Protocol**: Planned integration for competency exchange.
    3.  **LLM Extraction**: AI (OpenAI) powered extraction from documents, with a staging queue for human review and approval. Change detection via source URL checksums.

### Feature Specifications
-   **Be-Know-Do Framework**: Integrates self-discovery assessments (BE), career exploration (KNOW), and goal setting with milestones (DO).
-   **Scope & Sequence Builder**: A tool for educators to plan curricula, allowing creation from scratch or import from documents with AI-powered unit extraction. Includes unit management and campus admin oversight.
-   **Self-Discovery Module**: A 9-question assessment that evaluates Be-Know-Do competencies and links to career exploration.
-   **Career Exploration**: Detailed career information, including pathways and requirements, with the ability for users to save careers.
-   **Educator Influence & Affiliate System**: Unique referral codes, social sharing, and a point-based reward system for educators based on views, shares, and signups.
-   **Real-Time Collaboration**: Enables co-creation of lesson plans with invite codes, role differentiation, live chat, and edit history.
-   **Shared Resource Library**: A community platform for educators to share resources (lesson plans, worksheets) with visibility controls, categorization, and engagement tracking.
-   **Educational Standards System**: Lesson generator incorporates legally-compliant, hierarchical educational standards (e.g., US TEKS, CCSS) and a professional lesson plan format.
-   **Student Digital Portfolio**: Students can create and manage a professional portfolio to showcase completed assignments, projects, and achievements. Features include:
    -   Portfolio profile with bio, skills, education, and contact info
    -   Add/remove/reorder portfolio items (assignments, projects, certificates, achievements, reflections)
    -   Multiple theme options (professional, creative, minimal, academic)
    -   Privacy controls (private, unlisted, public)
    -   Shareable links for colleges, employers, and scholarship committees
    -   Social sharing integration (LinkedIn, Handshake recommendations)
    -   PDF download for applications
    -   View count analytics
-   **One-Click Template Library**: Educators can save lesson plans as reusable templates and browse community-shared templates for quick lesson creation.

### LYS V3.0 Global Architecture (December 2024)
-   **Global Authority Tree**: Polymorphic hierarchy supporting worldwide educational governance systems with five levels (supranational, national, regional/state, local/district, school) and three model types:
    -   `bottom_heavy`: US-style with strong local control (TEA, school districts)
    -   `top_down_unitary`: African/Asian centralized national curriculum
    -   `federal_hybrid`: EU/Canadian mixed federal-state jurisdiction
-   **LYS Milestone Engine**: Separate from goals table, tracking Being/Knowing/Doing progress with:
    -   Three categories (being, knowing, doing) mapping to Be-Know-Do framework
    -   Gatekeeper logic for blocking milestones (hard deadlines, prerequisites)
    -   Regional multipliers for gamification weighting
    -   Alternative pathway support for flexible progression
-   **Workforce Trends Integration**: Weekly automated sync with BLS Occupational Outlook Handbook data for career alignment
    -   Automatic weekly sync scheduler runs in background
    -   Fetches data from BLS Employment Projections and OEWS wage statistics
    -   Updates career salary, job outlook, and growth projections
    -   Admin dashboard at System Admin > Data Sync for monitoring and manual triggers
    -   Sync history tracking with status, processed counts, and error logs
-   **Alignment Matrix**: Regional gamification weights connecting authorities to workforce data

## External Dependencies

### AI Services
-   **OpenAI API**: For AI lesson plan generation and LLM-powered standards extraction.

### Database
-   **PostgreSQL**: Primary data store for all application data, user information, and session management.

### Key NPM Packages
-   **UI**: `shadcn/ui`, `@radix-ui/react-primitives`.
-   **Forms**: `react-hook-form`, `@hookform/resolvers` (for Zod).
-   **Date Handling**: `date-fns`.
-   **Session Management**: `express-session`, `connect-pg-simple`.
-   **Icons**: `lucide-react`, `react-icons`.

### Development Tools
-   **TypeScript**: Used across the stack with strict mode.
-   **Vite**: Frontend build tool.
-   **esbuild**: Server bundling.

### Payment Integration (Pending)
-   **Demo Mode**: Currently the platform operates in demo mode for tier upgrades. Users can simulate upgrading to Pro or Campus tiers via `/api/subscription/demo-upgrade`.
-   **Future**: When ready for production payments, connect Stripe via Replit's Stripe connector integration. The user fields `stripeCustomerId`, `stripeSubscriptionId`, and `subscriptionStatus` are ready in the database schema.

### Country Affordability Index (CAI) Global Pricing
-   **Purpose**: Enables equitable, cross-border pricing based on local purchasing power rather than simple currency conversion.
-   **CAI Score**: Each country receives a score from 0.05-1.0 based on:
    -   GDP per Capita (PPP) - 35%
    -   Median Monthly Income - 25%
    -   Out-of-Pocket Healthcare Spend - 20%
    -   Urban Cost-of-Living Index - 20%
-   **LCSI (Local Cost-of-Services Index)**: Additional adjustment factor (0-0.15) for regional variations.
-   **Pricing Formula**: `Adjusted Price = Global Reference Price × (CAI Score + LCSI Adjustment)`
-   **Income Level Categories**:
    -   High Income: CAI 0.70-1.0 (USA, Germany, Australia, etc.)
    -   Upper-Middle: CAI 0.40-0.69 (Brazil, Mexico, China, etc.)
    -   Lower-Middle: CAI 0.20-0.39 (India, Nigeria, Philippines, etc.)
    -   Low Income: CAI 0.05-0.19 (Ethiopia, DR Congo, etc.)
-   **Coverage**: 120+ countries across all regions
-   **API Endpoints**:
    -   `GET /api/cai/countries` - All countries with CAI data
    -   `GET /api/cai/countries/:code` - Single country by ISO code
    -   `GET /api/cai/pricing/:countryCode` - Adjusted pricing for country
-   **UI**: Pricing page includes country selector with transparent pricing breakdown

## Onboarding Flow
-   New users are automatically redirected to `/onboarding` if they haven't completed the onboarding wizard.
-   Onboarding collects: role (student/educator/campus_admin), primary goals, interests, language, and location preferences.
-   Exempt paths from onboarding redirect: `/onboarding`, `/pricing`, `/shared/*`