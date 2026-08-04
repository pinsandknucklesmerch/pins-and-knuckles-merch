-- Extend the Product Types master dataset for Commercial Invoice defaults.
-- The commodity_code column already exists on product_types; make it safe for
-- existing calculator-only Product Types that do not have customs data yet.

alter table public.product_types
  alter column commodity_code set default '',
  drop constraint if exists product_types_commodity_code_not_blank_chk,
  add column if not exists country_of_origin text not null default '',
  add column if not exists invoice_description text not null default '',
  add column if not exists default_invoice_cost numeric(12,4),
  add column if not exists invoice_currency_code text;

alter table public.product_types
  add constraint product_types_default_invoice_cost_chk
    check (default_invoice_cost is null or default_invoice_cost >= 0),
  add constraint product_types_invoice_currency_code_chk
    check (invoice_currency_code is null or invoice_currency_code in ('GBP', 'EUR'));

-- product_types_set_updated_at already provides the existing updated_at behavior.
