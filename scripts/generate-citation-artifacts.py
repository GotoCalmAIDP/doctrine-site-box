#!/usr/bin/env python3
"""Generate P2 citation utilities and a derived publication manifest.

Controlled sources:
  - src/en/citation.md
  - src/ua/citation.md

The script adds stable HTML anchors only, preserving every existing publication
wording, number, title, DOI, group order, date, version statement, and role.
All generated artifacts are overwritten deterministically except for the explicit
UTC generation timestamp required in the manifest.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EN_CITATION = ROOT / "src" / "en" / "citation.md"
UA_CITATION = ROOT / "src" / "ua" / "citation.md"
ASSET_CITATION_DIR = ROOT / "src" / "assets" / "citation"
MANIFEST_PATH = ROOT / "src" / "assets" / "data" / "publications.json"
SCHEMA_PATH = ROOT / "docs" / "publications-manifest.schema.json"
ROOT_CFF = ROOT / "CITATION.cff"

GROUP_IDS = [
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


def citation_values(en_text: str) -> dict[str, str]:
    bib = re.search(r"```\n(@misc\{.*?\n\})\n```", en_text, flags=re.S)
    if not bib:
        raise ValueError("Approved BibTeX block is missing from EN Citation page")
    bib_text = bib.group(1)

    def bib_field(name: str) -> str:
        match = re.search(rf"^\s*{re.escape(name)}\s*=\s*\{{(.+?)\}},?$", bib_text, flags=re.M)
        if not match:
            raise ValueError(f"Missing approved BibTeX field: {name}")
        return match.group(1)

    short_author = re.search(r"^>\s+(.+)$", en_text, flags=re.M)
    if not short_author:
        raise ValueError("Recommended citation author line missing")
    return {
        "short_author": short_author.group(1).strip(),
        "author": bib_field("author"),
        "title": bib_field("title"),
        "year": bib_field("year"),
        "canonical_version": bib_field("note").replace("Canonical Version ", ""),
        "repository": bib_field("howpublished"),
        "url": bib_field("url"),
        "bibtex": bib_text,
    }


def publication_section(text: str) -> str:
    headings = ("## Related Zenodo Publications", "## Пов'язані публікації на Zenodo")
    for heading in headings:
        if heading in text:
            return text.split(heading, 1)[1]
    raise ValueError("Citation page does not contain a Zenodo publication section")


def parse_records(text: str, language: str) -> tuple[list[dict[str, Any]], list[str]]:
    records: list[dict[str, Any]] = []
    groups: list[str] = []
    current_group: str | None = None
    lines = publication_section(text).splitlines()
    for index, line in enumerate(lines):
        group_match = RE_GROUP.match(line)
        if group_match:
            current_group = group_match.group(1)
            groups.append(current_group)
            continue
        rec_match = RE_RECORD.match(line)
        if rec_match:
            if not current_group:
                raise ValueError(f"Record {rec_match.group(1)} appears outside a group in {language}")
            number = int(rec_match.group(1))
            if index + 1 >= len(lines):
                raise ValueError(f"Record {number} missing DOI line in {language}")
            doi_match = RE_DOI.match(lines[index + 1])
            if not doi_match:
                raise ValueError(f"Record {number} missing DOI line in {language}")
            doi = doi_match.group(1)
            record_id = doi.rsplit(".", 1)[1]
            records.append({
                "number": number,
                "title": rec_match.group(2),
                "doi": doi,
                "group": current_group,
                "canonical_zenodo_url": f"https://zenodo.org/records/{record_id}",
            })
    return records, groups


def add_anchors(text: str) -> str:
    """Add only stable anchor elements; do not alter citation text."""
    records, groups = parse_records(text, "anchor source")
    if len(groups) != len(GROUP_IDS):
        raise ValueError(f"Expected {len(GROUP_IDS)} publication groups, got {len(groups)}")

    for group, group_id in zip(groups, GROUP_IDS):
        anchor = f'<a id="publication-group-{group_id}"></a>'
        heading = f"### {group}"
        if anchor not in text:
            text = text.replace(heading, f"{anchor}\n\n{heading}", 1)

    for record in records:
        anchor = f'<a id="publication-{record["number"]:02d}"></a>'
        line = f'{record["number"]}. **{record["title"]}**'
        if anchor not in text:
            text = text.replace(line, f"{anchor}\n\n{line}", 1)

    all_versions_anchor = '<a id="record-33-all-versions-doi"></a>'
    all_versions_line = "> **All-versions DOI for record 33:**"
    ua_all_versions_line = "> **DOI всіх версій для запису 33:**"
    if all_versions_anchor not in text:
        if all_versions_line in text:
            text = text.replace(all_versions_line, f"{all_versions_anchor}\n\n{all_versions_line}", 1)
        elif ua_all_versions_line in text:
            text = text.replace(ua_all_versions_line, f"{all_versions_anchor}\n\n{ua_all_versions_line}", 1)
        else:
            raise ValueError("Record-33 all-versions DOI block missing")
    return text


def extract_record_33_metadata(en_text: str, ua_text: str) -> dict[str, Any]:
    en_note = re.search(r"\*Published\s+(.+?),\s+Version\s+([0-9.]+)\.", en_text)
    ua_note = re.search(r"\*Опубліковано\s+(.+?),\s+Версія\s+([0-9.]+)\.", ua_text)
    en_all = re.search(r"All-versions DOI for record 33:\*{0,2}\s*\[(10\.5281/zenodo\.\d+)\]", en_text)
    ua_all = re.search(r"DOI всіх версій для запису 33:\*{0,2}\s*\[(10\.5281/zenodo\.\d+)\]", ua_text)
    if not all((en_note, ua_note, en_all, ua_all)):
        raise ValueError("Record-33 date/version/all-versions DOI treatment is incomplete")
    if en_note.group(2) != ua_note.group(2) or en_all.group(1) != ua_all.group(1):
        raise ValueError("Record-33 EN/UA treatment disagrees")
    return {
        "date": {"en": en_note.group(1), "ua": ua_note.group(1)},
        "version": en_note.group(2),
        "all_versions_doi": en_all.group(1),
        "all_versions_canonical_zenodo_url": f"https://zenodo.org/records/{en_all.group(1).rsplit('.', 1)[1]}",
        "role_status": {
            "en": "Includes subordinate Commercial Companion Note 19; the companion has no independent DOI or doctrinal standing.",
            "ua": "Включає підпорядковану Commercial Companion Note 19; супровідна нотатка не має незалежного DOI або доктринального статусу."
        }
    }


def manifest_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://gotocalmaidp.github.io/doctrine-site-box/assets/data/publications.schema.json",
        "title": "Derived Doctrine Publication Manifest",
        "type": "object",
        "required": ["schema_version", "derived", "authoritative_source", "generated_at", "non_authoritative_notice", "records"],
        "properties": {
            "schema_version": {"type": "string", "const": "1.0"},
            "derived": {"type": "boolean", "const": True},
            "authoritative_source": {
                "type": "object",
                "required": ["en", "ua"],
                "properties": {"en": {"type": "string"}, "ua": {"type": "string"}}
            },
            "generated_at": {"type": "string", "format": "date-time"},
            "non_authoritative_notice": {"type": "string"},
            "records": {
                "type": "array",
                "minItems": 33,
                "maxItems": 33,
                "items": {
                    "type": "object",
                    "required": ["record_number", "title", "structural_group", "version_doi", "canonical_zenodo_url", "displayed_publication_date", "version", "role_status"],
                    "properties": {
                        "record_number": {"type": "integer", "minimum": 1, "maximum": 33},
                        "title": {"type": "string"},
                        "structural_group": {
                            "type": "object",
                            "required": ["en", "ua"],
                            "properties": {"en": {"type": "string"}, "ua": {"type": "string"}}
                        },
                        "version_doi": {"type": "string", "pattern": "^10\\.5281/zenodo\\.\\d+$"},
                        "canonical_zenodo_url": {"type": "string", "pattern": "^https://zenodo\\.org/records/\\d+$"},
                        "displayed_publication_date": {"type": ["object", "null"]},
                        "version": {"type": ["string", "null"]},
                        "role_status": {"type": ["object", "null"]},
                        "all_versions_doi": {"type": "string", "pattern": "^10\\.5281/zenodo\\.\\d+$"},
                        "all_versions_canonical_zenodo_url": {"type": "string", "pattern": "^https://zenodo\\.org/records/\\d+$"}
                    }
                }
            }
        }
    }


def write_citation_files(values: dict[str, str]) -> None:
    ASSET_CITATION_DIR.mkdir(parents=True, exist_ok=True)
    cff = f'''# Generated from the approved Citation page; do not hand-edit.\ncff-version: 1.2.0\nmessage: "If you use this conceptual reference, please cite it as below."\ntitle: "{values['title']}"\ntype: generic\nauthors:\n  - family-names: "Partasyuk"\n    given-names: "Vadym"\nversion: "{values['canonical_version']}"\nurl: "{values['url']}"\npreferred-citation:\n  type: generic\n  authors:\n    - family-names: "Partasyuk"\n      given-names: "Vadym"\n  title: "{values['title']}"\n  year: {values['year']}\n  version: "{values['canonical_version']}"\n  publisher: "{values['repository']}"\n  url: "{values['url']}"\n'''
    bib = values["bibtex"] + "\n"
    ris = f'''TY  - GEN\nAU  - {values['author']}\nTI  - {values['title']}\nPY  - {values['year']}\nT2  - {values['repository']}\nM1  - Canonical Version {values['canonical_version']}\nUR  - {values['url']}\nER  -\n'''
    plain = f'''{values['short_author']}\n{values['title']}.\nCanonical Version {values['canonical_version']}.\n{values['repository']}.\nAvailable at: {values['url']}\n'''

    ROOT_CFF.write_text(cff, encoding="utf-8")
    (ASSET_CITATION_DIR / "CITATION.cff").write_text(cff, encoding="utf-8")
    (ASSET_CITATION_DIR / "applicability-boundary-doctrine.bib").write_text(bib, encoding="utf-8")
    (ASSET_CITATION_DIR / "applicability-boundary-doctrine.ris").write_text(ris, encoding="utf-8")
    (ASSET_CITATION_DIR / "applicability-boundary-doctrine-citation.txt").write_text(plain, encoding="utf-8")


def main() -> None:
    en_text = EN_CITATION.read_text(encoding="utf-8")
    ua_text = UA_CITATION.read_text(encoding="utf-8")

    values = citation_values(en_text)
    en_records, en_groups = parse_records(en_text, "EN")
    ua_records, ua_groups = parse_records(ua_text, "UA")

    if len(en_records) != 33 or len(ua_records) != 33:
        raise ValueError(f"Expected 33 records per language, got EN={len(en_records)}, UA={len(ua_records)}")
    if len(en_groups) != len(GROUP_IDS) or len(ua_groups) != len(GROUP_IDS):
        raise ValueError("Publication group count does not match controlled anchor set")
    for en, ua in zip(en_records, ua_records):
        if (en["number"], en["title"], en["doi"]) != (ua["number"], ua["title"], ua["doi"]):
            raise ValueError(f"EN/UA record mismatch at record {en['number']}")

    record33 = extract_record_33_metadata(en_text, ua_text)
    manifest_records = []
    for en, ua in zip(en_records, ua_records):
        entry: dict[str, Any] = {
            "record_number": en["number"],
            "title": en["title"],
            "structural_group": {"en": en["group"], "ua": ua["group"]},
            "version_doi": en["doi"],
            "canonical_zenodo_url": en["canonical_zenodo_url"],
            "displayed_publication_date": None,
            "version": None,
            "role_status": None,
        }
        if en["number"] == 33:
            entry["displayed_publication_date"] = record33["date"]
            entry["version"] = record33["version"]
            entry["role_status"] = record33["role_status"]
            entry["all_versions_doi"] = record33["all_versions_doi"]
            entry["all_versions_canonical_zenodo_url"] = record33["all_versions_canonical_zenodo_url"]
        manifest_records.append(entry)

    manifest = {
        "schema_version": "1.0",
        "derived": True,
        "authoritative_source": {
            "en": "https://gotocalmaidp.github.io/doctrine-site-box/en/citation/",
            "ua": "https://gotocalmaidp.github.io/doctrine-site-box/ua/citation/"
        },
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "non_authoritative_notice": "This derived artifact does not modify or replace the canonical doctrine or Zenodo records.",
        "records": manifest_records,
    }

    # Only anchor additions are permitted in citation source.
    EN_CITATION.write_text(add_anchors(en_text), encoding="utf-8")
    UA_CITATION.write_text(add_anchors(ua_text), encoding="utf-8")
    write_citation_files(values)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    SCHEMA_PATH.write_text(json.dumps(manifest_schema(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("Generated citation utilities, manifest, schema, and citation anchors")
    print(f"Records: {len(manifest_records)} | Unique publication DOIs: {len(set(r['version_doi'] for r in manifest_records))}")


if __name__ == "__main__":
    main()
