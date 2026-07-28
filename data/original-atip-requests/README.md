# Original ATIP request PDFs

This directory holds the source PDFs behind the parsed releases under
`data/parsed/`. Each file is the Access to Information and Privacy (ATIP)
package that Immigration, Refugees and Citizenship Canada (IRCC) released in
response to a request, and every package is an image-only scan with no text
layer, so these files exist for **provenance only** and should not be parsed
directly. The structured data lives in the matching `data/parsed/<request>/`
directory, which records how each PDF was OCR-extracted and reconciled.

Each PDF is named after its ATIP request number. The table below records, for
every file, a reference URL that points at the original ATIP request on the
Government of Canada open-government portal (`open.canada.ca`), rather than at
any PDF download, so that each release can be traced back to, or re-requested
from, its origin.

## Files

| PDF                 | Organization | Summary                                                                                                                                                                                            | Pages | Released  | Reference URL                                                                   |
| ------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------- | ------------------------------------------------------------------------------- |
| `1A-2025-08687.pdf` | IRCC         | Number of security screenings initiated between January 1, 2019 and December 31, 2025, broken down by application/immigration stream, screening activity type, citizenship, and processing office. | 76    | 2025      | https://open.canada.ca/en/search/ati?search_api_fulltext=1A-2025-08687          |
| `A-2025-15758.pdf`  | IRCC         | Family Class and Spouse or Common-Law Partner In-Canada Class Application Processing Time Statistics (2018-01-01 to 2025-03-31).                                                                   | 2151  | July 2025 | https://open.canada.ca/en/search/ati/reference/07c42e73983adaff6fd3f7db12132b0f |
| `A-2025-15779.pdf`  | IRCC         | Citizenship Application Processing Time Statistics (2018 to March 2025); internal statistical data on citizenship applications processed by IRCC.                                                  | 22    | June 2025 | https://open.canada.ca/en/search/ati/reference/dcb03180b3b078f7c3b815937868554e |

## Notes

- `1A-2025-08687` carries the `1A` prefix because it is an informal re-release of
  previously disclosed records rather than an original formal request, and the
  open-government portal does not catalogue it under its own request page. The
  reference URL above is therefore a search link on the request number instead of
  a `…/ati/reference/…` request page, and it may return no direct hit.
- `A-2025-15758.pdf` is currently a zero-byte placeholder in this directory; the
  reference URL still points at the correct request so the file can be populated
  later.

## Adding a new PDF

This README is a template. When a new ATIP PDF is added, drop the file in this
directory named after its request number and append a row to the [Files](#files)
table. Find the reference URL by searching the request number on the open-data
portal at `https://open.canada.ca/en/search/ati`, then copy the
`…/ati/reference/…` link from the matching result's request page — this is the
original ATIP request, not a PDF download. If the request is an informal
re-release that has no request page of its own, record a
`…/search/ati?search_api_fulltext=<request-number>` search link instead and note
the exception here.
