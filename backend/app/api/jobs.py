import os
import uuid
import shutil
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.job import Job, FileRecord, OrganizationAction, AppSettings
from backend.app.schemas.job import (
    JobSchema,
    FileRecordSchema,
    OrganizationActionSchema,
    DuplicateGroupSchema,
    PlanUpdateRequest,
    SettingsSchema,
)
from backend.app.services.extraction import validate_and_extract_zip, ExtractionError
from backend.app.services.scanner import scan_directory
from backend.app.services.categorizer import DEFAULT_CATEGORY_RULES
from backend.app.services.duplicates import group_duplicates
from backend.app.services.organizer import generate_organization_plan, execute_organization_plan
from backend.app.services.restore import restore_job_workspace

router = APIRouter(prefix="/jobs", tags=["jobs"])

WORKSPACE_BASE = os.path.abspath(os.environ.get("FILEPILOT_WORKSPACE", "workspace"))


def get_job_workspace(job_id: str) -> Dict[str, str]:
    job_dir = os.path.join(WORKSPACE_BASE, job_id)
    return {
        "job_dir": job_dir,
        "archive_path": os.path.join(job_dir, "source.zip"),
        "extracted_dir": os.path.join(job_dir, "extracted"),
        "organized_dir": os.path.join(job_dir, "organized"),
        "output_zip_path": os.path.join(job_dir, "organized_output.zip"),
    }


@router.get("", response_model=List[JobSchema])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return [JobSchema.model_validate(j) for j in jobs]


@router.post("", response_model=JobSchema)
async def upload_job(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archive files are supported.")

    job_id = f"job_{uuid.uuid4().hex[:10]}"
    ws = get_job_workspace(job_id)
    os.makedirs(ws["job_dir"], exist_ok=True)

    # Save uploaded file
    try:
        with open(ws["archive_path"], "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    # Extract archive safely
    try:
        extracted_files_count = validate_and_extract_zip(ws["archive_path"], ws["extracted_dir"])
    except ExtractionError as ee:
        shutil.rmtree(ws["job_dir"], ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(ee))
    except Exception as e:
        shutil.rmtree(ws["job_dir"], ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Archive extraction failed: {str(e)}")

    job = Job(
        id=job_id,
        source_filename=file.filename,
        archive_path=ws["archive_path"],
        extracted_dir=ws["extracted_dir"],
        status="uploaded",
        total_files=extracted_files_count,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return JobSchema.model_validate(job)


@router.get("/{job_id}", response_model=JobSchema)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobSchema.model_validate(job)


@router.post("/{job_id}/scan", response_model=JobSchema)
def scan_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch app settings for custom category rules
    setting_rec = db.query(AppSettings).filter(AppSettings.key == "app_config").first()
    category_rules = DEFAULT_CATEGORY_RULES
    if setting_rec:
        val = setting_rec.get_value()
        if val and "category_rules" in val:
            category_rules = val["category_rules"]

    # Clear existing file records if re-scanning
    db.query(FileRecord).filter(FileRecord.job_id == job_id).delete()
    db.query(OrganizationAction).filter(OrganizationAction.job_id == job_id).delete()

    raw_records = list(scan_directory(job.extracted_dir, category_rules=category_rules))
    
    # Assign file IDs
    for rec in raw_records:
        rec["id"] = f"file_{uuid.uuid4().hex[:10]}"
        rec["job_id"] = job_id

    # Group exact duplicates
    dup_res = group_duplicates(raw_records)
    processed_records = dup_res["records"]

    # Summary metrics
    cat_summary = {}
    total_size = 0
    file_models = []

    for rec in processed_records:
        total_size += rec["file_size"]
        cat = rec["category"]
        cat_summary[cat] = cat_summary.get(cat, 0) + 1

        fm = FileRecord(
            id=rec["id"],
            job_id=job_id,
            original_path=rec["original_path"],
            filename=rec["filename"],
            extension=rec["extension"],
            mime_type=rec["mime_type"],
            file_size=rec["file_size"],
            created_at=rec["created_at"],
            modified_at=rec["modified_at"],
            sha256_hash=rec["sha256_hash"],
            category=rec["category"],
            duplicate_group_id=rec["duplicate_group_id"],
            is_duplicate=rec["is_duplicate"],
            is_selected_duplicate=rec["is_selected_duplicate"],
        )
        file_models.append(fm)

    db.bulk_save_objects(file_models)

    job.total_files = len(processed_records)
    job.total_size = total_size
    job.duplicate_count = dup_res["total_duplicate_count"]
    job.duplicate_savings = dup_res["total_duplicate_savings"]
    job.set_categories_summary(cat_summary)
    job.status = "scanned"

    db.commit()
    db.refresh(job)

    # Automatically generate default organization plan upon scan completion
    plan_actions = generate_organization_plan(processed_records)
    action_models = [
        OrganizationAction(
            id=act["id"],
            job_id=job_id,
            file_id=act["file_id"],
            original_path=act["original_path"],
            proposed_path=act["proposed_path"],
            action=act["action"],
            status=act["status"],
            conflict_flag=act["conflict_flag"],
            conflict_reason=act["conflict_reason"],
        )
        for act in plan_actions
    ]
    db.bulk_save_objects(action_models)

    # Update file record proposed paths
    act_map = {act["file_id"]: act["proposed_path"] for act in plan_actions}
    for fm in db.query(FileRecord).filter(FileRecord.job_id == job_id).all():
        if fm.id in act_map:
            fm.proposed_path = act_map[fm.id]

    job.status = "planned"
    db.commit()
    db.refresh(job)

    return JobSchema.model_validate(job)


@router.get("/{job_id}/files", response_model=List[FileRecordSchema])
def get_job_files(
    job_id: str,
    search: Optional[str] = None,
    category: Optional[str] = None,
    duplicates_only: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    query = db.query(FileRecord).filter(FileRecord.job_id == job_id)
    if search:
        query = query.filter(FileRecord.filename.ilike(f"%{search}%"))
    if category and category.lower() != "all":
        query = query.filter(FileRecord.category.ilike(category))
    if duplicates_only:
        query = query.filter(FileRecord.is_duplicate == True)

    files = query.all()
    return [FileRecordSchema.model_validate(f) for f in files]


@router.get("/{job_id}/file-content")
def get_file_content(job_id: str, file_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    file_rec = db.query(FileRecord).filter(FileRecord.id == file_id, FileRecord.job_id == job_id).first()
    if not job or not file_rec:
        raise HTTPException(status_code=404, detail="File record not found")

    full_path = os.path.join(job.extracted_dir, file_rec.original_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File content not found on disk")

    ext = file_rec.extension.lower()
    text_exts = [".txt", ".py", ".js", ".json", ".csv", ".md", ".html", ".css", ".xml", ".sh", ".sql"]
    img_exts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]

    if ext in text_exts:
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(50000)
            return PlainTextResponse(content)
        except Exception as e:
            return PlainTextResponse(f"Error reading file: {str(e)}")

    if ext in img_exts:
        return FileResponse(full_path, media_type=file_rec.mime_type or "image/png")

    return Response(content=f"Binary preview unavailable for extension {ext} ({file_rec.file_size} bytes)", media_type="text/plain")


@router.get("/{job_id}/duplicates", response_model=List[DuplicateGroupSchema])
def get_job_duplicates(job_id: str, db: Session = Depends(get_db)):
    duplicate_files = db.query(FileRecord).filter(
        FileRecord.job_id == job_id,
        FileRecord.is_duplicate == True
    ).all()

    groups_map = {}
    for f in duplicate_files:
        gid = f.duplicate_group_id
        if not gid:
            continue
        if gid not in groups_map:
            groups_map[gid] = {
                "duplicate_group_id": gid,
                "sha256_hash": f.sha256_hash,
                "file_size": f.file_size,
                "files": [],
            }
        groups_map[gid]["files"].append(FileRecordSchema.model_validate(f))

    result = []
    for gid, data in groups_map.items():
        files_list = data["files"]
        count = len(files_list)
        total_size = data["file_size"] * count
        savings = data["file_size"] * (count - 1)
        result.append(DuplicateGroupSchema(
            duplicate_group_id=gid,
            sha256_hash=data["sha256_hash"],
            count=count,
            total_size=total_size,
            potential_savings=savings,
            files=files_list,
        ))

    return result


@router.get("/{job_id}/plan", response_model=List[OrganizationActionSchema])
def get_job_plan(job_id: str, db: Session = Depends(get_db)):
    actions = db.query(OrganizationAction).filter(OrganizationAction.job_id == job_id).all()
    return [OrganizationActionSchema.model_validate(a) for a in actions]


@router.put("/{job_id}/plan", response_model=List[OrganizationActionSchema])
def update_job_plan(job_id: str, req: PlanUpdateRequest, db: Session = Depends(get_db)):
    for item in req.updates:
        file_rec = db.query(FileRecord).filter(FileRecord.id == item.file_id, FileRecord.job_id == job_id).first()
        action_rec = db.query(OrganizationAction).filter(OrganizationAction.file_id == item.file_id, OrganizationAction.job_id == job_id).first()

        if item.is_selected_duplicate is not None and file_rec:
            file_rec.is_selected_duplicate = item.is_selected_duplicate
            if action_rec:
                if not item.is_selected_duplicate:
                    action_rec.action = "skip"
                    action_rec.proposed_path = f"_skipped/{file_rec.filename}"
                else:
                    action_rec.action = "copy"
                    action_rec.proposed_path = f"{file_rec.category}/{file_rec.filename}"

        if item.user_override_path is not None and action_rec:
            action_rec.user_override_path = item.user_override_path
            action_rec.proposed_path = item.user_override_path
            action_rec.action = "rename" if os.path.basename(item.user_override_path) != file_rec.filename else "copy"

    db.commit()
    actions = db.query(OrganizationAction).filter(OrganizationAction.job_id == job_id).all()
    return [OrganizationActionSchema.model_validate(a) for a in actions]


@router.post("/{job_id}/organize", response_model=JobSchema)
def organize_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    ws = get_job_workspace(job_id)
    actions = db.query(OrganizationAction).filter(OrganizationAction.job_id == job_id).all()

    action_dicts = [
        {
            "id": a.id,
            "job_id": a.job_id,
            "file_id": a.file_id,
            "original_path": a.original_path,
            "proposed_path": a.proposed_path,
            "action": a.action,
            "status": a.status,
            "conflict_flag": a.conflict_flag,
            "user_override_path": a.user_override_path,
        }
        for a in actions
    ]

    res = execute_organization_plan(
        extracted_dir=job.extracted_dir,
        organized_dir=ws["organized_dir"],
        output_zip_path=ws["output_zip_path"],
        actions=action_dicts,
    )

    job.organized_dir = ws["organized_dir"]
    job.output_zip_path = ws["output_zip_path"]
    job.status = "organized"

    # Update DB actions status
    for a in actions:
        a.status = "completed" if a.action != "skip" else "skipped"

    db.commit()
    db.refresh(job)

    return JobSchema.model_validate(job)


@router.get("/{job_id}/download")
def download_organized_output(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.output_zip_path or not os.path.exists(job.output_zip_path):
        raise HTTPException(status_code=404, detail="Organized output ZIP not found. Please run organization first.")

    out_name = f"organized_{job.source_filename}"
    return FileResponse(
        path=job.output_zip_path,
        filename=out_name,
        media_type="application/zip"
    )


@router.post("/{job_id}/restore", response_model=JobSchema)
def restore_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    ws = get_job_workspace(job_id)
    restore_job_workspace(ws["organized_dir"], ws["output_zip_path"])

    job.organized_dir = None
    job.output_zip_path = None
    job.status = "planned"

    # Reset action status to pending
    db.query(OrganizationAction).filter(OrganizationAction.job_id == job_id).update({"status": "pending"})

    db.commit()
    db.refresh(job)

    return JobSchema.model_validate(job)


@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    ws = get_job_workspace(job_id)
    shutil.rmtree(ws["job_dir"], ignore_errors=True)

    db.delete(job)
    db.commit()
    return {"message": f"Job {job_id} deleted successfully."}
