-- Golden CRM baseline schema (Postgres / Supabase)

create extension if not exists pgcrypto;

create table if not exists apps (
  id text primary key,
  name text not null,
  description text not null default '',
  segments text[] not null default array['General']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  app_id text not null references apps(id) on delete cascade,
  segment text not null,
  name text not null,
  email text not null,
  phone text not null default '',
  stage text not null,
  source text not null,
  created_at date not null,
  last_contact date not null,
  next_follow_up date,
  monthly_value numeric(12,2) not null default 0,
  usage_score integer not null default 50,
  owner text not null default 'Unassigned',
  labels text[] not null default '{}'::text[],
  notes text not null default '',
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_id, email)
);

create index if not exists idx_customers_app_stage on customers(app_id, stage);
create index if not exists idx_customers_followup on customers(app_id, next_follow_up);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  app_id text not null references apps(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  segment text not null,
  title text not null,
  status text not null,
  priority text not null,
  owner text not null default 'Unassigned',
  due_date date,
  labels text[] not null default '{}'::text[],
  notes text not null default '',
  created_at date not null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_app_status on tasks(app_id, status);
create index if not exists idx_tasks_due on tasks(app_id, due_date);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  app_id text not null references apps(id) on delete cascade,
  segment text not null,
  date date not null,
  name text not null,
  channel text not null,
  sent integer not null default 0,
  conversions integer not null default 0,
  revenue numeric(12,2) not null default 0,
  notes text not null default '',
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_app_date on campaigns(app_id, date);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  date date not null,
  channel text not null,
  summary text not null,
  outcome text not null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_interactions_customer_date on interactions(customer_id, date desc);

-- NOTE: enable and configure RLS policies before production use.
