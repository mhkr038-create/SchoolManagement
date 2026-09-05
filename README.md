# School Management System (ERP & SaaS)

A production-grade, multi-tenant School Management ERP platform engineered for schools with 1,500+ students and staff, expandable into a multi-school SaaS.

## Technology Stack

- **Monorepo**: pnpm Workspaces
- **Backend (`apps/api`)**: Node.js, NestJS, TypeScript, REST API, Passport JWT, bcryptjs, class-validator
- **Database**: PostgreSQL 16 with Prisma ORM (25+ relational tables, row-level data isolation via `school_id`)
- **Cache & Async**: Redis 7, BullMQ ready
- **Frontend (`apps/web`)**: React 18, TypeScript, Vite, Material UI (MUI), TanStack Query, Zustand, React Hook Form, Axios
- **Shared Types (`packages/types`)**: Common types, DTOs, Enums, API envelopes

---

## Getting Started

### 1. Prerequisites
- **Node.js**: >= 20.x (tested on v22.23.1)
- **pnpm**: >= 10.x / 11.x
- **PostgreSQL**: Local PostgreSQL 16 instance, Docker, or managed cloud DB (e.g. Supabase, Neon)

### 2. Environment Setup
Copy `.env.example` to `.env` and configure your database connection string:

```bash
cp .env.example .env
cp .env.example apps/api/.env
```

Ensure `DATABASE_URL` is set to your PostgreSQL database:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/school_management?schema=public"
```

### 3. Database Migration & Seed
Run Prisma migrations and populate standard permissions, roles, academic year, and default Super Admin account:

```bash
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

#### Default Credentials Seeded:
- **School**: Greenwood International Academy
- **School Code**: `GIA-2026`
- **Email**: `admin@schoolerp.com`
- **Password**: `AdminPassword123!`

---

### 4. Running Development Servers

Start both Backend API and Frontend Web concurrently:

```bash
pnpm dev
```

Or run them individually:

```bash
# Terminal 1: NestJS API Server (Port 4000)
pnpm dev:api

# Terminal 2: React Vite Web App (Port 5173)
pnpm dev:web
```

- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **REST API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

## Module Roadmap

- [x] **Phase 1: Foundation & Security** (Monorepo, PostgreSQL, Prisma, NestJS, React, JWT Auth, RBAC, Multi-Tenancy)
- [ ] **Phase 2: Academic Core & SIS** (Academic Years, Classes, Sections, Subjects, Students, Guardians, Staff, Admissions)
- [ ] **Phase 3: Attendance Engine** (Daily/Period Class Attendance, Administrative Freeze/Lock, Monthly Summaries)
- [ ] **Phase 4: Examinations & Marks** (Exam Schedules, Marks Entry Matrix, Grade Scales, PDF Report Cards)
- [ ] **Phase 5: Financial Engine** (Fee Templates, Class Invoicing, Partial Payments, PDF Receipts, Refunds)
- [ ] **Phase 6: Timetable & Homework** (Automated Conflict-Free Timetable, Assignments & Submissions)
- [ ] **Phase 7: Communications** (School Announcements, In-App Notifications, Async Email Workers)
- [ ] **Phase 8: Reporting & Hardening** (PDF/Excel/CSV Exporters, Audit Logs Inspection, Security Audits)
