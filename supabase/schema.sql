-- SignalDraft schema (Phase 1 + Phase 2) — run in Supabase SQL Editor
-- Existing Phase 1 DBs: run supabase/migration-phase2.sql instead of re-running this file
-- https://supabase.com/dashboard → SQL → New query

create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'received'
    check (status in ('received', 'researching', 'drafting', 'review', 'delivered', 'revision', 'closed')),
  tier text not null default 'blueprint',
  due_at timestamptz not null,
  intake_json jsonb not null,
  contact_name text not null,
  contact_email text not null,
  company_name text not null,
  use_case text not null default 'csat',
  operator_notes text,
  payment_status text not null default 'waived'
    check (payment_status in ('pending', 'paid', 'waived', 'failed')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_cents integer,
  deliverable_json jsonb,
  deliverable_published_at timestamptz,
  portal_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists projects_status_idx on projects (status);
create index if not exists projects_due_at_idx on projects (due_at);
create index if not exists projects_created_at_idx on projects (created_at desc);
create index if not exists projects_client_token_idx on projects (client_token);

create or replace function projects_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function projects_set_updated_at();

alter table projects enable row level security;

-- Growth Operator state (CRM dashboard, blockers, phase gates)
create table if not exists growth_state (
  id text primary key default 'signal-draft',
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

insert into growth_state (id, state_json)
values ('signal-draft', '{}'::jsonb)
on conflict (id) do nothing;

alter table growth_state enable row level security;

-- API uses service_role key server-side only; no public policies.