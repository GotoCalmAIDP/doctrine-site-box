# Executor B — doctrine Screening integration

Status: PREPARATION COMPLETE / SHARED RELEASE MANIFEST PENDING. This is not a v14 release or deployment acceptance.

Assignment: https://app.notion.com/p/4012a14e14ce81d6afa7e02a99bda6bc

Command: https://app.notion.com/p/4012a14e14ce818786b9f0b6c83f843b

Baseline and rollback: `f82c696d79d3ff31cf0cd6f12c6db2449ac84187`, `backup/pre-screening-20261022`. Working branch: `screening/doctrine-improvement-20261022`. Fresh main matched the baseline and no open PR existed at intake. No other repository is edited.

## Isolated preparation diff

- Pin existing evidence/document tests to the actually selected v08/v10 modules. At the baseline these equal the generic files byte for byte; assertions are preserved.
- Add `npm run audit:screening-assets` after Eleventy in the existing integrity job. It reads physical EN/UA entry pages, rejects generic or mismatched JS/CSS, preserves `/doctrine-site-box/`, traverses literal module imports, verifies built/source SHA-256 and flags unreviewed worker/CSS dependencies.
- No runtime, shared evaluator/schema, publication, citation, ACTIVE/corpus/formal128, production ref or public visibility changes in this preparation commit.

## Fresh validation

Executed here, not inherited from historical reports:

1. `npm ci` — PASS.
2. `npm run test:screening` — PASS, including existing evidence/Maritime/public activity/document/rights checks. Re-run after exact-module test pinning — PASS.
3. `python scripts/generate-page-metadata.py` and `python scripts/generate-citation-artifacts.py` — PASS; 116 metadata entries, 33 unique publication DOIs.
4. `npm run build` — PASS; 120 outputs.
5. `python scripts/audit-routes.py _site` — PASS; 58 EN + 58 UA, no broken internal links, controlled canonical baseline preserved.
6. Workflow controlled-artifact `git diff --exit-code` — PASS; no generated changes.
7. `npm run audit:screening-assets` — PASS; eight selected v13 JS/CSS files, source/built bytes identical.
8. `git diff --check` — PASS.

Local environment: Node 24.19.0 and Python 3.12; workflow requests Node20/Python3.11, so fresh PR CI is still required. Missing jsonschema environment dependencies were installed without changing project integrity code.

The live EN baseline was opened in cloud Chrome; it rendered v13 introduction, terms gate and four disabled entry controls. No terms accepted or aggregate contribution submitted. This is baseline entry observation only. Local browser cannot reach the host's HTTP server (`ERR_CONNECTION_REFUSED`); local Playwright Chromium download failed with an invalid/truncated ZIP. New-release browser/file/mobile interactions remain UNVERIFIED. Static responsive audit is not a mobile browser test.

## Exact current runtime closure

| Asset | SHA-256 |
| --- | --- |
| screening-v13.js | 92c4fa451c3bd1a75933eb64098366db3d306bb5a979c4021313391bdb866e64 |
| screening-v13.css | 14bbd13d35aa4d0d598bb1540798232b809b156f5fa106f1ca8819725fa1077d |
| screening-core.js | c73fc4fd098985af193f44f6922abd49d2ea1f061753f52e9cb7ef03bdb6eb17 |
| evidence-workspace-core-v08.js | 662d0d385e116a1e0e2a388aaa08bb04894d0810460104916df12074e0435409 |
| public-activity-core.js | 994f1718d884724e434faf9afc26fb1563f77f97613dfca77b27e5ba323fd280 |
| maritime-core.js | 88d6ad5a88dfb4061a00b3d3af919a9fa38d59c53937f30264151de8383cc813 |
| document-intake-core-v10.js | 5cc59e49a29f2a040ceccb7ce2650b4393c291ef9470fea4880083711478a684 |
| rights-core-v13.js | e451f09603b628a922484c5ab81ced372a69b4d963492ecd34441a2767eef606 |

No extra parser/worker/CDN/CSS import dependencies. DOCX uses native DecompressionStream, three reports, 10MiB/file, 16MiB XML/entry and 4096 ZIP entries. Session/evidence/Maritime versions and nine axes remain unchanged.

## Findings for the shared release owner

Baseline v13 reads `file.arrayBuffer()` before descriptor validation and lacks cancellation checks after asynchronous intake; Reset can be undone by late completion. Native inflation checks actual expanded length after collecting output. Storage errors are silent. The automatic aggregate GET precedes contribution consent. Parser reports retain limited section excerpts (up to180 chars), metadata and locators; zero-extracted-text retention must not be claimed. Fixes must come from the single pinned shared release owner, not an independent B rewrite.

## Next executable step

Read the managing chat's immutable portable release manifest and feature matrix. Verify all hashes before copying its selected assets/tests. Switch the doctrinal template to the pinned matching JS/CSS; retain all existing rich functions, routes and basepath. Run the fresh complete pipeline plus new exact-release tests and browser/mobile checks; save an independent acceptance checkpoint in the assignment page. Publish through Pages only after the managing chat's acceptance, then verify workflow/deployment source and actual served closure identity. If blocked, preserve this branch and state the exact remaining dependency. Rollback production remains the original baseline and its backup ref.
