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