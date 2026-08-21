#!/usr/bin/env python3
"""Create a stable first-party PNG social preview from the existing doctrine SVG.

This is deterministic format conversion and framing only; it adds no semantic or
promotional content. The source remains applicability-boundary-diagram.svg.
"""

from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "assets" / "applicability-boundary-diagram.svg"
OUTPUT = ROOT / "src" / "assets" / "applicability-boundary-social.png"

# Preserve the whole portrait diagram inside a conventional 1200×630 social frame.
rendered = cairosvg.svg2png(url=str(SOURCE), output_width=394, output_height=630)
diagram = Image.open(BytesIO(rendered)).convert("RGBA")
canvas = Image.new("RGBA", (1200, 630), "#ffffff")
canvas.alpha_composite(diagram, ((1200 - diagram.width) // 2, 0))
canvas.convert("RGB").save(OUTPUT, "PNG", optimize=True)
print(f"Generated {OUTPUT.relative_to(ROOT)}: 1200x630")
