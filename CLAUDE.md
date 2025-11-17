# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **whitelabel CRM and sales dashboard** built with Next.js 15, React 18, TypeScript, Tailwind CSS, and Supabase. The application provides multi-tenant CRM functionality with commission tracking, pipeline management, team competitions, and advertising integrations (Meta/Facebook Ads). Each whitelabel instance operates in complete isolation with its own branding, users, and data.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Database & Schema Management

### Supabase Setup
The project uses Supabase for authentication, database, and storage. All database schema changes must be made via SQL migration files in the `scripts/` directory.

### Running Migrations
Migrations are numbered sequentially (e.g., `01-create-tables.sql`, `02-enable-rls.sql`). Execute them in order through the Supabase SQL editor or via the Supabase CLI.

**IMPORTANT**: When creating new migrations:
- Use `SECURITY DEFINER` for functions that need to bypass RLS (e.g., auto-creation triggers)
  - Example: `create_default_pipeline()` and `auto_create_default_pipeline()` in `39-fix-pipeline-security-definer.sql`
  - Without `SECURITY DEFINER`, triggers fail with RLS permission errors
- Always set `search_path = public` in SECURITY DEFINER functions to prevent privilege escalation attacks
- Test RLS policies thoroughly - all tables use Row-Level Security
- New pipelines should be created automatically for whitelabels via trigger (see `07-auto-create-default-pipeline.sql`)

### Key Database Tables
- `whitelabels` - Multi-tenant isolation root table
- `users` - Legacy user authentication (being phased out)
- `employees` - New user system with role-based access (`admin`, `gestor`, `colaborador`)
- `contacts` - CRM contacts/leads with pipeline stages
- `deals` - Sales opportunities linked to contacts
- `pipelines` & `pipeline_stages` - Customizable sales pipelines
- `teams` & `team_members` - Team organization
- `commission_settings` & `user_commissions` - Commission tracking for SDRs and Closers
- `meetings` - SDR meeting tracking
- `facebook_leads` - Facebook Lead Ads integration

## Architecture Patterns

### Multi-Tenant Isolation
Every data table has a `whitelabel_id` foreign key. Row-Level Security (RLS) policies enforce complete data isolation between whitelabels. **Never** query data without filtering by `whitelabel_id`.

### Authentication & Permissions
The system uses a dual authentication model:

1. **Legacy System** (`users` table): Being phased out, but still referenced for backward compatibility
2. **New System** (`employees` table): Current implementation with three access levels:
   - `SuperAdmin` - Full system access (admin panel only)
   - `admin` - Whitelabel admin access (settings, commissions, teams)
   - `gestor` - Manager access (view commissions, manage teams/goals)
   - `colaborador` - Standard user access

**Permission checking flow** (see `lib/permissions.ts`):
1. Check if user exists in `employees` table → use `employee.user_role`
2. Fallback to `users` table → map `role` to access level
3. Default to `colaborador` if no role found

### Data Access Patterns

**Frontend → API Routes → Supabase** (Preferred)
- Frontend calls `/api/dashboard/*` routes
- API routes authenticate user and validate permissions
- API routes query Supabase with RLS enforcement
- Benefits: Security, server-side caching, encapsulation

**Client-side caching** is implemented via `lib/api-cache.ts`:
- Cache TTL: 30s-2min depending on data type
- Invalidation on mutations (create/update/delete)
- Uses in-memory Map with timestamp tracking

### Commission System

The commission system supports two roles with checkpoint-based multipliers:

**SDR (Sales Development Representative)**:
- Paid per meeting held: `sdrMeetingCommission` × meetings
- Bonus per converted meeting: `sdrBonusClosedMeeting` × conversions
- Target: `sdrMeetingsTarget` meetings/month

**Closer (Account Executive)**:
- Percentage of sales: `closerCommissionPercent` × total_sales
- Fixed monthly commission: `closerFixedCommission`
- Per-sale bonus: `closerPerSaleCommission` × sales_count
- Target: `closerSalesTarget` in sales/month

**Checkpoint Tiers** (applies to both roles):
- Tier 1: `checkpoint1Percent`% of target → `checkpoint1CommissionPercent`% multiplier
- Tier 2: `checkpoint2Percent`% of target → `checkpoint2CommissionPercent`% multiplier
- Tier 3: `checkpoint3Percent`% of target → `checkpoint3CommissionPercent`% multiplier

Commission calculations are in `lib/commission-calculations.ts`.

### Pipeline System

Pipelines are customizable sales funnels with multiple stages:

- Each whitelabel has a default pipeline (auto-created via database trigger)
- Contacts move through stages: `contacts.stageId` → `pipeline_stages.id`
- Stages have accounting flags:
  - `countsAsMeeting` - Stage counts as SDR meeting held
  - `countsAsSale` - Stage counts as Closer sale closed
  - `requiresSdr` - Must have `sdrId` assigned
  - `requiresCloser` - Must have `closerId` assigned
  - `requiresDealValue` - Must have `dealValue` filled

**Stage Mapping**: Legacy `status` field is mapped to new pipeline stages via `lib/stage-mapping.ts` for backward compatibility.

## Key File Locations

### Type Definitions
`lib/types.ts` - All TypeScript interfaces for the application (Whitelabel, Contact, Deal, Pipeline, Commission, etc.)

### Supabase Clients
- `lib/supabase/server.ts` - Server-side Supabase client (SSR, API routes)
- `lib/supabase/client.ts` - Client-side Supabase client (browser)
- `lib/supabase/meta-ads-credentials.ts` - Encrypted Meta Ads credential storage
- `lib/supabase/facebook-credentials.ts` - Encrypted Facebook credential storage

### Data Services
- `lib/supabase-data-service.ts` - Frontend service for API calls (with caching)
- `lib/api-cache.ts` - Client-side caching layer
- `lib/commission-calculations.ts` - Commission calculation logic
- `lib/goal-progress-service.ts` - Goal tracking across pipelines

### UI Components
- `components/ui/*` - shadcn/ui component library
- `components/app-sidebar.tsx` - Main navigation sidebar
- `components/CRM/*` - CRM-specific components
- `components/pipelines/*` - Pipeline management UI
- `components/comissoes/*` - Commission tracking UI

### API Routes
- `app/api/dashboard/*` - Main dashboard API (contacts, deals, teams, analytics)
- `app/api/auth/*` - Authentication endpoints
- `app/api/webhooks/facebook/*` - Facebook Lead Ads webhook handler

### Dashboard Pages
- `app/dashboard/page.tsx` - Main dashboard with metrics
- `app/dashboard/CRM/*` - CRM contact management
- `app/dashboard/Comissoes/*` - Commission tracking
- `app/dashboard/Configuracoes/*` - Settings (whitelabel config, integrations)
- `app/dashboard/Times/*` - Team management
- `app/dashboard/Colaboradores/*` - Employee management

## Environment Variables

Required variables (see `.env.local.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations

# Encryption (CRITICAL - for API key storage)
ENCRYPTION_KEY=64_character_hex_key  # Generate with: openssl rand -hex 32
```

**NEVER** commit `.env.local` to git. API keys (Meta Ads, Facebook) are stored encrypted in the database using `ENCRYPTION_KEY`.

## Routing & Middleware

- `middleware.ts` - Authentication check for `/dashboard` and `/admin` routes
- Unauthenticated users redirected to `/` (login page)
- Authenticated users on `/` redirected to `/dashboard`
- Uses Supabase session validation (JWT-based, no network request)

## Styling

- Tailwind CSS 4.x with custom configuration
- Dark mode support via `next-themes`
- Component styling via `class-variance-authority` and `tailwind-merge`
- Global styles in `app/globals.css`

## Third-Party Integrations

### Meta Ads (Facebook Ads)
- Credentials stored encrypted in `whitelabels` table
- API wrapper: `lib/supabase/meta-ads-credentials.ts`
- Metrics tracked: ROAS, ROI, CAC, CPC, CTR

### Facebook Lead Ads
- Webhook endpoint: `/api/webhooks/facebook`
- Leads auto-create contacts in CRM
- See `scripts/TEST_FACEBOOK_WEBHOOK.md` for testing guide

## Important Development Notes

1. **Always filter by whitelabel_id** - RLS is enforced at database level, but queries should explicitly filter
2. **Use API routes for mutations** - Don't expose Supabase client directly for writes
3. **Invalidate cache on mutations** - Call `apiCache.invalidate()` after create/update/delete
4. **Test RLS policies** - Create test users in different whitelabels to verify isolation
5. **Migration order matters** - Execute SQL scripts sequentially by number
6. **Encryption key is critical** - Losing `ENCRYPTION_KEY` makes stored credentials unrecoverable

## Testing Patterns

While there are no formal test files, manual testing should cover:
- Multi-tenant isolation (different whitelabel users cannot see each other's data)
- Permission enforcement (colaborador cannot access admin settings)
- Commission calculations (verify checkpoint tiers and multipliers)
- Pipeline stage transitions (meeting/sale flags correctly counted)
- Facebook webhook processing (lead creation from webhook payload)
