# Governance

This document defines the governance rules, release procedures, and rollback protocols for doctrine-site-box.

---

## Core Rules

### 1. UA/EN Parity Rule

All content pages must maintain parallel versions in both languages:
- Every file in `src/en/` must have a corresponding file in `src/ua/`
- Content meaning must be equivalent (not necessarily literal translation)
- Language switcher must work correctly on all pages

### 2. No Content Without Changelog Entry

**Any change to files under `src/en/` or `src/ua/` requires a corresponding update to CHANGELOG.md.**

This rule is enforced by CI. Commits that modify content files without updating CHANGELOG.md will fail the build.

### 3. Non-Claims Principle

This site does not provide:
- Certification or conformity assessment
- Legal, financial, or engineering advice
- Operational instructions or implementation guidance

All pages must maintain this principle. See [Scope & Non-Claims](/en/scope/) for details.

---

## Release Checklist

Before tagging a release, verify:

- [ ] `npm run build` succeeds without errors
- [ ] All pages return HTTP 200
- [ ] Language switcher works on all pages
- [ ] 404 page is accessible
- [ ] Footer contains all governance links (Scope | Evidence | Change Log)
- [ ] Footer contains all legal links (Terms | Privacy | Cookies | Disclaimer)
- [ ] CHANGELOG.md is updated with new version entry
- [ ] UA/EN parity is maintained

---

## Tagging Procedure

```bash
# 1. Ensure all changes are committed
git status

# 2. Create annotated tag
git tag -a v0.x.x -m "Release v0.x.x: brief description"

# 3. Push tag to origin
git push origin v0.x.x

# 4. Verify tag on GitHub
# https://github.com/GotoCalmAIDP/doctrine-site-box/tags
```

---

## Rollback Procedure

### Option A: Revert Specific Commit

```bash
# 1. Identify the commit to revert
git log --oneline

# 2. Revert the commit
git revert <commit-hash>

# 3. Push the revert
git push origin main

# 4. Verify deployment
# Check GitHub Actions and live site
```

### Option B: Rollback to Tag

```bash
# 1. List available tags
git tag -l

# 2. Reset to specific tag (creates new commit)
git checkout v0.x.x
git checkout -b rollback-branch
git push origin rollback-branch

# 3. Create PR to merge rollback-branch into main
# Or force push (use with caution):
# git push origin main --force
```

### Option C: Restore from Archive

1. Download release archive from Google Drive:
   `GotoCalm_MASTER_ARCHIVE/99_Future_Work_EMPTY/doctrine-site-box-RELEASES/`
2. Extract and verify files
3. Replace current `src/` directory with archived version
4. Commit and push

### Redeploy Confirmation Steps

After any rollback:

1. Verify GitHub Actions workflow completes successfully
2. Check live site loads correctly
3. Test language switcher on multiple pages
4. Verify footer links work
5. Document rollback in CHANGELOG.md

---

## Archive Locations

### Notion
`GotoCalm_MASTER/99_Future_Work/doctrine-site-box — Change Log`

### Google Drive
`GotoCalm_MASTER_ARCHIVE/99_Future_Work_EMPTY/doctrine-site-box-RELEASES/`

---

## Contact

For questions about governance or release procedures, see [Contact](/en/contact/).
