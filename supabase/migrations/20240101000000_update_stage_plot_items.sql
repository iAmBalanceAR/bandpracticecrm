-- Drop existing stage_plot_items table (this will cascade delete all items)
drop table stage_plot_items;

-- Recreate stage_plot_items table with equipment_id instead of member_name/instrument
create table stage_plot_items (
  id uuid default gen_random_uuid() primary key,
  stage_plot_id uuid references stage_plots on delete cascade not null,
  equipment_id text not null,
  position_x float not null,
  position_y float not null,
  width float not null,
  height float not null,
  rotation float default 0,
  technical_requirements jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Re-enable RLS
alter table stage_plot_items enable row level security;

-- Recreate policies
create policy "Users can view items of their stage plots"
  on stage_plot_items for select
  using (exists (
    select 1 from stage_plots
    where id = stage_plot_id
    and user_id = auth.uid()
  ));

create policy "Users can insert items to their stage plots"
  on stage_plot_items for insert
  with check (exists (
    select 1 from stage_plots
    where id = stage_plot_id
    and user_id = auth.uid()
  ));

create policy "Users can update items on their stage plots"
  on stage_plot_items for update
  using (exists (
    select 1 from stage_plots
    where id = stage_plot_id
    and user_id = auth.uid()
  ));

create policy "Users can delete items from their stage plots"
  on stage_plot_items for delete
  using (exists (
    select 1 from stage_plots
    where id = stage_plot_id
    and user_id = auth.uid()
  )); 