-- Remove policies recursivas (consultavam a própria tabela users dentro da policy)
drop policy if exists "users: admin all" on users;
drop policy if exists "transactions: admin all" on transactions;
drop policy if exists "escrow_events: admin all" on escrow_events;

-- Função security definer para verificar admin sem recursão
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Recria policies de admin usando a função (sem recursão)
create policy "users: admin all"
  on users for all
  using (public.is_admin());

create policy "transactions: admin all"
  on transactions for all
  using (public.is_admin());

create policy "escrow_events: admin all"
  on escrow_events for all
  using (public.is_admin());
