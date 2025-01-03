-- Allow NULL values for created_by and created_by_email
alter table leads alter column created_by drop not null;
alter table leads alter column created_by_email drop not null; 