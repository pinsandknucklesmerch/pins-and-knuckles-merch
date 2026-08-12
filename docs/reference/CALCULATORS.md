# Calculators Reference

This is the current repository-verified calculator reference. Migrations,
source code, and generated database types remain authoritative. Legacy
calculator migration plans are historical research, not implementation guides.

## Active profiles and boundaries

Active profile codes are:

- `EU_STANDARD`
- `EU_US_CLIENTS`
- `UK_TRADE`

Calculator drafts are client-local. They are not saved to Supabase or browser
storage. Reference data is loaded from Supabase; pricing/validation/breakdown
and quote-formatting logic lives in calculator domain/lib modules.

## EU Standard

EU Standard uses profile `EU_STANDARD` and EUR pricing. It is driven by
garments, profile-specific garment markups, profile-to-pricing-set mappings,
EU print tiers, EU embroidery prices, fees, and delivery rates.

- Garments require EUR pricing and use a profile-specific markup.
- Print positions include Front, Back, Left Sleeve, Right Sleeve, and Neck.
  Colour input is capped at 9; Neck uses configured fees rather than standard
  print colour tiers.
- Embroidery uses configured size pricing and digitising fees.
- Optional per-item PK markup is included only when enabled.
- VAT comes from the calculator profile.
- EU quantity validation supports 50–2,000.
- Production price excludes garment and PK markups. Pins/customer price adds
  garment markup, opted-in PK markup, customer decoration/digitising cost, and
  VAT. Delivery is an optional separate helper and is excluded from calculator
  production, customer, VAT, profit, and quote totals.
- Quote formatting and detailed production/Pins breakdowns are generated from
  current calculation results.

## EU US Clients

EU US Clients uses profile `EU_US_CLIENTS`. It shares the EU engine, EUR
garments, print/embroidery architecture, quantity/input behavior, optional PK
markup, separate delivery helper, and calculation boundaries with EU Standard.

Its profile-specific markup/configuration and US-client quote formatter are the
meaningful differences. The formatter preserves the current `+ base` wording.

## UK Trade

UK Trade uses profile `UK_TRADE` and GBP pricing. It requires a GBP-priced
garment, a quantity of at least 50, and at least one print or embroidery item.

- Print floor tiers are 50, 100, 200, 500, 1,000, 2,500, 5,000, and 10,000.
- VAT is 20%.
- Standard print setup follows colour count. Non-white standard prints add an
  underbase screen; white/whites do not.
- Neck standard uses configured neck behavior and two setup screens; neck
  transfer uses no setup screens.
- Embroidery uses floor quantity tiers through 2,500. Stitch counts normalize
  to the 7,000–15,000 configured blocks, with additional 1,000-stitch blocks
  above 15,000.
- Screen and embroidery setup fees come from reference fees. Results expose
  detailed costs, VAT, setup, and quote output.

## EU Trade

EU Trade is deferred. There is no active route or profile. Do not implement it
until pricing and business rules are confirmed.

## Reference data and catalogue direction

The calculator schema includes garments, calculator profiles, pricing sets,
profile-price-set mappings, garment markups, EU/UK print tiers, EU/UK
embroidery pricing, calculator fees, and delivery rates.

`garment_type` remains transitional markup data. Product Types and their
`pricing_category` are the current category direction for management flows.
Generic Hoodies remains a temporary fallback while hoodie material and remaining
garment identity conflicts are reconciled; do not infer material-specific
pricing without reliable evidence.

## Verification boundary

The repository verifies current algorithms, migrations, and tests. It cannot
by itself verify remote seed/application state or real-world pricing, quote, and
export parity; those remain controlled operational/business checks.
