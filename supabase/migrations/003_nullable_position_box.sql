-- Allow position_box to be null (means player is imported but not assigned to any draft box)
alter table players alter column position_box drop not null;
