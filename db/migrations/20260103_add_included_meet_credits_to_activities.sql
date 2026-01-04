alter table activities
add column if not exists included_meet_credits integer not null default 0;
