import os
import hashlib
import mimetypes
import datetime
from pathlib import Path
from backend.app.services.categorizer import categorize_file


def calculate_sha256(file_path: str) -> str:
    """Calculates SHA-256 hash of a file reading in chunks."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def scan_directory(extracted_dir: str, category_rules: dict = None):
    """
    Recursively scans extracted directory and collects metadata for all files.
    Yields dicts with file properties.
    """
    base_path = Path(extracted_dir)
    
    for root, _, files in os.walk(extracted_dir):
        for fname in files:
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, extracted_dir).replace("\\", "/")
            
            stat = os.stat(full_path)
            file_size = stat.st_size
            ext = os.path.splitext(fname)[1].lower()
            
            mime_type, _ = mimetypes.guess_type(full_path)
            created_at = datetime.datetime.fromtimestamp(stat.st_ctime)
            modified_at = datetime.datetime.fromtimestamp(stat.st_mtime)
            
            sha256_hash = calculate_sha256(full_path)
            category = categorize_file(fname, custom_rules=category_rules)

            yield {
                "original_path": rel_path,
                "filename": fname,
                "extension": ext,
                "mime_type": mime_type or "application/octet-stream",
                "file_size": file_size,
                "created_at": created_at,
                "modified_at": modified_at,
                "sha256_hash": sha256_hash,
                "category": category,
            }
