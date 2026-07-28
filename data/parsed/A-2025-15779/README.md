# A-2025-15779 — IRCC Citizenship Processing & Volume Statistics

Structured data extracted from `data/original-atip-requests/A-2025-15779.pdf`, an
Access to Information (ATIP) release from Immigration, Refugees and Citizenship
Canada (IRCC). The PDF is a 22-page image-only scan (no text layer); this dataset
was produced by OCR + coordinate-based table reconstruction.

- **Source data & date:** IRCC-EDW, refreshed May 23, 2025. Data more recent than
  April 30, 2025 has not been publicly released. Tracking: OPP-DART-2025-32468.
- **Coverage:** by **country of birth**, calendar years **2018 → March 2025**.
- **Application families:** _Grant of citizenship_ (categories Grant 5(1) & 5(2))
  and _Proof of Citizenship_.

## Files

| file                   | description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `A-2025-15779.sqlite3` | SQLite database — 6 data tables + `tables_meta` + `extraction_issues` |
| `*.csv`                | one CSV per data table (same content as the DB tables)                |

## The six tables

Each table is broken down by country of birth (~190–198 country rows) plus an
`Other Countries` catch-all (unknown/missing/invalid origin) and an
`Overall`/`Grand Total` summary row.

|                          | processing time — months (80th pct)† | processing time — days (average)‡ | volume — counts          |
| ------------------------ | ------------------------------------ | --------------------------------- | ------------------------ |
| **Grant of citizenship** | `grant_e2e_processing_months`        | `grant_avg_processing_days`       | `grant_finalized_counts` |
| **Proof of Citizenship** | `poc_e2e_processing_months`          | `poc_avg_processing_days`         | `poc_processed_counts`   |

† Maximum number of **months** to process the fastest **80%** of applications
finalized in a defined 6-month period (end-to-end = application received →
finalized).
‡ **Average** number of **days** to process applications finalized in a defined
12-month period.

### Column layout

- **Processing-time tables** (10 columns): `country_raw, country, 2018, 2019, 2020,
2021, 2022, 2023, 2024,` and a final column — `mar_2025` (months tables) or
  `2025_jan_mar` (days tables). Values are months or days.
- **`grant_finalized_counts`** (34 columns): `country_raw, country,` then for each
  year 2018–2024 plus `2025_jan_mar`, four sub-columns
  `<year>_citizen, <year>_not_granted, <year>_other_closures, <year>_total`.
  Total = citizen + not*granted + other_closures. \_Other closures* = abandoned,
  withdrawn, administrative closure, deceased, incomplete, wrong form, etc.
- **`poc_processed_counts`** (26 columns): `country_raw, country,` then for each
  year `<year>_approved, <year>_refused, <year>_total`. Total = approved + refused.

`country` is the normalized name; `country_raw` preserves the raw OCR text.

### Supporting tables

- **`tables_meta`** — `name, kind, n_rows, description` for each data table.
- **`extraction_issues`** — cells that could not be extracted. `issue =
'unfixable_obscured'` marks cells physically overprinted by the ATIP bates stamp
  or disclosure watermark in the source scan (stored as `NULL` in the data
  tables); `issue = 'name_unresolved'` flags a country name OCR could not resolve.
