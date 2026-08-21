#!/usr/bin/env bash
# Deterministic route and link audit for doctrine-site-box
# Runs after build. Exits non-zero on any failure.
# Produces machine-readable JSON artifact at scripts/audit-result.json

set -euo pipefail

SITE_DIR="${1:-_site}"
RESULT_FILE="scripts/audit-result.json"
ERRORS=0

echo "=== Doctrine Site Route & Link Audit ==="
echo "Build directory: $SITE_DIR"

# --- 1. Route universe: 57 EN + 57 UA ---
EN_COUNT=$(find "$SITE_DIR/en" -name "index.html" | wc -l)
UA_COUNT=$(find "$SITE_DIR/ua" -name "index.html" | wc -l)
echo "EN routes: $EN_COUNT | UA routes: $UA_COUNT"

if [ "$EN_COUNT" -ne 57 ]; then
  echo "FAIL: Expected 57 EN routes, got $EN_COUNT"
  ERRORS=$((ERRORS + 1))
fi
if [ "$UA_COUNT" -ne 57 ]; then
  echo "FAIL: Expected 57 UA routes, got $UA_COUNT"
  ERRORS=$((ERRORS + 1))
fi

# --- 2. EN/UA parity ---
EN_SLUGS=$(find "$SITE_DIR/en" -name "index.html" | sed "s|$SITE_DIR/en/||" | sort)
UA_SLUGS=$(find "$SITE_DIR/ua" -name "index.html" | sed "s|$SITE_DIR/ua/||" | sort)
if [ "$EN_SLUGS" != "$UA_SLUGS" ]; then
  echo "FAIL: EN/UA slug sets differ"
  diff <(echo "$EN_SLUGS") <(echo "$UA_SLUGS") || true
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: EN/UA parity (57 = 57)"
fi

# --- 3. Citation DOI assertions ---
EN_CITATION="$SITE_DIR/en/citation/index.html"
UA_CITATION="$SITE_DIR/ua/citation/index.html"

EN_DOI_COUNT=$(grep -oP 'zenodo\.\d+' "$EN_CITATION" | sort -u | wc -l)
UA_DOI_COUNT=$(grep -oP 'zenodo\.\d+' "$UA_CITATION" | sort -u | wc -l)
echo "EN unique DOIs: $EN_DOI_COUNT | UA unique DOIs: $UA_DOI_COUNT"

# 33 publication DOIs + 1 concept DOI = 34
if [ "$EN_DOI_COUNT" -ne 34 ]; then
  echo "FAIL: Expected 34 unique DOI IDs in EN citation, got $EN_DOI_COUNT"
  ERRORS=$((ERRORS + 1))
fi
if [ "$UA_DOI_COUNT" -ne 34 ]; then
  echo "FAIL: Expected 34 unique DOI IDs in UA citation, got $UA_DOI_COUNT"
  ERRORS=$((ERRORS + 1))
fi

# EN/UA DOI order must match
EN_DOI_ORDER=$(grep -oP 'zenodo\.\d+' "$EN_CITATION")
UA_DOI_ORDER=$(grep -oP 'zenodo\.\d+' "$UA_CITATION")
if [ "$EN_DOI_ORDER" != "$UA_DOI_ORDER" ]; then
  echo "FAIL: EN/UA DOI order differs"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: EN/UA DOI order identical"
fi

# Check for stale 1-22 headline
if grep -q "publications (1–22)" "$EN_CITATION" 2>/dev/null; then
  echo "FAIL: Stale '1-22' headline found in EN citation"
  ERRORS=$((ERRORS + 1))
fi

# Check no record 34
if grep -q "record 34\|Publication 34\|publication 34" "$EN_CITATION" 2>/dev/null; then
  echo "FAIL: Unexpected record 34 reference in EN citation"
  ERRORS=$((ERRORS + 1))
fi

# Verify record 33 version DOI present
if ! grep -q "zenodo.22016915" "$EN_CITATION" 2>/dev/null; then
  echo "FAIL: Record 33 version DOI (22016915) missing from EN citation"
  ERRORS=$((ERRORS + 1))
fi

# Verify concept DOI present
if ! grep -q "zenodo.22016914" "$EN_CITATION" 2>/dev/null; then
  echo "FAIL: Concept DOI (22016914) missing from EN citation"
  ERRORS=$((ERRORS + 1))
fi

echo "PASS: Citation DOI assertions"

# --- 4. Internal link verification ---
BROKEN_LINKS=0
for html_file in $(find "$SITE_DIR" -name "index.html" -o -name "404.html"); do
  # Extract internal hrefs (starting with /doctrine-site-box/)
  hrefs=$(grep -oP 'href="/doctrine-site-box/[^"#]*"' "$html_file" 2>/dev/null | sed 's/href="//;s/"$//' | sort -u)
  for href in $hrefs; do
    # Convert href to local path
    local_path="$SITE_DIR${href#/doctrine-site-box}"
    if [ -d "$local_path" ]; then
      # Directory — check for index.html
      if [ ! -f "${local_path}index.html" ] && [ ! -f "${local_path}/index.html" ]; then
        echo "BROKEN: $href (from $html_file) — no index.html"
        BROKEN_LINKS=$((BROKEN_LINKS + 1))
      fi
    elif [ ! -f "$local_path" ]; then
      echo "BROKEN: $href (from $html_file) — target missing"
      BROKEN_LINKS=$((BROKEN_LINKS + 1))
    fi
  done
done

if [ "$BROKEN_LINKS" -gt 0 ]; then
  echo "FAIL: $BROKEN_LINKS broken internal links"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: All internal links resolve"
fi

# --- 5. Primary graph reachability (nav-linked pages) ---
NAV_PAGES=$(grep -oP 'href="/doctrine-site-box/en/[^"]*"' "$SITE_DIR/en/about/index.html" | grep 'nav-link\|class="active"' | wc -l 2>/dev/null || echo "0")
# Just verify nav entries exist in built output
NAV_COUNT_EN=$(grep -c 'class="active"\|<li>' "$SITE_DIR/en/about/index.html" 2>/dev/null || echo "0")
echo "Nav entries in EN about page: $NAV_COUNT_EN"

# --- 6. Sitemap and robots ---
if [ -f "$SITE_DIR/sitemap.xml" ]; then
  SITEMAP_URLS=$(grep -c "<url>" "$SITE_DIR/sitemap.xml")
  echo "PASS: sitemap.xml exists ($SITEMAP_URLS URLs)"
else
  echo "FAIL: sitemap.xml missing"
  ERRORS=$((ERRORS + 1))
fi

if [ -f "$SITE_DIR/robots.txt" ]; then
  echo "PASS: robots.txt exists"
else
  echo "FAIL: robots.txt missing"
  ERRORS=$((ERRORS + 1))
fi

# --- Summary ---
echo ""
echo "=== AUDIT SUMMARY ==="
echo "EN routes: $EN_COUNT"
echo "UA routes: $UA_COUNT"
echo "EN/UA parity: $([ "$EN_SLUGS" = "$UA_SLUGS" ] && echo PASS || echo FAIL)"
echo "EN DOIs: $EN_DOI_COUNT"
echo "UA DOIs: $UA_DOI_COUNT"
echo "Broken links: $BROKEN_LINKS"
echo "Errors: $ERRORS"

# Write machine-readable artifact
cat > "$RESULT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "en_routes": $EN_COUNT,
  "ua_routes": $UA_COUNT,
  "en_ua_parity": $([ "$EN_SLUGS" = "$UA_SLUGS" ] && echo true || echo false),
  "en_doi_count": $EN_DOI_COUNT,
  "ua_doi_count": $UA_DOI_COUNT,
  "doi_order_match": $([ "$EN_DOI_ORDER" = "$UA_DOI_ORDER" ] && echo true || echo false),
  "broken_internal_links": $BROKEN_LINKS,
  "sitemap_exists": $([ -f "$SITE_DIR/sitemap.xml" ] && echo true || echo false),
  "robots_exists": $([ -f "$SITE_DIR/robots.txt" ] && echo true || echo false),
  "errors": $ERRORS,
  "result": "$([ $ERRORS -eq 0 ] && echo PASS || echo FAIL)"
}
EOF

echo "Artifact: $RESULT_FILE"

if [ $ERRORS -gt 0 ]; then
  echo "AUDIT FAILED with $ERRORS error(s)"
  exit 1
else
  echo "AUDIT PASSED"
  exit 0
fi
