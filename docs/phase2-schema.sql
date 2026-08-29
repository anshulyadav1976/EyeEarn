-- Optional Supabase/Postgres shape. The zero-setup demo uses .data/phase2.json.
-- No client policies are granted: exposed tables are server-route-only by default.

create table if not exists zones (
  id text primary key, name text not null,
  longitude double precision not null check (longitude between -180 and 180),
  latitude double precision not null check (latitude between -90 and 90),
  safe_for_demo boolean not null default false
);

create table if not exists bounties (
  id text primary key, zone_id text not null references zones(id),
  reward_minor integer not null check (reward_minor >= 0),
  reason text not null, evidence_requirement text not null,
  source text not null check (source in ('seeded', 'buyer_request')),
  updated_at timestamptz not null default now()
);

create table if not exists runs (
  id text primary key, runner_name text not null, zone_ids jsonb not null,
  status text not null check (status in ('live', 'finished', 'handed-off')),
  started_at timestamptz not null, finished_at timestamptz, handed_off_at timestamptz,
  earned_minor integer not null default 0 check (earned_minor >= 0)
);

create table if not exists route_points (
  id bigserial primary key, run_id text not null references runs(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy double precision check (accuracy >= 0), recorded_at timestamptz not null
);

create table if not exists observations (
  id text primary key, run_id text not null references runs(id) on delete cascade,
  category text not null, description text not null,
  modality text not null check (modality in ('vision', 'voice', 'fused')),
  source text not null default 'runner' check (source in ('runner', 'external', 'demo_import')),
  captured_at timestamptz not null, latitude double precision, longitude double precision,
  privacy_state text not null default 'safe' check (privacy_state in ('safe', 'redacted', 'blocked'))
);

create table if not exists evidence_assets (
  id text primary key, observation_id text not null references observations(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image', 'short_audio')),
  privacy_state text not null check (privacy_state in ('safe', 'redacted', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists bounty_completions (
  run_id text not null references runs(id) on delete cascade,
  bounty_id text not null references bounties(id), accepted boolean not null,
  completed_at timestamptz not null,
  reward_minor integer not null default 0 check (reward_minor >= 0),
  primary key (run_id, bounty_id)
);

alter table zones enable row level security;
alter table bounties enable row level security;
alter table runs enable row level security;
alter table route_points enable row level security;
alter table observations enable row level security;
alter table evidence_assets enable row level security;
alter table bounty_completions enable row level security;

-- Add narrowly scoped ownership policies after authentication is chosen. Until
-- then, only protected server routes using a server-side secret/service role
-- should read or write these tables.
