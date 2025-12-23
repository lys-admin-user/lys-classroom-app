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
- **Database**: PostgreSQL with full user data persistence
- **Schema Location**: `shared/schema.ts` contains all database tables and Zod validation schemas
- **Storage**: `DatabaseStorage` implementation using PostgreSQL for:
  - Lessons and lesson sharing
  - Goals with milestones
  - Scope & Sequence with units
  - Self-discovery assessment results
  - Saved careers
  - Scope change requests
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
- **Import Existing**: Upload PDF/DOCX/TXT documents with intelligent unit extraction using pdf-parse and mammoth
- **Skip Option**: Teachers can skip to lesson planning if they don't need scope planning
- **Unit Management**: Add/edit units with standards alignment, transfer goals, and timeline
- **Campus Admin Tab**: For campus/enterprise tier users to view published scopes and approve/reject teacher change requests
- **Database Tables**: `scope_sequences`, `sequence_units`, `campus_scopes`, `scope_change_requests`
- **Pages**: `/scope-sequence` (list/manage scopes), `/scope/:id` (edit individual scope with units)

### Self-Discovery Module
BE pillar assessment tool:
- **9-Question Assessment**: Evaluates Be-Know-Do competencies with personalized scoring
- **Results Persistence**: Saves assessment results to database for authenticated users
- **Career Connection**: Links to career exploration based on results
- **Page**: `/self-discovery`

### Career Exploration
KNOW pillar features:
- **Career Database**: Detailed career information with pathways, salaries, and requirements
- **Save Careers**: Authenticated users can save/unsave careers for future reference
- **Pathway Types**: College, Military, Trade School, Certification options
- **Page**: `/careers`

### Educator Influence & Affiliate System
Social sharing and affiliate rewards for educators:
- **Affiliate Profile**: Each educator gets a unique referral code (auto-generated on first share)
- **ShareDialog Component**: Social media sharing with Twitter/X, Facebook, LinkedIn, Email buttons
- **Referral Tracking**: View events tracked when shared lessons are accessed with referral codes
- **Points System**:
  - View = 1 point (when someone views a shared lesson)
  - Share = 5 points (for each social media share)
  - Link Copy = 2 points
  - Lesson Save = 25 points (when someone saves a shared lesson)
  - Signup = 50 points (when someone registers through a referral link)
- **Dashboard**: `/educator-influence` shows total points, views, shares, referrals, and recent activity
- **Database Tables**: `educator_affiliates`, `referral_events`, `affiliate_rewards`
- **API Endpoints**:
  - GET `/api/affiliate/me` - Get/create affiliate profile
  - GET `/api/affiliate/dashboard` - Dashboard with stats and recent events
  - POST `/api/lessons/:id/share-link` - Generate share URL with referral code
  - POST `/api/referral/track` - Public endpoint for tracking referral events

### Real-Time Collaboration System
Enables educators to co-create lesson plans and share resources:
- **WebSocket Server**: Real-time communication via `/ws/collaboration` endpoint
  - Auto-reconnect with exponential backoff (max 5 attempts)
  - Participant presence tracking with color-coded avatars
  - Live cursor positions and edit streaming
- **Collaboration Sessions**:
  - 8-character invite codes for session joining
  - Host/editor role differentiation
  - Configurable max participants (default 10)
  - Settings for editing, chat, and comment permissions
- **Live Chat**: Real-time messaging within collaboration rooms
- **Edit History**: Tracks all changes with user attribution and timestamps
- **Database Tables**: `collaboration_sessions`, `session_participants`, `collaboration_messages`, `session_edit_history`
- **Pages**: `/collaboration` (hub for sessions), `/collaboration/:id` (active session room)
- **API Endpoints**:
  - POST `/api/collaboration/sessions` - Create new session
  - GET `/api/collaboration/sessions` - List hosted sessions
  - GET `/api/collaboration/participating` - List joined sessions
  - POST `/api/collaboration/join` - Join via invite code
  - POST `/api/collaboration/sessions/:id/end` - End session (host only)
  - POST `/api/collaboration/sessions/:id/leave` - Leave session

### Shared Resource Library
Community-driven resource sharing for educators:
- **Resource Types**: Lesson plans, worksheets, presentations, assessments, activities, templates
- **Visibility Control**: Public (discoverable) or private
- **Engagement Tracking**: Like count and download count
- **Categorization**: By category, subject, grade level, and custom tags
- **Database Tables**: `shared_resources`, `resource_likes`
- **Page**: `/resource-library`
- **API Endpoints**:
  - GET `/api/resources/shared` - Browse public resources with filters
  - GET `/api/resources/mine` - List user's own resources
  - POST `/api/resources` - Create new resource
  - PATCH `/api/resources/:id` - Update resource
  - DELETE `/api/resources/:id` - Delete resource
  - POST `/api/resources/:id/like` - Toggle like
  - POST `/api/resources/:id/download` - Track download

### Educational Standards System
The lesson generator requires legally-compliant educational standards:
- **Static Standards**: `shared/standards.ts` contains fallback hierarchical standards data
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

### Automated Standards Ingestion System
Three-tier approach for importing educational standards from external sources:
- **Tier 1 - CSP API**: Common Standards Project API integration (`server/services/cspService.ts`)
  - Fetches jurisdictions and standard sets from `api.commonstandardsproject.com`
  - Auto-generates UIDs using MD5 hashing of composite keys
  - Version history tracking for standards updates
- **Tier 2 - CASE Protocol**: (Future) Competency and Academic Standards Exchange
- **Tier 3 - LLM Extraction**: AI-powered extraction from raw text (`server/services/llmExtractionService.ts`)
  - Uses OpenAI to parse standards from PDF/document text
  - Bullet-point validation ensures data integrity (compares extracted count vs raw bullets)
  - Confidence scoring for extraction quality
  - All extracted standards go to staging queue for human review
- **Staging Workflow**: Approval system for new standards
  - New standards from LLM extraction enter staging queue as "pending"
  - Admin can approve (moves to live standards) or reject (with reason)
  - Bulk approval for efficient batch processing
  - Soft delete strategy: deprecated standards marked inactive to preserve user data
- **Change Detection**: Source URL checksum monitoring
  - MD5 checksums stored for source URLs
  - Detects when source documents have been updated
  - Triggers re-scraping when changes detected
- **Database Tables**: `standards_jurisdictions`, `standard_sets`, `educational_standards`, `standards_sync_log`, `standards_staging`, `source_checksums`
- **Admin Page**: `/admin/standards` with tabs for Browse Standards, Staging Queue, LLM Extract, and Sync Logs
- **API Endpoints**:
  - GET `/api/admin/standards/status` - Sync statistics and status
  - GET `/api/admin/standards/jurisdictions` - List jurisdictions from database
  - POST `/api/admin/standards/sync/jurisdictions` - Trigger jurisdiction sync from CSP
  - POST `/api/admin/standards/sync/standard-set` - Sync a specific standard set
  - GET `/api/admin/standards/staging` - Get staging queue standards
  - POST `/api/admin/standards/staging/:id/approve` - Approve a staging standard
  - POST `/api/admin/standards/staging/:id/reject` - Reject a staging standard
  - POST `/api/admin/standards/staging/bulk-approve` - Bulk approve staging standards
  - POST `/api/admin/standards/extract` - Extract standards from text using LLM
  - POST `/api/admin/standards/check-source` - Check source URL for changes
  - GET `/api/standards/countries` - Public API for lesson planning
  - GET `/api/standards/states/:country` - Public API for lesson planning
  - GET `/api/standards/subjects/:country/:stateAbbr` - Public API for lesson planning

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