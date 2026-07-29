# OPP-DART-2025-34337 — Security-screening non-favourable results by nationality

Structured data extracted from
`data/original-atip-requests/OPP-DART-2025-34337.pdf`, an Access to Information
(ATIP) release from Immigration, Refugees and Citizenship Canada (IRCC). The PDF
is an image-only scan with no text layer, so this dataset was produced by
rendering the pages at 300 DPI and transcribing the tables by hand, cross-checked
against enlarged crops of each column.

- **Source data & date:** IRCC-EDW (CBR), refreshed August 18, 2025. Data is
  operational and subject to change. Tracking: OPP-DART-2025-34337.
- **Coverage:** applications **referred to security screening between January 1,
  2019 and July 31, 2025** whose **Security Screening Activity Status is
  Non-Favourable** (the release states "Non-Favourable means Failed"), broken down
  by **nationality** and calendar year (2019 → 2025, where 2025 covers Jan–Jul).
- **Application families:** _PR_ (permanent residence) and _TR_ (temporary
  residence), reported as two separate blocks in the source.

Only the **non-favourable-results** table (source pages 16–19, bates 000142–000145)
was extracted. The companion table that merely counts referrals to security
screening was deliberately not extracted, per the request.

## Files

| file                              | description                                                                |
| --------------------------------- | -------------------------------------------------------------------------- |
| `unfavourable_pr.csv`             | PR block — 83 nationality rows + one section-total row                     |
| `unfavourable_tr.csv`             | TR block — 102 nationality rows + one section-total row                    |
| `unfavourable_by_nationality.csv` | PR + TR combined, with an `application_type` column, nationality rows only |

### Column layout

- **`unfavourable_pr.csv` / `unfavourable_tr.csv`** (10 columns): `country_raw,
country, iso3, 2019, 2020, 2021, 2022, 2023, 2024, 2025_jan_jul`.
- **`unfavourable_by_nationality.csv`** (11 columns): the same, prefixed with
  `application_type` (`PR` or `TR`).

`country_raw` preserves the label exactly as printed in the scan; `country` is a
normalized common name; `iso3` is the ISO 3166-1 alpha-3 code. Values are counts
of applications with a non-favourable (failed) screening result.

### The `iso3` column

`iso3` is resolved from the normalized `country` column (not the source-clipped
`country_raw`) using the same name→ISO3 resolver the site's `build:data` step
uses (`scripts/build-viz-data.mts`), so the codes match the rest of the repo.
Notably Kosovo resolves to the user-assigned code `UNK` (consistent with the
`world-countries` dataset used across the project), and the Democratic Republic
of the Congo resolves to `COD`. `iso3` is left **empty** only for the rows that
have no country code: the section-total rows and `Stateless`. Every nationality
row is coded. No two distinct nationalities share a code.

### Section-total rows

`unfavourable_pr.csv` and `unfavourable_tr.csv` each end with a single row whose
`country` reads `PR (all nationalities)` / `TR (all nationalities)`. This carries
the block subtotal printed in the header band of the source table (PR =
185/125/260/195/145/75/5; TR = 810/205/300/520/550/225/70 across the seven year
columns). **Exclude this row when summing over nationalities.** The combined file
has no total rows. The overall grand total across PR + TR printed at the foot of
the source table is 990/330/560/715/695/300/80.

## Reading the values

- **`--`** means the value was **suppressed**: the underlying count is between 0
  and 5 (i.e. 1–4) and IRCC replaces it with `--` for privacy. It is _not_ zero
  and _not_ missing data.
- **`0`** is a literal zero.
- All other values are **rounded down to a multiple of 5**. Because of suppression
  and rounding, the nationality rows do not sum exactly to the printed totals, and
  the totals themselves are rounded — treat every figure as approximate.

## Extraction notes and caveats

- The source clips the nationality column to a fixed width, so several country
  names are physically truncated in the scan and cannot be recovered from the PDF
  itself. Where the intended country is unambiguous, `country` gives the full
  name while `country_raw` keeps the clipped text. The affected labels and their
  normalizations are: `Congo, Democratic Repu` → Congo, Democratic Republic of the;
  `East Timor, Democratic F` → East Timor (Timor-Leste); `Federal Republic of Came`
  → Cameroon; `Federal Republic of Germ` → Germany; `People's Republic of Chin` →
  China; `Peoples Republic of Beni` → Benin; `Socialist Republic of Viet` →
  Vietnam; `Somalia, Democratic Rep` → Somalia; `Mongolia, People's Repu` →
  Mongolia; `Trinidad and Tobago, Re` → Trinidad and Tobago; `United Kingdom and
Ove` → United Kingdom and Overseas Territories; `South Sudan, Republic O` →
  South Sudan; `Democratic Republic of S` → Sudan (deduced, see below);
  `Palestinian Authority (Ga` → Palestinian Authority (Gaza/West Bank), where the
  parenthetical is inferred and should be verified against the source.
- **Deduced name — Sudan:** `Democratic Republic of S` appears in both the PR and
  TR blocks (sorted between "Cuba"/"Czech Republic" and "Denmark"). The source
  clips it after the leading "S" even at 600 DPI, so the full string is not
  recoverable from the scan. It is **Sudan** (`SDN`): IRCC's country reference
  writes Sudan as "Democratic Republic of Sudan", the only entry that both starts
  with "Democratic Republic of S" and sorts into that alphabetical slot. It is
  distinct from the separately listed "Somalia, Democratic Rep" (Somalia) and
  "South Sudan, Republic O" (South Sudan), and Sudan appears nowhere else in the
  release. `country_raw` still preserves the clipped text; `country` and `iso3`
  carry the deduced Sudan / `SDN`.
- `country_raw` values such as `Chad, Republic of`, `Guinea, Republic of`,
  `Kosovo, Republic of`, `Yemen, Republic of`, `Republic of Indonesia`,
  `Republic of Ivory Coast`, `Republic of South Africa`, `Republic of Ireland`,
  `Bosnia-Hercegovina`, `Hong Kong SAR`, `The Netherlands`, `St. Kitts-Nevis`, and
  `Burkina-Faso` are normalized to their common short forms in `country`.
