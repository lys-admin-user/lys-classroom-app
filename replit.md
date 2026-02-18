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
-   **Security**: Input validation, ownership checks, and server-side regeneration of critical IDs.
-   **Monorepo Structure**: `/client`, `/server`, and `/shared` directories.
-   **AI Integration**: OpenAI API for AI-driven features, with mock data fallback.
-   **Real-Time Collaboration**: WebSocket server for live cursor positions, presence, and chat.
-   **Multi-Tenancy**: Supports organizations (School, District, University) with hierarchical role-based access control (system_admin > site_admin > district_admin > campus_admin > educator > homeschool_parent > student), `requireRole()` middleware with DB lookups, and an invitation system.
-   **Automated Standards Ingestion**: Three-tier system for importing educational standards including CSP API, planned CASE Protocol, and LLM extraction.

### Feature Specifications
-   **Be-Know-Do Framework**: Integrates self-discovery assessments (BE), career exploration (KNOW), and goal setting (DO).
-   **Lesson Plan Rubric System**: Comprehensive rubric with 6 categories and 4 quality levels, used for AI lesson generation and quality scoring.
-   **AI Lesson Plan Caching**: Database-backed cache for AI-generated lesson plans to reduce duplicate API calls.
-   **AI Lesson-Assignment Alignment**: AI Assignment Generator aligns with lesson rubric standards, assessing objectives and incorporating BKD principles.
-   **Scope & Sequence Builder**: Tool for curriculum planning, including pacing tracking and automatic standards extraction.
-   **Self-Discovery & Career Exploration**: Modules for self-assessment and detailed career information.
-   **Educator Influence & Affiliate System**: Rewards system for educators.
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
-   **Educator Type Classification**: Allows educators to self-select their type for platform usage analytics.
-   **KNOW Resources Management**: Admin-managed curated educational content for the KNOW pillar.
-   **Student Matriculation & Achievement Tracking**: System-level tracking of student progress and achievements.
-   **Onboarding Tour**: Role-aware guided tour for new users.
-   **Scholarship & Mentorship System**: Comprehensive scholarship planning, essay builder, strengths inventory, campus activities tracker, and mentor connection features.

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
-   **Future**: Stripe integration (via Replit's Stripe connector).

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