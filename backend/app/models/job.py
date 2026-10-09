import datetime
import json
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    source_filename = Column(String, nullable=False)
    archive_path = Column(String, nullable=False)
    extracted_dir = Column(String, nullable=False)
    organized_dir = Column(String, nullable=True)
    output_zip_path = Column(String, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, scanned, planned, organized, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    total_files = Column(Integer, default=0)
    total_size = Column(BigInteger, default=0)
    duplicate_count = Column(Integer, default=0)
    duplicate_savings = Column(BigInteger, default=0)
    categories_json = Column(Text, default="{}")
    error_message = Column(Text, nullable=True)

    files = relationship("FileRecord", back_populates="job", cascade="all, delete-orphan")
    actions = relationship("OrganizationAction", back_populates="job", cascade="all, delete-orphan")

    @property
    def categories_summary(self):
        try:
            return json.loads(self.categories_json) if self.categories_json else {}
        except Exception:
            return {}

    def set_categories_summary(self, data):
        self.categories_json = json.dumps(data)


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    original_path = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    extension = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    file_size = Column(BigInteger, default=0)
    created_at = Column(DateTime, nullable=True)
    modified_at = Column(DateTime, nullable=True)
    sha256_hash = Column(String, index=True, nullable=True)
    category = Column(String, default="Others")
    proposed_path = Column(String, nullable=True)
    duplicate_group_id = Column(String, nullable=True, index=True)
    is_duplicate = Column(Boolean, default=False)
    is_selected_duplicate = Column(Boolean, default=True)

    job = relationship("Job", back_populates="files")
    action = relationship("OrganizationAction", back_populates="file", uselist=False, cascade="all, delete-orphan")


class OrganizationAction(Base):
    __tablename__ = "organization_actions"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    file_id = Column(String, ForeignKey("files.id"), nullable=False, index=True)
    original_path = Column(String, nullable=False)
    proposed_path = Column(String, nullable=False)
    action = Column(String, default="copy")  # copy, rename, skip
    status = Column(String, default="pending")  # pending, completed, failed, conflict
    conflict_flag = Column(Boolean, default=False)
    conflict_reason = Column(String, nullable=True)
    user_override_path = Column(String, nullable=True)

    job = relationship("Job", back_populates="actions")
    file = relationship("FileRecord", back_populates="action")


class AppSettings(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value_json = Column(Text, nullable=False)

    def get_value(self):
        try:
            return json.loads(self.value_json)
        except Exception:
            return None

    def set_value(self, val):
        self.value_json = json.dumps(val)
