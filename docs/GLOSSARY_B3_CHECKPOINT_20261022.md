# B3 — source-derived glossary navigation

Status: finished B3 candidate for independent manager acceptance. Source, full pipeline and supported-browser checks pass with the explicit limits below. This is not a deployment claim.

## Identity and boundaries

Repository: `GotoCalmAIDP/doctrine-site-box` only. Branch `site/glossary-navigation-20261022` starts from finished B2 `133976af6e455597445b0a8ef8724b8cec954859`; The manager independently accepted B2 and merged PR22 as `7b20084a64bc8e44a4cedfc22b5e865ef4c6c083` while B3 was being verified. B3 is a separate commit and review unit, based on that fresh main after confirming its tree matches the verified B2 tree. B2 was delivered and accepted before B3; its frozen source was not modified.

[Manager's source pack](https://app.notion.com/p/4012a14e14ce8131a6b8ce83c563c397) identifies the 23 existing EN/UA terms at published baseline `fc035df7090b33849d6813707ceb6ab25288a03d`. Canonical Markdown, definitions, publications, DOI, existing routes, language relations, Licensing and the nine shared r2 assets are preserved. The shared release remains `gotocalm-screening-portable-20261022-v14-r2`, source `df4ea1292f6c356950f25e46e6025f68304c8ab8`, manifest SHA256 `619492406980509341b4b99175c762ff116a595c25459722324bd6815763a53d`.

## Delivered change

A visible Glossary / Глосарій primary navigation entry leads to the existing pages. The build derives an alphabetic 23-term index from existing source headings and maps the Ukrainian headings' English parentheticals to their exact English counterparts. The generated index links to stable `term-*` IDs on the existing definitions. No alternative dictionary or new definitions are introduced. Existing IDs are preserved.

The optional title filter changes only the index links, with clear and no-result states; full definitions remain visible. The initial index and native anchors work without JavaScript. The added interface is excluded from B2's article search extraction. Assets are first-party and scoped to the existing glossary routes under `/doctrine-site-box/`.

## Verification

Fresh clean-build pipeline: `npm ci`; all seven existing Screening suites; metadata/citation generation; computed example generation; Eleventy; search tests; example roundtrip and pinned-controller import tests; new `test:glossary`; route audit; nine-asset audit; controlled-artifact reproducibility and whitespace checks. All pass. The glossary test is also wired into the existing integrity job. No dependencies or lockfiles changed.

- 58 EN + 58 UA routes, 117 sitemap URLs, 33 publications and all DOI/citation artifacts preserved.
- All 167 protected source/runtime/citation files still match published `fc035df…` byte-for-byte; both complete B2 search JSON files are also byte-identical. The new index/helper links are excluded from search extraction.
- All 23 canonical names and definitions per language, EN↔UA correspondence, locale alphabetic order, unique anchors, existing-ID preservation, adjacent stable aliases, collision rejection, idempotence, navigation/current states and no-JS text visibility pass.
- Tests compare the complete extracted glossary article/search record with independently rendered canonical Markdown, and verify glossary assets are scoped to exactly the two glossary routes. Literal Unicode/apostrophe normalization, HTML-like/regex-like queries, empty/no-result, Clear/focus, Escape and submit behavior pass.
- Supported-browser clicks tested every one of the 23 EN index links and 23 UA index links. Every target was the exact corresponding h2, received focus and matched the URL fragment. All 23 EN→UA→EN roundtrips also retained the exact term and focus.
- Actual keyboard Enter reached Evidence; Clear restored 23 links and input focus, Escape restored the list. EN filtering by Ukrainian `межа` returned two terms. An HTML-like query returned no matches without creating an image or hiding any definition. UA no-result text and keyboard Clear also passed.
- At EN 320 and UA 375 CSS px, no horizontal page overflow. UA `доказ` returned two title links; EN `legitimacy` returned one. The no-JS UA375 viewport retained all 23 index links and definitions, hid only the unavailable filter, and supported native Enter to Evidence and back to the index.
- The three new first-party CSS/JS/module resources returned HTTP200 with correct MIME and exact built bytes. Their hashes, plus all twenty B2 browser-served resource hashes, match the final clean build.

Evidence: [pipeline log](glossary-b3-qa/pipeline.txt), [check summary](glossary-b3-qa/pipeline-results.json), [all term-click/roundtrip records](glossary-b3-qa/browser-evidence.json), [served resource hashes](glossary-b3-qa/served-resources.json). The existing [B2 preserved-source hash manifest](reader-search-b2-qa/preserved-source-hashes.json) was rechecked in full.

| View | Screenshot |
| --- | --- |
| Desktop glossary/index | [Desktop](glossary-b3-qa/desktop-index.jpg) |
| EN320 / UA375 navigation and no-JS entry | [Mobile navigation](glossary-b3-qa/mobile-navigation.jpg) |
| Mobile filter and no-JS focused definition | [Mobile filter](glossary-b3-qa/mobile-filter.jpg) |

B used the explicitly assigned preview slot, then ran `sites-preview stop`; status is stopped and the slot is released. Temporary QA HTML, basepath symlink and preview configuration were removed before the final clean build. None are committed or published.

## Limits and next step

No production deployment, physical-device, screen-reader speech or print test is claimed. Current live source headings had no existing IDs; preservation of older IDs/aliases is covered by fixtures, while actual browser focus checks cover all 23 current h2 targets. The manager owns independent acceptance, merge and actual Pages verification. Existing terminology wording differences in the manager pack remain a separate semantic backlog and are not changed by this navigation work.

## Rollback

Before merge, close the B3 draft and retain accepted B2. After a future accepted merge, revert only the separate B3 commit in a forward commit, preserve later unrelated work, rerun the existing pipeline and verify served Pages. Accepted B2 main `7b20084a64bc8e44a4cedfc22b5e865ef4c6c083` (same tree as `133976af…`) is the immediate pre-B3 reference; earlier published rollback remains `backup/screening-r2-accepted-20261022` at `fc035df…`. Shared r2 is not rolled back or edited.
