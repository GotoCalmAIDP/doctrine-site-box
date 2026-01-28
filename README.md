# Doctrine Site — Structural Shell

**Version:** 1.0  
**Status:** Structural shell only — no content  
**Languages:** English (EN), Ukrainian (UA)

---

## Purpose

This repository contains the structural foundation for a doctrine-based website. It is a **shell only** — no doctrine content, theory, or claims have been written.

---

## Folder Structure

```
doctrine-site/
├── README.md              ← You are here
├── SITEMAP.md             ← Site navigation map
├── _site/                 ← Compiled output (empty)
├── _content/              ← Source content files
│   ├── en/                ← English pages
│   └── ua/                ← Ukrainian pages
├── _cases/                ← Future case studies (EMPTY)
├── _doctrine/             ← Future doctrine texts (EMPTY)
└── _assets/               ← Static resources
    ├── images/
    ├── styles/
    └── scripts/
```

---

## What This Contains

- **Page skeletons:** All 7 public pages in both languages with placeholder blocks
- **Sitemap:** Navigation structure and URL patterns
- **Folder structure:** Ready for static site generator integration

---

## What This Does NOT Contain

- ❌ Doctrine content, theory, or claims
- ❌ Case study materials
- ❌ Implemented language switcher
- ❌ CSS/JS styling
- ❌ Build configuration

---

## How to Extend

### Adding Content

1. Navigate to `/_content/en/` or `/_content/ua/`
2. Open the relevant `.md` file
3. Replace `[PLACEHOLDER]` blocks with actual content
4. Ensure both language versions are updated in parallel

### Adding Doctrine Materials

1. Place source documents in `/_doctrine/`
2. Reference them when writing `doctrine.md` content
3. See `/_doctrine/README.md` for guidelines

### Adding Case Studies

1. Place case materials in `/_cases/`
2. Update the Case Index in `cases.md`
3. See `/_cases/README.md` for guidelines

### Building the Site

This structure is compatible with static site generators:
- Jekyll
- Hugo
- Eleventy
- Astro

Configure your chosen generator to:
- Read from `/_content/`
- Output to `/_site/`
- Process both `/en/` and `/ua/` language folders

---

## Constraints

1. **No existing site modification:** This is a NEW, SEPARATE project
2. **No doctrine assumptions:** Content must come from approved sources only
3. **Bilingual parity:** All changes must be reflected in both languages

---

## Contact

[CONTENT WILL BE ADDED LATER]
