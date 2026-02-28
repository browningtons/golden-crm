# Golden CRM

Multi-app CRM control plane for lifecycle operations across different product lines and customer segments.

This app is built to help you:
- Track leads/customers across multiple apps and segments
- Move contacts through lifecycle pipeline stages
- Run follow-up and retention task operations
- Log campaigns and interactions with attribution context
- Import records at scale via deterministic CSV contracts

## Stack

- React 18 + TypeScript + Vite
- GitHub Actions for CI + Pages deploy
- LocalStorage persistence (current)
- Supabase schema included for backend migration (`supabase/schema.sql`)

## Run Locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Core App Features

- App portfolio and segment model
- Customer lifecycle pipeline (`new`, `qualified`, `trial`, `paid`, `at-risk`, `churned`)
- Task workspace with status/priority and due-date tracking
- Campaign performance logging by app + segment
- Interaction timeline by app + segment
- Scoped KPI cards (MRR, open tasks, follow-up risk)
- CSV importer with dry-run validation for contacts/tasks/campaigns

## CSV Import Contract

See full spec: `docs/CSV_IMPORT_SPEC.md`

Templates:
- `public/import-templates/contacts_template.csv`
- `public/import-templates/tasks_template.csv`
- `public/import-templates/campaigns_template.csv`

Important rules:
- CSV delimiter: comma `,`
- Quote character: `"`
- Encoding: UTF-8
- Date format: `YYYY-MM-DD`
- Multi-value helper columns use pipe delimiter: `|`

## Deploy

GitHub Pages deploys via Actions workflows:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/preview.yml`

Pages source in GitHub repo settings should be set to **GitHub Actions**.

## Backend Migration (Supabase)

SQL schema for production persistence:
- `supabase/schema.sql`

Suggested next step:
1. Create Supabase project
2. Run schema SQL
3. Replace localStorage adapter with Supabase client CRUD in `src/App.tsx`

## Legacy Materials

Initial interview case-study artifacts were archived to:
- `legacy/interview-case-study/`
