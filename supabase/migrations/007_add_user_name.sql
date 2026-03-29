alter table users add column if not exists name text;
alter table users drop constraint if exists users_email_key;
alter table users alter column email drop not null;
