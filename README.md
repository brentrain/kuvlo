# Kuvlo

![SaaS](https://img.shields.io/badge/SaaS-Field_Service_Platform-7C3AED?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Resend](https://img.shields.io/badge/Email-Resend-111827?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active_Development-2E7D32?style=for-the-badge)

**A full-stack field-service and small-business operations platform for managing clients, jobs, invoices, company settings, reminders, payments, and day-to-day work from one place.**

Kuvlo is built for independent operators and small service businesses that need more than a spreadsheet but less complexity than a large enterprise platform. The application combines scheduling, client records, revenue tracking, invoicing, email workflows, account management, and database-backed business operations in a single Next.js application.

## What Kuvlo does

Kuvlo provides a practical operating layer for service work. Authenticated users can manage clients and jobs, monitor upcoming work and revenue, create invoices, maintain company and account information, send invoice emails, configure payment links, export data, and trigger scheduled reminders.

The dashboard surfaces immediate operational information such as jobs scheduled today, current-week revenue, and upcoming jobs. Data is stored in Supabase and scoped to authenticated users through the application's database model and access rules.

## Current capabilities

- User authentication with Supabase
- Dashboard with jobs, revenue, and upcoming-work summaries
- Client management
- Job scheduling and status tracking
- Invoice creation and invoice-item support
- Invoice email delivery through Resend
- Company profile and account settings
- Payment-link support, including LemonSqueezy, Stripe, PayPal, and Venmo fields
- Scheduled job-reminder email endpoint
- Excel export support
- Supabase-backed relational data model
- SQL setup and schema documentation included in the repository
- Responsive Next.js App Router interface

## Application structure

```text
┌──────────────────────────────┐
│         Next.js UI           │
│ dashboard • clients • jobs   │
│ invoices • company • account │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Supabase Auth + Data     │
│ users • clients • jobs       │
│ invoices • company profiles  │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌──────────────┐
│ Next.js API  │ │ Data Export  │
│ invoice mail │ │    XLSX      │
│ job reminders│ └──────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Resend    │
│ email delivery│
└──────────────┘
```

## Project structure

```text
kuvlo/
├── app/
│   ├── account/              # User account management
│   ├── api/                  # Server-side API routes
│   │   ├── send-invoice/
│   │   └── send-job-reminders/
│   ├── auth/                 # Authentication screens
│   ├── clients/              # Client management
│   ├── company/              # Company profile/settings
│   ├── invoices/             # Invoice workflows
│   ├── jobs/                 # Job scheduling and management
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   └── exportToExcel.ts
│   ├── layout.tsx
│   └── page.tsx              # Main dashboard
├── COMPLETE_DATABASE_SETUP.sql
├── DATABASE_SCHEMA.md
├── EMAIL_SETUP.md
├── package.json
└── README.md
```

## Tech stack

**Frontend / full stack:** Next.js 16, React 19, TypeScript, Tailwind CSS  
**Backend services:** Supabase Auth + Postgres  
**Email:** Resend  
**Data export:** SheetJS / XLSX  
**Payments:** Configurable external payment links  
**Deployment model:** Standard Next.js deployment with environment-based configuration

## Run locally

Clone the repository and install dependencies:

```bash
git clone https://github.com/brentrain/kuvlo.git
cd kuvlo
npm install
```

Create `.env.local` and configure the required services:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
FROM_EMAIL=...
NOTIFY_EMAIL=...
CRON_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database setup

The repository includes SQL and schema documentation for the Supabase data model, including client, job, invoice, invoice-item, and company-profile support.

Start with:

```text
COMPLETE_DATABASE_SETUP.sql
DATABASE_SCHEMA.md
```

Additional SQL files document later schema additions and fixes.

## Security notes

Client-side Supabase access uses the public anonymous key, while privileged scheduled server work should use `SUPABASE_SERVICE_ROLE_KEY` only on the server.

The job-reminder endpoint requires an authorization header using `CRON_SECRET`, preventing it from being used as an open public email trigger. The server-side route also escapes user-controlled text before placing it into reminder-email HTML.

Secrets such as the Supabase service-role key, Resend API key, and cron secret must never be exposed through `NEXT_PUBLIC_*` variables or committed to the repository.

## Product direction

Kuvlo is intended to grow from an operational MVP into a stronger small-business platform. Logical next additions include improved reporting, richer scheduling views, recurring jobs, expense tracking, invoice/payment status automation, stronger notification workflows, role-based access, customer-facing portals, and deeper automation around everyday field-service work.

## Portfolio context

This project demonstrates full-stack product development rather than a single isolated feature. It combines authentication, relational data modeling, CRUD workflows, scheduling logic, invoicing, email delivery, API routes, environment-based configuration, exports, and SaaS-oriented product thinking in one application.

It is designed around a real business workflow: keeping track of the work, the customer, the money, and what needs to happen next.
