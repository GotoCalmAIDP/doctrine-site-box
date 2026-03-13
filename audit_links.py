#!/usr/bin/env python3
"""
Site-wide internal link integrity audit for doctrine-site-box.
Scans all built HTML files in _site/ and checks all internal links.
"""

import os
import re
from pathlib import Path
from urllib.parse import urlparse, unquote

SITE_DIR = Path("_site")

def get_all_html_files(site_dir):
    """Get all HTML files in the site directory."""
    return sorted(site_dir.rglob("*.html"))

def get_all_available_paths(site_dir):
    """Build a set of all available URL paths from the built site."""
    paths = set()
    for html_file in get_all_html_files(site_dir):
        rel = html_file.relative_to(site_dir)
        # /en/doctrine/index.html -> /en/doctrine/
        url_path = "/" + str(rel.parent) + "/"
        url_path = url_path.replace("//", "/")
        if rel.name == "index.html":
            paths.add(url_path)
        else:
            paths.add("/" + str(rel))
    # Also add root
    paths.add("/")
    return paths

def get_anchors_in_file(html_content):
    """Extract all id attributes from HTML content."""
    anchors = set()
    # Match id="..." or id='...'
    for match in re.finditer(r'id=["\']([^"\']+)["\']', html_content):
        anchors.add(match.group(1))
    return anchors

def extract_internal_links(html_content, page_path):
    """Extract all internal links (href) from HTML content."""
    links = []
    for match in re.finditer(r'href=["\']([^"\']+)["\']', html_content):
        href = match.group(1)
        # Skip external links, mailto, tel, javascript
        if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "#")):
            if href.startswith("#"):
                links.append({"href": href, "type": "anchor", "raw": href})
            continue
        # Internal link
        links.append({"href": href, "type": "internal", "raw": href})
    return links

def resolve_link(href, current_page_url):
    """Resolve a relative link against the current page URL."""
    if href.startswith("/"):
        return href
    # Relative link
    base = current_page_url.rsplit("/", 1)[0] + "/"
    resolved = os.path.normpath(base + href)
    resolved = resolved.replace("\\", "/")
    if not resolved.endswith("/") and "#" not in resolved and "." not in resolved.split("/")[-1]:
        resolved += "/"
    return resolved

def get_link_context(html_content, href):
    """Try to get the link text for a given href."""
    pattern = r'<a[^>]*href=["\']' + re.escape(href) + r'["\'][^>]*>(.*?)</a>'
    match = re.search(pattern, html_content, re.DOTALL)
    if match:
        text = re.sub(r'<[^>]+>', '', match.group(1)).strip()
        return text[:100]
    return "(no text found)"

def page_url_from_file(html_file, site_dir):
    """Convert a file path to its URL path."""
    rel = html_file.relative_to(site_dir)
    if rel.name == "index.html":
        url = "/" + str(rel.parent) + "/"
    else:
        url = "/" + str(rel)
    return url.replace("//", "/")

def main():
    available_paths = get_all_available_paths(SITE_DIR)
    html_files = get_all_html_files(SITE_DIR)
    
    total_links = 0
    broken_links = []
    working_links = 0
    
    # Cache anchors per page
    anchor_cache = {}
    
    for html_file in html_files:
        content = html_file.read_text(encoding="utf-8")
        page_url = page_url_from_file(html_file, SITE_DIR)
        src_file = str(html_file.relative_to(SITE_DIR))
        
        # Cache anchors for this page
        anchor_cache[page_url] = get_anchors_in_file(content)
        
        links = extract_internal_links(content, page_url)
        
        for link in links:
            total_links += 1
            href = link["href"]
            link_text = get_link_context(content, href)
            
            if link["type"] == "anchor":
                # Check anchor within same page
                anchor = href[1:]  # remove #
                if anchor not in anchor_cache[page_url]:
                    broken_links.append({
                        "source": src_file,
                        "source_url": page_url,
                        "href": href,
                        "link_text": link_text,
                        "resolved": page_url + href,
                        "issue": f"anchor #{anchor} not found in page"
                    })
                else:
                    working_links += 1
            else:
                # Split path and fragment
                if "#" in href:
                    path_part, fragment = href.split("#", 1)
                else:
                    path_part = href
                    fragment = None
                
                resolved = resolve_link(path_part, page_url)
                if not resolved.endswith("/") and "." not in resolved.split("/")[-1]:
                    resolved += "/"
                
                if resolved in available_paths:
                    # Path exists, check fragment if present
                    if fragment:
                        # Load target page anchors
                        target_file = SITE_DIR / resolved.lstrip("/") 
                        if not target_file.is_file():
                            target_file = SITE_DIR / resolved.lstrip("/") / "index.html"
                        if target_file.is_file():
                            if resolved not in anchor_cache:
                                target_content = target_file.read_text(encoding="utf-8")
                                anchor_cache[resolved] = get_anchors_in_file(target_content)
                            if fragment not in anchor_cache.get(resolved, set()):
                                broken_links.append({
                                    "source": src_file,
                                    "source_url": page_url,
                                    "href": href,
                                    "link_text": link_text,
                                    "resolved": resolved + "#" + fragment,
                                    "issue": f"anchor #{fragment} not found in target page {resolved}"
                                })
                            else:
                                working_links += 1
                        else:
                            working_links += 1  # can't verify anchor but path exists
                    else:
                        working_links += 1
                else:
                    broken_links.append({
                        "source": src_file,
                        "source_url": page_url,
                        "href": href,
                        "link_text": link_text,
                        "resolved": resolved,
                        "issue": f"target path {resolved} does not exist"
                    })
    
    # Print results
    print(f"\n{'='*70}")
    print(f"INTERNAL LINK AUDIT REPORT")
    print(f"{'='*70}")
    print(f"Total HTML files scanned: {len(html_files)}")
    print(f"Total internal links checked: {total_links}")
    print(f"Working links: {working_links}")
    print(f"Broken links found: {len(broken_links)}")
    print(f"{'='*70}\n")
    
    if broken_links:
        print("BROKEN LINKS DETAIL:")
        print("-"*70)
        for i, bl in enumerate(broken_links, 1):
            print(f"\n[{i}]")
            print(f"  Source file: {bl['source']}")
            print(f"  Source URL:  {bl['source_url']}")
            print(f"  Link href:  {bl['href']}")
            print(f"  Link text:  {bl['link_text']}")
            print(f"  Resolved:   {bl['resolved']}")
            print(f"  Issue:      {bl['issue']}")
    else:
        print("No broken links found.")
    
    # Also check source markdown files for links
    print(f"\n{'='*70}")
    print("SOURCE MARKDOWN LINK AUDIT")
    print(f"{'='*70}")
    
    src_dir = Path("src")
    md_files = sorted(src_dir.rglob("*.md"))
    md_links_total = 0
    md_broken = []
    
    for md_file in md_files:
        content = md_file.read_text(encoding="utf-8")
        rel_path = str(md_file)
        lang = "en" if "/en/" in rel_path else "ua" if "/ua/" in rel_path else "unknown"
        
        # Find markdown links [text](url)
        for match in re.finditer(r'\[([^\]]*)\]\(([^)]+)\)', content):
            link_text = match.group(1)
            href = match.group(2)
            
            # Skip external
            if href.startswith(("http://", "https://", "mailto:", "tel:")):
                continue
            
            md_links_total += 1
            
            # Check if target exists
            if "#" in href:
                path_part, fragment = href.split("#", 1)
            else:
                path_part = href
                fragment = None
            
            # Resolve relative to lang root
            if path_part.startswith("/"):
                target_url = path_part
            else:
                # relative to current file's directory
                base = "/" + str(md_file.parent.relative_to(src_dir)) + "/"
                target_url = os.path.normpath(base + path_part).replace("\\", "/")
            
            if not target_url.endswith("/") and "." not in target_url.split("/")[-1]:
                target_url += "/"
            
            if target_url not in available_paths:
                md_broken.append({
                    "source": rel_path,
                    "lang": lang,
                    "link_text": link_text,
                    "href": href,
                    "resolved": target_url,
                    "issue": f"target {target_url} not found in built site"
                })
    
    print(f"Markdown files scanned: {len(md_files)}")
    print(f"Internal markdown links checked: {md_links_total}")
    print(f"Broken markdown links: {len(md_broken)}")
    
    if md_broken:
        print("\nBROKEN MARKDOWN LINKS:")
        print("-"*70)
        for i, bl in enumerate(md_broken, 1):
            print(f"\n[{i}]")
            print(f"  Source: {bl['source']}")
            print(f"  Lang:   {bl['lang']}")
            print(f"  Text:   {bl['link_text']}")
            print(f"  Href:   {bl['href']}")
            print(f"  Resolved: {bl['resolved']}")
            print(f"  Issue:  {bl['issue']}")

    # Also audit navigation links from .eleventy.js
    print(f"\n{'='*70}")
    print("NAVIGATION AUDIT")
    print(f"{'='*70}")
    
    eleventy_content = Path(".eleventy.js").read_text(encoding="utf-8")
    nav_links = re.findall(r'url:\s*["\']([^"\']+)["\']', eleventy_content)
    nav_broken = []
    for nav_url in nav_links:
        if nav_url not in available_paths:
            nav_broken.append(nav_url)
    
    print(f"Navigation URLs found: {len(nav_links)}")
    print(f"Broken navigation URLs: {len(nav_broken)}")
    if nav_broken:
        for url in nav_broken:
            print(f"  BROKEN: {url}")
    
    print(f"\n{'='*70}")
    print("AUDIT COMPLETE")
    print(f"{'='*70}")

if __name__ == "__main__":
    main()
