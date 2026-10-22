# B2 — local search and reading shell

Status: finished B2 candidate for independent manager acceptance. Local search, reader shell and the optional computed educational example are complete. Supported-browser desktop/EN/UA/keyboard/mobile checks and fresh clean-build pipeline evidence are recorded below. This is not a deployment claim.

The first complete search/reader increment was saved as `86de6cb583d1992e377709d24ee52a5acf6173b7`; draft [PR22](https://github.com/GotoCalmAIDP/doctrine-site-box/pull/22) remains the review vehicle. Its first exact-head [CI run](https://github.com/GotoCalmAIDP/doctrine-site-box/actions/runs/39846451974) passed. The immutable URL of this final document is recorded in B's assignment after the follow-up commit.

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

Executed again on a clean `_site` after preview cleanup, not reused from B r2. Full [pipeline log](reader-search-b2-qa/pipeline.txt), [exit-code summary](reader-search-b2-qa/pipeline-results.json) and [167 preserved source hashes](reader-search-b2-qa/preserved-source-hashes.json) are retained. Twenty browser-served resource hashes also match this final clean build. Local environment: Node 24 / Python 3.12; GitHub CI independently runs Node 20 / Python 3.11.

- `npm ci` and the complete existing `npm run test:screening` (all seven commands): PASS.
- Both metadata/citation generators: PASS; 116 metadata entries, 33 publication records/DOIs.
- `npm run build`: PASS, existing 120 Eleventy outputs plus two non-HTML search indexes.
- `npm run test:search`: PASS. Extraction exclusions; allowlist-only generation; malformed/missing routes rejected; deterministic index bytes; 58 EN + 58 UA exact result URLs; all publication DOIs; title ranking; EN authority/commit; UA повноваження/межі; DP; Unicode/apostrophe and length-changing normalization; literal HTML-like/regex-like/long/empty/no-match input; distinct 001 case families.
- A1–A9 checks report the actual static corpus honestly: the combined range has no matches; only A7 matches a public contact fingerprint. Dynamic Screening axis labels are not silently injected into an article-only index.
- `python scripts/audit-routes.py _site`: PASS, 58 EN + 58 UA, 117 sitemap URLs, 0 broken links/orphans, canonical/hreflang/citation integrity.
- `npm run audit:screening-assets`: PASS, exact nine r2 source/built asset hashes and basepath.
- `npm run test:example`: PASS: deterministic computed EN/UA files, native schema roundtrip, identical semantics, date separation, static built links and isolation. The second command exercises the actual pinned controller import handler using isolated Node DOM/storage/network fixtures: consent gate rejects before reading; a synthetic prior-rights fixture imports correctly; rendered counts are 0 mapped / 17 open / 0 out-of-scope / 11 priority-open; completion count stays 0, prior fixture rights stay unchanged, no consent events or network occur; declined replacement preserves the existing workspace. This is not browser import acceptance or a real Terms agreement.
- `git diff --check`: PASS.
- Generated metadata/citation/manifest/audit artifacts, all `src/en` and `src/ua` source documents, all shared runtime files and shared manifest: byte-unchanged from the published baseline.
- Independent generated-shell inspection: all 116 pages have an initial h1, correct current links, complete catalogue, and reader-only table wrappers; legal footer markup preserved.

## Computed educational example

A collapsed, explicitly nonnormative template block on the existing EN/UA Screening pages describes a fictional supplier-reply drafting assistant. It is outside both the canonical article and `#gc-screening`, with its own scoped CSS and no JavaScript or session hooks. Viewing/downloading cannot initiate import. Compatible JSON and a Markdown review brief are static same-origin downloads; import remains a separate manual action in the existing workspace.

The generator calls the unchanged r2 `evaluateScreening`, `createEvidenceRows`, `buildEvidenceWorkspaceExport`, `parseEvidenceWorkspaceImport` and `buildEvidenceReviewBrief`. It checks the exact manifest and all nine runtime hashes before generating. Every answer is UNKNOWN, response basis is exploratory, consequence class is unknown. Computed outputs: exploratory / training-only, 17 unknown, 0 out-of-scope, 0 mapped, 17 open and 11 priority-open records. EN/UA semantics match. No axis zeros are portrayed as measured failure or effectiveness. Fictional labels and descriptions are not verified evidence and cannot authorize an operation.

Core basis date `2026-09-22`, fictional assessment date `2026-10-22`, and fixed reproducible export timestamp `2026-10-22T00:00:00.000Z` are explained separately. The unchanged JSON schema's English machine limitations are retained; the UA presentation explains this. Runtime schema/version stay unchanged. Markdown files are passthrough downloads, explicitly excluded from Eleventy template processing, so they create no extra HTML routes.

The small manager review correction replaces the misleading search placeholder A1 with DP; dynamic axis labels are still not injected into the public article index.

## Browser evidence and screenshots

A's explicit slot-release checkpoint was observed before B started the supported `sites-preview`. B then completed its checks and stopped its own preview; status is stopped and the slot is released. Temporary viewport/resource QA pages, basepath mount and preview configuration were removed before the final clean build.

- Desktop EN: authority 25, commit 3, exact DOI 1; title ranking, literal HTML-like input, empty/no-match and 240-character limit pass. Boundary shows 30 of 44 then all 44 with keyboard focus moved to the first newly revealed result; Clear returns focus to the input. Queries never enter the URL.
- Selecting UA on the EN interface yields 9 results for повноваження, with Ukrainian language attributes and UA paths. UA at 375 CSS px yields 51 results for межі. EN at 320 CSS px yields five results for 001, with the two case families distinguished.
- First Tab reaches Skip to content; Return focuses main. Native catalogue keyboard expansion, correct Reading Order navigation/current state and no-JS catalogue/navigation pass. The no-JS search is disabled with an explanation.
- At 320/375 CSS px the document has no horizontal overflow. A wide reader table scrolls within its focusable region by ArrowRight while the page remains contained. These are actual browser iframe viewports, not physical-device tests.
- A controlled missing-index check displayed the error/retry state. Restoring the exact JSON and pressing Search recovered 25 authority results without a reload.
- Both mobile educational blocks expand and display the same computed values without document overflow. Viewing and clicking the JSON download retained a synthetic working draft, count 0, last-result None and unchecked Terms. No real aggregate POST was made.
- All 20 checked first-party resources, including search modules/indexes, all nine r2 files, example CSS and four downloads, returned HTTP 200 with correct MIME and exact built bytes. See [served-byte evidence](reader-search-b2-qa/served-resources.json) and [structured browser evidence](reader-search-b2-qa/browser-evidence.json).

| View | Evidence |
| --- | --- |
| Desktop search | [Screenshot](reader-search-b2-qa/en-search.jpg) |
| Desktop reader / navigation | [Screenshot](reader-search-b2-qa/en-reading.jpg) |
| UA 375 / EN 320 / no-JS 375 search | [Screenshot](reader-search-b2-qa/mobile-search.jpg) |
| UA 375 / EN 320 educational example | [Screenshot](reader-search-b2-qa/mobile-example.jpg) |

## Limits and next step

The browser download broker timed out with `waitForEvent(download)` and one documented `downloadMedia` recovery; no completed downloaded-file path is claimed. Static JSON/Markdown responses and exact bytes are verified. Manual browser file-picker import beyond the initial Terms gate was not performed; no legal agreement was accepted. Actual controller import is covered by the isolated Node oracle described above. Physical devices, screen-reader speech and print output are untested. The existing optional aggregate GET was unavailable in preview; no new live aggregate or POST validation is claimed.

No automatic TOC or print rules were introduced. A queued B3 glossary-navigation increment stays separate and does not delay this ready B2 candidate. The manager independently accepts the exact final commit, then owns merge, Pages deployment and actual served-version verification. B does not merge or publish this draft, and no production success is claimed here.

## Rollback

Published baseline is pinned by `backup/screening-r2-accepted-20261022` at `fc035df7090b33849d6813707ceb6ab25288a03d`. Before merge, close this draft without touching main. After a future accepted merge, revert only the B2 integration in a new forward commit, preserving intervening work; rerun the existing full pipeline and verify the actual Pages version. Do not roll back or alter the already accepted r2 shared engine.
