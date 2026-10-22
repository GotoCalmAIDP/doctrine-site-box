# Exact private/public matrix — 22 October 2026

Read-only source comparison; no implementation, runtime, mobile, network or deployment tests claimed.

## Identity

- Private source recovered by parent with supported Sites workflow: project `appgprj_6ace8660511c8191912ec992ad3f9b2c`, commit `1e95fdf90f7a711b4a1a5cbf73535eebd0bc4e76`; local `/workspace/scratch/73a47e3f37fb/private-source-recovery`.
- Public doctrinal baseline: `GotoCalmAIDP/doctrine-site-box`, `f82c696d79d3ff31cf0cd6f12c6db2449ac84187`; local `/workspace/scratch/73a47e3f37fb/baseline-read-audit-doctrine`.
- Public runtime entry is `screening-v13.js`, not generic `screening.js`. Exact static closure: screening-core.js, evidence-workspace-core-v08.js, public-activity-core.js, maritime-core.js, document-intake-core-v10.js, rights-core-v13.js, screening-v13.css. Nested imports remain inside this list; no parser/worker third-party dependency.

## Decision

Retain the public v13 evaluator, schema, evidence/Maritime/rights/export engine. Add private capabilities through a shared v14 preliminary intake/UI layer and focused parser hardening. Private README explicitly identifies this build as a preliminary text-cue screen, not a duplicate of the canonical nine-axis assessment. The private build must not replace public v13 wholesale.

| Capability | Public v13 | Exact private v1 | Selected transfer |
|---|---|---|---|
| Assessment core | 17 prompts, 9 axes, 4 bounded outcomes, critical unknown handling | 5 regex mention checks; no nine-axis evaluator | Keep public unchanged; mention checks only as unverified orientation |
| Consequences | informational / limited / enterprise / high / critical / unknown | none / light / enterprise / higher / unknown | Keep canonical enum; preliminary labels may map with confirmation; do not remove critical |
| Minimal input | Document-first orientation, quick missing-context questions | Optional 6,000-char free description; file-only path | Add free-description preliminary entry without requiring full 21 selections |
| Auto determination | DOCX title/version/sector/lifecycle/regulatory/axis locators; user confirms consequence | Regex consequence/sector cues, simple EN/UA/RU negation and precedence; manual downgrade warning | Reuse cues as suggestions; require/retain user confirmation and unresolved difference; never evidence |
| Documents | DOCX only; 3 files, 10 MiB each, metadata and section locators; raw text discarded | DOCX/TXT/MD, 3 files, 10 MiB each, 60k combined accepted text; 16 MiB document.xml | Add TXT/MD with explicit UTF-8/60k limits; retain richer DOCX metadata/locators and raw disposal |
| DOCX robustness | 4,096-entry cap, declared 16 MiB per retained XML; inflates whole output then checks | Streaming limit during deflate; CRC32; encrypted/macro rejection; central/local consistency; duplicate document.xml rejection; strict UTF-8/XML/DOCTYPE checks | Priority: port streaming bound+CRC+encryption/container checks into existing parser; retain docProps metadata entries |
| Evidence workspace | 17 core records; 8-axis Maritime package; mapping actions/conflicts/freshness | None | Preserve all |
| Session | sessionStorage draft schema 0.1, derived-only intake and consent; silent storage failure | sessionStorage version1; draft+accepted extracted raw text+count/current/last; visible failure note | Preserve public derived-only policy; add stats and visible storage limitation; do not copy private raw text persistence |
| Reset | restart clears full state/terms; workspace-clear resets Tier1 fields | Reset clears all except language and invalidates pending reads via generation token | Add in-flight generation cancellation; clearly label scope of full Reset vs workspace clear |
| Counter / last result | No tab completion counter; separate opt-in public aggregate | Count increments only successful explicit preliminary submit; retained last/date after draft edit | Add clearly labelled tab-local completion stats, increment once per explicit completion; do not count render/import/refresh/auto cues |
| Import/export | Portable workspace schema0.4, legacy0.1/0.2/0.3 support, Maritime0.1, JSON and printable brief | No portable import/export; session restore only | Keep public contracts; add optional preliminary metadata separately, never pass private session as workspace JSON |
| Consent/rights | Terms gate, rights metadata/notices; opt-in aggregate summary | Footer links and explanatory boundaries only | Preserve richer public rights/consent. No new transmission or consent laundering |
| Aggregate | GET aggregate; explicit consented POST; strict summary builder | No fetch/XHR/beacon | Preserve opt-in semantic contract; new commercial-origin CORS needs actual verification; local work must survive failure |
| Languages | EN/UA (`ua` app language) | EN/UA (`uk` app language, `lang=ua` alias) | Normalize adapter to public en/ua and HTML uk where appropriate |
| Mobile/accessibility | Public responsive CSS and focus/terms flow | Responsive 740/940px, 44px mobile buttons, reduced motion, screen-reader result announcements | Port compatible interaction improvements; fresh visual/functional QA remains required |

## Compatibility contract

Keep `ASSESSMENT_VERSION = screening-core 0.3.0-alpha`, `EVIDENCE_WORKSPACE_VERSION = evidence-readiness-workspace 0.5.0-alpha`, and workspace schema `goto-calm:evidence-readiness-workspace:0.4` unless parent intentionally changes semantics. Existing parser accepts explicit legacy schemas 0.1/0.2/0.3 and validates rows/options. Existing `normalizeConsequenceClass` only recognizes public enum (and old yes/no). A direct private `higher` becomes unknown; `none` or `light` also becomes unknown. A private session `{version:1,...}` is not workspace export and should be rejected clearly by current workspace import.

Recommended preliminary mapping: none → informational; light → limited; enterprise → enterprise; higher → unresolved high-or-critical cue requiring explicit public choice; unknown → unknown. Do not auto-map a live vessel/collision cue down to high when public critical exists. Store cue class, chosen canonical class and confirmation separately; automatic strings are not an admissibility result.

Session keys should be app-specific (e.g. configurable commercial/doctrine namespace); origin separation alone isolates current keys but does not migrate data. Public key currently `goto-calm:screening-tab-draft`, schema `goto-calm:screening-tab-draft:0.1`; private key `gotocalm.screening.review.session.v1`, version1. Browser storage does not transfer across origins. Preserve explicit snapshot assessment date/version on import; generatedAt is not reassessment.

## Exact integration points

- Public `screening-v13.js`: session/state declaration ~1093–1154; sessionSnapshot/persist/restore ~1154–1227; intro ~1387; startWorkspace ~1753; document read ~1962; document quick route ~2115; workspace export ~2620; reset/restart ~2776; input/change ~2811; basis submit sets results ~2932.
- Add an explicit preliminary completion event for stats; full assessment completion is basis submit. Do not increment in `renderResults()`, workspace recalculation, `startWorkspace()`, import, auto text preview or aggregate submit. If counting both preliminary and full runs, display separate counters or exact combined label and test de-duplication.
- Public document read has no generation token: Reset during awaited `file.arrayBuffer()` / analysis can currently allow stale completion to overwrite cleared state. Add generation capture before await, check after each await, invalidate on full reset/new assessment/import where appropriate. Private `generation++` pattern is useful.
- Public `document-intake-core-v10.js`: `inflateRaw` ~152; `readZipEntry` ~159; `readDocxXml` ~183. Port safety while retaining `RETAINED_ENTRIES` document.xml/core.xml/app.xml. Enforce bounded stream before allocation, declared and actual size consistency, entry CRC, encryption rejection, duplicate retained entry rejection, central/local boundaries, malformed ZIP/XML rejection. Private only reads document.xml, so wholesale replacement would lose version/title/metadata.
- TXT/MD parse adapter should produce the same derived report contract as DOCX, including source type/locator, file descriptor and unverified suggestions. Never persist text just because private prototype does.
- Rights module intentionally points to canonical doctrinal terms; source references may remain external. Required runtime JS/CSS must stay local to each origin.

## Priority caveats

1. Regex negation is shallow and not language understanding. Absence of a cue is UNKNOWN; a negative phrase does not prove no consequential path. Do not convert matched words to positive answers on the public nine axes.
2. Private `checks` only mean mentioned, not tested/effective/current. Carry this exact label if shown.
3. Public classes and private classes have different resolution. Preserve high and critical distinctly in canonical data and exports.
4. Public promises raw file bytes/text are discarded after derived analysis; private persists raw accepted text in sessionStorage. Keep the stronger public privacy contract.
5. Private counter counts preliminary submits, not unique people or audited assessments. Public aggregate counts only consented substantive completions; these are different metrics.
6. Public DOCX size check currently happens after unbounded deflate, and CRC/encryption checks are absent. Merely preserving the displayed 16 MiB limit would not implement bounded memory processing.
7. Current private examples and copy link `?release=v12` externally; this is reference navigation, not a portable engine. Do not retain it as the commercial runtime path.

## Meaningful new verification to require

- Golden independent enum mapping: none/limited/enterprise/unknown plus higher cue that requires high/critical confirmation; high and critical public fixtures unchanged; stronger cue retained after manual downgrade.
- Same canonical input on both origins gives equal bounded evaluator/workspace output under fixed time. No extra axis points for cue presence.
- DOCX stored/deflated good fixture with core/app metadata; CRC mismatch; encrypted flag; duplicate retained entry; truncated central/local range; wrong declared expansion; stream expands beyond bound; macro entry; malformed/DOCTYPE XML; no readable text; unavailable native DecompressionStream.
- TXT/MD good UTF-8; invalid UTF-8, NUL/binary, empty, per-file/combined char cap; 4th file; oversized file. No raw text in persisted session or export.
- Explicit completion increments once; failed submit/auto cues/edit/language/import/refresh do not; last remains until explicit reset; interrupted file read cannot restore cleared data; blocked sessionStorage is visible and evaluation still works.
- Existing workspace0.4 and legacy fixtures, Maritime merge/conflict cases, export→import EN/UA cross-origin, source date/version preservation, unsupported private-session import gives clear error.
- Network interception: file bytes/description never transmitted; aggregate POST absent before consent; POST contains only schema/class/sector/outcome/basis/version/receiptToken; denial/error leaves local work usable; commercial origin allowed only as intended.
- Fresh browser/mobile path after integration, with terms gates, focus, long filename/UA text, direct URL/reload and exact locally served module imports.

## Source file SHA-256

Private:

```text
8c297702d98940b8e37331e382297c5a7634a6029fd286761f2b5052ce266cf1 dist/core.js
8c9681f6886dbc8a27470f91007a24fa89be4e9b0eb24a700dd1c6731a0b73eb dist/intake.js
e3ab8007f5bbc5736a3e4bc547bb7cb9e7a69fc7f41691ecbf7d5487b041df81 dist/app.js
607b82abaa4a699e8e5cbafd1747a39a98144f37022218b73fa57bc29b1b72dd dist/i18n.js
df2270f676d3f5212d018928cfd8909b6a767b8cf4cb6cf110cf61be2a9e028c dist/index.html
4419b4d3320e141e62e7f0096bdc5f0b6c330c890014d51a08626a9ed7b81eb5 dist/style.css
```

Public:

```text
c73fc4fd098985af193f44f6922abd49d2ea1f061753f52e9cb7ef03bdb6eb17 screening-core.js
92c4fa451c3bd1a75933eb64098366db3d306bb5a979c4021313391bdb866e64 screening-v13.js
14bbd13d35aa4d0d598bb1540798232b809b156f5fa106f1ca8819725fa1077d screening-v13.css
662d0d385e116a1e0e2a388aaa08bb04894d0810460104916df12074e0435409 evidence-workspace-core-v08.js
5cc59e49a29f2a040ceccb7ce2650b4393c291ef9470fea4880083711478a684 document-intake-core-v10.js
88d6ad5a88dfb4061a00b3d3af919a9fa38d59c53937f30264151de8383cc813 maritime-core.js
994f1718d884724e434faf9afc26fb1563f77f97613dfca77b27e5ba323fd280 public-activity-core.js
e451f09603b628a922484c5ab81ced372a69b4d963492ecd34441a2767eef606 rights-core-v13.js
```

No repositories were modified by this audit. The report is a parent-coordination artifact, not a release manifest or proof of implementation.
