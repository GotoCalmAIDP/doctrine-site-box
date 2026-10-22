# B4 — native reader contents checkpoint

READY for independent acceptance; no merge or publication by executor B.

Base: `2a5442c377c6f03a63b37e18ea7b4e253ede82d7` (fresh main checked before branch and remote write). Branch: `site/reader-toc-20261022`. The immutable candidate is the commit containing this checkpoint; its exact SHA and draft PR are also recorded at the top of the B Notion assignment.

## Result

Build-time native, initially collapsed “On this page” / “На цій сторінці” on 90 EN/UA reader pages with at least four nonempty eligible h2/h3 headings. A scoped CSS asset is served under `/doctrine-site-box/`. The TOC is a sibling before the canonical article; the article's first heading remains its h1. No client JavaScript or dependency was added.

Exact rendered heading labels and source order are retained; h3 entries are indented. Existing IDs and attributes survive. New Unicode IDs are deterministic, checked against all page IDs, and suffixed uniquely. Native fragments are URL-encoded; targets accept focus. Existing duplicate page IDs fail the build instead of being silently renamed. Screening, Glossary, hidden headings and utility UI are excluded.

Changed implementation: `.eleventy.js`, `src/_includes/base.njk`, `scripts/reader-toc.cjs`, `src/assets/reader-toc/reader-toc.css`. Tests: `scripts/test-reader-toc.mjs`, `package.json`, `.github/workflows/deploy.yml`. Remaining additions are this checkpoint and `docs/reader-toc-b4-qa/` evidence. Canonical Markdown, publications, DOI, definitions, Screening and glossary implementation are untouched.

## Fresh validation

- Fresh `npm ci`; existing Python audit dependencies installed using current workflow command.
- Complete Screening tests; metadata and citation generation; Eleventy plus computed example and search generation; search, example and glossary tests; new reader TOC tests; deterministic route audit; selected Screening asset audit; controlled generated-artifact git diff: PASS. Exact commands/timestamps and output: `reader-toc-b4-qa/pipeline.txt` and `final-pipeline-results.json`. Tested application source hashes bind these results to the candidate.
- New tests cover all 90 eligible built pages, all TOC targets and labels, h3 level/order, exclusions/short pages, repeated headings, later explicit/outside-article ID collisions, duplicate-existing-ID failure, original links/focus attributes, Unicode, percent/reserved characters, deterministic/idempotent transformation and unchanged canonical extraction.
- All 167 protected files byte-identical to exact main (also original B2 frozen hash set): `preserved-source-hashes.json`. Nine shared r2 assets and manifest unchanged; release `gotocalm-screening-portable-20261022-v14-r2`, source `df4ea1292f6c356950f25e46e6025f68304c8ab8`, manifest SHA256 `619492406980509341b4b99175c762ff116a595c25459722324bd6815763a53d`.
- Full search JSON byte equality against saved accepted-main output: EN 152804 bytes / SHA256 `2656641173a0d798142193b1b54be27dd77d10efc437d261673675f7cde40c38`; UA 270390 bytes / `17704381bf7bda599a3b8a31d410e4a211d8a7d62d53b37af895736abcbdadbe`. This is a whole-file comparison, not an excerpt. Accepted B3 candidate and fresh main trees were identical before starting.

## Browser evidence

Managed preview on `http://terminal.local:4173/` with real `/doctrine-site-box/` paths. Desktop EN/UA native summary Enter → Tab → anchor Enter → exact H2 focus: PASS. At 320px EN and 375px UA frame widths, plus 375px UA sandbox without allow-scripts, all five section links in each frame were keyboard-activated (15 transitions); every target had correct H2 focus and fragment. No horizontal overflow: inner content 305/360px after scrollbar. Screenshots: `reader-toc-b4-qa/mobile.jpg`, `desktop.jpg`; observed JSON: `browser-evidence.json`.

Screenshots/mobile tests preceded the isolated percent-encoding correction; visible layout and target IDs did not change. Final encoded Ukrainian fragment was subsequently verified in desktop browser and complete final build/tests repeated. Browser checks are representative routes; all 90 pages' links are structurally tested. Preview stopped and temporary configuration/symlinks/helper removed before final build. No Screening consent or aggregate interaction occurred.

Not performed: physical-device/Safari/Firefox checks, screen-reader speech, printed/PDF rendering, exhaustive browser interaction across all 90 articles, production/deployment HTTP checks. Browser mobile evidence uses iframe viewport dimensions, not a physical handset. Remote CI outcome is recorded separately in the Notion checkpoint after PR creation.

## Rollback and next step

Pre-B4 source is `2a5442c377c6f03a63b37e18ea7b4e253ede82d7`, retained by `backup/glossary-accepted-20261022`. Before merge, simply leave the draft PR unmerged. If B4 is later accepted and rollback is required, create a fresh branch and forward-revert only B4's accepted commit/merge, retaining B1/B2/B3 and unrelated later work; rerun pipeline and have the manager verify the new Pages artifact and actual served version. Do not reset main.

Manager next: inspect immutable diff and fresh CI, independently confirm protected/search hashes, links and keyboard behavior; accept or request a bounded correction. Only the manager merges and publishes, then binds Pages artifact and served bytes.
