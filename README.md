# GotoCalm — Applicability Boundary Doctrine

Public reference website in English (EN) and Ukrainian (UA), built with Eleventy and published through GitHub Pages.

**Live site:** https://gotocalmaidp.github.io/doctrine-site-box/

## Contents

- Published doctrine, definitions, source references and illustrative cases.
- Bilingual reading navigation, glossary, local site search and contents for long pages.
- A browser-local public Screening and evidence-readiness workspace with portable exports.
- A clearly fictional educational example and citation artifacts.

The public Screening is a self-reported preparation aid, not an operational controller, evidence verification, certification or a complete implementation of the doctrine. The independently hosted commercial site is https://gotocalm.com/.

## Source and build

EN and UA pages are in `src/en/` and `src/ua/`; shared layouts are in `src/_includes/`; public assets are in `src/assets/`. Eleventy generates `_site/`. The base path is `/doctrine-site-box`.

```bash
npm ci
python scripts/generate-page-metadata.py
python scripts/generate-citation-artifacts.py
npm run build
python scripts/audit-routes.py _site
```

The GitHub Actions workflow checks integrity before deploying accepted `main` changes to GitHub Pages. A branch head alone is not evidence of the served deployment. Preserve a verified previous revision when preparing a release.

## Contribution boundaries

Keep EN/UA pages consistent. Preserve published source content, identifiers, attribution and existing routes unless a change expressly requires otherwise. Shared Screening releases use a pinned asset manifest; changes to that runtime must remain coordinated across the two sites.

This is a public repository. Keep private documents, internal working discussions, client materials and credentials in a separate private workspace. Include only materials intended for public distribution in source and build artifacts.

## Rights and contact

See [LICENSE.md](LICENSE.md), [NOTICE.md](NOTICE.md), and the website Terms and Privacy pages. This repository is source-available under a limited evaluation licence, not an open-source licence. Specific item licences, third-party licences and valid earlier grants remain effective.

Contact: admin@gotocalm.com
