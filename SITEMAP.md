# SITEMAP — Doctrine Site

**Version:** 1.0 (Structural Shell)  
**Status:** Placeholder structure only — no content

---

## Canonical URL Structure

| Page | English URL | Ukrainian URL | Status |
|------|-------------|---------------|--------|
| Home | `/en/` | `/ua/` | Shell |
| About the Project | `/en/about/` | `/ua/about/` | Shell |
| Doctrine | `/en/doctrine/` | `/ua/doctrine/` | **PLACEHOLDER** |
| Case Studies | `/en/cases/` | `/ua/cases/` | **PLACEHOLDER** |
| Method | `/en/method/` | `/ua/method/` | Shell |
| Boundaries | `/en/boundaries/` | `/ua/boundaries/` | Shell |
| Contact | `/en/contact/` | `/ua/contact/` | Shell |

> **Note:** The route `/case-studies/` is **not used**. The canonical route for Case Studies is `/cases/`. Tests and links should follow `/en/cases/` and `/ua/cases/`.

---

## Navigation Hierarchy

```
[LANGUAGE SWITCHER]
    ├── EN
    └── UA

PRIMARY NAVIGATION
    ├── Home
    ├── About
    ├── Doctrine [PLACEHOLDER]
    ├── Case Studies [PLACEHOLDER] → /cases/
    ├── Method
    ├── Boundaries
    └── Contact
```

---

## Notes

- All pages exist as structural shells only
- "Doctrine" and "Case Studies" are explicitly marked as content placeholders
- Language switcher is implemented and functional
- Content will be added in future phases

---

## Extension Points

When adding content:
1. Edit corresponding files in `/src/en/` and `/src/ua/`
2. Maintain parallel structure between languages
3. Update this sitemap when adding new pages
