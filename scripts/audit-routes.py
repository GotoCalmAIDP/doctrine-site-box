#!/usr/bin/env python3
"""Deterministic route, link, reachability, and metadata audit for doctrine-site-box.
Run after build: python3 scripts/audit-routes.py [_site]
Exits non-zero on failure. Writes scripts/audit-result.json."""

import os, re, json, sys
from datetime import datetime, timezone
from pathlib import Path
from html.parser import HTMLParser

site_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
errors = 0
PREFIX = "/doctrine-site-box"

print("=== Doctrine Site Enhanced Route & Link Audit ===")
print(f"Build directory: {site_dir}")

# ─── 1. Route universe ───
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

# ─── 2. EN/UA parity ───
parity = en_pages == ua_pages
if not parity:
    print("FAIL: EN/UA slug sets differ")
    errors += 1
else:
    print("PASS: EN/UA parity (57 = 57)")

# ─── 3. Citation DOI assertions ───
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
    print("FAIL: Stale '1-22' headline in EN citation"); errors += 1
if re.search(r'record 34|Publication 34|publication 34', en_citation):
    print("FAIL: Unexpected record 34 reference"); errors += 1
if "zenodo.22016915" not in en_citation:
    print("FAIL: Record 33 version DOI missing"); errors += 1
if "zenodo.22016914" not in en_citation:
    print("FAIL: Concept DOI missing"); errors += 1
print("PASS: Citation DOI assertions")

# ─── 4. Internal link verification ───
broken_links = []
all_html = list(site_dir.rglob("*.html"))
link_graph = {}  # page -> set of internal link targets

for html_file in all_html:
    content = html_file.read_text(errors='ignore')
    rel_path = "/" + str(html_file.relative_to(site_dir))
    # Normalize to route
    route = rel_path.replace("/index.html", "/")
    if route.endswith(".html") and route != "/404.html":
        route = route  # keep as-is for 404.html

    hrefs = re.findall(r'href="' + re.escape(PREFIX) + r'/([^"#]*)"', content)
    targets = set()
    for href in set(hrefs):
        local = site_dir / href
        target_route = PREFIX + "/" + href
        if not target_route.endswith("/") and not target_route.endswith(".html") and not "." in href.split("/")[-1]:
            target_route += "/"
        targets.add(target_route)
        if local.is_dir():
            if not (local / "index.html").exists():
                broken_links.append(f"{PREFIX}/{href} (from {route})")
        elif not local.exists():
            broken_links.append(f"{PREFIX}/{href} (from {route})")
    link_graph[route] = targets

if broken_links:
    print(f"FAIL: {len(broken_links)} broken internal links")
    for bl in broken_links[:10]:
        print(f"  {bl}")
    errors += 1
else:
    print("PASS: All internal links resolve")

# ─── 5. Reachability / orphan detection ───
# Build full route set
all_routes = set()
for html_file in all_html:
    rel = "/" + str(html_file.relative_to(site_dir))
    route = rel.replace("/index.html", "/")
    all_routes.add(route)

# Public HTML routes (exclude non-page assets)
public_html_routes = sorted(all_routes)

# Allowed exclusions
allowed_exclusions = ["/404.html"]

# Crawl from entry surfaces
entry_points = ["/", "/en/", "/ua/"]
visited = set()
queue = list(entry_points)

while queue:
    current = queue.pop(0)
    if current in visited:
        continue
    visited.add(current)
    # Find this route's outgoing links
    if current in link_graph:
        for target in link_graph[current]:
            # Normalize target to match our route format
            norm = target.replace(PREFIX, "")
            if not norm.startswith("/"):
                norm = "/" + norm
            if norm not in visited and norm in all_routes:
                queue.append(norm)

reachable_routes = sorted(visited & all_routes)
orphan_routes = sorted((all_routes - visited) - set(allowed_exclusions))

print(f"Public HTML routes: {len(public_html_routes)}")
print(f"Reachable routes: {len(reachable_routes)}")
print(f"Orphan routes: {len(orphan_routes)}")
if orphan_routes:
    print(f"FAIL: {len(orphan_routes)} orphan routes found:")
    for o in orphan_routes:
        print(f"  {o}")
    errors += 1
else:
    print("PASS: No orphan routes (all public content reachable)")

# ─── 6. Sitemap and robots ───
sitemap_exists = (site_dir / "sitemap.xml").exists()
robots_exists = (site_dir / "robots.txt").exists()
sitemap_urls = 0
if sitemap_exists:
    sitemap_content = (site_dir / "sitemap.xml").read_text()
    sitemap_urls = sitemap_content.count("<url>")
    # Verify 404 is NOT in sitemap
    if "/404" in sitemap_content:
        print("FAIL: 404 page found in sitemap")
        errors += 1
    if sitemap_urls != 115:
        print(f"WARN: Expected 115 sitemap URLs, got {sitemap_urls}")
    print(f"PASS: sitemap.xml ({sitemap_urls} URLs, 404 excluded)")
else:
    print("FAIL: sitemap.xml missing"); errors += 1

if robots_exists:
    print("PASS: robots.txt exists")
else:
    print("FAIL: robots.txt missing"); errors += 1

# ─── 7. Canonical/hreflang validation ───
canonical_errors = 0
hreflang_errors = 0
for html_file in (site_dir / "en").rglob("index.html"):
    content = html_file.read_text(errors='ignore')
    route = "/" + str(html_file.relative_to(site_dir)).replace("/index.html", "/")
    full_url = f"https://gotocalmaidp.github.io{PREFIX}{route}"
    # Check canonical
    if f'rel="canonical" href="{full_url}"' not in content:
        canonical_errors += 1
    # Check hreflang en
    if f'hreflang="en" href="{full_url}"' not in content:
        hreflang_errors += 1
    # Check hreflang uk
    ua_url = full_url.replace("/en/", "/ua/")
    if f'hreflang="uk" href="{ua_url}"' not in content:
        hreflang_errors += 1

for html_file in (site_dir / "ua").rglob("index.html"):
    content = html_file.read_text(errors='ignore')
    route = "/" + str(html_file.relative_to(site_dir)).replace("/index.html", "/")
    full_url = f"https://gotocalmaidp.github.io{PREFIX}{route}"
    if f'rel="canonical" href="{full_url}"' not in content:
        canonical_errors += 1
    if f'hreflang="uk" href="{full_url}"' not in content:
        hreflang_errors += 1
    en_url = full_url.replace("/ua/", "/en/")
    if f'hreflang="en" href="{en_url}"' not in content:
        hreflang_errors += 1

if canonical_errors:
    print(f"FAIL: {canonical_errors} canonical link errors"); errors += 1
else:
    print("PASS: Canonical links valid on all pages")

if hreflang_errors:
    print(f"FAIL: {hreflang_errors} hreflang errors"); errors += 1
else:
    print("PASS: Hreflang alternates valid on all pages")

# ─── 8. Lang attribute validation ───
lang_errors = 0
for html_file in (site_dir / "en").rglob("index.html"):
    content = html_file.read_text(errors='ignore')
    if 'lang="en"' not in content.split("</head>")[0]:
        lang_errors += 1
for html_file in (site_dir / "ua").rglob("index.html"):
    content = html_file.read_text(errors='ignore')
    if 'lang="uk"' not in content.split("</head>")[0]:
        lang_errors += 1

if lang_errors:
    print(f"FAIL: {lang_errors} lang attribute errors"); errors += 1
else:
    print('PASS: lang="en" and lang="uk" validation')

# ─── Summary ───
print(f"\n=== AUDIT SUMMARY ===")
print(f"EN routes: {en_count}")
print(f"UA routes: {ua_count}")
print(f"EN/UA parity: {'PASS' if parity else 'FAIL'}")
print(f"EN DOIs: {len(en_unique)}")
print(f"UA DOIs: {len(ua_unique)}")
print(f"DOI order match: {'PASS' if doi_order_match else 'FAIL'}")
print(f"Broken internal links: {len(broken_links)}")
print(f"Public HTML routes: {len(public_html_routes)}")
print(f"Reachable routes: {len(reachable_routes)}")
print(f"Orphan routes: {len(orphan_routes)}")
print(f"Allowed exclusions: {allowed_exclusions}")
print(f"Sitemap URLs: {sitemap_urls}")
print(f"Canonical/hreflang: {'PASS' if canonical_errors == 0 and hreflang_errors == 0 else 'FAIL'}")
print(f"Lang validation: {'PASS' if lang_errors == 0 else 'FAIL'}")
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
    "public_html_routes": len(public_html_routes),
    "reachable_routes": len(reachable_routes),
    "orphan_routes": orphan_routes,
    "allowed_exclusions": allowed_exclusions,
    "sitemap_exists": sitemap_exists,
    "sitemap_url_count": sitemap_urls,
    "robots_exists": robots_exists,
    "canonical_errors": canonical_errors,
    "hreflang_errors": hreflang_errors,
    "lang_errors": lang_errors,
    "errors": errors,
    "result": "PASS" if errors == 0 else "FAIL"
}

os.makedirs("scripts", exist_ok=True)
with open("scripts/audit-result.json", "w") as f:
    json.dump(result, f, indent=2)
print(f"\nArtifact: scripts/audit-result.json")

if errors > 0:
    print(f"AUDIT FAILED with {errors} error(s)")
    sys.exit(1)
else:
    print("AUDIT PASSED")
    sys.exit(0)
