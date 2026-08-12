-- Webhook payload signing: new secret column, plaintext (server needs to compute HMAC, not just verify a hash)
alter table public.customers add column if not exists webhook_signing_secret text;

-- Rate limiting: per-customer, per-minute request counter
create table if not exists public.webhook_rate_limits (
  customer_id bigint references public.customers(customer_id),
  window_start timestamptz,
  request_count int not null default 1,
  primary key (customer_id, window_start)
);
alter table public.webhook_rate_limits enable row level security;
-- No public policies: only ever touched by the edge function's service-role connection.

create or replace function public.check_rate_limit(p_customer_id bigint, p_limit int default 60)
returns boolean
language plpgsql
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_count int;
begin
  insert into public.webhook_rate_limits (customer_id, window_start, request_count)
  values (p_customer_id, v_window, 1)
  on conflict (customer_id, window_start)
  do update set request_count = webhook_rate_limits.request_count + 1
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;
