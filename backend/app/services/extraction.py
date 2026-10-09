import os
import zipfile
import shutil
from pathlib import Path


class ExtractionError(Exception):
    pass


MAX_FILES_LIMIT = 5000
MAX_EXTRACTED_SIZE_MB = 500  # 500 MB limit safety


def validate_and_extract_zip(zip_path: str, extract_dir: str) -> int:
    """
    Validates ZIP file safety (path traversal prevention, zip bomb limits)
    and extracts all contents into target directory.
    Returns total extracted file count.
    """
    os.makedirs(extract_dir, exist_ok=True)
    
    if not zipfile.is_zipfile(zip_path):
        raise ExtractionError("Provided file is not a valid ZIP archive.")

    total_files = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(zip_path, 'r') as archive:
        infolist = archive.infolist()

        for item in infolist:
            # Skip directory entries in count check
            if item.is_dir():
                continue
            
            # Check path traversal vulnerability
            filename = item.filename
            norm_path = os.path.normpath(filename)
            if norm_path.startswith("..") or os.path.isabs(norm_path) or "/../" in filename or "\\..\\" in filename:
                raise ExtractionError(f"Security Warning: Unsafe relative path detected in archive: {filename}")

            total_files += 1
            total_uncompressed_bytes += item.file_size

            if total_files > MAX_FILES_LIMIT:
                raise ExtractionError(f"Archive exceeds maximum file count limit ({MAX_FILES_LIMIT} files).")

            if total_uncompressed_bytes > MAX_EXTRACTED_SIZE_MB * 1024 * 1024:
                raise ExtractionError(f"Archive exceeds maximum total size limit ({MAX_EXTRACTED_SIZE_MB} MB).")

        # Perform actual safe extraction
        target_base = Path(extract_dir).resolve()
        for item in infolist:
            extracted_path = target_base.joinpath(item.filename).resolve()
            if not str(extracted_path).startswith(str(target_base)):
                raise ExtractionError(f"Path traversal attempt blocked: {item.filename}")
        
        archive.extractall(extract_dir)

    return total_files
