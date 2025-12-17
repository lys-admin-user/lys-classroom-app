# LYS Educational Platform

## Overview

LYS (Laddering Your Success) is an AI-powered educational platform designed to help educators and students achieve success through the "Be-Know-Do" methodology. The platform provides AI lesson planning tools, self-discovery assessments, career exploration features, goal tracking, and educational resources. The core philosophy focuses on identity-based learning that bridges the gap between high school and real-world success.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom design tokens matching LYS brand colors (Primary Red #EE4E23, Warm Yellow #F8D842, Dark Teal #016371)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Typography**: Custom font stack using Permanent Marker (headers), Oswald (subheaders), and Roboto (body text)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API with `/api` prefix
- **Validation**: Zod schemas for request/response validation
- **AI Integration**: OpenAI API for lesson plan generation with graceful fallback to mock data when API key unavailable

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with lessons and goals tables tied to authenticated users
- **Schema Location**: `shared/schema.ts` contains all database tables and Zod validation schemas
- **Storage**: `DatabaseStorage` implementation using PostgreSQL for lessons and goals
- **Shared Types**: Schema types are shared between client and server via `@shared/*` path alias

### Authentication & Security
- **Auth Provider**: Replit Auth with Google, GitHub, and email login options
- **Session Management**: express-session with PostgreSQL session storage
- **Ownership Checks**: 
  - Lessons require authentication to save; delete operations verify userId ownership
  - Goals support anonymous creation; modifications check ownership when userId is set
  - Milestone IDs are always regenerated server-side to prevent ID injection attacks
- **Input Validation**: All POST/PATCH endpoints validate request bodies with Zod schemas before processing

### Key Design Patterns
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/*` for client source, `@shared/*` for shared code, `@assets/*` for attached assets
- **Component Organization**: UI primitives in `/components/ui`, feature components in `/components`
- **API Pattern**: Mutations use `apiRequest` helper, queries use React Query with automatic key-based fetching

### Be-Know-Do Framework Integration
The application is structured around the LYS methodology:
- **BE (Identity & Purpose)**: Self-discovery assessments, personality tests, values exploration
- **KNOW (Strategy & Resources)**: Career exploration, educational resources, financial literacy tools
- **DO (Action & Impact)**: Goal setting, action plans, milestone tracking

### Scope & Sequence Builder
Yearly curriculum planning tool for educators:
- **Build From Scratch**: Multi-step wizard with Country → State → Subject → Grade selection
- **Import Existing**: Upload PDF/DOCX/TXT documents (stub implementation for parsing)
- **Skip Option**: Teachers can skip to lesson planning if they don't need scope planning
- **Unit Management**: Add/edit units with standards alignment, transfer goals, and timeline
- **Campus Admin Tab**: Placeholder for managing campus-wide default scopes and change request approvals
- **Database Tables**: `scope_sequences`, `sequence_units`, `campus_scopes`, `scope_change_requests`
- **Pages**: `/scope-sequence` (list/manage scopes), `/scope/:id` (edit individual scope with units)

### Educational Standards System
The lesson generator requires legally-compliant educational standards:
- **Standards Database**: `shared/standards.ts` contains hierarchical standards data
- **Hierarchy**: Country → State/Region → Subject → Standard Codes
- **Supported Standards**: 
  - US: Texas TEKS, California CCSS, Florida B.E.S.T., New York NYSLS
  - Common Core State Standards (Multi-State)
- **Lesson Plan Format**: Professional educator format with:
  - Course, Unit, TEKS/Standards codes
  - LYS Methodology section (BE/KNOW/DO with life applications)
  - Essential Questions
  - Instructional phases (Anticipatory Set, Modeling, Guided Practice, Independent Practice)
  - Lesson Close with life application connections (Educational, Social, Vocational, Financial, Spiritual, Cultural, Health)

## External Dependencies

### AI Services
- **OpenAI API**: Used for generating personalized lesson plans aligned with Be-Know-Do methodology. Requires `OPENAI_API_KEY` environment variable. Falls back to mock data when unavailable.

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable). Drizzle Kit handles migrations stored in `/migrations`.

### Key NPM Packages
- **UI**: Full shadcn/ui component suite with Radix UI primitives
- **Forms**: react-hook-form with @hookform/resolvers for Zod integration
- **Date Handling**: date-fns for date formatting and manipulation
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **Icons**: Lucide React for iconography, react-icons for social media icons

### Development Tools
- **TypeScript**: Strict mode enabled with bundler module resolution
- **Vite Plugins**: Runtime error overlay, Replit-specific development plugins (cartographer, dev-banner)
- **Build Process**: Custom build script using esbuild for server bundling