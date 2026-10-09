create type public.app_role as enum ('super_admin','nursery_seller','buyer');
create type public.verification_status as enum ('pending','verified','rejected');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id)
);
create table public.nurseries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  name text not null,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);
create table public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null
);
create table public.nursery_inventory (
  id uuid primary key default gen_random_uuid(),
  nursery_id uuid not null references public.nurseries(id) on delete cascade,
  product_id uuid not null references public.product_catalog(id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  price_per_unit numeric(12,2) not null default 0 check (price_per_unit >= 0),
  unique (nursery_id, product_id)
);

grant select on public.users to authenticated; grant all on public.users to service_role;
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
grant select, update on public.nurseries to authenticated; grant all on public.nurseries to service_role;
grant select on public.product_catalog to authenticated; grant all on public.product_catalog to service_role;
grant select, insert, update on public.nursery_inventory to authenticated; grant all on public.nursery_inventory to service_role;

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.nurseries enable row level security;
alter table public.product_catalog enable row level security;
alter table public.nursery_inventory enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own or admin read users" on public.users for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "own or admin read roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "owner or admin read nurseries" on public.nurseries for select to authenticated
  using (owner_user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "admin updates nurseries" on public.nurseries for update to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "signed in read catalog" on public.product_catalog for select to authenticated using (true);
create policy "owner or admin read inventory" on public.nursery_inventory for select to authenticated
  using (public.has_role(auth.uid(),'super_admin') or exists (select 1 from public.nurseries n where n.id = nursery_id and n.owner_user_id = auth.uid()));
create policy "verified owner inserts inventory" on public.nursery_inventory for insert to authenticated
  with check (exists (select 1 from public.nurseries n where n.id = nursery_id and n.owner_user_id = auth.uid() and n.verification_status = 'verified'));
create policy "verified owner updates inventory" on public.nursery_inventory for update to authenticated
  using (exists (select 1 from public.nurseries n where n.id = nursery_id and n.owner_user_id = auth.uid() and n.verification_status = 'verified'))
  with check (exists (select 1 from public.nurseries n where n.id = nursery_id and n.owner_user_id = auth.uid() and n.verification_status = 'verified'));

-- Aggregated stock: owner-rights view so buyers see totals only, never per-nursery rows
create view public.product_stock_summary as
select p.id as product_id, p.name, p.category,
  coalesce(sum(i.quantity_available),0)::bigint as total_quantity,
  count(distinct n.id) filter (where i.quantity_available > 0)::int as nursery_count
from public.product_catalog p
left join public.nursery_inventory i on i.product_id = p.id
left join public.nurseries n on n.id = i.nursery_id
where n.verification_status = 'verified' or n.id is null
group by p.id, p.name, p.category;
revoke all on public.product_stock_summary from anon;
grant select on public.product_stock_summary to authenticated;

-- Signup: only buyer or nursery_seller can be self-chosen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _role public.app_role;
begin
  _role := case when new.raw_user_meta_data->>'role' = 'nursery_seller' then 'nursery_seller'::public.app_role else 'buyer'::public.app_role end;
  insert into public.users (id, email) values (new.id, new.email);
  insert into public.user_roles (user_id, role) values (new.id, _role);
  if _role = 'nursery_seller' then
    insert into public.nurseries (owner_user_id, name)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nursery_name',''), 'My Nursery'));
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed data
insert into public.product_catalog (id, name, category) values
  ('00000000-0000-0000-0000-0000000000c1','Coconut Plant','Palms');
insert into public.nurseries (id, name, verification_status) values
  ('00000000-0000-0000-0000-0000000000a1','Clifton Green Nursery','verified'),
  ('00000000-0000-0000-0000-0000000000a2','Malir Palm Farms','verified');
insert into public.nursery_inventory (nursery_id, product_id, quantity_available, price_per_unit) values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1',5200,350),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000c1',3220,320);