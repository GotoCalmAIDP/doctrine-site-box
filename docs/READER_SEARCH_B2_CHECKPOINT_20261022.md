# B2 — local search and reading shell

Status: first complete source increment; ready for independent source review.
Browser acceptance and screenshots are pending the manager-confirmed release of A's single managed-preview slot. This checkpoint is not a deployment claim.

## Identity and scope

- Repository: `GotoCalmAIDP/doctrine-site-box` only.
- Branch: `site/reader-search-20261022`, based on fresh published main `fc035df7090b33849d6813707ceb6ab25288a03d`.
- Instruction: B2 on [B assignment](https://app.notion.com/p/4012a14e14ce81d6afa7e02a99bda6bc).
- Runtime remains exact shared r2 `df4ea1292f6c356950f25e46e6025f68304c8ab8`, release `gotocalm-screening-portable-20261022-v14-r2`.
- Shared manifest SHA256: `619492406980509341b4b99175c762ff116a595c25459722324bd6815763a53d`; all nine selected asset bytes and hashes unchanged.

## Delivered

The existing EN/UA Index Note pages retain their complete canonical articles. A separate template sibling supplies search, reached directly from Search / Пошук in the main navigation. Search uses two deterministic static JSON indexes generated from the built main articles at precisely the `pageMetadata` allowlist routes. The ordinary build performs generation for both integrity and Pages deployment. The already locked Eleventy dependency tree supplies `htmlparser2`; no dependencies or lockfile changes were added.

Search includes public titles, headings, article text and DOI link targets; it excludes the document shell, scripts, styles, hidden content and search controls. Nothing crawls Notion, DOCX, repository docs/backups, browser sessions or visitor documents. Queries stay in memory, with no query-bearing fetch, URL, storage or telemetry. Matching is literal and case-insensitive, preserves Ukrainian letters, normalizes apostrophes/Unicode, requires all terms and ranks titles above body text. Results show separate titles and full language paths, preserving both case libraries. Loading, empty, no-results, error/retry, clear, result count and show-all states are included. Query length is bounded at 240 characters.

Reading navigation has five primary entries, prominent Reading Order, and a keyboard/native-details catalogue containing every one of the 58 language pages. Current-page indicators now account for the Pages basepath. A skip link moves focus to main content. Reader typography, links, spacing and tables are scoped away from Screening. Table wrappers provide keyboard scrolling without changing source text or existing IDs. Fonts, JS, CSS and indexes are first-party. No print rules or automatic TOC were introduced.

## Fresh checks

Executed on this increment, not reused from B r2:

- `npm ci` and the complete existing `npm run test:screening` (all seven commands): PASS.
- Both metadata/citation generators: PASS; 116 metadata entries, 33 publication records/DOIs.
- `npm run build`: PASS, existing 120 Eleventy outputs plus two non-HTML search indexes.
- `npm run test:search`: PASS. Extraction exclusions; allowlist-only generation; malformed/missing routes rejected; deterministic index bytes; 58 EN + 58 UA exact result URLs; all publication DOIs; title ranking; EN authority/commit; UA повноваження/межі; DP; Unicode/apostrophe and length-changing normalization; literal HTML-like/regex-like/long/empty/no-match input; distinct 001 case families.
- A1–A9 checks report the actual static corpus honestly: the combined range has no matches; only A7 matches a public contact fingerprint. Dynamic Screening axis labels are not silently injected into an article-only index.
- `python scripts/audit-routes.py _site`: PASS, 58 EN + 58 UA, 117 sitemap URLs, 0 broken links/orphans, canonical/hreflang/citation integrity.
- `npm run audit:screening-assets`: PASS, exact nine r2 source/built asset hashes and basepath.
- `git diff --check`: PASS.
- Generated metadata/citation/manifest/audit artifacts, all `src/en` and `src/ua` source documents, all shared runtime files and shared manifest: byte-unchanged from the published baseline.
- Independent generated-shell inspection: all 116 pages have an initial h1, correct current links, complete catalogue, and reader-only table wrappers; legal footer markup preserved.

## Limits and next step

Browser keyboard/focus, mobile 320/375 widths, no-JS interaction, real served MIME/loading/error behaviour and screenshots remain pending at this first checkpoint. A owns the managed-preview slot; B has requested the next slot in its assignment and has not stopped or replaced A's supervisor. No browser pass or Pages publication is claimed. Physical devices, screen-reader speech and print output are not tested.

The optional synthetic educational result has not been included in this first increment. Its APIs were inspected read-only; it will be added only if sufficient time remains to compute and verify its JSON roundtrip and noninterference with the working session.

Root independently accepts the exact final candidate, then owns merge/deployment/live verification. B does not publish this draft.

## Rollback

Published baseline is pinned by `backup/screening-r2-accepted-20261022` at `fc035df7090b33849d6813707ceb6ab25288a03d`. Before merge, close this draft without touching main. After a future accepted merge, revert only the B2 integration in a new forward commit, preserving intervening work; rerun the existing full pipeline and verify the actual Pages version. Do not roll back or alter the already accepted r2 shared engine.
