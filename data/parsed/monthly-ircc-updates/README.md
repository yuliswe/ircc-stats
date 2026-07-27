# Monthly IRCC updates

Monthly operational counts published by Immigration, Refugees and Citizenship
Canada (IRCC), broken down by source country. The figures were originally
distributed as three Excel workbooks ("Open Data - OPS … en.xlsx"), which have
since been removed. This directory keeps the flattened CSV extracts and a
SQLite database built from them.

## Datasets

| Key            | Description                          | Source workbook                          |
| -------------- | ------------------------------------ | ---------------------------------------- |
| `pr_intake`    | Permanent Residence – Intake         | Open Data - OPS PR Intake en.xlsx        |
| `sp_processed` | Study Permit – Processed             | Open Data - OPS SP Processed en.xlsx     |
| `trv_intake`   | Temporary Resident Visa – Intake     | Open Data - OPS TRV Intake en.xlsx       |

Each workbook is a wide cross-tab in which source countries run down the rows
and a month band (January–December plus a per-year `Total` column) runs across
the columns, with the year label printed once above each January. The extracts
below reshape that cross-tab into a tidy long format, one observation per row.

## Files

- `pr_intake.csv`, `sp_processed.csv`, `trv_intake.csv` — tidy long extracts,
  one row per (country, year, month), with columns:

  | Column    | Meaning                                                          |
  | --------- | ---------------------------------------------------------------- |
  | `country` | Source country. The literal `Total` denotes the all-countries aggregate row carried over from the workbook. |
  | `year`    | Calendar year (2023–2026 as published).                          |
  | `month`   | `January`…`December`, or `Total` for the workbook's per-year total column. |
  | `value`   | The count. Empty when IRCC suppressed the cell (see below).      |

- `ircc-monthly-updates.sqlite3` — SQLite database holding all three datasets. The
  per-country monthly observations live in `monthly_stats`, while the workbook's
  aggregate rows are kept separately in `monthly_totals`. There is also one view
  per dataset.

## Suppression and zeros

IRCC suppresses small counts to protect privacy, marking those cells with `--`
in the source. These are distinct from a genuine count of `0`:

- In the CSVs, a suppressed cell is an **empty** `value`, whereas a true zero is
  written as `0`.
- In the database, a suppressed cell has `value IS NULL` and `suppressed = 1`,
  whereas a true zero has `value = 0` and `suppressed = 0`.

## Database schema

`monthly_stats` holds only the real monthly observations, one row per
(dataset, country, year, month), with no aggregate rows:

```sql
CREATE TABLE monthly_stats (
    dataset       TEXT    NOT NULL,   -- pr_intake | sp_processed | trv_intake
    dataset_label TEXT    NOT NULL,   -- human-readable dataset name
    country       TEXT    NOT NULL,   -- source country (never 'Total')
    year          INTEGER NOT NULL,
    month         TEXT    NOT NULL,   -- 'January'..'December' (never 'Total')
    value         INTEGER,            -- NULL where IRCC suppressed the cell ('--')
    suppressed    INTEGER NOT NULL    -- 1 if the source cell was '--', else 0
);
```

`monthly_totals` holds the aggregate rows lifted out of the workbook. It shares
the same columns and adds an `agg_kind` tag identifying which kind of total each
row is:

```sql
CREATE TABLE monthly_totals (
    dataset       TEXT    NOT NULL,   -- pr_intake | sp_processed | trv_intake
    dataset_label TEXT    NOT NULL,   -- human-readable dataset name
    country       TEXT    NOT NULL,   -- source country, or 'Total' for the all-countries aggregate
    year          INTEGER NOT NULL,
    month         TEXT    NOT NULL,   -- 'January'..'December', or 'Total' for the per-year total
    value         INTEGER,            -- NULL where IRCC suppressed the cell ('--')
    suppressed    INTEGER NOT NULL,   -- 1 if the source cell was '--', else 0
    agg_kind      TEXT    NOT NULL    -- see below
);
```

`agg_kind` distinguishes the three ways a row can be an aggregate:

| `agg_kind`      | Meaning                                                              |
| --------------- | ------------------------------------------------------------------- |
| `year_total`    | A country's per-year total (`month = 'Total'`, a real `country`).   |
| `country_total` | The all-countries aggregate for one month (`country = 'Total'`).    |
| `grand_total`   | The all-countries per-year total (`country = 'Total'` and `month = 'Total'`). |

Each table has a covering index on `(dataset, country, year, month)`. The
convenience view per dataset (`pr_intake`, `sp_processed`, `trv_intake`) reads
from `monthly_stats` and exposes `country, year, month, value`, so the views
contain only real monthly observations.

`monthly_stats` has 25,338 rows (`pr_intake` 8,364, `sp_processed` 8,159,
`trv_intake` 8,815). `monthly_totals` has 2,607 rows (`pr_intake` 861,
`sp_processed` 841, `trv_intake` 905).

## Querying

Because `monthly_stats` no longer carries any aggregate rows, you can sum it
directly without filtering. Read a precomputed total from `monthly_totals` when
you want IRCC's own figure rather than one you derive yourself:

```sql
-- Study permits processed for India, by month in 2024 (real months only):
SELECT month, value
FROM sp_processed              -- view over monthly_stats
WHERE country = 'India' AND year = 2024;

-- Sum the detail table directly; no Total rows to exclude:
SELECT country, SUM(value) AS total_2024
FROM monthly_stats
WHERE dataset = 'trv_intake'
  AND year = 2024
GROUP BY country
ORDER BY total_2024 DESC;

-- IRCC's own published per-country year total for the same slice:
SELECT country, value AS total_2024
FROM monthly_totals
WHERE dataset = 'trv_intake'
  AND year = 2024
  AND agg_kind = 'year_total'
ORDER BY total_2024 DESC;
```
