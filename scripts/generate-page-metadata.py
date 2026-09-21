#!/usr/bin/env python3
"""Generate page-specific discovery metadata from visible EN/UA Markdown source.

Source of truth: each page's front-matter title/description, or its first visible
paragraph where no description exists. Output is deterministic and should not be
hand-edited: src/_data/page-metadata.json.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
OUT = SRC / "_data" / "pageMetadata.json"


def clean_visible_text(value: str) -> str:
    value = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", value)
    value = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"[*_`>#]", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def cut_sentence(text: str, limit: int = 185) -> str:
    if len(text) <= limit:
        return text
    candidate = text[: limit + 1]
    stop = max(candidate.rfind(". "), candidate.rfind(".\""), candidate.rfind(".\n"))
    if stop > limit // 2:
        return candidate[: stop + 1].strip()
    stop = candidate.rfind(" ")
    return candidate[:stop].rstrip(" ,;:-") + "…"


def parse_page(path: Path, language: str) -> tuple[str, str, str]:
    raw = path.read_text(encoding="utf-8")
    frontmatter = ""
    body = raw
    if raw.startswith("---\n"):
        _, frontmatter, body = raw.split("---\n", 2)

    fields = {}
    for line in frontmatter.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            fields[key.strip()] = value.strip().strip('"').strip("'")

    title = fields.get("title", "")
    if not title:
        heading = re.search(r"^#\s+(.+)$", body, flags=re.MULTILINE)
        title = clean_visible_text(heading.group(1)) if heading else path.stem

    description = fields.get("description", "")
    if not description:
        chunks = re.split(r"\n\s*\n", body)
        for chunk in chunks:
            raw_candidate = chunk.strip()
            if not raw_candidate or raw_candidate.startswith("---") or raw_candidate.startswith("#"):
                continue
            candidate = clean_visible_text(raw_candidate)
            if not candidate:
                continue
            if candidate.startswith("Status:") or candidate.startswith("Статус:"):
                continue
            description = candidate
            break
    description = cut_sentence(clean_visible_text(description))

    relative = path.relative_to(SRC / language)
    if relative.name == "index.md":
        route = f"/{language}/" if relative.parent == Path(".") else f"/{language}/{relative.parent.as_posix()}/"
    else:
        route = f"/{language}/{relative.with_suffix('').as_posix()}/"
    return route, title, description


def main() -> None:
    metadata = {}
    for language in ("en", "ua"):
        suffix = "Applicability Boundary Doctrine" if language == "en" else "Доктрина межі застосовності"
        for path in sorted((SRC / language).rglob("*.md")):
            route, title, description = parse_page(path, language)
            metadata[route] = {
                "title": title,
                "description": description,
                "og_title": f"{title} | {suffix}",
                "og_description": description,
                "twitter_title": f"{title} | {suffix}",
                "twitter_description": description,
                "source": "front matter description" if "description:" in path.read_text(encoding="utf-8").split("---\n", 2)[1] else "first visible paragraph",
            }

    if len([key for key in metadata if key.startswith("/en/")]) != 58:
        raise SystemExit("Expected 58 EN metadata entries")
    if len([key for key in metadata if key.startswith("/ua/")]) != 57:
        raise SystemExit("Expected 58 UA metadata entries")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {OUT.relative_to(ROOT)} with {len(metadata)} entries")


if __name__ == "__main__":
    main()
