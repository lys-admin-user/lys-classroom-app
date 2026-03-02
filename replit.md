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
-   **Parent Portal**: Free tier portal for progress tracking and career readiness insights.
-   **Admin Analytics**: Dashboards for system performance, goal completion, user engagement, and granular user metrics.
-   **Scholarship & Mentorship System**: Tools for scholarship planning, essay building, and mentor connections.
-   **Help Desk**: Searchable knowledge base and troubleshooting guides for users and administrators.
-   **Developer Documentation**: Internal documentation for site_admin and system_admin roles covering architecture, APIs, security, and integration details.
-   **Org Admin Self-Service**: Tools for campus and district admins to manage their organizations and members.
-   **RSS Content Ingestion System**: System admin Content Hub for managing and ingesting RSS feeds, categorizing content for various platform features, with an approval workflow.

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