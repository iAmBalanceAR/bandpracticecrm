-- Drop existing functions
drop function if exists public.set_default_tour(p_tour_id bigint);
drop function if exists public.set_default_tour(p_tour_id uuid);

-- Create function to set a tour as default (without modifying tour connections)
create or replace function public.set_default_tour(p_tour_id integer)
returns void
language plpgsql security definer
as $$
declare
  v_user_id uuid;
begin
  -- Get the user_id from the tour and verify ownership
  select user_id into v_user_id
  from public.tours
  where id = p_tour_id
  and user_id = auth.uid();

  -- Only proceed if the tour belongs to the authenticated user
  if v_user_id is not null then
    -- First, unset default for all other tours of this user
    update public.tours
    set is_default = false
    where user_id = v_user_id
    and id != p_tour_id;

    -- Then set this tour as default
    update public.tours
    set is_default = true
    where id = p_tour_id
    and user_id = v_user_id;
  else
    raise exception 'Tour not found or unauthorized';
  end if;
end;
$$; 