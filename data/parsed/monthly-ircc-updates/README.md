# Monthly IRCC updates

Monthly operational counts published by Immigration, Refugees and Citizenship
Canada (IRCC), broken down by source country. IRCC distributes the figures as
Excel workbooks on its open-data site, and this directory keeps a flattened CSV
extract of each workbook alongside a SQLite database built from them. The
[Datasets](#datasets) section catalogues every extract, and [Sources](#sources)
records the exact download URL behind each one so it can be traced back to, and
refreshed from, its origin.

## Datasets

Each CSV is a tidy long extract of one IRCC workbook.

| CSV                   | Description                                                          |
| --------------------- | ------------------------------------------------------------------- |
| `pr_intake.csv`       | New permanent-residence applications received (intake).             |
| `copr_issued.csv`     | Confirmation of Permanent Residence (COPR) documents issued.        |
| `trv_intake.csv`      | New temporary-resident-visa applications received (intake).         |
| `tr_processed.csv`    | Temporary-residence applications finalized (processed).             |
| `tr_approved.csv`     | Temporary-residence applications approved.                          |
| `sp_processed.csv`    | Study-permit applications finalized (processed).                    |
| `trv_v1_approved.csv` | Temporary-resident (visitor, V-1) visas approved.                   |
| `pr_citz.csv`         | Permanent residents admitted (landings), by country of citizenship. |

Each workbook is a wide cross-tab in which countries run down the rows and a
month band (January–December plus a per-year `Total` column) runs across the
columns, with the year label printed once above each January. The extracts
reshape that cross-tab into the tidy long format described under [Files](#files),
one observation per row.

The first seven extracts share the columns `country, year, month, value`.
`pr_citz.csv` is the exception, because `EN_ODP-PR-Citz.xlsx` is a finer
permanent-residence-by-citizenship series that reaches back to 2015 and carries
quarter subtotals; its extract uses a `period` column in place of `month`, where
`period` is one of `Jan`…`Dec` or a quarter subtotal `Q1 Total`…`Q4 Total`.

## Sources

The workbooks all live under
`https://www.ircc.canada.ca/opendata-donneesouvertes/data/`, and the URLs below
are that base followed by the (space-containing) workbook filename.

| CSV                   | URL                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pr_intake.csv`       | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20PR%20Intake%20en.xlsx        |
| `copr_issued.csv`     | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20COPR%20Issued%20en.xlsx      |
| `trv_intake.csv`      | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20TRV%20Intake%20en.xlsx       |
| `tr_processed.csv`    | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20TR%20Processed%20en.xlsx     |
| `tr_approved.csv`     | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20TR%20Approved%20en.xlsx      |
| `sp_processed.csv`    | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20SP%20Processed%20en.xlsx     |
| `trv_v1_approved.csv` | https://www.ircc.canada.ca/opendata-donneesouvertes/data/Open%20Data%20-%20OPS%20TRV%20V-1%20Approved%20en.xlsx |
| `pr_citz.csv`         | https://www.ircc.canada.ca/opendata-donneesouvertes/data/EN_ODP-PR-Citz.xlsx                                  |

## Files

- The monthly extracts (every CSV except `pr_citz.csv`) are tidy long, one row
  per (country, year, month), with columns:

  | Column    | Meaning                                                          |
  | --------- | ---------------------------------------------------------------- |
  | `country` | Source country. The literal `Total` denotes the all-countries aggregate row carried over from the workbook. |
  | `year`    | Calendar year (2023–2026 as published).                          |
  | `month`   | `January`…`December`, or `Total` for the workbook's per-year total column. |
  | `value`   | The count. Empty when IRCC suppressed the cell (see below).      |

  `pr_citz.csv` follows the same shape but replaces `month` with `period` (see
  [Datasets](#datasets)).

- `ircc-monthly-updates.sqlite3` — SQLite database built from the original three
  monthly datasets (`pr_intake`, `sp_processed`, `trv_intake`) only; the other
  five CSVs are not yet folded into it. The per-country monthly observations live
  in `monthly_stats`, while the workbook's aggregate rows are kept separately in
  `monthly_totals`. There is also one view per dataset.

## Suppression and zeros

IRCC suppresses small counts to protect privacy, marking those cells with `--`
in the source. These are distinct from a genuine count of `0`:

- In the CSVs, a suppressed cell is an **empty** `value`, whereas a true zero is
  written as `0`.
- In the database, a suppressed cell has `value IS NULL` and `suppressed = 1`,
  whereas a true zero has `value = 0` and `suppressed = 0`.
