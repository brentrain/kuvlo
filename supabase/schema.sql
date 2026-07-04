create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  client_name text not null,
  client_email text,
  status text not null default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  communication_log jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  business_name text not null default 'Your Business',
  address text,
  city text,
  state text,
  zip_code text,
  email text,
  phone text,
  tax_id text,
  created_at timestamptz default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  total_amount numeric not null default 0,
  payment_status text not null default 'pending',
  invoice_number text unique,
  description text,
  due_date date,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table public.jobs enable row level security;
alter table public.clients enable row level security;
alter table public.company_profiles enable row level security;
alter table public.invoices enable row level security;

create policy "Users can manage their own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own company profiles" on public.company_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
