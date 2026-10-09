import os
import shutil
import zipfile
import uuid
from pathlib import Path
from typing import List, Dict, Any


def generate_organization_plan(file_records: List[Dict[str, Any]], naming_convention: str = "{category}/{filename}") -> List[Dict[str, Any]]:
    """
    Generates deterministic proposed paths for each file with collision handling.
    Returns list of organization actions.
    """
    proposed_paths_seen = set()
    actions = []

    for rec in file_records:
        file_id = rec["id"]
        job_id = rec["job_id"]
        original_path = rec["original_path"]
        category = rec.get("category", "Others")
        filename = rec["filename"]
        is_selected = rec.get("is_selected_duplicate", True)

        if not is_selected:
            # Skip unselected duplicates
            actions.append({
                "id": f"act_{uuid.uuid4().hex[:8]}",
                "job_id": job_id,
                "file_id": file_id,
                "original_path": original_path,
                "proposed_path": f"_skipped/{filename}",
                "action": "skip",
                "status": "pending",
                "conflict_flag": False,
                "conflict_reason": "Excluded duplicate copy",
            })
            continue

        # Build proposed relative path
        stem, ext = os.path.splitext(filename)
        base_dir = category
        target_name = filename

        proposed_rel = f"{base_dir}/{target_name}"

        # Collision resolution if target filename already used in plan
        counter = 1
        while proposed_rel.lower() in proposed_paths_seen:
            target_name = f"{stem} ({counter}){ext}"
            proposed_rel = f"{base_dir}/{target_name}"
            counter += 1

        proposed_paths_seen.add(proposed_rel.lower())

        action_type = "rename" if target_name != filename else "copy"

        actions.append({
            "id": f"act_{uuid.uuid4().hex[:8]}",
            "job_id": job_id,
            "file_id": file_id,
            "original_path": original_path,
            "proposed_path": proposed_rel,
            "action": action_type,
            "status": "pending",
            "conflict_flag": (counter > 1),
            "conflict_reason": f"Filename collision resolved by appending '({counter-1})'" if counter > 1 else None,
        })

    return actions


def execute_organization_plan(extracted_dir: str, organized_dir: str, output_zip_path: str, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes organization actions safely:
    - Creates organized folder structure
    - Copies files into target paths without touching original files
    - Compresses organized result into output_zip_path
    Returns summary statistics.
    """
    if os.path.exists(organized_dir):
        shutil.rmtree(organized_dir)
    os.makedirs(organized_dir, exist_ok=True)

    completed_count = 0
    skipped_count = 0
    failed_count = 0

    for act in actions:
        if act["action"] == "skip":
            act["status"] = "completed"
            skipped_count += 1
            continue

        rel_dest = act.get("user_override_path") or act["proposed_path"]
        src_full = os.path.join(extracted_dir, act["original_path"])
        dest_full = os.path.join(organized_dir, rel_dest)

        if not os.path.exists(src_full):
            act["status"] = "failed"
            act["conflict_reason"] = "Source file missing"
            failed_count += 1
            continue

        try:
            os.makedirs(os.path.dirname(dest_full), exist_ok=True)
            shutil.copy2(src_full, dest_full)
            act["status"] = "completed"
            completed_count += 1
        except Exception as e:
            act["status"] = "failed"
            act["conflict_reason"] = str(e)
            failed_count += 1

    # Create output ZIP archive
    os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(organized_dir):
            for fname in files:
                full_fpath = os.path.join(root, fname)
                arcname = os.path.relpath(full_fpath, organized_dir)
                zipf.write(full_fpath, arcname)

    return {
        "completed": completed_count,
        "skipped": skipped_count,
        "failed": failed_count,
        "output_zip_path": output_zip_path,
    }
