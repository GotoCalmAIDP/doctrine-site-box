#!/usr/bin/env python3
"""Deterministic route and link audit for doctrine-site-box.
Run after build: python3 scripts/audit-routes.py [_site]
Exits non-zero on failure. Writes scripts/audit-result.json."""

import os, re, json, sys
from datetime import datetime, timezone
from pathlib import Path

site_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
errors = 0

print("=== Doctrine Site Route & Link Audit ===")
print(f"Build directory: {site_dir}")

# 1. Route universe
en_pages = sorted(str(p.relative_to(site_dir / "en")) for p in (site_dir / "en").rglob("index.html"))
ua_pages = sorted(str(p.relative_to(site_dir / "ua")) for p in (site_dir / "ua").rglob("index.html"))
en_count = len(en_pages)
ua_count = len(ua_pages)
print(f"EN routes: {en_count} | UA routes: {ua_count}")

if en_count != 57:
    print(f"FAIL: Expected 57 EN routes, got {en_count}")
    errors += 1
if ua_count != 57:
    print(f"FAIL: Expected 57 UA routes, got {ua_count}")
    errors += 1

# 2. EN/UA parity
parity = en_pages == ua_pages
if not parity:
    print("FAIL: EN/UA slug sets differ")
    errors += 1
else:
    print("PASS: EN/UA parity (57 = 57)")

# 3. Citation DOI assertions
en_citation = (site_dir / "en" / "citation" / "index.html").read_text()
ua_citation = (site_dir / "ua" / "citation" / "index.html").read_text()

en_dois = re.findall(r'zenodo\.\d+', en_citation)
ua_dois = re.findall(r'zenodo\.\d+', ua_citation)
en_unique = sorted(set(en_dois))
ua_unique = sorted(set(ua_dois))
print(f"EN unique DOIs: {len(en_unique)} | UA unique DOIs: {len(ua_unique)}")

if len(en_unique) != 34:
    print(f"FAIL: Expected 34 unique DOIs in EN, got {len(en_unique)}")
    errors += 1
if len(ua_unique) != 34:
    print(f"FAIL: Expected 34 unique DOIs in UA, got {len(ua_unique)}")
    errors += 1

doi_order_match = en_dois == ua_dois
if not doi_order_match:
    print("FAIL: EN/UA DOI order differs")
    errors += 1
else:
    print("PASS: EN/UA DOI order identical")

if "publications (1–22)" in en_citation:
    print("FAIL: Stale '1-22' headline in EN citation")
    errors += 1

if re.search(r'record 34|Publication 34|publication 34', en_citation):
    print("FAIL: Unexpected record 34 reference")
    errors += 1

if "zenodo.22016915" not in en_citation:
    print("FAIL: Record 33 version DOI missing")
    errors += 1

if "zenodo.22016914" not in en_citation:
    print("FAIL: Concept DOI missing")
    errors += 1

print("PASS: Citation DOI assertions")

# 4. Internal link verification
broken_links = []
all_html = list(site_dir.rglob("*.html"))
for html_file in all_html:
    content = html_file.read_text(errors='ignore')
    hrefs = re.findall(r'href="/doctrine-site-box/([^"#]*)"', content)
    for href in set(hrefs):
        local = site_dir / href
        if local.is_dir():
            if not (local / "index.html").exists():
                broken_links.append(f"/doctrine-site-box/{href} (from {html_file.relative_to(site_dir)})")
        elif not local.exists():
            broken_links.append(f"/doctrine-site-box/{href} (from {html_file.relative_to(site_dir)})")

if broken_links:
    print(f"FAIL: {len(broken_links)} broken internal links")
    for bl in broken_links[:10]:
        print(f"  {bl}")
    errors += 1
else:
    print("PASS: All internal links resolve")

# 5. Sitemap and robots
sitemap_exists = (site_dir / "sitemap.xml").exists()
robots_exists = (site_dir / "robots.txt").exists()
sitemap_urls = 0
if sitemap_exists:
    sitemap_urls = (site_dir / "sitemap.xml").read_text().count("<url>")
    print(f"PASS: sitemap.xml ({sitemap_urls} URLs)")
else:
    print("FAIL: sitemap.xml missing")
    errors += 1

if robots_exists:
    print("PASS: robots.txt exists")
else:
    print("FAIL: robots.txt missing")
    errors += 1

# Summary
print(f"\n=== AUDIT SUMMARY ===")
print(f"EN routes: {en_count}")
print(f"UA routes: {ua_count}")
print(f"EN/UA parity: {'PASS' if parity else 'FAIL'}")
print(f"EN DOIs: {len(en_unique)}")
print(f"UA DOIs: {len(ua_unique)}")
print(f"Broken links: {len(broken_links)}")
print(f"Errors: {errors}")

# Write artifact
result = {
    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "en_routes": en_count,
    "ua_routes": ua_count,
    "en_ua_parity": parity,
    "en_doi_count": len(en_unique),
    "ua_doi_count": len(ua_unique),
    "doi_order_match": doi_order_match,
    "broken_internal_links": len(broken_links),
    "broken_link_details": broken_links[:20],
    "sitemap_exists": sitemap_exists,
    "sitemap_url_count": sitemap_urls,
    "robots_exists": robots_exists,
    "errors": errors,
    "result": "PASS" if errors == 0 else "FAIL"
}

os.makedirs("scripts", exist_ok=True)
with open("scripts/audit-result.json", "w") as f:
    json.dump(result, f, indent=2)
print(f"Artifact: scripts/audit-result.json")

if errors > 0:
    print(f"AUDIT FAILED with {errors} error(s)")
    sys.exit(1)
else:
    print("AUDIT PASSED")
    sys.exit(0)
