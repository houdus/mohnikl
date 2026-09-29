import base64
import fnmatch
import hashlib
import json
import os
import sys
import time
import urllib.request
from urllib.error import HTTPError
from urllib.parse import quote

API = "https://api.github.com"
SKIP_DIRS = {".git", "node_modules", ".next", "out", "dist", "build", ".turbo", ".vercel", "__pycache__"}
SKIP_FILES = {".env", ".env.local", ".env.production", ".env.development", "Thumbs.db", ".DS_Store"}
SKIP_GLOBS = ["*.log", "*.tsbuildinfo", ".env.*.local"]
MAX_BYTES = 90 * 1024 * 1024  # Contents API rejects files near 100 MB


def api(method, url, token, payload=None, retries=4):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "project-uploader",
    }
    body = json.dumps(payload).encode() if payload is not None else None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                return res.status, json.loads(res.read().decode() or "{}")
        except HTTPError as e:
            raw = e.read().decode()
            if e.code in (403, 429) and attempt < retries - 1:
                wait = int(e.headers.get("Retry-After") or 2 ** (attempt + 2))
                time.sleep(wait)
                continue
            if e.code >= 500 and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            try:
                return e.code, json.loads(raw)
            except json.JSONDecodeError:
                return e.code, {"message": raw}
    return 0, {"message": "retries exhausted"}


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob %d\x00" % len(data) + data).hexdigest()


def should_skip(name: str) -> bool:
    return name in SKIP_FILES or any(fnmatch.fnmatch(name, g) for g in SKIP_GLOBS)


def upload_to_github(token, username, repo, project_folder, branch="main"):
    if not os.path.isdir(project_folder):
        sys.exit(f"Folder not found: {project_folder}")

    ok = skipped = failed = 0
    for root, dirs, files in os.walk(project_folder):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for file in files:
            if should_skip(file):
                continue
            path = os.path.join(root, file)
            rel = os.path.relpath(path, project_folder).replace("\\", "/")

            if os.path.getsize(path) > MAX_BYTES:
                print(f"Too large, skipped: {rel}")
                skipped += 1
                continue

            with open(path, "rb") as f:
                data = f.read()

            url = f"{API}/repos/{username}/{repo}/contents/{quote(rel)}"
            status, info = api("GET", f"{url}?ref={branch}", token)
            sha = None
            if status == 200:
                sha = info.get("sha")
                if sha == git_blob_sha(data):
                    print(f"Unchanged: {rel}")
                    skipped += 1
                    continue
            elif status != 404:
                print(f"Failed lookup {rel}: {info.get('message')}")
                failed += 1
                continue

            payload = {
                "message": f"{'Update' if sha else 'Add'} {rel}",
                "content": base64.b64encode(data).decode(),
                "branch": branch,
            }
            if sha:
                payload["sha"] = sha

            status, info = api("PUT", url, token, payload)
            if status in (200, 201):
                print(f"Uploaded: {rel}")
                ok += 1
            else:
                print(f"Failed {rel}: {info.get('message')}")
                failed += 1

    print(f"\nDone. uploaded={ok} skipped={skipped} failed={failed}")


if __name__ == "__main__":
    upload_to_github(
        token=os.environ["GITHUB_TOKEN"],
        username="houdus",
        repo="mohnikl",
        project_folder=r"C:\Users\james\Downloads\moviebox-international-v1",
        branch="main",
    )