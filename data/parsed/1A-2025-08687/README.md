# IRCC ATIP release `1A-2025-08687` — Security Screenings (parsed & reconciled)

Counts of IRCC security screenings **initiated between January 1, 2019 and
December 31, 2025**, broken down by application/immigration stream, screening
activity type, citizenship, and processing office. The numbers were OCR-extracted
from the scanned PDF (`original-atip-requests/1A-2025-08687.pdf`, 76 pages),
then corrected and reconciled against the printed table.

Two datasets are combined here, distinguished by the `source` column:

| `source` | Stream | PDF pages |
|----------|--------|-----------|
| `trv`    | Temporary Resident | 1–40 |
| `pr`     | Permanent Resident | 41–76 |

## Files

| File | Contents |
|------|----------|
| `1A-2025-08687.sqlite3` | SQLite database — the authoritative copy. Two tables (below). |
| `1A-2025-08687.csv` | CSV dump of the `"1A-2025-08687"` table (office-level leaf rows). |
| `aggregation.csv` | CSV dump of the `aggregation` table (roll-up rows). |
| `README.md` | This file. |

Database tables:

- **`"1A-2025-08687"`** — office-level leaf rows (the actual data cells).
- **`aggregation`** — all roll-up rows (subtotals and grand totals).

The two CSVs are plain-text mirrors of the two tables (same columns, same rows).
Use whichever is convenient. The `.sqlite3` is the source of truth.

## Columns

Identical in both tables and both CSVs:

| Column | Meaning |
|--------|---------|
| `source` | `trv` or `pr` |
| `page` | PDF page the row was read from (provenance) |
| `category` | Top stream. TRV → application type (`SP`, `SP-EXT`, `TRV`, `VR-EXT`, `WP`, `WP-EXT`). PR → immigration category (`Economic`, `Family Class`, `Humanitarian & Compassionate / Public Policy`, `Protected Persons`, `Permit Holders Class`, `Unspecified`). |
| `activity_type` | Screening type. TRV → `VIT 34` / `VIT 35` / `VIT 37`. PR → `HIRV Screening` / `Org Crime Screening` / `Security Screening`. |
| `citizenship` | Country of citizenship |
| `office` | Visa / processing office (the leaf dimension) |
| `level` | Which tier of the hierarchy this row is (see below) |
| `total_2025` | Screenings initiated in calendar year 2025 |
| `total_2019_to_2025` | Screenings initiated over the whole period 2019–2025 (always ≥ `total_2025`) |
| `fix_status` | `NULL` for normal rows; `MISSING_DATA_PLACEHOLDER` for synthetic reconciliation rows |
| `fix_note` | Explanation, populated only on placeholder rows |

Blank numeric cells are stored as `NULL` (empty in the CSV) and mean zero.

A few `office` labels were truncated by the PDF's column width and are stored as
printed (e.g. `Global Case Management System (G`, `Yaounde (High Commission of
Canac`), which reflects the source rather than a parsing error.

## Hierarchy (the `level` column)

The report is a tree flattened into rows. `level` marks where a row sits,
outermost → innermost:

```
report_total
  └─ application_type / immigration_category
       └─ activity_type
            └─ citizenship
                 └─ office
```

- The **`"1A-2025-08687"`** (office) table holds **only** `level='office'` rows — the leaves.
- The **`aggregation`** table holds every roll-up level (`report_total`,
  `application_type`, `immigration_category`, `activity_type`, `citizenship`).

**Reconciliation invariant** (holds everywhere, for both value columns, per source):
each roll-up total equals the sum of the rows one level beneath it —
`citizenship` = Σ its offices, `activity_type` = Σ its citizenships,
`category` = Σ its activity_types, `report_total` = Σ its categories.

## How to use it

Read pre-computed subtotals straight from `aggregation` (they already match — no
need to re-sum). The overall grand totals are:

```sql
SELECT source, total_2025, total_2019_to_2025
FROM aggregation WHERE level='report_total';
-- trv -> 27527 / 195224      pr -> 14743 / 116725
```

Re-aggregate from the leaves yourself (matches the `aggregation` table):

```sql
SELECT source, category, activity_type, citizenship,
       SUM(total_2025)         AS y2025,
       SUM(total_2019_to_2025) AS y2019_2025
FROM "1A-2025-08687"
GROUP BY source, category, activity_type, citizenship;
```

**Rejoining offices to their roll-ups:** join on
`(source, category, activity_type, citizenship)`. ⚠️ This key is **not unique** in
one place — `Singapore` appears as 4 separate citizenship groups under
`pr / Protected Persons / Security Screening` (the source lists them separately, a
couple being an office literally named "Singapore"). For an unambiguous
office → roll-up link there, use row order or ask for an `id` column to be added.

## Placeholders: the `Missing data` rows

A few groups in the source PDF **do not foot** — the printed parent total ≠ the sum
of its visible detail rows. There are two causes:

1. **ATIP redaction** under s.16(1)(c) — small cells were withheld from the release.
2. The source document's **own subtotal disagrees** with its printed rows.

Rather than leave those groups unbalanced, one synthetic child row per group was
inserted so **all aggregations reconcile**:

- citizenship named `Missing data` and/or office named `Missing data`
- `fix_status = 'MISSING_DATA_PLACEHOLDER'`
- `total_2025` / `total_2019_to_2025` = the exact gap (parent − visible rows)
- `fix_note` = why the gap exists

There are **21** such rows (13 offices + 8 citizenships). A few have **negative**
values — those are the "source does not foot" cases where the printed detail
exceeds the printed subtotal.

```sql
-- as-printed (unpadded) data:
SELECT * FROM "1A-2025-08687"
WHERE fix_status IS NULL OR fix_status <> 'MISSING_DATA_PLACEHOLDER';
-- include placeholders (default) to keep every aggregation balanced.
```
