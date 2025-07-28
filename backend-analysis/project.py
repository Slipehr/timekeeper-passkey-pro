from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.core.database import SessionLocal
from src.models.project import Project, ProjectStatus
from src.schemas.project import ProjectCreate, ProjectOut
from src.services.rbac import require_role
from src.models.user import UserRole, User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ProjectOut)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.manager))
):
    project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status or ProjectStatus.active,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.post("", response_model=ProjectOut, include_in_schema=False)
def create_project_no_slash(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.manager))
):
    project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status or ProjectStatus.active,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[ProjectOut])
def get_all_projects(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.user, UserRole.manager, UserRole.audit))
):
    return db.query(Project).all()

@router.get("", response_model=List[ProjectOut], include_in_schema=False)
def get_all_projects_no_slash(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.user, UserRole.manager, UserRole.audit))
):
    return db.query(Project).all()

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.manager))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.name = project_data.name
    project.description = project_data.description

    # ✅ PATCH: Allow status update from frontend
    if project_data.status:
        if project_data.status not in ProjectStatus.__members__:
            raise HTTPException(status_code=400, detail="Invalid project status")
        project.status = project_data.status

    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.manager))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

