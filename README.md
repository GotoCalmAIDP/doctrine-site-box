# Doctrine Site — Structural Shell

**Version:** 1.0  
**Status:** Structural shell only — no content  
**Languages:** English (EN), Ukrainian (UA)

---

## Purpose

This repository contains the structural foundation for a doctrine-based website. It is a **shell only** — no doctrine content, theory, or claims have been written.

---

## Live Site

**URL:** https://gotocalmaidp.github.io/doctrine-site-box/

---

## Canonical Routes

| Page | English | Ukrainian |
|------|---------|-----------|
| Home | `/en/` | `/ua/` |
| About | `/en/about/` | `/ua/about/` |
| Doctrine | `/en/doctrine/` | `/ua/doctrine/` |
| Case Studies | `/en/cases/` | `/ua/cases/` |
| Method | `/en/method/` | `/ua/method/` |
| Boundaries | `/en/boundaries/` | `/ua/boundaries/` |
| Contact | `/en/contact/` | `/ua/contact/` |

> **Note:** The route `/case-studies/` is **not used**. Tests should follow `/cases/`.

---

## Folder Structure

```
doctrine-site-box/
├── README.md              ← You are here
├── SITEMAP.md             ← Site navigation map
├── .eleventy.js           ← Eleventy configuration
├── package.json           ← Node.js dependencies
├── src/                   ← Source content files
│   ├── en/                ← English pages
│   ├── ua/                ← Ukrainian pages
│   └── _includes/         ← Templates
├── css/                   ← Stylesheets
├── _site/                 ← Compiled output (generated)
├── _cases/                ← Future case studies (EMPTY)
├── _doctrine/             ← Future doctrine texts (EMPTY)
└── _assets/               ← Static resources
```

---

## What This Contains

- **Page skeletons:** All 7 public pages in both languages with placeholder blocks
- **Sitemap:** Navigation structure and URL patterns
- **Build configuration:** Eleventy static site generator
- **GitHub Actions:** Automated deployment to GitHub Pages

---

## What This Does NOT Contain

- ❌ Doctrine content, theory, or claims
- ❌ Case study materials

---

## How to Extend

### Adding Content

1. Navigate to `/src/en/` or `/src/ua/`
2. Open the relevant `.md` file
3. Replace `[PLACEHOLDER]` blocks with actual content
4. Ensure both language versions are updated in parallel

### Adding Doctrine Materials

1. Place source documents in `/_doctrine/`
2. Reference them when writing `doctrine.md` content

### Adding Case Studies

1. Place case materials in `/_cases/`
2. Update the Case Index in `src/en/cases.md` and `src/ua/cases.md`

### Building Locally

```bash
npm ci
npm run build
```

Output will be generated in `/_site/`.

---

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

---

## Constraints

1. **No existing site modification:** This is a NEW, SEPARATE project
2. **No doctrine assumptions:** Content must come from approved sources only
3. **Bilingual parity:** All changes must be reflected in both languages

---

## Contact

[CONTENT WILL BE ADDED LATER]
