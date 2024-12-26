-- Drop existing functions if they exist
drop function if exists delete_tour(bigint);
drop function if exists update_tour(bigint, jsonb);
drop function if exists create_tour(jsonb);
drop function if exists get_user_tours();

-- Create function to get user's tours
create or replace function get_user_tours()
returns setof tours
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select *
  from tours
  where user_id = auth.uid()
  order by departure_date desc nulls last;
end;
$$;

-- Create function to create a tour
create or replace function create_tour(tour_data jsonb)
returns tours
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tour tours;
begin
  insert into tours (
    user_id,
    title,
    description,
    departure_date,
    return_date,
    status
  )
  values (
    auth.uid(),
    tour_data->>'title',
    tour_data->>'description',
    (tour_data->>'departure_date')::date,
    (tour_data->>'return_date')::date,
    (tour_data->>'status')::tour_status
  )
  returning * into new_tour;

  return new_tour;
end;
$$;

-- Create function to update a tour
create or replace function update_tour(tour_id bigint, tour_data jsonb)
returns tours
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_tour tours;
begin
  update tours
  set
    title = tour_data->>'title',
    description = tour_data->>'description',
    departure_date = (tour_data->>'departure_date')::date,
    return_date = (tour_data->>'return_date')::date,
    status = (tour_data->>'status')::tour_status
  where id = tour_id
    and user_id = auth.uid()
  returning * into updated_tour;

  if updated_tour is null then
    raise exception 'Tour not found or you do not have permission to update it';
  end if;

  return updated_tour;
end;
$$;

-- Create function to delete a tour
create or replace function delete_tour(tour_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from tours
  where id = tour_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Tour not found or you do not have permission to delete it';
  end if;
end;
$$; 