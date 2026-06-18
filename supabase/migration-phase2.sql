-- SignalDraft Phase 2 — run in Supabase SQL Editor on existing databases
-- Adds payment, deliverable, and portal columns to projects

alter table projects
  add column if not exists payment_status text not null default 'waived'
    check (payment_status in ('pending', 'paid', 'waived', 'failed'));

alter table projects
  add column if not exists stripe_checkout_session_id text;

alter table projects
  add column if not exists stripe_payment_intent_id text;

alter table projects
  add column if not exists amount_cents integer;

alter table projects
  add column if not exists deliverable_json jsonb;

alter table projects
  add column if not exists deliverable_published_at timestamptz;

alter table projects
  add column if not exists portal_visible boolean not null default false;

-- Existing projects before Stripe: treat as waived (founding / manual mode)
update projects set payment_status = 'waived' where payment_status is null;