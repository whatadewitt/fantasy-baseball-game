-- Allow same player to appear in multiple positions (e.g. Ohtani as SP + DH)
alter table players drop constraint players_mlb_id_key;
alter table players add constraint players_mlb_id_position_key unique (mlb_id, position);
