import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.job import AppSettings
from backend.app.schemas.job import SettingsSchema
from backend.app.services.categorizer import DEFAULT_CATEGORY_RULES

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "category_rules": DEFAULT_CATEGORY_RULES,
    "naming_convention": "{category}/{filename}",
    "max_upload_size_mb": 500,
    "max_file_count": 5000,
    "auto_remove_duplicates": False,
}


@router.get("", response_model=SettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    setting_record = db.query(AppSettings).filter(AppSettings.key == "app_config").first()
    if not setting_record:
        return DEFAULT_SETTINGS
    return setting_record.get_value() or DEFAULT_SETTINGS


@router.post("", response_model=SettingsSchema)
def update_settings(payload: SettingsSchema, db: Session = Depends(get_db)):
    setting_record = db.query(AppSettings).filter(AppSettings.key == "app_config").first()
    data = payload.dict()
    if not setting_record:
        setting_record = AppSettings(key="app_config", value_json=json.dumps(data))
        db.add(setting_record)
    else:
        setting_record.value_json = json.dumps(data)
    db.commit()
    return data
