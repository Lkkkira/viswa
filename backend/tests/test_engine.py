import os
import io
import tempfile
import zipfile
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.extraction import validate_and_extract_zip, ExtractionError
from backend.app.services.categorizer import categorize_file
from backend.app.services.duplicates import group_duplicates
from backend.app.services.organizer import generate_organization_plan, execute_organization_plan

client = TestClient(app)


def create_sample_zip(tmp_path) -> str:
    zip_filepath = os.path.join(tmp_path, "sample.zip")
    with zipfile.ZipFile(zip_filepath, 'w') as zf:
        zf.writestr("doc1.pdf", b"Sample PDF document content")
        zf.writestr("photo1.jpg", b"JPEG image binary data")
        zf.writestr("photo2_duplicate.jpg", b"JPEG image binary data")  # exact duplicate
        zf.writestr("code.py", b"print('Hello FilePilot')")
        zf.writestr("nested/doc2.pdf", b"Another PDF content")
    return zip_filepath


def test_categorizer():
    assert categorize_file("report.pdf") == "Documents"
    assert categorize_file("vacation.png") == "Images"
    assert categorize_file("song.mp3") == "Audio"
    assert categorize_file("movie.mp4") == "Videos"
    assert categorize_file("script.py") == "Code"
    assert categorize_file("archive.zip") == "Archives"
    assert categorize_file("unknown.xyz") == "Others"


def test_extraction_and_security(tmp_path):
    zip_path = create_sample_zip(tmp_path)
    extract_dir = os.path.join(tmp_path, "extracted")
    
    count = validate_and_extract_zip(zip_path, extract_dir)
    assert count == 5
    assert os.path.exists(os.path.join(extract_dir, "doc1.pdf"))

    # Unsafe path traversal attempt
    bad_zip_path = os.path.join(tmp_path, "bad.zip")
    with zipfile.ZipFile(bad_zip_path, 'w') as zf:
        zf.writestr("../evil.txt", b"malicious content")
    
    with pytest.raises(ExtractionError):
        validate_and_extract_zip(bad_zip_path, os.path.join(tmp_path, "bad_extract"))


def test_duplicate_detection():
    file_records = [
        {"id": "1", "filename": "photo1.jpg", "file_size": 100, "sha256_hash": "hash_abc", "original_path": "photo1.jpg"},
        {"id": "2", "filename": "photo2_dup.jpg", "file_size": 100, "sha256_hash": "hash_abc", "original_path": "photo2_dup.jpg"},
        {"id": "3", "filename": "doc.pdf", "file_size": 200, "sha256_hash": "hash_xyz", "original_path": "doc.pdf"},
    ]
    res = group_duplicates(file_records)
    assert res["total_duplicate_count"] == 1
    assert res["total_duplicate_savings"] == 100
    assert res["records"][0]["is_duplicate"] is True
    assert res["records"][1]["is_duplicate"] is True
    assert res["records"][2]["is_duplicate"] is False


def test_organization_plan_and_execution(tmp_path):
    ext_dir = os.path.join(tmp_path, "extracted")
    org_dir = os.path.join(tmp_path, "organized")
    out_zip = os.path.join(tmp_path, "output.zip")

    os.makedirs(ext_dir, exist_ok=True)
    with open(os.path.join(ext_dir, "report.pdf"), "w") as f:
        f.write("Report content")
    with open(os.path.join(ext_dir, "report_copy.pdf"), "w") as f:
        f.write("Report content")

    file_records = [
        {
            "id": "f1",
            "job_id": "job1",
            "original_path": "report.pdf",
            "filename": "report.pdf",
            "category": "Documents",
            "file_size": 14,
            "is_selected_duplicate": True,
        },
        {
            "id": "f2",
            "job_id": "job1",
            "original_path": "report_copy.pdf",
            "filename": "report.pdf",  # duplicate target name test
            "category": "Documents",
            "file_size": 14,
            "is_selected_duplicate": True,
        }
    ]

    actions = generate_organization_plan(file_records)
    assert len(actions) == 2
    # Check collision handling
    assert actions[0]["proposed_path"] == "Documents/report.pdf"
    assert actions[1]["proposed_path"] == "Documents/report (1).pdf"

    exec_res = execute_organization_plan(ext_dir, org_dir, out_zip, actions)
    assert exec_res["completed"] == 2
    assert os.path.exists(os.path.join(org_dir, "Documents", "report.pdf"))
    assert os.path.exists(os.path.join(org_dir, "Documents", "report (1).pdf"))
    assert os.path.exists(out_zip)


def test_full_api_workflow(tmp_path):
    zip_path = create_sample_zip(tmp_path)
    
    with open(zip_path, "rb") as f:
        resp = client.post("/api/jobs", files={"file": ("test_upload.zip", f, "application/zip")})
    assert resp.status_code == 200
    job_data = resp.json()
    job_id = job_data["id"]
    assert job_data["status"] == "uploaded"

    # Scan job
    scan_resp = client.post(f"/api/jobs/{job_id}/scan")
    assert scan_resp.status_code == 200
    scanned_job = scan_resp.json()
    assert scanned_job["status"] == "planned"
    assert scanned_job["total_files"] == 5

    # Get files
    files_resp = client.get(f"/api/jobs/{job_id}/files")
    assert files_resp.status_code == 200
    files = files_resp.json()
    assert len(files) == 5

    # Get duplicates
    dups_resp = client.get(f"/api/jobs/{job_id}/duplicates")
    assert dups_resp.status_code == 200
    dup_groups = dups_resp.json()
    assert len(dup_groups) >= 1

    # Organize job
    org_resp = client.post(f"/api/jobs/{job_id}/organize")
    assert org_resp.status_code == 200
    organized_job = org_resp.json()
    assert organized_job["status"] == "organized"

    # Download output
    dl_resp = client.get(f"/api/jobs/{job_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/zip"

    # Restore job
    rst_resp = client.post(f"/api/jobs/{job_id}/restore")
    assert rst_resp.status_code == 200
    assert rst_resp.json()["status"] == "planned"
