#!/usr/bin/env python3
"""Deterministic P2 audit for doctrine-site-box.

Run after build: python3 scripts/audit-routes.py [_site]
The audit verifies route reachability, link integrity, EN/UA parity, publication
source/manifest agreement, citation utilities, metadata, and static accessibility
controls. It writes scripts/audit-result.json and exits non-zero on any failure.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SITE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "_site")
if not SITE.is_absolute():
    SITE = ROOT / SITE
PREFIX = "/doctrine-site-box"
SITE_ORIGIN = "https://gotocalmaidp.github.io"
EN_CITATION = ROOT / "src" / "en" / "citation.md"
UA_CITATION = ROOT / "src" / "ua" / "citation.md"
METADATA_PATH = ROOT / "src" / "_data" / "pageMetadata.json"
MANIFEST_PATH = ROOT / "src" / "assets" / "data" / "publications.json"
SCHEMA_PATH = ROOT / "docs" / "publications-manifest.schema.json"
CFF_PATH = ROOT / "CITATION.cff"
CSS_PATH = ROOT / "css" / "style.css"

EXPECTED_CANONICAL_HASHES = {
    "src/en/boundaries.md": "b2aaea2409fffd2d8fc6bdc60d75283a5eaae9cfbc74065423f5a33477d94d41",
    "src/ua/boundaries.md": "cf2b2587ffc33e1f8f29e99bc52bba58e597e6bb7bcd84eb1b600b6147a11dbf",
}
EXPECTED_GROUPS = [
    "foundational-doctrine",
    "doctrinal-specifications",
    "evaluation-modules",
    "standing-operative-capacity-surfaces",
    "commercial-companion-notes",
    "corpus-governance-and-canon-controls",
    "commit-transition-attribution-and-runtime-integrity",
    "boundary-discovery-and-post-market-monitoring",
]

RE_RECORD = re.compile(r"^(\d+)\. \*\*(.+)\*\*$")
RE_DOI = re.compile(r"^\s*DOI:\s*\[(10\.5281/zenodo\.\d+)\]\(https://doi\.org/\1\)")
RE_GROUP = re.compile(r"^###\s+(.+)$")

errors: list[str] = []

def fail(message: str) -> None:
    errors.append(message)
    print(f"FAIL: {message}")

def passed(message: str) -> None:
    print(f"PASS: {message}")

def route_from_file(html_file: Path) -> str:
    rel = "/" + str(html_file.relative_to(SITE))
    return rel.replace("/index.html", "/")

def publication_section(text: str) -> str:
    for heading in ("## Related Zenodo Publications", "## Пов'язані публікації на Zenodo"):
        if heading in text:
            return text.split(heading, 1)[1]
    raise ValueError("Zenodo publication section is missing")

def parse_publications(text: str) -> tuple[list[dict[str, Any]], list[str]]:
    records: list[dict[str, Any]] = []
    groups: list[str] = []
    group: str | None = None
    lines = publication_section(text).splitlines()
    for index, line in enumerate(lines):
        group_match = RE_GROUP.match(line)
        if group_match:
            group = group_match.group(1)
            groups.append(group)
            continue
        record_match = RE_RECORD.match(line)
        if record_match:
            if group is None or index + 1 >= len(lines):
                raise ValueError("Publication record grouping is malformed")
            doi_match = RE_DOI.match(lines[index + 1])
            if not doi_match:
                raise ValueError(f"Publication record {record_match.group(1)} DOI is malformed")
            records.append({
                "number": int(record_match.group(1)),
                "title": record_match.group(2),
                "doi": doi_match.group(1),
                "group": group,
            })
    return records, groups

def bib_values(text: str) -> dict[str, str]:
    block = re.search(r"```\n(@misc\{.*?\n\})\n```", text, flags=re.S)
    if not block:
        raise ValueError("Approved BibTeX source block is missing")
    bib = block.group(1)
    fields: dict[str, str] = {}
    for name in ("author", "title", "year", "note", "howpublished", "url"):
        match = re.search(rf"^\s*{name}\s*=\s*\{{(.+?)\}},?$", bib, flags=re.M)
        if not match:
            raise ValueError(f"Approved BibTeX source is missing {name}")
        fields[name] = match.group(1)
    fields["raw"] = bib
    return fields

def head_of(content: str) -> str:
    return content.split("</head>", 1)[0]

def meta_content(head: str, name: str, attribute: str = "name") -> str | None:
    pattern = rf'<meta\s+{attribute}="{re.escape(name)}"\s+content="([^"]*)"'
    match = re.search(pattern, head)
    return match.group(1) if match else None

print("=== Doctrine Site P2 Deterministic Audit ===")
print(f"Build directory: {SITE}")
if not SITE.exists():
    raise SystemExit(f"Build directory does not exist: {SITE}")

# 1. Route universe and parity.
all_html_files = sorted(SITE.rglob("*.html"))
all_routes = {route_from_file(path) for path in all_html_files}
en_pages = sorted(str(p.relative_to(SITE / "en")) for p in (SITE / "en").rglob("index.html"))
ua_pages = sorted(str(p.relative_to(SITE / "ua")) for p in (SITE / "ua").rglob("index.html"))
en_count, ua_count = len(en_pages), len(ua_pages)
if en_count != 57:
    fail(f"Expected 57 EN routes, got {en_count}")
else:
    passed("EN routes = 57")
if ua_count != 57:
    fail(f"Expected 57 UA routes, got {ua_count}")
else:
    passed("UA routes = 57")
parity = en_pages == ua_pages
if not parity:
    fail("EN/UA slug parity differs")
else:
    passed("EN/UA parity")

# 1b. Complete generated EN/UA metadata map.
metadata_map_errors = 0
try:
    metadata_map = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    expected_metadata_routes = {route for route in all_routes if route.startswith("/en/") or route.startswith("/ua/")}
    if set(metadata_map) != expected_metadata_routes:
        raise ValueError("metadata map routes do not exactly match the EN/UA public route universe")
    for route, item in metadata_map.items():
        for key in ("title", "description", "og_title", "og_description", "twitter_title", "twitter_description", "source"):
            if not item.get(key):
                raise ValueError(f"metadata map entry {route} has empty {key}")
    passed("Complete generated pageMetadata map (57 EN + 57 UA)")
except Exception as exc:
    metadata_map_errors += 1
    fail(f"Generated pageMetadata map validation: {exc}")

# 2. Internal links, route reachability, and link names.
broken_links: list[str] = []
unclear_link_names: list[str] = []
link_graph: dict[str, set[str]] = {}
for html_file in all_html_files:
    content = html_file.read_text(encoding="utf-8", errors="ignore")
    route = route_from_file(html_file)
    targets: set[str] = set()
    for href in re.findall(r'href="' + re.escape(PREFIX) + r'/([^"#]*)"', content):
        target_path = SITE / href
        target_route = "/" + href
        if not target_route.endswith("/") and not target_route.endswith(".html") and "." not in href.split("/")[-1]:
            target_route += "/"
        targets.add(target_route)
        if target_path.is_dir():
            if not (target_path / "index.html").exists():
                broken_links.append(f"{route} -> {PREFIX}/{href}")
        elif not target_path.exists():
            broken_links.append(f"{route} -> {PREFIX}/{href}")
    for attrs, label in re.findall(r"<a\s+([^>]*\bhref=[^>]*)>(.*?)</a>", content, flags=re.S | re.I):
        visible = re.sub(r"<[^>]+>", "", label).strip()
        if not visible:
            unclear_link_names.append(f"{route}: empty link name")
        elif visible.lower() in {"click here", "here", "more", "read more"}:
            unclear_link_names.append(f"{route}: ambiguous link name '{visible}'")
    link_graph[route] = targets
if broken_links:
    fail(f"Broken internal links ({len(broken_links)})")
else:
    passed("Broken internal links = 0")
if unclear_link_names:
    fail(f"Unclear link names ({len(unclear_link_names)})")
else:
    passed("Link-name clarity")

allowed_exclusions = ["/404.html"]
entry_points = ["/", "/en/", "/ua/"]
visited: set[str] = set()
queue = list(entry_points)
while queue:
    current = queue.pop(0)
    if current in visited:
        continue
    visited.add(current)
    for target in link_graph.get(current, set()):
        if target in all_routes and target not in visited:
            queue.append(target)
reachable_routes = sorted(visited & all_routes)
orphan_routes = sorted((all_routes - visited) - set(allowed_exclusions))
if orphan_routes:
    fail(f"Orphan public routes ({len(orphan_routes)})")
else:
    passed("Orphan routes = []")

# 3. Sitemap and robots.
sitemap = SITE / "sitemap.xml"
robots = SITE / "robots.txt"
sitemap_url_count = 0
if not sitemap.exists():
    fail("sitemap.xml missing")
else:
    sitemap_text = sitemap.read_text(encoding="utf-8")
    sitemap_url_count = sitemap_text.count("<url>")
    if sitemap_url_count != 115:
        fail(f"Expected 115 sitemap URLs, got {sitemap_url_count}")
    elif "/404" in sitemap_text:
        fail("404 is present in sitemap")
    else:
        passed("sitemap = 115 URLs; 404 excluded")
if not robots.exists() or "Sitemap: https://gotocalmaidp.github.io/doctrine-site-box/sitemap.xml" not in robots.read_text(encoding="utf-8"):
    fail("robots.txt missing or sitemap reference incorrect")
else:
    passed("robots.txt")

# 4. Canonical/hreflang/lang and all page-specific discovery metadata.
canonical_errors = 0
hreflang_errors = 0
lang_errors = 0
metadata_errors = 0
titles_by_lang: dict[str, list[str]] = {"en": [], "ua": []}
for language, html_files, expected_lang, other_lang in (
    ("en", (SITE / "en").rglob("index.html"), "en", "ua"),
    ("ua", (SITE / "ua").rglob("index.html"), "uk", "en"),
):
    for html_file in html_files:
        content = html_file.read_text(encoding="utf-8", errors="ignore")
        head = head_of(content)
        route = route_from_file(html_file)
        canonical = f"{SITE_ORIGIN}{PREFIX}{route}"
        counterpart = canonical.replace(f"/{language}/", f"/{other_lang}/")
        other_hreflang = "uk" if language == "en" else "en"
        if f'rel="canonical" href="{canonical}"' not in head:
            canonical_errors += 1
        if f'hreflang="{expected_lang}" href="{canonical}"' not in head:
            hreflang_errors += 1
        if f'hreflang="{other_hreflang}" href="{counterpart}"' not in head:
            hreflang_errors += 1
        if f'lang="{expected_lang}"' not in head:
            lang_errors += 1
        required_meta = [
            ("description", "name"),
            ("og:title", "property"),
            ("og:description", "property"),
            ("og:url", "property"),
            ("og:image", "property"),
            ("twitter:card", "name"),
            ("twitter:title", "name"),
            ("twitter:description", "name"),
            ("twitter:image", "name"),
        ]
        values = {}
        for key, attr in required_meta:
            value = meta_content(head, key, attr)
            values[key] = value
            if not value:
                metadata_errors += 1
        if values.get("og:url") != canonical:
            metadata_errors += 1
        if values.get("og:image") != f"{SITE_ORIGIN}{PREFIX}/assets/applicability-boundary-social.png":
            metadata_errors += 1
        title_match = re.search(r"<title>(.*?)</title>", head, flags=re.S)
        if title_match:
            titles_by_lang[language].append(title_match.group(1).strip())
        else:
            metadata_errors += 1
if canonical_errors:
    fail(f"Canonical errors ({canonical_errors})")
else:
    passed("Self-referencing canonical URLs")
if hreflang_errors:
    fail(f"Hreflang errors ({hreflang_errors})")
else:
    passed("Reciprocal hreflang en/uk")
if lang_errors:
    fail(f"Language attribute errors ({lang_errors})")
else:
    passed('lang="en" and lang="uk"')
if metadata_errors:
    fail(f"Discovery metadata errors ({metadata_errors})")
else:
    passed("Page-specific description, Open Graph, and Twitter metadata")
title_uniqueness = {language: len(titles) == len(set(titles)) for language, titles in titles_by_lang.items()}
for language, is_unique in title_uniqueness.items():
    if not is_unique:
        fail(f"Duplicate rendered metadata titles in {language}")
    else:
        passed(f"Unique rendered metadata titles ({language})")

# 5. Citation sources, utilities, anchors, manifest, and schema.
en_source = EN_CITATION.read_text(encoding="utf-8")
ua_source = UA_CITATION.read_text(encoding="utf-8")
en_records, en_groups = parse_publications(en_source)
ua_records, ua_groups = parse_publications(ua_source)
publication_errors = 0
if len(en_records) != 33 or len(ua_records) != 33:
    publication_errors += 1
if sorted(r["number"] for r in en_records) != list(range(1, 34)):
    publication_errors += 1
if sorted(r["number"] for r in ua_records) != list(range(1, 34)):
    publication_errors += 1
if [(r["number"], r["title"], r["doi"]) for r in en_records] != [(r["number"], r["title"], r["doi"]) for r in ua_records]:
    publication_errors += 1
if len(en_groups) != 8 or len(ua_groups) != 8:
    publication_errors += 1
if publication_errors:
    fail("Citation record count, titles, DOI values, DOI order, or group order mismatch")
else:
    passed("EN/UA citation records (1–33), titles, DOI values, ordering, and groups")

# Citation download utilities.
try:
    approved = bib_values(en_source)
    cff = yaml.safe_load(CFF_PATH.read_text(encoding="utf-8"))
    required_cff = {
        "cff-version": "1.2.0",
        "title": approved["title"],
        "version": approved["note"].replace("Canonical Version ", ""),
        "url": approved["url"],
    }
    for key, expected in required_cff.items():
        if cff.get(key) != expected:
            raise ValueError(f"CFF {key} disagrees with approved Citation source")
    author = cff.get("authors", [{}])[0]
    if author.get("family-names") != "Partasyuk" or author.get("given-names") != "Vadym":
        raise ValueError("CFF author disagrees with approved BibTeX")
    preferred = cff.get("preferred-citation", {})
    if preferred.get("year") != int(approved["year"]):
        raise ValueError("CFF year disagrees with approved BibTeX")
    bib_download = (ROOT / "src" / "assets" / "citation" / "applicability-boundary-doctrine.bib").read_text(encoding="utf-8").strip()
    if bib_download != approved["raw"].strip():
        raise ValueError("BibTeX download disagrees with approved Citation source")
    ris = (ROOT / "src" / "assets" / "citation" / "applicability-boundary-doctrine.ris").read_text(encoding="utf-8")
    for expected in (f"AU  - {approved['author']}", f"TI  - {approved['title']}", f"PY  - {approved['year']}", f"UR  - {approved['url']}"):
        if expected not in ris:
            raise ValueError("RIS download disagrees with approved Citation source")
    plain = (ROOT / "src" / "assets" / "citation" / "applicability-boundary-doctrine-citation.txt").read_text(encoding="utf-8")
    for expected in ("Partasyuk, V.", approved["title"], approved["note"], approved["url"]):
        if expected not in plain:
            raise ValueError("Plain citation download disagrees with approved Citation source")
    if not (ROOT / "src" / "assets" / "citation" / "CITATION.cff").read_text(encoding="utf-8") == CFF_PATH.read_text(encoding="utf-8"):
        raise ValueError("Deployable CFF differs from repository-root CITATION.cff")
    passed("CITATION.cff, BibTeX, RIS, and plain citation files")
except Exception as exc:
    fail(f"Citation-file validation: {exc}")

# Publication manifest schema and source agreement.
manifest_errors = 0
try:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    schema_errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(manifest), key=lambda e: e.path)
    if schema_errors:
        raise ValueError("; ".join(error.message for error in schema_errors[:3]))
    if manifest.get("derived") is not True:
        raise ValueError("derived must be true")
    if manifest.get("authoritative_source", {}).get("en") != f"{SITE_ORIGIN}{PREFIX}/en/citation/":
        raise ValueError("EN authoritative source is incorrect")
    if manifest.get("authoritative_source", {}).get("ua") != f"{SITE_ORIGIN}{PREFIX}/ua/citation/":
        raise ValueError("UA authoritative source is incorrect")
    records = manifest.get("records", [])
    expected = [(r["number"], r["title"], r["doi"], r["group"]) for r in en_records]
    actual = [(r.get("record_number"), r.get("title"), r.get("version_doi"), r.get("structural_group", {}).get("en")) for r in records]
    if actual != expected:
        raise ValueError("Manifest record count, titles, DOI values, DOI order, or group ordering disagrees with Citation")
    record33 = records[-1]
    if record33.get("all_versions_doi") != "10.5281/zenodo.22016914":
        raise ValueError("Manifest record-33 all-versions DOI treatment is incorrect")
    if record33.get("version_doi") != "10.5281/zenodo.22016915":
        raise ValueError("Manifest record-33 version DOI treatment is incorrect")
    passed("Derived publication manifest schema and source agreement")
except Exception as exc:
    manifest_errors += 1
    fail(f"Publication manifest validation: {exc}")

# Citation download links, stable anchors, and factual Citation metadata in rendered pages.
citation_page_errors = 0
for language in ("en", "ua"):
    rendered = (SITE / language / "citation" / "index.html").read_text(encoding="utf-8")
    for href in (
        "/doctrine-site-box/assets/citation/CITATION.cff",
        "/doctrine-site-box/assets/citation/applicability-boundary-doctrine.bib",
        "/doctrine-site-box/assets/citation/applicability-boundary-doctrine.ris",
        "/doctrine-site-box/assets/citation/applicability-boundary-doctrine-citation.txt",
    ):
        if f'href="{href}"' not in rendered:
            citation_page_errors += 1
    for record in range(1, 34):
        if f'id="publication-{record:02d}"' not in rendered:
            citation_page_errors += 1
    for group_id in EXPECTED_GROUPS:
        if f'id="publication-group-{group_id}"' not in rendered:
            citation_page_errors += 1
    if 'id="record-33-all-versions-doi"' not in rendered:
        citation_page_errors += 1
    head = head_of(rendered)
    for name, value in (
        ("citation_title", "Applicability Boundary Doctrine"),
        ("citation_author", "Partasyuk, Vadym"),
        ("citation_publication_date", "2025"),
        ("citation_technical_report_institution", "GotoCalm AI-DP Doctrine Repository"),
        ("citation_url", f"{SITE_ORIGIN}{PREFIX}/"),
    ):
        if meta_content(head, name) != value:
            citation_page_errors += 1
    if '"@type": "CreativeWork"' not in head or '"version": "1.4.3"' not in head:
        citation_page_errors += 1
if citation_page_errors:
    fail(f"Citation downloads, anchors, or machine-readable metadata errors ({citation_page_errors})")
else:
    passed("Citation download links, anchors, citation_* metadata, and JSON-LD")

# 6. Accessibility source checks plus heading hierarchy.
css = CSS_PATH.read_text(encoding="utf-8")
accessibility_errors = 0
heading_hierarchy_details: list[str] = []
if "a:focus-visible" not in css or "outline: 3px solid #004c99" not in css:
    accessibility_errors += 1
if "@media (max-width: 768px)" not in css or "overflow-wrap: anywhere" not in css:
    accessibility_errors += 1
for html_file in all_html_files:
    content = html_file.read_text(encoding="utf-8", errors="ignore")
    levels = [int(level) for level in re.findall(r"<h([1-6])(?:\s|>)", content, flags=re.I)]
    if not levels or levels[0] != 1:
        accessibility_errors += 1
        heading_hierarchy_details.append(f"{route_from_file(html_file)}: missing initial h1")
        continue
    for previous, current in zip(levels, levels[1:]):
        if current > previous + 1:
            accessibility_errors += 1
            heading_hierarchy_details.append(f"{route_from_file(html_file)}: h{previous} to h{current} skip")
            break
if accessibility_errors:
    fail(f"Static accessibility errors ({accessibility_errors})")
else:
    passed("Keyboard focus, responsive wrapping, and heading hierarchy")

# 7. Social image and protected canonical baseline.
social_image = SITE / "assets" / "applicability-boundary-social.png"
if not social_image.exists():
    fail("First-party social image is missing from build")
else:
    size = Image.open(social_image).size
    if size != (1200, 630):
        fail(f"Social image dimensions are {size}, expected (1200, 630)")
    else:
        passed("First-party social image (1200x630)")

import hashlib
canonical_hash_errors = 0
for relative, expected_hash in EXPECTED_CANONICAL_HASHES.items():
    actual_hash = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
    if actual_hash != expected_hash:
        canonical_hash_errors += 1
if canonical_hash_errors:
    fail(f"Canonical baseline hash errors ({canonical_hash_errors})")
else:
    passed("Canonical baseline SHA-256")

result = {
    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "en_routes": en_count,
    "ua_routes": ua_count,
    "en_ua_parity": parity,
    "en_doi_count": len(set(r["doi"] for r in en_records)) + 1,
    "ua_doi_count": len(set(r["doi"] for r in ua_records)) + 1,
    "doi_order_match": [(r["number"], r["doi"]) for r in en_records] == [(r["number"], r["doi"]) for r in ua_records],
    "broken_internal_links": broken_links,
    "unclear_link_names": unclear_link_names,
    "public_html_routes": sorted(all_routes),
    "public_html_route_count": len(all_routes),
    "reachable_routes": reachable_routes,
    "reachable_route_count": len(reachable_routes),
    "orphan_routes": orphan_routes,
    "allowed_exclusions": allowed_exclusions,
    "sitemap_exists": sitemap.exists(),
    "sitemap_url_count": sitemap_url_count,
    "robots_exists": robots.exists(),
    "canonical_errors": canonical_errors,
    "hreflang_errors": hreflang_errors,
    "lang_errors": lang_errors,
    "metadata_errors": metadata_errors,
    "metadata_map_errors": metadata_map_errors,
    "metadata_title_uniqueness": title_uniqueness,
    "citation_file_validation": "PASS" if not any(e.startswith("Citation-file") for e in errors) else "FAIL",
    "manifest_schema_validation": "PASS" if manifest_errors == 0 else "FAIL",
    "citation_page_errors": citation_page_errors,
    "static_accessibility_errors": accessibility_errors,
    "heading_hierarchy_details": heading_hierarchy_details,
    "canonical_hash_errors": canonical_hash_errors,
    "result": "PASS" if not errors else "FAIL",
    "errors": errors,
}

output = ROOT / "scripts" / "audit-result.json"
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Artifact: {output.relative_to(ROOT)}")
if errors:
    print(f"AUDIT FAILED with {len(errors)} error(s)")
    sys.exit(1)
print("AUDIT PASSED")
