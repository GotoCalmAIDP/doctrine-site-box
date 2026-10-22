# Executor B — doctrinal Screening v14 r2 checkpoint

Status: READY FOR INDEPENDENT ACCEPTANCE / NOT DEPLOYED. Exact r2 integrated; pipeline and final EN/UA/mobile wrapper checks completed with the specific browser-policy limit below. The r1 defects are resolved; managing-chat acceptance is the next gate.

Assignment: https://app.notion.com/p/4012a14e14ce81d6afa7e02a99bda6bc

## Identity and scope

- Production baseline/rollback: `f82c696d79d3ff31cf0cd6f12c6db2449ac84187`, `backup/pre-screening-20261022`.
- Existing integration: `862f2fbb470ec400b2e5021077cb8df4df643ff5`, draft PR21, branch `screening/doctrine-improvement-20261022`.
- Exact common source: `df4ea1292f6c356950f25e46e6025f68304c8ab8` (r2), superseding r1 `dac71a03978d5913fa9729800b0ccba0b80c13de`.
- Release: `gotocalm-screening-portable-20261022-v14-r2`. Complete nine-asset manifest is `docs/screening-shared-v14/RELEASE_MANIFEST.json`; its SHA-256 is `619492406980509341b4b99175c762ff116a595c25459722324bd6815763a53d`.
- R2 controller:226003bytes, SHA-256 `ad98aae6d3a4abc089889f6ef1882225d45105f69190536c8cb32f2b84a0d911`. Other eight runtime assets are unchanged and all nine match the exact shared manifest.
- B-owned audit release_id pin changed r1 to r2; all closure/path/count/size/hash checks retained. Exact r2 controller, tests, integration document and manifest consumed without modification.
- Matching v14 JS/CSS on physical EN/UA routes retain `/doctrine-site-box/`. Existing tests plus all three shared suites remain in package/CI; built asset audit remains in integrity job.
- All historical assets, nine-axis evaluator, evidence/Maritime/rights/export functions, publication/DOI/citation/content and normative activation surfaces remain unchanged. No other repository, commercial feature, DNS/mail or production ref changed.

## Corrected shared behavior

Descriptor validation now precedes byte reads. Accepted import/scan owns its generation; rejected input does not cancel valid pending work. Detached/replaced controllers cannot render, clear or persist stale work. Reset/new run/import invalidate pending aggregate replies. Independent source review found no remaining blocking regression.

Canonical core0.3.0-alpha, evidence0.5.0-alpha/schema0.4 with legacy0.1–0.3, Maritime0.1 and session0.2 contracts remain unchanged. Claims, extracted text and locators remain unverified. Imported old date/version/staleness do not become current. Full raw description/text are not persisted; limited metadata/section excerpts can remain locally.

## Fresh r2 checks

- `npm ci`; full seven-command `npm run test:screening` — PASS. Existing checks retained; new controller tests cover file-read bounds, import/scan ordering, detached/superseded controllers, late aggregate replies, Reset, legacy/storage/count.
- Both metadata/citation generators; Eleventy120outputs — PASS.
- Deterministic audit58EN+58UA,0broken links, citations/canonical baseline — PASS.
- `audit:screening-assets`:exact9/9manifest assets, correct EN/UA/basepath, matching source/built hashes — PASS.
- Workflow controlled-artifact diff unchanged; `git diff --check` — PASS.
- B's original independent rejected-file spy now PASS: unsupportedZIP100bytes and DOCX10485761bytes each perform0reads (r1 each performed1).
- Independent second execution of session/controller/parser including5local DOCX calibrations — PASS. Additional old-snapshot oracle preserves2025date/version/stale and recheck-currentness; unsupported private-session format rejected. Calibration files are not committed.

Local Node24.19/Python3.12. GitHub CI Node20/Python3.11 PASS for exact code candidate656b9bef6e820c6cdbd01045e822935d24184e14: https://github.com/GotoCalmAIDP/doctrine-site-box/actions/runs/39837852132 . Final evidence/document commit changes no application runtime; its CI is recorded in the assignment page.

## Completed final-wrapper browser QA

Supported Sites managed preview, cloud Chrome, exact built pages and Pages basepath. No Site registration or deployment. Temporary hosting/mount/helper HTML removed; supervisor stopped. Detailed evidence: `docs/screening-b-qa/r2-browser-evidence.json`; screenshot: `docs/screening-b-qa/r2-ua375.jpg` (SHA2562454eb5d7037e13495315ed7198872131be57ab0ef9226696cece9576b378c80).

| Path | Observed result |
| --- | --- |
| Minimum EN text | Unverified Enterprise cue; default Unknown; explicit Critical retained |
| Full canonical path | Maritime/design/mixed basis+17Unknown gives Insufficient basis; all9axes visible; count1 |
| Session/reload | Original count1/last timestamp survives navigation and successful direct reload |
| Maritime | Both routing choices unresolved+8Unknown gives bound-control-path-first; count remains1 |
| Native DOCX | Deflated synthetic fixture with long Unicode name;9/9cues, all17core records remain open |
| Invalid files | ZIP,10MiB+1 and corrupt DOCX rejected with specific local errors; prior report preserved |
| File count | DOCX+TXT+MD produces3reports; Maximum of3documents button disabled |
| EN to UA | Object/version/old2025-01-01date and count1 preserved |
| Portable JSON | Browser export schema0.4 has17records+1Maritime package; separate UA375tab import preserves old date/version and count0/no last result |
| Mobile | UA375: document360=scroll360,root328=scroll328,htmluk. EN320: document305=scroll305,htmlen.15px reserved for vertical scrollbar; no horizontal overflow |
| Reset | Explicit test confirm accepted; imported workspace inputs removed, terms unchecked, count0/no last result |
| Served identity | All9same-origin asset GETs200, correct JS/CSS MIME, exact response bytes equal manifest-pinned source |

The browser's URL-policy gate rejected the final mobile harness reload after Reset (disallowed protocol; exact target protocol not exposed). That single post-Reset reload is UNVERIFIED; no alternate surface/workaround was attempted. The preceding result reload/restore passed and controller oracles verify Reset persistence. A screenshot clipping attempt timed out; the earlier complete viewport screenshot was saved unchanged. These tool limits are not application failures or a physical-device test.

The initial supervisor conflict was resolved after A saved its completed acceptance checkpoint. Successful B direct reload/restore was rerun on the correct B preview; earlier Cannot GET did not count as a product failure.

Aggregate showed unavailable while local paths stayed usable. No contribution opt-in/action/live POST. Source and mocked lifecycle tests enforce payload exclusion of files/text/answers/locators. Actual application CORS, physical mobile devices, full accessibility and printed PDF remain unverified. Limited metadata/excerpts can remain locally; zero-text-retention is not claimed.

After removing temporary QA files, metadata/citations, Eleventy, route integrity, nine-asset audit and controlled-artifact diff were repeated successfully; no QA route or mount enters production.

## Next step and rollback

Return this immutable checkpoint to the managing chat for independent acceptance. No shared fix or user permission is pending; the narrow tool/device/CORS limits above remain explicit. Publication remains the separate next stage already authorized by the owner: after acceptance, recheck refs/foreign work, merge only accepted scope, inspect actual Pages integrity/build/deployment source and compare served EN/UA closure to accepted manifest. A branch push or green build alone is not deployment.

Rollback remains the original baseline backup. Revert only this integration and restore v13 template while preserving unrelated later changes. Current production is unchanged by B.
