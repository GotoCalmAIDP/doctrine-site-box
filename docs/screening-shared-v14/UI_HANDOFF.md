# Shared UI v14 draft handoff

Status: READY FOR ROOT REVIEW/BROWSER QA; no commit, push, template switch, or deployment performed. Manager root owns release decisions. Staging: `/workspace/scratch/73a47e3f37fb/shared-release-work`.

## Files owned by this task

- `src/assets/screening/screening-v14.js` (copy of v13 plus additive features)
- `src/assets/screening/screening-v14.css` (v13 preserved + small responsive additions)
- `src/assets/screening/screening-session-v14.js` (pure orientation, completion history, safe wrapper link configuration)
- `scripts/test-screening-session-v14.mjs`
- `scripts/test-screening-app-v14.mjs`

Historical v13 files, canonical screening/evidence/Maritime/rights core files, templates, package scripts, and production branch untouched. Parser v14 belongs to separate parser task and is imported by the v14 entry.

## Behavior and boundaries

- Local short description <=6000 characters. Keyword orientation returns derived category flags and a suggested canonical class, never verified answers/evidence. Explicit class confirmation is required to continue; default remains UNKNOWN. All six canonical classes remain available, including Critical distinct from High.
- Raw short description is held only in the current page memory/DOM, omitted from every session/export, and cleared when continuing/resetting. Document intake retains public derived metadata/locators plus limited section excerpts; EN/UA privacy copy now discloses those excerpts accurately. Full extracted text is not retained by the parser report.
- Tab counter records canonical final-basis completion once per explicit started run. Quick document/blank workspace has explicit Record result action; render/edit/export/import/restore never auto-increment. Import invalidates active run so imported snapshot cannot be recorded as a fresh run.
- Last result preserves original recording timestamp, canonical class/outcome and core version. New screening clears current work while preserving count/last. Global Reset clears all work/count/last and current/legacy storage; existing workspace Reset stays scoped.
- Generation cancellation blocks late file-read/parser/import results from reviving reset/replaced workspaces. The controller test verifies the delayed read/reset race.
- Session schema `goto-calm:screening-tab-draft:0.2`, key includes current host. Old 0.1 session migrates with zero invented completion history. Full evidence export/import schema unchanged. Storage failure is visible EN/UA and does not prevent local screening.

## Wrapper configuration for identical shared asset bytes

Root element `#gc-screening` accepts:

- `data-language="en"` or `ua` (existing)
- `data-doctrine-base="https://gotocalmaidp.github.io/doctrine-site-box"` for commercial shell; default `/doctrine-site-box` for doctrine.
- `data-contact-url="/contact"` for commercial; default resolved doctrine language contact.
- `data-aggregate-mode="off"` to disable aggregate/contribution rendering and ALL related GET/POST. Default retains existing doctrine aggregate behavior. Local tab history remains available in both modes.

Only HTTPS or root-relative safe links accepted; credentials/javascript/protocol-relative values fall back. Configured hrefs are escaped. Terms and rights metadata retain exact canonical references.

## Fresh validation

PASS: `node --check src/assets/screening/screening-v14.js`

PASS: `node scripts/test-screening-session-v14.mjs` — independent text cue/negation/UA/UNKNOWN controls; raw marker excluded from derived summary; class compatibility; count/repeat/reload/malformed history; safe links/config; EN/UA excerpt disclosure.

PASS: `node scripts/test-screening-app-v14.mjs` — small fake-DOM controller harness: explicit Critical confirmation, raw description omitted from session and cleared on continuation, canonical count once, another run preserves history, same-tab reload preserves timestamp, portable import doesn't count, delayed file read cannot revive Reset, legacy draft migrates without invented count, denied storage keeps local function, aggregate off performs zero network requests.

PASS: `npm run test:screening` — existing fresh screening/evidence/Maritime/public-activity/generic-intake/rights tests. This existing command does not yet include the new v14 scripts; integrators should add/run them through actual pipeline.

Limits: fake-DOM controller checks are not browser DOM/layout/accessibility/parser runtime QA. Browser/mobile/deployed asset tests remain with root and external integrators. No new semantic evaluation rules, certification, runtime enforcement, or actual operation permission introduced.
