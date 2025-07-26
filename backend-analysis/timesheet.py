from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from enum import Enum

from src.core.database import SessionLocal
from src.models.timesheet import TimesheetEntry
from src.schemas.timesheet import TimesheetCreate, Timesheet
from src.models.user import User, UserRole
from src.services.rbac import require_role

router = APIRouter()

class TimesheetStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[Timesheet])
def get_my_timesheets(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.user, UserRole.audit, UserRole.manager))
):
    query = db.query(TimesheetEntry)
    if user.role == UserRole.user:
        query = query.filter(TimesheetEntry.user_id == user.id)
    return query.all()

@router.get("/entries", response_model=List[Timesheet])
def get_entries(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.user, UserRole.audit, UserRole.manager))
):
    query = db.query(TimesheetEntry)
    if user.role == UserRole.user:
        query = query.filter(TimesheetEntry.user_id == user.id)
    return query.all()

@router.post("/", response_model=Timesheet)
def create_entry(
    entry: TimesheetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.user, UserRole.manager))
):
    if entry.status and entry.status not in TimesheetStatus.__members__:
        raise HTTPException(status_code=400, detail="Invalid status value")

    new_entry = TimesheetEntry(
        user_id=user.id,
        date=entry.date,
        hours=entry.hours,
        project_id=entry.project_id,
        description=entry.description,
        status=entry.status or "draft"
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.post("/entries", response_model=Timesheet)
def create_entry_alias(
    entry: TimesheetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.user, UserRole.manager))
):
    return create_entry(entry=entry, db=db, user=user)

@router.put("/{entry_id}", response_model=Timesheet)
def update_entry(
    entry_id: UUID,
    update: TimesheetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.user, UserRole.manager))
):
    entry = db.query(TimesheetEntry).filter(TimesheetEntry.id == entry_id)
    if user.role == UserRole.user:
        entry = entry.filter(TimesheetEntry.user_id == user.id)
    entry = entry.first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if update.status and update.status not in TimesheetStatus.__members__:
        raise HTTPException(status_code=400, detail="Invalid status value")

    entry.date = update.date
    entry.hours = update.hours
    entry.project_id = update.project_id
    entry.description = update.description
    entry.status = update.status or "draft"

    db.commit()
    db.refresh(entry)
    return entry

@router.put("/{entry_id}/approve", response_model=Timesheet)
def approve_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.manager))
):
    entry = db.query(TimesheetEntry).filter(TimesheetEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.status != TimesheetStatus.submitted:
        raise HTTPException(status_code=400, detail="Only submitted entries can be approved")

    entry.status = TimesheetStatus.approved
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}")
def delete_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.user, UserRole.manager))
):
    entry = db.query(TimesheetEntry).filter(TimesheetEntry.id == entry_id)
    if user.role == UserRole.user:
        entry = entry.filter(TimesheetEntry.user_id == user.id)
    entry = entry.first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return {"detail": "Entry deleted"}

