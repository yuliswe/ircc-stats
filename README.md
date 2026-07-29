# IRCC statistics

This repository holds Immigration, Refugees and Citizenship Canada (IRCC)
statistics that were released through Access to Information and Privacy (ATIP)
requests and through IRCC's monthly open-data updates, together with the code
that turns those numbers into a web report.

Most people who land here are looking for the underlying data rather than the
app, so this README tells you where the data lives and how the directories are
laid out. Everything is under `data/`.

## Where to find the data

```
data/
├── original-atip-requests/   Source PDFs (provenance only)
├── parsed/                    Structured data extracted from the PDFs
│   ├── 1A-2025-08687/
│   ├── A-2025-15779/
│   └── monthly-ircc-updates/
└── derived/                   Cross-datasets computed from the parsed releases
```

### `data/original-atip-requests/` — the source PDFs

Each file is the ATIP package that IRCC released in response to a request, named
after its ATIP request number (for example `A-2025-15779.pdf`). These scans are
image-only with no text layer, so they exist for provenance only and should not
be parsed directly. Use the parsed data instead. The directory's `README.md`
records the original request URL behind every PDF.

### `data/parsed/<release>/` — the structured data

This is what most people want. Each subdirectory is one release and holds the
data extracted and reconciled from the matching source PDF:

- a `.sqlite3` database, which is the source of truth;
- one or more `.csv` files that mirror the database tables in plain text;
- a `README.md` that documents the tables, columns, units, and caveats.

The releases currently present are:

- `data/parsed/1A-2025-08687/` — IRCC security screenings (TRV and PR), broken
  down by application stream, screening activity type, citizenship, and
  processing office.
- `data/parsed/A-2025-15779/` — citizenship grant and proof-of-citizenship
  processing times and volumes, broken down by country of birth.
- `data/parsed/monthly-ircc-updates/` — monthly permanent-resident intake,
  study-permit and temporary-resident processing, and TRV intake, broken down
  by source country.

Not every PDF has a parsed release yet, so the two directories do not map one to
one.

### `data/derived/` — cross-datasets

These CSVs are computed from the parsed releases rather than extracted from a
PDF, so they are generated products rather than a primary source. The directory's
`README.md` records exactly how each one was derived so that it can be
reproduced or audited.

## Read the per-release README before you use a dataset

Before you query, sum, or otherwise rely on any dataset, read the `README.md`
inside that release's directory. Each one is authoritative and documents things
you cannot infer from the column names alone, and which differ between releases:
the exact tables and their units, which rows are leaves versus roll-ups so that
you do not double-count, how suppressed or redacted cells are encoded versus a
true zero, and any synthetic reconciliation rows. Prefer the `.sqlite3` for
queries; the CSV files are there when a plain-text mirror is more convenient.

## Running the app

The repository also contains a Next.js web report built from this data. If you
want to run it, on macOS:

1. Make sure your `~/.zshrc` file has the following lines:

   ```
   if [ -f ./.zshrc ] && [ $(pwd) != ~ ]; then
     source ./.zshrc
   fi
   ```

2. Run the following once to set up the environment:

   ```
   ./initenv.bash
   ```

3. Start a new terminal session.
