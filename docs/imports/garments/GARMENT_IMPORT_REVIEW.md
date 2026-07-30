# Garment Import Review

## Summary

61 workbook garment rows prepared. 45 are READY and 16 use the temporary generic `Hoodies` fallback. The reviewed import migrations map all 61 rows without guessing hoodie material.

## Ready Records

45 records have a high-confidence Product Type mapping.

## Generic Hoodie Fallback

`20260728170000_add_generic_hoodies_product_type.sql` adds the active `Hoodies` Product Type with the `HOODIE` pricing category. It is a temporary non-material-specific fallback; `Hoodies - cotton` and `Hoodies - poly / cotton` remain active and must replace these mappings when reliable material evidence is available.

All 16 previously unresolved hoodie rows now use this fallback:

- Garments!7, !12, !13, !17, !18, !19, !22, !23
- Garments!26, !30, !39, !40, !41, !44, !50, !62

The fallback synchronizes the transitional `garment_type` to `HOODIE`, so it uses the existing database-driven hoodie markup. EU US Clients remains €4.00 per garment; EU Standard profile data and UK Trade pricing are not changed.

## Hoodie Import Operations

Inserted because no safe existing identity was present:

- Garments!17: JH011 | AWDis | Epic Print Hoodie
- Garments!62: JH050 | AWDis | Zoodie

Existing rows remapped without changing identity or price fields:

- Exact identity: Garments!7, !26, !30, !39, !40, !41, !44, !50
- Safe code + brand + colour identity: Garments!12, !13, !18, !19, !22, !23

The latter six retain their pre-existing legacy names. Code, brand, and colour uniquely identify their matching active row, so only `product_type_id` and transitional `garment_type` are updated.

## Existing Record Conflicts

The hoodie conflicts were reviewed by the forward migration. No hoodie conflict is left unchanged: six legacy-name conflicts are safely remapped by unique code + brand + colour, and two previously excluded rows are inserted. The following non-hoodie conflicts remain manual-review items:

- Garments!3: W101 | Westford Mill | Bag for life - long handles | White / Natural — Source identity differs from existing active record; do not update without review.
- Garments!4: BB653 | Beechfield | Beechfield Low Profile 6 Panel Dad Cap | (blank colour) — Source identity differs from existing active record; do not update without review.
- Garments!20: GD21 | Gildan | Hammer Heavyweight T-Shirt | Whites — Source identity differs from existing active record; do not update without review.
- Garments!21: GD21 | Gildan | Hammer Heavyweight T-Shirt | Colours — Source identity differs from existing active record; do not update without review.
- Garments!24: GD05 | Gildan | Heavy Cotton T-Shirt | Colours — Source identity differs from existing active record; do not update without review.
- Garments!25: GD05 | Gildan | Heavy Cotton T-Shirt | White, Natural — Source identity differs from existing active record; do not update without review.
- Garments!35: W265 | Westford Mill | Organic Premium Cotton Maxi Tote Bag | (blank colour) — Source identity differs from existing active record; do not update without review.
- Garments!42: GD01 | Gildan | SoftStyle Adult T-Shirt | Colours — Source identity differs from existing active record; do not update without review.
- Garments!43: GD01 | Gildan | SoftStyle Adult T-Shirt | Whites — Source identity differs from existing active record; do not update without review.
- Garments!52: GD14 | Gildan | Ultra Cotton Long Sleeve T-Shirt | Colours — Source identity differs from existing active record; do not update without review.
- Garments!53: GD14 | Gildan | Ultra Cotton Long Sleeve T-Shirt | Whites — Source identity differs from existing active record; do not update without review.
- Garments!54: GD02 | Gildan | Ultra Cotton T-Shirt | Whites — Source identity differs from existing active record; do not update without review.
- Garments!55: GD02 | Gildan | Ultra Cotton T-Shirt | Colours — Source identity differs from existing active record; do not update without review.
- Garments!57: CV3001 | Bella Canvas | Unisex Crew Neck T-Shirt | Whites — Source identity differs from existing active record; do not update without review.
- Garments!58: W101 | Westford Mill | Westford Mill Bag For Life - Long Handles | Colours — Source identity differs from existing active record; do not update without review.

## Product Type Coverage

Product Types referenced by READY garments:

- Baseball cap
- Tote bags
- Long sleeve tees
- Cotton T-shirt/Tank Top
- Beanies

The 16 hoodie records use the temporary `Hoodies` fallback.

## Remaining Decisions

Replace each generic `Hoodies` mapping with `Hoodies - cotton` or `Hoodies - poly / cotton` only when reliable material evidence is available. Do not infer the material from the product name.
