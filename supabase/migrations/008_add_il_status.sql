-- Track injured-list status on players. NULL = active.
-- Stored as the IL length in days (7, 10, 15, 60) so the UI can render "IL-10" etc.
alter table players add column if not exists il_status smallint;

create index if not exists idx_players_il_status on players(il_status) where il_status is not null;
