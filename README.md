# MarkupFlow

Visual feedback and design approval software for freelancers, web designers, and agencies.

## What it does

- Clients click anywhere on a live site or design to leave pinned visual comments
- Teams manage all feedback in a centralized triage board
- Review cycles are tracked: Draft → Active → In Review → Changes Requested → Approved
- Every approval is explicit, timestamped, and tied to a specific version
- The client experience requires zero friction — no account needed

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **PostgreSQL** + **Prisma ORM**
- **NextAuth.js** (email/password + magic link)
- **Tailwind CSS** + **shadcn/ui** components
- **Resend** for transactional email
- **Stripe** for billing (architecture ready, wire up your keys)
- **Sonner** for toast notifications

## Quick start (local dev)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally or a connection string
- (Optional) Resend account for emails

### 2. Clone and install

```bash
git clone <repo-url>
cd markupflow
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
# At minimum: set DATABASE_URL and AUTH_SECRET
```

### 4. Set up database

```bash
# Create and migrate the database
npx prisma migrate dev --name init

# Seed with demo data (optional but recommended)
npx prisma db seed
```

### 5. Run

```bash
npm run dev
# App at http://localhost:3000
```

### 6. Demo accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| `alex@riverstudio.dev` | `password123` | Workspace owner |
| `sam@riverstudio.dev` | `password123` | Team member |
| `admin@markupflow.com` | `password123` | Platform admin |

Demo review portal (no login needed): http://localhost:3000/review/demo-review-token-acme-v2

## Project structure

```
src/
├── app/
│   ├── (auth)/          — Login, signup, magic link, onboarding
│   ├── (app)/           — Main app (dashboard, projects, clients, feedback...)
│   ├── (admin)/         — Platform admin panel (/admin/*)
│   ├── review/[token]/  — Public client review portal
│   └── api/             — API routes
├── components/
│   ├── ui/              — Base UI primitives (shadcn-style)
│   ├── layout/          — Sidebar, nav
│   ├── shared/          — Reusable app components
│   ├── projects/        — Project-specific components
│   ├── feedback/        — Feedback triage components
│   ├── review/          — Client review portal
│   ├── notifications/   — Notification components
│   └── settings/        — Settings forms
├── lib/
│   ├── auth/            — NextAuth config and session helpers
│   ├── billing/         — Plan definitions
│   ├── db/              — Prisma client singleton
│   ├── email/           — Email sending functions
│   ├── audit.ts         — Audit log helper
│   ├── notifications.ts — Notification helpers
│   ├── workspace.ts     — Workspace request helper
│   └── utils.ts         — General utilities
└── types/               — TypeScript type extensions
prisma/
├── schema.prisma        — Full data model
└── seed.ts              — Local dev seed data
```

## Data model overview

```
Workspace (tenant)
├── WorkspaceMember (owner, admin, team_member)
├── WorkspaceInvitation
├── Client
│   └── Project
│       ├── Deliverable
│       │   ├── DeliverableVersion (versioned URLs/files)
│       │   └── FeedbackItem
│       │       └── FeedbackComment
│       └── ReviewLink (secure client portal)
│           ├── ReviewSession
│           └── ApprovalAction
├── Notification
├── AuditLog
└── FeatureFlag
```

## Authentication

- **Email + password**: Standard credentials login
- **Magic link**: Passwordless sign-in via email (15-minute expiry)
- **Session**: JWT-based via NextAuth.js
- **RBAC**: Enforced at API level via workspace membership roles
- **Multi-tenant isolation**: All queries scoped to `workspaceId`

## Client review portal security

- Review links use a random 24-character token (not sequential IDs)
- Links can have expiry dates
- Internal comments are filtered out before serving to clients
- No auth required for clients — frictionless by design
- Approval actions are immutably logged with timestamps

## What's production-ready

✅ Auth (email/password + magic link)  
✅ Multi-tenant workspace isolation  
✅ RBAC (owner, admin, team_member)  
✅ Full CRUD for clients, projects, deliverables  
✅ Deliverable versioning  
✅ Visual positional feedback  
✅ Secure client review portal  
✅ Approval workflow with checklist  
✅ Approval audit trail  
✅ In-app notifications  
✅ Email notifications (Resend)  
✅ Feedback triage board with assign/resolve  
✅ Billing architecture (Stripe-ready)  
✅ Platform admin panel  
✅ Audit log  
✅ Public homepage + pricing page  

## What's scaffolded / incomplete

⚠️ **File uploads**: Architecture is ready (DeliverableVersion has file fields) but actual upload handling needs an upload provider (UploadThing, S3, etc.) wired in.

⚠️ **Magic link sign-in flow**: The current implementation re-issues a temp password on verify. For production, consider using a proper token-based session handoff.

⚠️ **Invitation accept flow**: `/invite/[token]` route needs to be built — API exists, page is missing.

⚠️ **Email-only magic link**: Currently falls back to the credentials provider. In production, use a dedicated email-based provider flow.

⚠️ **Real-time updates**: Feedback and approval status changes require a page refresh. Add WebSockets or SSE for live updates.

⚠️ **Storage abstraction**: Only URL-based deliverables work. File upload requires connecting UploadThing or AWS S3.

⚠️ **White-label client portal**: Agency plan feature — not yet implemented.

⚠️ **Feature flags**: Model exists, no UI for managing them yet.

## Deploying to production

1. Set up a PostgreSQL database (Supabase, Neon, Railway, etc.)
2. Set `DATABASE_URL` and run `npx prisma migrate deploy`
3. Set `AUTH_SECRET` to a secure random string
4. Configure Resend API key and verify your domain
5. Set up Stripe and add price IDs to env
6. Deploy to Vercel, Railway, or any Node.js host
7. Point `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain

## Stripe setup

1. Create a Stripe account
2. Create 3 products: Starter ($29/mo), Pro ($79/mo), Agency ($199/mo)
3. Copy the price IDs to env vars
4. Set up webhook: `stripe listen --forward-to localhost:3000/api/billing/webhook`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
