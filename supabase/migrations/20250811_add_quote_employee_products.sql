-- Create association table between quotes, employees, and products
-- Allows explicitly linking each employee to one or more products within a quote

create table if not exists public.quote_employee_products (
  id bigserial primary key,
  quote_id bigint not null references public.quotes(id) on delete cascade,
  employee_id bigint not null references public.employees(id) on delete restrict,
  product_id bigint not null references public.products(id) on delete restrict,
  hours_allocated numeric(10,2), -- optional: portion of hours for this employee towards this product
  notes text,
  created_at timestamptz not null default now(),
  unique (quote_id, employee_id, product_id)
);

comment on table public.quote_employee_products is 'Specific association of employees to products within a quote';
comment on column public.quote_employee_products.hours_allocated is 'Optional hours allocated from the employee to this product';

-- Helpful index for querying links by quote
create index if not exists idx_qep_quote_id on public.quote_employee_products(quote_id);
create index if not exists idx_qep_employee_id on public.quote_employee_products(employee_id);
create index if not exists idx_qep_product_id on public.quote_employee_products(product_id);

