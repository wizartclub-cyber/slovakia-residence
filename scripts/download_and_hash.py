#!/usr/bin/env python3
"""
download_and_hash.py — Slovakia Residence Guide, Phase 1 source snapshots.

Reads a document registry (YAML), downloads every resource URL into
sources/snapshots/<id>.<ext>, and records evidence for each resource:
  retrievedAt, httpStatus, finalUrl, bytes, sha256, mime (server),
  signature (magic bytes), pages / pageSizes (PDF only), contentDate (server Last-Modified).

It NEVER changes legal fields (validFrom, priority, notes …).
It NEVER sets reviewStatus to source_verified or legally_reviewed — those are
human decisions. It only writes `snapshot:` evidence blocks and, on success,
sets reviewStatus to `snapshot_taken` when the previous value was
`url_verified` or missing.

Usage (from the project root):
    python3 scripts/download_and_hash.py                       # uses document-registry-v0.4.yaml
    python3 scripts/download_and_hash.py --registry X.yaml
    python3 scripts/download_and_hash.py --verify              # re-hash existing snapshots, report drift

Requirements: Python 3.9+, `pip install pyyaml requests pypdf`
"""
import argparse
import datetime as dt
import hashlib
import json
import mimetypes
import sys
from pathlib import Path

try:
    import requests
    import yaml
except ImportError:
    sys.exit("Missing packages. Run:  pip3 install pyyaml requests pypdf")

try:
    from pypdf import PdfReader
except ImportError:  # pypdf optional; PDF metadata just gets skipped
    PdfReader = None

ROOT = Path(__file__).resolve().parent.parent
SNAP_DIR = ROOT / "sources" / "snapshots"
MANIFEST = ROOT / "sources" / "manifest.json"
UA = "SlovakiaResidenceGuide-source-snapshot/0.1 (+non-commercial legal reference; contact: repository owner)"
TIMEOUT = 60

MAGIC = {
    b"%PDF": "pdf",
    b"\xd0\xcf\x11\xe0": "doc",          # OLE2 (legacy .doc/.xls)
    b"PK\x03\x04": "docx",               # ZIP container (docx/xlsx/odt)
    b"{\\rtf": "rtf",
}


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sniff(data: bytes) -> str:
    head = data[:8]
    for magic, kind in MAGIC.items():
        if head.startswith(magic):
            return kind
    lowered = data[:2048].lower()
    if b"<html" in lowered or b"<!doctype html" in lowered:
        return "html"
    return "unknown"


def ext_for(kind: str, url: str, mime: str) -> str:
    if kind in ("pdf", "doc", "docx", "rtf", "html"):
        return kind
    guessed = mimetypes.guess_extension(mime.split(";")[0].strip()) if mime else None
    if guessed:
        return guessed.lstrip(".")
    tail = url.rsplit("/", 1)[-1]
    return tail.rsplit(".", 1)[-1] if "." in tail else "bin"


def pdf_info(path: Path):
    if PdfReader is None:
        return None
    try:
        r = PdfReader(str(path))
        sizes = []
        for p in r.pages:
            box = p.mediabox
            sizes.append([round(float(box.width), 2), round(float(box.height), 2)])
        fields = r.get_fields() or {}
        return {"pages": len(r.pages), "pageSizesPt": sizes, "acroFormFields": len(fields)}
    except Exception as e:  # noqa: BLE001
        return {"error": f"pdf parse failed: {e}"}


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def snapshot_url(res: dict) -> tuple[str | None, str]:
    """Adresa to snapshot, and which registry field it came from.

    Slov-Lex `url` is the floating ezbierky page, which is a ~2 KB JavaScript
    shell: downloading it yields no legal text at all. The real, citable text
    lives at `staticUrl` (static.slov-lex.sk .print.html) or at the pinned
    temporal `pinnedUrl`. Prefer those.
    """
    for field in ("staticUrl", "pinnedUrl", "url"):
        value = res.get(field)
        if value:
            return value, field
    return None, "url"


def fetch(res: dict) -> dict:
    url, field = snapshot_url(res)
    ev = {"retrievedAt": utc_now(), "requestedUrl": url, "urlField": field}
    if not url:
        # Registered resource whose official URL is not confirmed yet: skip, never guess.
        ev.update({"ok": False, "error": "no url in registry — supply the official URL first"})
        return ev
    try:
        resp = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
    except requests.RequestException as e:
        ev.update({"ok": False, "error": str(e)})
        return ev
    ev.update({
        "httpStatus": resp.status_code,
        "finalUrl": resp.url,
        "redirected": resp.url != url,
        "serverMime": resp.headers.get("Content-Type", ""),
        "serverLastModified": resp.headers.get("Last-Modified", ""),
    })
    if resp.status_code != 200:
        ev["ok"] = False
        return ev
    data = resp.content
    kind = sniff(data)
    ext = ext_for(kind, resp.url, ev["serverMime"])
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    out = SNAP_DIR / f"{res['id']}.{ext}"
    out.write_bytes(data)
    ev.update({
        "ok": True,
        "signature": kind,
        "bytes": len(data),
        "sha256": sha256_of(out),
        "snapshotPath": str(out.relative_to(ROOT)),
    })
    declared = res.get("type", "")
    if declared.startswith("official_form_") and declared.split("_")[-1] != kind:
        ev["warning"] = f"registry type {declared} but file signature is {kind}"
    if kind == "html" and declared.startswith("official_form_"):
        ev["warning"] = "expected a file but got an HTML page (login wall, moved file, or landing page)"
    if kind == "pdf":
        info = pdf_info(out)
        if info:
            ev["pdf"] = info
    return ev


def verify(registry: dict) -> int:
    drift = 0
    for res in registry["resources"]:
        snap = res.get("snapshot") or {}
        p = snap.get("snapshotPath")
        if not p:
            print(f"  - {res['id']}: no snapshot yet")
            continue
        path = ROOT / p
        if not path.exists():
            print(f"  ! {res['id']}: snapshot file missing ({p})")
            drift += 1
            continue
        actual = sha256_of(path)
        if actual != snap.get("sha256"):
            print(f"  ! {res['id']}: HASH MISMATCH  registry={snap.get('sha256')[:12]}…  file={actual[:12]}…")
            drift += 1
        else:
            print(f"  ✓ {res['id']}")
    return drift


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", default="document-registry-v0.4.yaml")
    ap.add_argument("--verify", action="store_true", help="re-hash local snapshots instead of downloading")
    ap.add_argument("--only", help="comma-separated resource ids to (re)download")
    ap.add_argument("--local", action="store_true",
                    help="record files already saved by hand in sources/snapshots/ (for sites that block scripts)")
    ap.add_argument("--force-local", action="store_true", help="with --local: overwrite existing snapshot evidence")
    args = ap.parse_args()

    reg_path = ROOT / args.registry
    registry = yaml.safe_load(reg_path.read_text(encoding="utf-8"))

    if args.verify:
        print(f"Verifying snapshots listed in {reg_path.name}")
        sys.exit(1 if verify(registry) else 0)

    if args.local:
        # Some authorities (mzv.sk) return 403 to every programmatic client,
        # whatever the User-Agent. Those files must be saved by hand from a
        # browser into sources/snapshots/<id>.<ext>; this mode records the same
        # evidence for them, and marks that the file was obtained manually.
        found = 0
        for res in registry["resources"]:
            existing = sorted(SNAP_DIR.glob(f"{res['id']}.*")) if SNAP_DIR.exists() else []
            if not existing:
                continue
            snap = res.get("snapshot") or {}
            if snap.get("ok") and not args.force_local:
                continue
            path = existing[0]
            data = path.read_bytes()
            ev = {
                "retrievedAt": utc_now(),
                "requestedUrl": snapshot_url(res)[0],
                "obtainedManually": True,
                "ok": True,
                "signature": sniff(data),
                "bytes": len(data),
                "sha256": sha256_of(path),
                "snapshotPath": str(path.relative_to(ROOT)),
            }
            if PdfReader and ev["signature"] == "pdf":
                try:
                    reader = PdfReader(str(path))
                    ev["pdf"] = {
                        "pages": len(reader.pages),
                        "acroFormFields": len((reader.get_fields() or {})),
                    }
                except Exception as e:  # noqa: BLE001
                    ev["warning"] = f"pdf parse failed: {e}"
            res["snapshot"] = ev
            if res.get("reviewStatus") in (None, "url_verified", "fetch_pending"):
                res["reviewStatus"] = "snapshot_taken"
            found += 1
            print(f"→ {res['id']}: {ev['signature']} {ev['bytes']} B sha256={ev['sha256'][:16]}… (manual)")
        registry["snapshotRunAt"] = utc_now()
        reg_path.write_text(yaml.safe_dump(registry, sort_keys=False, allow_unicode=True, width=120), encoding="utf-8")
        print(f"\nDone: {found} file(s) recorded from sources/snapshots/.")
        sys.exit(0)

    wanted = set(args.only.split(",")) if args.only else None
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    ok = fail = 0
    for res in registry["resources"]:
        if wanted and res["id"] not in wanted:
            continue
        print(f"→ {res['id']}")
        ev = fetch(res)
        res["snapshot"] = ev
        manifest[res["id"]] = ev
        if ev.get("ok"):
            ok += 1
            if res.get("reviewStatus") in (None, "url_verified", "fetch_pending"):
                res["reviewStatus"] = "snapshot_taken"
            msg = f"   {ev['signature']} {ev['bytes']} B sha256={ev['sha256'][:16]}…"
            if "pdf" in ev:
                msg += f" pages={ev['pdf'].get('pages')} acroFields={ev['pdf'].get('acroFormFields')}"
            print(msg)
            if ev.get("warning"):
                print(f"   ⚠ {ev['warning']}")
        else:
            fail += 1
            if res.get("reviewStatus") in (None, "url_verified"):
                res["reviewStatus"] = "fetch_pending"
            print(f"   ✗ {ev.get('error') or ev.get('httpStatus')}")

    registry["snapshotRunAt"] = utc_now()
    reg_path.write_text(yaml.safe_dump(registry, sort_keys=False, allow_unicode=True, width=120), encoding="utf-8")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone: {ok} ok, {fail} failed. Registry updated: {reg_path.name}; manifest: sources/manifest.json")
    print("Next: open SOURCE_AUDIT and move resources to source_verified only after a human looks at each file.")


if __name__ == "__main__":
    main()
