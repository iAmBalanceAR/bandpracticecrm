-- Drop existing foreign key constraint
alter table saved_venues drop constraint if exists saved_venues_venue_id_fkey;

-- Change venue_id column type to UUID
alter table saved_venues 
  alter column venue_id type uuid using venue_id::uuid;

-- Re-add foreign key constraint
alter table saved_venues 
  add constraint saved_venues_venue_id_fkey 
  foreign key (venue_id) references venues(id) on delete cascade; 