#!/usr/bin/env python3
"""SolarEraser Chat — reversible, byte-preserving JavaScript source organizer.

Runs from the root of the SolarEraserYT/demo repository, on a NEW branch:
    python solareraser_js_organizer.py --apply
    python solareraser_js_organizer.py --verify

After editing an organized source part:
    python solareraser_js_organizer.py --build
    python solareraser_js_organizer.py --verify

Other options:
    python solareraser_js_organizer.py --undo
    python solareraser_js_organizer.py --apply --section store
    python solareraser_js_organizer.py --verify --section store

This script does not invoke git, mutate Supabase, modify JavaScript logic, or
change HTML script tags. The public JS bundles remain byte-for-byte identical
at installation time. Source fragments are concatenated in manifest order;
GitHub Actions will also rebuild them before deployment.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

BRANCH = "refactor/javascript-organization"
WORKFLOW = Path(".github/workflows/publish-chat.yml")
WORKFLOW_ANCHOR = "          cp -R scripts _site/\n"
WORKFLOW_PATCH = (
    "          # Regenerate the existing JS bundles from ordered source fragments.\n"
    "          python3 solareraser_js_organizer.py --build --root _site\n"
)
SRC_BASE = Path("scripts/source")

# Existing code is NOT rewritten or converted to ES modules. Section markers
# are matched by unique exact text, not fragile numerical line numbers.
SECTIONS = {
    "store": {
        "bundle": "scripts/store-panel.js",
        "parts": [
            ("00-store-shell.js", None),
            ("10-glitch-collection.js", "/* SolarEraser Store — Glitch Collection preview add-on."),
            ("20-visual-showcase.js", "/* SolarEraser Store — Visual Showcase V3"),
            ("30-animated-previews.js", "/* SolarEraser Store V4 — animated cosmetic previews."),
            ("40-animated-calling-cards.js", "/* ==========================================\n   SOLARERASER — REAL ANIMATED CALLING CARDS"),
        ],
    },
    "settings": {
        "bundle": "scripts/settings-panel.js",
        "parts": [
            ("00-settings-panel.js", None),
            ("10-namecard-inventory.js", "/* SolarEraser — Solar Tempest Inventory: Step 3B */"),
            ("20-cosmetic-effect-inventory.js", "/* SolarEraser Chat — Step 5: Cosmetic Effect Inventories */"),
            ("30-advanced-settings.js", "/* ==========================================\n   SOLARERASER CHAT — STEP 7"),
        ],
    },
    "main": {
        "bundle": "main.js",
        "parts": [
            ("00-foundation.js", None),
            ("10-glow-and-profiles.js", "// --------------------------------------------------\n// VERIFIED GLOW"),
            ("20-messages.js", "// --------------------------------------------------\n// MESSAGES"),
            ("30-room-selector.js", "// --------------------------------------------------\n// PUBLIC ROOM SELECTOR"),
            ("40-online-users-and-namecards.js", "// --------------------------------------------------\n// ONLINE USERS AND CLICKABLE IDS"),
            ("50-supabase-connection.js", "// --------------------------------------------------\n// SUPABASE CONNECTION"),
            ("60-room-lifecycle.js", "// --------------------------------------------------\n// JOIN ROOMS"),
            ("70-nick-and-commands.js", "// --------------------------------------------------\n// NICKNAME COMMANDS"),
            ("80-message-sending.js", "// --------------------------------------------------\n// SEND MESSAGES"),
            ("90-color-picker.js", "// --------------------------------------------------\n// NICKNAME COLOR PICKER"),
            ("100-chat-startup.js", "// --------------------------------------------------\n// SETTINGS GEAR"),
            ("110-moderation.js", "// STEP 108D — Restore original username-click behavior."),
            ("120-admin-and-utilities.js", "// ==================================================\n// STEP 114N — Live presence heartbeat for /rooms"),
            ("130-topics-and-help.js", "/*\n  STEP 121B — Scrolling room topics"),
            ("140-account-recovery.js", "/* ==========================================\n   SOLARERASER — PERMANENT RECOVERY CODE"),
            ("150-prism-username.js", "/* ============================================\n   SOLARERASER CHAT — STEP 6B"),
            ("160-glitch-messages.js", "/* ============================================\n   SOLARERASER CHAT — STEP 6C"),
        ],
    },
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def die(message: str) -> None:
    raise RuntimeError(message)


def repo_branch(root: Path) -> str | None:
    head = root / ".git" / "HEAD"
    # Git worktrees keep .git as a small pointer file.
    git_dir = root / ".git"
    if git_dir.is_file():
        first = git_dir.read_text(encoding="utf-8").strip()
        if first.startswith("gitdir: "):
            target = Path(first[8:])
            git_dir = target if target.is_absolute() else (root / target).resolve()
            head = git_dir / "HEAD"
    if not head.is_file():
        return None
    value = head.read_text(encoding="utf-8").strip()
    return value.removeprefix("ref: refs/heads/") if value.startswith("ref: refs/heads/") else None


def require_branch(root: Path) -> None:
    actual = repo_branch(root)
    if actual != BRANCH:
        die(
            f"This operation requires GitHub Desktop branch '{BRANCH}'. "
            f"Detected: {actual or '(no readable branch)'}. "
            "Switch/create that branch first; no files were changed."
        )


def manifest_path(root: Path, key: str) -> Path:
    return root / SRC_BASE / key / "manifest.json"


def raw_parts(data: bytes, key: str) -> list[tuple[str, bytes]]:
    """Split at existing named boundaries while retaining original CRLF/LF bytes."""
    lines = data.splitlines(keepends=True)
    normalized = b"".join(
        line.replace(b"\r\n", b"\n") for line in lines
    ).decode("utf-8")
    boundaries = [0]
    names = [SECTIONS[key]["parts"][0][0]]
    for name, marker in SECTIONS[key]["parts"][1:]:
        count = normalized.count(marker)
        if count != 1:
            die(f"{key}: expected one occurrence of '{marker[:65]}', found {count}. "
                "Your bundle may have changed. Stop and review before reorganizing.")
        offset = normalized.index(marker)
        # Every marker begins a line; preserve all blank lines and delimiters.
        line_index = normalized.count("\n", 0, offset)
        if line_index <= boundaries[-1] or line_index >= len(lines):
            die(f"{key}: source boundaries are out of order for '{name}'.")
        boundaries.append(line_index)
        names.append(name)
    boundaries.append(len(lines))
    chunks = [(name, b"".join(lines[boundaries[i]:boundaries[i+1]]))
              for i, name in enumerate(names)]
    if not all(value for _, value in chunks) or b"".join(value for _, value in chunks) != data:
        die(f"{key}: exact-byte split verification failed; no files changed.")
    return chunks


def checked_manifest(root: Path, key: str) -> dict:
    path = manifest_path(root, key)
    if not path.is_file():
        die(f"{key}: no source manifest at {path}. Apply that section first.")
    value = json.loads(path.read_text(encoding="utf-8"))
    expected_names = [name for name, _ in SECTIONS[key]["parts"]]
    if (value.get("bundle") != SECTIONS[key]["bundle"] or
        [part.get("name") for part in value.get("parts", [])] != expected_names):
        die(f"{key}: unexpected manifest content; refusing to build.")
    return value


def assemble(root: Path, key: str, manifest: dict) -> bytes:
    folder = root / SRC_BASE / key
    pieces = []
    for part in manifest["parts"]:
        name = part["name"]  # already checked against safe, fixed filenames
        location = folder / name
        if not location.is_file():
            die(f"{key}: missing source part {location}")
        pieces.append(location.read_bytes())
    return b"".join(pieces)


def chosen(section: str) -> list[str]:
    return list(SECTIONS) if section == "all" else [section]


def apply(root: Path, section: str) -> None:
    require_branch(root)
    keys = chosen(section)
    prepared = {}
    for key in keys:
        target = manifest_path(root, key)
        if target.exists():
            die(f"{key}: already organized. Use --verify or --build; no files changed.")
        folder = target.parent
        if folder.exists():
            die(f"{key}: source folder already exists: {folder}; stop to avoid overwriting.")
        bundle = root / SECTIONS[key]["bundle"]
        if not bundle.is_file():
            die(f"Missing {bundle}; run this from the demo repository root.")
        data = bundle.read_bytes()
        parts = raw_parts(data, key)
        prepared[key] = (data, parts)

    wf_path = root / WORKFLOW
    wf = wf_path.read_text(encoding="utf-8")
    if WORKFLOW_PATCH not in wf:
        if wf.count(WORKFLOW_ANCHOR) != 1:
            die("GitHub Pages workflow has changed; cannot safely add build step.")
        amended = wf.replace(WORKFLOW_ANCHOR,
                             WORKFLOW_ANCHOR + WORKFLOW_PATCH, 1)
    else:
        amended = wf

    for key, (data, parts) in prepared.items():
        folder = manifest_path(root, key).parent
        folder.mkdir(parents=True)
        for name, chunk in parts:
            (folder / name).write_bytes(chunk)
        manifest = {
            "bundle": SECTIONS[key]["bundle"],
            "original_sha256": sha256(data),
            "last_built_sha256": sha256(data),
            "parts": [{"name": name, "initial_sha256": sha256(chunk)}
                      for name, chunk in parts],
        }
        manifest_path(root, key).write_text(
            json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
        )
        print(f"[OK] {key}: {len(parts)} source files; original bundle UNCHANGED")

    if amended != wf:
        wf_path.write_text(amended, encoding="utf-8")
        print("[OK] GitHub Pages now rebuilds production JS bundles")
    print("Run --verify. In GitHub Desktop, review the generated source files before committing.")


def verify(root: Path, section: str) -> None:
    errors = []
    for key in chosen(section):
        manifest = checked_manifest(root, key)
        assembled = assemble(root, key, manifest)
        built = (root / manifest["bundle"]).read_bytes()
        if assembled != built:
            errors.append(key)
            print(f"[FAIL] {key}: bundle differs from source; run --build")
        else:
            print(f"[OK] {key}: {len(manifest['parts'])} pieces reconstruct "
                  f"the original bundle exactly ({len(built):,} bytes)")
    if not (root / WORKFLOW).is_file() or WORKFLOW_PATCH not in (root / WORKFLOW).read_text(encoding="utf-8"):
        errors.append("GitHub Pages workflow")
        print("[FAIL] GitHub Pages build step missing")
    if errors:
        die("Verification failed: " + ", ".join(errors))
    print("All selected JavaScript bundles are byte-for-byte identical to their source fragments.")


def build(root: Path, section: str) -> None:
    keys = [key for key in chosen(section) if manifest_path(root, key).exists()]
    if not keys:
        die("No organized sections were found; nothing to build.")
    changes = []
    # Preflight EVERYTHING before writing any bundle.
    for key in keys:
        manifest = checked_manifest(root, key)
        location = root / manifest["bundle"]
        current = location.read_bytes()
        last_hash = manifest.get("last_built_sha256")
        content = assemble(root, key, manifest)
        # Git can normalize Windows CRLF to LF on checkout. The stored
        # last-built hash may therefore differ even when the checked-out
        # bundle and its source fragments are *exactly the same bytes*.
        # Only allow that harmless case; otherwise preserve the safety stop.
        if sha256(current) != last_hash and current != content:
            die(f"{key}: {location} was edited separately from its source pieces. "
                "Move the changes into the corresponding source part first; "
                "refusing to overwrite the bundle.")
        changes.append((key, location, content, manifest))

    for key, location, content, manifest in changes:
        if location.read_bytes() != content:
            location.write_bytes(content)
            print(f"[BUILT] {location} ({len(content):,} bytes)")
        else:
            print(f"[OK] {location} already up to date")
        if manifest["last_built_sha256"] != sha256(content):
            manifest["last_built_sha256"] = sha256(content)
            manifest_path(root, key).write_text(
                json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
            )


def undo(root: Path, section: str) -> None:
    require_branch(root)
    keys = chosen(section)
    # Undo is deliberately safe ONLY before source edits; otherwise use GitHub
    # Desktop's branch history to revert without silently losing work.
    for key in keys:
        manifest = checked_manifest(root, key)
        for part in manifest["parts"]:
            data = (manifest_path(root, key).parent / part["name"]).read_bytes()
            if sha256(data) != part["initial_sha256"]:
                die(f"{key}: source has been edited; --undo refuses to discard it.")
        original = (root / manifest["bundle"]).read_bytes()
        if sha256(original) != manifest["original_sha256"]:
            die(f"{key}: bundle has changed since organizing; --undo refused.")
    wf_path = root / WORKFLOW
    wf = wf_path.read_text(encoding="utf-8")
    if WORKFLOW_PATCH not in wf:
        die("Workflow build patch missing; inspect branch before undoing.")
    for key in keys:
        shutil.rmtree(manifest_path(root, key).parent)
        print(f"[UNDONE] {key}: source fragments removed, original bundle kept")
    if not any(manifest_path(root, key).exists() for key in SECTIONS):
        wf_path.write_text(wf.replace(WORKFLOW_PATCH, "", 1), encoding="utf-8")
        print("[UNDONE] GitHub Pages build step removed")
    print("Original JavaScript bundles were never modified by the organizer.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    action = parser.add_mutually_exclusive_group(required=True)
    for option in ("apply", "verify", "build", "undo"):
        action.add_argument("--" + option, action="store_true")
    parser.add_argument("--section", choices=("all", "store", "settings", "main"), default="all")
    parser.add_argument("--root", type=Path, default=Path("."), help="Repository root (or _site for GitHub Pages)")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        if args.apply:
            apply(root, args.section)
        elif args.verify:
            verify(root, args.section)
        elif args.build:
            build(root, args.section)
        else:
            undo(root, args.section)
    except (RuntimeError, OSError, ValueError, UnicodeError, KeyError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
