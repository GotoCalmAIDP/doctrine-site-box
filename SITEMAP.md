# SITEMAP — Doctrine Site

**Version:** 1.2 (Governance Shell)  
**Status:** Structural shell with governance pages

---

## Canonical URL Structure

### Main Pages

| Page | English URL | Ukrainian URL | Status |
|------|-------------|---------------|--------|
| Home | `/en/` | `/ua/` | Content |
| About the Project | `/en/about/` | `/ua/about/` | Content |
| Doctrine | `/en/doctrine/` | `/ua/doctrine/` | **PLACEHOLDER** |
| Case Studies | `/en/cases/` | `/ua/cases/` | **PLACEHOLDER** |
| Method | `/en/method/` | `/ua/method/` | Content |
| Boundaries | `/en/boundaries/` | `/ua/boundaries/` | Content |
| Contact | `/en/contact/` | `/ua/contact/` | Content |

> **Note:** The route `/case-studies/` is **not used**. The canonical route for Case Studies is `/cases/`. Tests and links should follow `/en/cases/` and `/ua/cases/`.

### Governance Pages

| Page | English URL | Ukrainian URL | Status |
|------|-------------|---------------|--------|
| Scope & Non-Claims | `/en/scope/` | `/ua/scope/` | Content |
| Evidence & Traceability | `/en/evidence/` | `/ua/evidence/` | Content |
| Change Log | `/en/change-log/` | `/ua/change-log/` | Content |

### Legal Pages

| Page | English URL | Ukrainian URL | Status |
|------|-------------|---------------|--------|
| Terms of Use | `/en/terms/` | `/ua/terms/` | Shell |
| Privacy Policy | `/en/privacy/` | `/ua/privacy/` | Shell |
| Cookie Policy | `/en/cookies/` | `/ua/cookies/` | Shell |
| Disclaimer | `/en/disclaimer/` | `/ua/disclaimer/` | Content |

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

FOOTER NAVIGATION
    ├── Home
    ├── Contact
    ├── Governance: Scope | Evidence | Change Log
    └── Legal: Terms | Privacy | Cookies | Disclaimer
```

---

## Notes

- All main pages contain minimal bilingual content
- "Doctrine" and "Case Studies" are explicitly marked as content placeholders
- Governance pages provide DNV-friendly clarity on scope and non-claims
- Language switcher is implemented and functional
- Legal and governance pages are linked in the footer across all pages

---

## Extension Points

When adding content:
1. Edit corresponding files in `/src/en/` and `/src/ua/`
2. Maintain parallel structure between languages
3. Update this sitemap when adding new pages
4. Update Change Log page with release notes
