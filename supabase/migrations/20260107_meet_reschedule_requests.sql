-- Meet reschedule requests: keep history of proposed new times without losing original event time

create extension if not exists pgcrypto;

create table if not exists public.calendar_event_reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  requested_by_user_id uuid not null,
  requested_by_role text not null check (requested_by_role in ('client', 'coach')),
  from_start_time timestamptz not null,
  from_end_time timestamptz,
  to_start_time timestamptz not null,
  to_end_time timestamptz,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_event_reschedule_requests enable row level security;

create index if not exists calendar_event_reschedule_requests_event_id_idx
  on public.calendar_event_reschedule_requests(event_id);

create index if not exists calendar_event_reschedule_requests_requester_idx
  on public.calendar_event_reschedule_requests(requested_by_user_id, status, created_at desc);

-- Clients can read reschedule requests for events where they are participants
create policy "Clients can read their meet reschedule requests"
on public.calendar_event_reschedule_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.calendar_event_participants p
    where p.event_id = calendar_event_reschedule_requests.event_id
      and p.client_id = auth.uid()
  )
);

-- Coaches can read reschedule requests for their own events
create policy "Coaches can read reschedule requests for their events"
on public.calendar_event_reschedule_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.calendar_events e
    where e.id = calendar_event_reschedule_requests.event_id
      and e.coach_id = auth.uid()
  )
);

-- Clients can create reschedule requests for events where they are participants
create policy "Clients can create reschedule requests"
on public.calendar_event_reschedule_requests
for insert
to authenticated
with check (
  requested_by_user_id = auth.uid()
  and requested_by_role = 'client'
  and exists (
    select 1
    from public.calendar_event_participants p
    where p.event_id = calendar_event_reschedule_requests.event_id
      and p.client_id = auth.uid()
  )
);

-- Coaches can create reschedule requests for their own events
create policy "Coaches can create reschedule requests"
on public.calendar_event_reschedule_requests
for insert
to authenticated
with check (
  requested_by_user_id = auth.uid()
  and requested_by_role = 'coach'
  and exists (
    select 1
    from public.calendar_events e
    where e.id = calendar_event_reschedule_requests.event_id
      and e.coach_id = auth.uid()
  )
);

-- Requester or coach can update status/times (e.g. accept/decline/cancel)
create policy "Requester or coach can update reschedule requests"
on public.calendar_event_reschedule_requests
for update
to authenticated
using (
  requested_by_user_id = auth.uid()
  or exists (
    select 1
    from public.calendar_events e
    where e.id = calendar_event_reschedule_requests.event_id
      and e.coach_id = auth.uid()
  )
)
with check (
  requested_by_user_id = calendar_event_reschedule_requests.requested_by_user_id
  and requested_by_role = calendar_event_reschedule_requests.requested_by_role
);
