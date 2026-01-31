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

### Global Architecture
-   **Educational Hierarchy**: Structured organization of students and classes (Country > State/Jurisdiction > District > School/Campus > Class > Student) with validation.
-   **Global Authority Tree**: Polymorphic hierarchy supporting various educational governance systems (bottom_heavy, top_down_unitary, federal_hybrid).
-   **LYS Milestone Engine**: Tracks Being/Knowing/Doing progress with gatekeeper logic, regional multipliers, and alternative pathways.
-   **Workforce Trends Integration**: Weekly automated sync with BLS Occupational Outlook Handbook data for career alignment, salary, and job outlook.
-   **Alignment Matrix**: Connects regional gamification weights to workforce data.

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

### Country Affordability Index (CAI) Global Pricing
-   **Purpose**: Equitable, cross-border pricing based on local purchasing power using GDP per Capita, Monthly Income, Healthcare Spend, and Cost-of-Living Index.
-   **Formula**: `Adjusted Price = Global Reference Price × (CAI Score + LCSI Adjustment)`.
-   **Coverage**: 120+ countries.

### HubSpot CRM Integration
-   **Connection**: Uses Replit's HubSpot connector.
-   **Capabilities**: Create/update contacts, companies, deals, and sync users.

### WordPress Integration
-   **Methods**: Iframe Embeds, Shortcodes, oEmbed, REST API.
-   **Features**: Sync lesson plans to WordPress as draft posts, embed LYS widgets.

### SIS (Student Information System) Integration
-   **Supported Providers**: Clever, PowerSchool, Canvas LMS, Infinite Campus, Skyward, OneRoster.
-   **Features**: OAuth authentication, manual API token configuration, student/course import and sync, sync history tracking, configurable settings, role-based access.