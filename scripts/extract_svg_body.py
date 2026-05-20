#!/usr/bin/env python3
"""Extract body outline paths from muscle map SVG files.

Usage:
    python3 scripts/extract_svg_body.py <svg_file> <label>

Extracts all <path d="..."> and <line> elements inside <g id="body">,
converts <line> to M/L path notation, and prints JS array syntax.
"""
import sys
import re


def extract_body_paths(svg_content):
    # Find the body group (including everything until </g> that closes it)
    # Use a simple approach: find id="body" then extract content
    start = svg_content.find('id="body"')
    if start == -1:
        start = svg_content.find("id='body'")
    if start == -1:
        print("ERROR: No body group found", file=sys.stderr)
        return []

    # Go back to find the opening <g
    g_start = svg_content.rfind('<g', 0, start)

    # Find the matching closing </g> by counting depth
    depth = 0
    i = g_start
    body_end = -1
    while i < len(svg_content):
        if svg_content[i:i+2] == '<g':
            depth += 1
            i += 2
        elif svg_content[i:i+4] == '</g>':
            depth -= 1
            if depth == 0:
                body_end = i + 4
                break
            i += 4
        else:
            i += 1

    if body_end == -1:
        body_content = svg_content[g_start:]
    else:
        body_content = svg_content[g_start:body_end]

    paths = []

    # Extract path d attributes (handles both " and ')
    for m in re.finditer(r'<path\b[^>]*\bd="([^"]+)"', body_content):
        paths.append(m.group(1))
    for m in re.finditer(r"<path\b[^>]*\bd='([^']+)'", body_content):
        paths.append(m.group(1))

    # Convert <line> elements to M/L path notation
    for m in re.finditer(
        r'<line\b[^>]*\bx1="([^"]+)"[^>]*\by1="([^"]+)"[^>]*\bx2="([^"]+)"[^>]*\by2="([^"]+)"',
        body_content
    ):
        x1, y1, x2, y2 = m.group(1), m.group(2), m.group(3), m.group(4)
        paths.append(f"M{x1},{y1}L{x2},{y2}")

    return paths


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <svg_file> [label]")
        sys.exit(1)

    filename = sys.argv[1]
    label = sys.argv[2] if len(sys.argv) > 2 else filename

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    paths = extract_body_paths(content)
    print(f"// {label} — {len(paths)} body outline paths")
    print("const BODY = [")
    for p in paths:
        escaped = p.replace('\\', '\\\\').replace('"', '\\"')
        print(f'  "{escaped}",')
    print("];")
