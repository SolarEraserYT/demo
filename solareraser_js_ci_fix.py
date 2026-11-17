#!/usr/bin/env python3
"""Fix SolarEraser JS organizer's GitHub Pages line-ending false alarm.

Use on a new fix branch, starting from up-to-date main:
    python solareraser_js_ci_fix.py --apply
    python solareraser_js_ci_fix.py --verify

To undo only this code fix:
    python solareraser_js_ci_fix.py --undo

This adjusts only solareraser_js_organizer.py, not JS sources, bundles,
GitHub workflows, database, or website visuals.
"""
from pathlib import Path
import argparse
import sys

TARGET = Path("solareraser_js_organizer.py")
BEFORE = '        if sha256(current) != last_hash:\n            die(f"{key}: {location} was edited separately from its source pieces. "\n                "Move the changes into the corresponding source part first; "\n                "refusing to overwrite the bundle.")\n        content = assemble(root, key, manifest)\n        changes.append((key, location, content, manifest))\n'
AFTER = '        content = assemble(root, key, manifest)\n        # Git can normalize Windows CRLF to LF on checkout. The stored\n        # last-built hash may therefore differ even when the checked-out\n        # bundle and its source fragments are *exactly the same bytes*.\n        # Only allow that harmless case; otherwise preserve the safety stop.\n        if sha256(current) != last_hash and current != content:\n            die(f"{key}: {location} was edited separately from its source pieces. "\n                "Move the changes into the corresponding source part first; "\n                "refusing to overwrite the bundle.")\n        changes.append((key, location, content, manifest))\n'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    command = parser.add_mutually_exclusive_group(required=True)
    command.add_argument("--apply", action="store_true")
    command.add_argument("--verify", action="store_true")
    command.add_argument("--undo", action="store_true")
    args = parser.parse_args()

    folder = Path(__file__).resolve().parent
    target = folder / TARGET
    if not target.is_file():
        raise RuntimeError("Put this script beside solareraser_js_organizer.py in demo/.")

    content = target.read_text(encoding="utf-8")
    if args.verify:
        if content.count(AFTER) != 1 or BEFORE in content:
            raise RuntimeError("Verification failed: the correction is missing or altered.")
        print("[OK] Organizer has safe GitHub Pages line-ending handling.")
        return

    original, replacement = (AFTER, BEFORE) if args.undo else (BEFORE, AFTER)
    if content.count(original) != 1 or replacement in content:
        raise RuntimeError("Expected original code not found exactly once. No files were changed.")
    target.write_text(content.replace(original, replacement, 1), encoding="utf-8", newline="\n")
    print("[OK] " + ("Reverted CI fix." if args.undo else "Applied CI fix."))
    print("Next: python solareraser_js_ci_fix.py --verify")

if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, UnicodeError) as error:
        print("ERROR:", error, file=sys.stderr)
        sys.exit(1)
