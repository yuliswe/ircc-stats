---
name: extract-data
description: Locate the IRCC dataset files for data extraction or analysis in this repo. Use whenever a task needs the underlying numbers — building or changing a chart, adding a `build:data` source, writing a query, or answering a question about IRCC counts. Points to the data directories and requires reading each dataset's own README before use.
---

# Where the data lives

All datasets are under `data/`:

- `data/original-atip-requests/` — the source PDFs (image-only ATIP scans). Provenance only; do not parse these directly.
- `data/parsed/<release>/` — one directory per release, holding the extracted data: a `.sqlite3` (the source of truth), one or more `.csv` mirrors of its tables, and a `README.md` describing them.
- `data/*.csv` at the top level — hand-derived cross-datasets built from the parsed releases (e.g. `screening_vs_applications_2025.csv`).

The parsed releases currently present:

- `data/parsed/1A-2025-08687/` — security screenings (TRV + PR), by stream / activity type / citizenship / office.
- `data/parsed/A-2025-15779/` — citizenship grant & proof processing times and volumes, by country of birth.
- `data/parsed/monthly-ircc-updates/` — monthly PR intake, study-permit processed, and TRV intake, by source country.

# Before you extract: read the README

**Always read `data/parsed/<release>/README.md` for every release you touch before querying, summing, or wiring it into code.** Do not assume the schema. Each README is authoritative and documents things you cannot infer from the columns alone, and which differ per release:

- the exact tables/CSVs, their columns, and units;
- the aggregation hierarchy and which rows are leaves vs. roll-ups (so you don't double-count);
- how blanks are encoded — a suppressed/redacted cell (`--`, `NULL`, empty) versus a true `0`;
- synthetic reconciliation rows and other placeholders (e.g. `Missing data`, `MISSING_DATA_PLACEHOLDER`), including negative values;
- join keys and any known caveats where a key is not unique.

Prefer the `.sqlite3` for queries; the CSVs are plain-text mirrors of the same tables when a CSV is more convenient.

# How the data reaches the app

`scripts/build-viz-data.mts` (run via `npm run build:data`) reads the parsed CSVs, resolves citizenships to ISO-3166 codes, and emits `src/data/generated/viz.json`. The browser reads only that JSON — never the CSVs or SQLite. When adding a new source, parse it in that build script (or a helper it imports) and extend the `VizData` contract in `src/lib/viz-types.ts`.
