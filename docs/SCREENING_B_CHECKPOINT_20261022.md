# Executor B — doctrinal Screening v14 integration checkpoint

Status: INTEGRATED / REVIEW REQUIRED / NOT DEPLOYED. Shared r1 has one unresolved file-read limit defect. Do not merge or publish before the managing chat supplies a correction/disposition and independently accepts this integration.

Assignment: https://app.notion.com/p/4012a14e14ce81d6afa7e02a99bda6bc

Command: https://app.notion.com/p/4012a14e14ce818786b9f0b6c83f843b

## Source and isolated diff

- Fresh main baseline: `f82c696d79d3ff31cf0cd6f12c6db2449ac84187`. Rollback: `backup/pre-screening-20261022` at that same SHA.
- Working branch: `screening/doctrine-improvement-20261022`; draft PR21. Preparation commit: `963fba28707bc226fb36c1e46c7ae57a4d143828`; preparation CI39827310489 PASS. Those checks are distinct from this final v14 candidate.
- Exact shared source: `dac71a03978d5913fa9729800b0ccba0b80c13de`, release `gotocalm-screening-portable-20261022-v14-r1`. Nine asset byte counts/SHA-256 and all eleven added git blobs match the manager's immutable source. Shared files are unmodified.
- Template selects matching v14 JS/CSS for physical EN/UA routes. Historical v13/generic assets, publications/DOIs/citations/content and semantic cores remain intact.
- Existing tests pinned to selected evidence-v08/document-v10; all existing checks retained. Three manager v14 session/controller/parser test commands appended to the actual package/CI pipeline.
- New B-owned `audit:screening-assets` runs after Eleventy in existing integrity job. It pins v14/release identity, validates EN/UA mounts and `/doctrine-site-box/`, recursively resolves literal imports, checks source/built bytes and every manifest path/count/size/SHA-256, flags unreviewed worker/CSS dependencies.
- No commercial modules, other repositories, production refs, DNS/mail, ACTIVE/corpus/formal128 or proposal activation changed.

## Current manifest and contracts

The complete exact identity is committed in `docs/screening-shared-v14/RELEASE_MANIFEST.json`; integration contract and feature matrix are adjacent. Current runtime closure is nine assets: v14 entry/CSS/session/parser plus screening-core, evidence-v08, public-activity, maritime and rights-v13. No remote runtime import, parser, worker or CSS asset dependency.

Core0.3.0-alpha, evidence0.5.0-alpha/schema0.4, legacy0.1–0.3, Maritime0.1 and nine axes are unchanged. Session0.2 explicitly migrates old0.1 without inventing completion history. New local cues require canonical consequence confirmation; statement/extracted text/record mapping is unverified. Document metadata and section excerpts up to180 chars can remain locally; full text and raw preliminary description are not persisted. Origin storage remains separate; JSON0.4 is portable.

Default doctrinal aggregate behavior is inherited. Actual application CORS remains UNKNOWN from the manager's edge1010 finding; B sent no POST or additional probes. Count/last result is tab-local and independent. Contribution payload excludes documents/text/answers/locators and requires fresh opt-in/action.

## Fresh candidate validation

Executed on this integrated candidate, not copied from historical reports:

1. Full `npm run test:screening` including all three new commands — PASS. Session/controller tests cover cues, UNKNOWN/explicit Critical, raw-text exclusion, once-only completion, reload/date, JSON import without counting, Reset cancellation, legacy migration, blocked storage and aggregate-off. Parser tests cover corruption/CRC/limits/TXT/MD/metadata plus five available DOCX calibrations. Calibration files are not committed.
2. Metadata/citation generators — PASS;116 metadata records,33 publication DOIs.
3. Eleventy — PASS;120 outputs.
4. `npm run audit:screening-assets` — PASS; exactly nine manifest-matching assets on both physical language entries and correct Pages basepath.
5. Deterministic route audit — PASS;58 EN+58 UA, zero broken internal links, citation/canonical integrity preserved.
6. Workflow controlled-artifact diff — PASS; no generated changes. `git diff --check` — PASS.

Local Node24.19/Python3.12 differ from CI20/3.11; candidate PR CI must be checked independently. The managing chat separately performed browser QA of shared assets; that is not claimed as B final-wrapper testing.

B opened live EN baseline in cloud Chrome and saw intro, terms gate and four disabled entry controls. No terms were accepted or contribution submitted. The cloud browser cannot reach the local host HTTP build (`ERR_CONNECTION_REFUSED`); official local Chromium download returned invalid/truncated ZIP. New-release browser/file/mobile interactions are UNVERIFIED. Static responsive audit is not a mobile browser test. No new deployment or served v14 identity is claimed.

## Required shared-owner correction

`screening-v14.js` reads `file.arrayBuffer()` before calling parser descriptor validation. A rejected oversized/wrong-type file is therefore fully read first. Proposed exact shared change: import the already exported `validateDocumentFileDescriptor` and call it inside the existing try block immediately before the first file read; retain generation/error handling. Add a controller spy proving invalid descriptors never invoke `arrayBuffer()`. B has not edited the pinned assets; the manager must issue a corrected manifest/release or explicit bounded disposition. The request is also in the B assignment page.

Read-only independent review found no further blocking integration regression. It recorded an inherited lower-priority aggregate response race: a delayed sent/error response may update contribution state after full Reset; consent still gates the actual POST. Record or fix under shared ownership if aggregate remains enabled.

## Acceptance, deployment and rollback

Next action belongs to the managing chat: resolve the shared file-read defect, issue a matching A/B pinned release, independently accept this checkpoint and address final browser/mobile limits. B then consumes that exact release, reruns affected tests and required pipeline, updates this PR and releases through Pages within the owner's existing authorization. No repeat general publication permission is needed.

Before merge recheck fresh main/working refs and foreign work. After acceptance check PR integrity, merge only this scope, inspect main-triggered Pages integrity/build/deploy source, then compare actual served EN/UA JS/CSS/import bytes to the accepted manifest. Push or green build alone is not deployment evidence.

Rollback: revert only this integration release and restore v13 template from the preserved baseline, keeping unrelated later work. Production currently remains the original baseline; rollback backup is untouched. Exact commit/CI/diff and subsequent disposition are recorded in the assignment page for cross-chat continuation.
