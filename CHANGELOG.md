# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Live Site:** https://gotocalmaidp.github.io/doctrine-site-box/

---

## [v0.3.0] - 2026-01-29

**Commit:** `TBD`

### Added
- First illustrative case: Case 001 — Applicability Boundary (EN/UA)
- Case index page with methodology notes
- Internal links to Boundaries and Scope pages from case

### Changed
- Cases page: updated from placeholder to structured index with Case 001

### Notes
- Case is illustrative only — no conclusions, recommendations, or claims
- Demonstrates non-claim documentation structure

---

## [v0.2.0] - 2026-01-29

**Commit:** `ecec57a`

### Added
- Governance pages: Scope & Non-Claims, Evidence & Traceability, Change Log (EN/UA)
- Footer governance links on all pages: Scope | Evidence | Change Log
- CHANGELOG.md and GOVERNANCE.md for release control
- CI changelog guard to enforce documentation

### Changed
- About page: added non-claims statement and link to Scope
- Method page: added DNV-friendly note about applicability boundaries
- Boundaries page: added links to Scope and Evidence pages
- Disclaimer page: added explicit certification non-claim statement
- SITEMAP.md: updated to version 1.2 with governance pages

---

## [v0.1.1] - 2026-01-29

**Commit:** `3f19646`

### Fixed
- Root language selector links now use relative paths for GitHub Pages subpath compatibility

---

## [v0.1.0] - 2026-01-28

**Commit:** `ececea0`

### Added
- Initial site structure with Eleventy
- Bilingual navigation (EN/UA) with language switcher
- Main pages: Home, About, Doctrine, Cases, Method, Boundaries, Contact
- Legal pages: Terms, Privacy, Cookies, Disclaimer
- 404 error page
- GitHub Actions deployment workflow
- GitHub Pages hosting configuration

---

## Release Process

1. Update CHANGELOG.md with new version entry
2. Commit changes with descriptive message
3. Create and push git tag: `git tag v0.x.x && git push origin v0.x.x`
4. Verify GitHub Actions deployment succeeds
5. Mirror release to Notion and Google Drive archive
