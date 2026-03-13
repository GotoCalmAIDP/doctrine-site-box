#!/usr/bin/env python3
"""
Site-wide internal link integrity audit for doctrine-site-box.
Accounts for pathPrefix /doctrine-site-box/ used in GitHub Pages deployment.
Scans both built HTML and source markdown files.
"""

import os
import re
from pathlib import Path

SITE_DIR = Path("_site")
SRC_DIR = Path("src")
PATH_PREFIX = "/doctrine-site-box/"

def get_all_html_files(site_dir):
    return sorted(site_dir.rglob("*.html"))

def get_all_available_paths(site_dir):
    """Build a set of all available URL paths (with and without prefix)."""
    paths = set()
    for html_file in get_all_html_files(site_dir):
        rel = html_file.relative_to(site_dir)
        if rel.name == "index.html":
            url_path = "/" + str(rel.parent) + "/"
        else:
            url_path = "/" + str(rel)
        url_path = url_path.replace("//", "/")
        paths.add(url_path)
        # Also add with prefix
        prefixed = PATH_PREFIX.rstrip("/") + url_path
        paths.add(prefixed)
    paths.add("/")
    paths.add(PATH_PREFIX.rstrip("/") + "/")
    # Add css/style.css
    css_file = site_dir / "css" / "style.css"
    if css_file.exists():
        paths.add("/css/style.css")
        paths.add(PATH_PREFIX + "css/style.css")
    return paths

def get_anchors_in_file(html_content):
    anchors = set()
    for match in re.finditer(r'id=["\']([^"\']+)["\']', html_content):
        anchors.add(match.group(1))
    return anchors

def normalize_path(href):
    """Strip pathPrefix and normalize."""
    path = href
    if path.startswith(PATH_PREFIX):
        path = "/" + path[len(PATH_PREFIX):]
    if not path.endswith("/") and "#" not in path and "." not in path.split("/")[-1]:
        path += "/"
    return path

def page_url_from_file(html_file, site_dir):
    rel = html_file.relative_to(site_dir)
    if rel.name == "index.html":
        url = "/" + str(rel.parent) + "/"
    else:
        url = "/" + str(rel)
    return url.replace("//", "/")

def get_link_context(html_content, href):
    escaped = re.escape(href)
    pattern = r'<a[^>]*href=["\']' + escaped + r'["\'][^>]*>(.*?)</a>'
    match = re.search(pattern, html_content, re.DOTALL)
    if match:
        text = re.sub(r'<[^>]+>', '', match.group(1)).strip()
        return text[:100]
    return ""

def main():
    available_paths = get_all_available_paths(SITE_DIR)
    # Build normalized path set (without prefix)
    normalized_paths = set()
    for p in available_paths:
        normalized_paths.add(normalize_path(p))
    
    html_files = get_all_html_files(SITE_DIR)
    anchor_cache = {}
    
    # ========== PHASE 1: HTML link audit ==========
    total_html_links = 0
    broken_html = []
    
    for html_file in html_files:
        content = html_file.read_text(encoding="utf-8")
        page_url = page_url_from_file(html_file, SITE_DIR)
        src_file = str(html_file.relative_to(SITE_DIR))
        anchor_cache[page_url] = get_anchors_in_file(content)
        
        for match in re.finditer(r'href=["\']([^"\']+)["\']', content):
            href = match.group(1)
            
            # Skip external, mailto, tel, javascript
            if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:")):
                continue
            
            total_html_links += 1
            
            # Same-page anchor
            if href.startswith("#"):
                anchor = href[1:]
                if anchor not in anchor_cache[page_url]:
                    link_text = get_link_context(content, href)
                    broken_html.append({
                        "source": src_file,
                        "href": href,
                        "link_text": link_text,
                        "resolved": page_url + href,
                        "issue": f"anchor #{anchor} not found in page"
                    })
                continue
            
            # Split fragment
            if "#" in href:
                path_part, fragment = href.split("#", 1)
            else:
                path_part = href
                fragment = None
            
            # Normalize
            norm = normalize_path(path_part)
            
            # Check if it's a CSS/static file
            if path_part.endswith(".css") or path_part.endswith(".js") or path_part.endswith(".png") or path_part.endswith(".ico"):
                # Check with and without prefix
                if path_part in available_paths or norm in available_paths:
                    continue
                # Check if file exists in _site
                stripped = path_part.lstrip("/")
                if PATH_PREFIX.strip("/") + "/" in stripped:
                    stripped = stripped.replace(PATH_PREFIX.strip("/") + "/", "", 1)
                if (SITE_DIR / stripped).exists():
                    continue
                link_text = get_link_context(content, href)
                broken_html.append({
                    "source": src_file,
                    "href": href,
                    "link_text": link_text,
                    "resolved": norm,
                    "issue": f"static file {norm} not found"
                })
                continue
            
            if norm in normalized_paths:
                # Path exists; check fragment if present
                if fragment:
                    target_file = SITE_DIR / norm.strip("/") / "index.html"
                    if target_file.is_file():
                        if norm not in anchor_cache:
                            anchor_cache[norm] = get_anchors_in_file(target_file.read_text(encoding="utf-8"))
                        if fragment not in anchor_cache.get(norm, set()):
                            link_text = get_link_context(content, href)
                            broken_html.append({
                                "source": src_file,
                                "href": href,
                                "link_text": link_text,
                                "resolved": norm + "#" + fragment,
                                "issue": f"anchor #{fragment} not found in {norm}"
                            })
            else:
                link_text = get_link_context(content, href)
                broken_html.append({
                    "source": src_file,
                    "href": href,
                    "link_text": link_text,
                    "resolved": norm,
                    "issue": f"target page {norm} does not exist"
                })
    
    # ========== PHASE 2: Source Markdown link audit ==========
    md_files = sorted(SRC_DIR.rglob("*.md"))
    total_md_links = 0
    broken_md = []
    
    for md_file in md_files:
        content = md_file.read_text(encoding="utf-8")
        rel_path = str(md_file)
        lang = "en" if "/en/" in rel_path else "ua" if "/ua/" in rel_path else "unknown"
        
        for match in re.finditer(r'\[([^\]]*)\]\(([^)]+)\)', content):
            link_text = match.group(1)
            href = match.group(2)
            
            if href.startswith(("http://", "https://", "mailto:", "tel:", "#")):
                continue
            
            total_md_links += 1
            
            if "#" in href:
                path_part, fragment = href.split("#", 1)
            else:
                path_part = href
                fragment = None
            
            norm = normalize_path(path_part)
            
            if norm not in normalized_paths:
                broken_md.append({
                    "source": rel_path,
                    "lang": lang,
                    "link_text": link_text,
                    "href": href,
                    "resolved": norm,
                    "issue": f"target {norm} not found"
                })
    
    # ========== PHASE 3: Navigation audit ==========
    eleventy_content = Path(".eleventy.js").read_text(encoding="utf-8")
    nav_links = re.findall(r'url:\s*["\']([^"\']+)["\']', eleventy_content)
    nav_broken = []
    for nav_url in nav_links:
        norm = normalize_path(nav_url)
        if norm not in normalized_paths:
            nav_broken.append({"url": nav_url, "resolved": norm})
    
    # ========== PHASE 4: Footer audit ==========
    footer_file = Path("src/_includes/footer.njk")
    footer_broken = []
    if footer_file.exists():
        footer_content = footer_file.read_text(encoding="utf-8")
        for match in re.finditer(r'href=["\']([^"\']+)["\']', footer_content):
            href = match.group(1)
            if href.startswith(("http://", "https://", "mailto:", "{", "#")):
                continue
            # These are template expressions, skip
            if "{{" in href or "{%" in href:
                continue
    
    # ========== OUTPUT ==========
    print("=" * 70)
    print("INTERNAL LINK AUDIT REPORT")
    print("=" * 70)
    print(f"HTML files scanned:     {len(html_files)}")
    print(f"HTML internal links:    {total_html_links}")
    print(f"HTML broken links:      {len(broken_html)}")
    print(f"MD files scanned:       {len(md_files)}")
    print(f"MD internal links:      {total_md_links}")
    print(f"MD broken links:        {len(broken_md)}")
    print(f"Nav URLs checked:       {len(nav_links)}")
    print(f"Nav broken URLs:        {len(nav_broken)}")
    print("=" * 70)
    
    # Deduplicate HTML broken links by (source, href)
    seen = set()
    unique_broken_html = []
    for bl in broken_html:
        key = (bl["source"], bl["href"])
        if key not in seen:
            seen.add(key)
            unique_broken_html.append(bl)
    
    if unique_broken_html:
        print(f"\nUNIQUE BROKEN HTML LINKS ({len(unique_broken_html)}):")
        print("-" * 70)
        for i, bl in enumerate(unique_broken_html, 1):
            print(f"\n[{i}]")
            print(f"  Source:   {bl['source']}")
            print(f"  Href:     {bl['href']}")
            print(f"  Text:     {bl['link_text']}")
            print(f"  Resolved: {bl['resolved']}")
            print(f"  Issue:    {bl['issue']}")
    
    if broken_md:
        print(f"\nBROKEN MARKDOWN LINKS ({len(broken_md)}):")
        print("-" * 70)
        for i, bl in enumerate(broken_md, 1):
            print(f"\n[{i}]")
            print(f"  Source:   {bl['source']}")
            print(f"  Lang:     {bl['lang']}")
            print(f"  Text:     {bl['link_text']}")
            print(f"  Href:     {bl['href']}")
            print(f"  Resolved: {bl['resolved']}")
            print(f"  Issue:    {bl['issue']}")
    
    if nav_broken:
        print(f"\nBROKEN NAVIGATION URLS ({len(nav_broken)}):")
        print("-" * 70)
        for nb in nav_broken:
            print(f"  URL: {nb['url']} -> {nb['resolved']}")
    
    if not unique_broken_html and not broken_md and not nav_broken:
        print("\nNo broken links found.")
    
    print("\n" + "=" * 70)
    print("AUDIT COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    main()
