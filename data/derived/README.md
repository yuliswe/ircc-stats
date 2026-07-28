# Derived datasets

Cross-datasets computed from the parsed IRCC releases under `data/parsed/`. Each
file here is generated, not a primary source; this README records exactly how it
was derived so that it can be reproduced or audited.

## `screening_vs_applications_2025.csv`

For the 2025 calendar year, this table pairs each citizenship's count of
security-screening referrals with the volume of applications it submitted, so a
referral **rate over applications** (the chance of being referred) can be
computed rather than only a rate over screenings. It is the source of the Bias
Explorer's referral-rate view (`screeningApplications` in
`src/data/generated/viz.json`).

### Inputs

| Group               | Source                                                        | Provides                                                             |
| ------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Screening referrals | `data/parsed/1A-2025-08687/` (the security-screening release) | Per-citizenship 2025 referral counts by screening activity type.     |
| Application volumes | `data/parsed/monthly-ircc-updates/`                           | Per-country 2025 PR intake, study permits processed, and TRV intake. |

### Screening-referral columns

These come from the `1A-2025-08687` release, using its **`total_2025`** count
column (not the cumulative `total_2019_to_2025`). For each citizenship, the
office-level leaves are summed to a citizenship × activity-type total, exactly
the reconciled figures the Bias Explorer uses. The release splits screening into
two streams by its `source` column, and the columns follow that split:

| Column      | Stream | `1A-2025-08687` activity type | Notes                             |
| ----------- | ------ | ----------------------------- | --------------------------------- |
| `vit_34`    | TRV    | `VIT 34`                      |                                   |
| `vit_35`    | TRV    | `VIT 35`                      |                                   |
| `vit_37`    | TRV    | `VIT 37`                      |                                   |
| `hirv`      | PR     | `HIRV Screening`              | Human-rights-violation screening. |
| `org_crime` | PR     | `Org Crime Screening`         |                                   |
| `security`  | PR     | `Security Screening`          |                                   |

An activity-type cell that is blank in the release is written here as `0`.
Two subtotals and a grand total are derived from those six columns:

- `trv_subtotal` = `vit_34 + vit_35 + vit_37` (the TRV stream).
- `pr_subtotal` = `hirv + org_crime + security` (the PR stream).
- `referred_any_type_2025_fullyear` = `trv_subtotal + pr_subtotal`, the total
  referrals of any type. It equals the sum of all six activity columns.

### Application-volume columns

These are the 2025 published per-year totals (`year = 2025`, `month = 'Total'`)
from the monthly extracts documented in
`data/parsed/monthly-ircc-updates/README.md`:

| Column                       | Source extract | Meaning                                        |
| ---------------------------- | -------------- | ---------------------------------------------- |
| `pr_intake_2025_fullyear`    | `pr_intake`    | Permanent-residence applications received.     |
| `sp_processed_2025_fullyear` | `sp_processed` | Study permits processed.                       |
| `trv_intake_2025_fullyear`   | `trv_intake`   | Temporary-resident-visa applications received. |

The denominator column is the sum of the two **intake** series only:

- `total_applications_2025_fullyear` = `pr_intake_2025_fullyear +
trv_intake_2025_fullyear`.

Study permits are reported as _processed_ rather than _received_, so
`sp_processed_2025_fullyear` is carried for context but deliberately left out of
the applications denominator, which mixes only comparable intake counts.

## `tr_approval_vs_applications_2025.csv`

For the 2025 calendar year, this table pairs the number of temporary-residence
applications **approved** with the number **processed** for each source country,
and derives the approval and non-approval outcomes from that pair.

### Inputs

Both inputs are the monthly IRCC operational extracts documented in
`data/parsed/monthly-ircc-updates/README.md`:

| Input          | File                                                | Meaning                                                 |
| -------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `tr_approved`  | `data/parsed/monthly-ircc-updates/tr_approved.csv`  | Temporary-residence applications approved.              |
| `tr_processed` | `data/parsed/monthly-ircc-updates/tr_processed.csv` | Temporary-residence applications finalized (processed). |

### Which figure is used as the yearly total

Each input carries, for every country, a published per-year `Total` column
(`month = 'Total'`, `year = 2025`) alongside the twelve monthly cells. This
derivation uses that **published `Total`** as the yearly figure rather than
summing the twelve months. IRCC rounds every published cell independently to the
nearest multiple of 5, so the annual total (rounded once from the true annual
figure) does not equal the sum of the twelve already-rounded monthly cells, and
the sum also silently undercounts any month IRCC suppressed. The published
`Total` avoids both problems and is IRCC's own annual figure. As a result every
count in this file is a multiple of 5.

### Columns

| Column                 | Derivation                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `country`              | Source-country label, carried over verbatim from the inputs.  |
| `tr_approved`          | The country's 2025 published `Total` from `tr_approved.csv`.  |
| `tr_processed`         | The country's 2025 published `Total` from `tr_processed.csv`. |
| `tr_non_approval`      | `tr_processed − tr_approved`.                                 |
| `tr_approval_rate`     | `tr_approved ÷ tr_processed`, rounded to four decimals.       |
| `tr_non_approval_rate` | `1 − (tr_approved ÷ tr_processed)`, rounded to four decimals. |

### Suppression, missing values, and zero denominators

IRCC suppresses counts of 1 to 4 to protect privacy, publishing them as an empty
cell (see the suppression note in the monthly-updates README). This derivation
never guesses a suppressed value, so a derived field is left **empty** whenever
it cannot be computed exactly:

- If either `tr_approved` or `tr_processed` is suppressed, that count is empty
  and `tr_non_approval`, `tr_approval_rate`, and `tr_non_approval_rate` are all
  empty as well.
- If `tr_processed` is `0`, the two rates are undefined (division by zero) and
  are left empty, while `tr_non_approval` is still written (it is `0`).

Across the 216 rows, 13 have a suppressed `tr_approved` total and 10 a
suppressed `tr_processed` total, and five countries (Guadeloupe, Liechtenstein,
Martinique, Reunion, and The Netherlands Antilles) processed zero applications;
those rows therefore have empty rates. `tr_approved` never exceeds
`tr_processed`, so `tr_non_approval` is never negative.

### Aggregate rows

Two of the 216 rows are aggregates carried over from the source workbooks rather
than individual countries, and consumers that want only per-country figures
should exclude them:

- `Total` — the all-countries aggregate. In 2025, 2,815,455 of 4,723,515
  processed applications were approved, an approval rate of 0.5961.
- `Other*` — IRCC's residual bucket for applications not attributed to a listed
  country.

### Reproducing

The table is produced by reading the two inputs, selecting each country's
`year = 2025`, `month = 'Total'` cell, and applying the derivations above.
Regenerate this file whenever the monthly `tr_approved` and `tr_processed`
extracts change.
