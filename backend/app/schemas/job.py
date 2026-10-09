from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


class FileRecordSchema(BaseModel):
    id: str
    job_id: str
    original_path: str
    filename: str
    extension: str
    mime_type: Optional[str] = None
    file_size: int
    created_at: Optional[datetime] = None
    modified_at: Optional[datetime] = None
    sha256_hash: Optional[str] = None
    category: str
    proposed_path: Optional[str] = None
    duplicate_group_id: Optional[str] = None
    is_duplicate: bool
    is_selected_duplicate: bool

    model_config = ConfigDict(from_attributes=True)


class OrganizationActionSchema(BaseModel):
    id: str
    job_id: str
    file_id: str
    original_path: str
    proposed_path: str
    action: str
    status: str
    conflict_flag: bool
    conflict_reason: Optional[str] = None
    user_override_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobSchema(BaseModel):
    id: str
    source_filename: str
    status: str
    created_at: datetime
    updated_at: datetime
    total_files: int
    total_size: int
    duplicate_count: int
    duplicate_savings: int
    categories_summary: Dict[str, Any]
    error_message: Optional[str] = None
    output_zip_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DuplicateGroupSchema(BaseModel):
    duplicate_group_id: str
    sha256_hash: str
    count: int
    total_size: int
    potential_savings: int
    files: List[FileRecordSchema]


class PlanUpdateItem(BaseModel):
    file_id: str
    user_override_path: Optional[str] = None
    is_selected_duplicate: Optional[bool] = None


class PlanUpdateRequest(BaseModel):
    updates: List[PlanUpdateItem]


class SettingsSchema(BaseModel):
    category_rules: Dict[str, List[str]]
    naming_convention: str
    max_upload_size_mb: int
    max_file_count: int
    auto_remove_duplicates: bool
