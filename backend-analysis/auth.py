from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
import csv
import os

from src.core.database import SessionLocal
from src.schemas.user import UserCreate, UserOut
from src.models.user import User, UserRole
from src.services.token import create_access_token
from src.services.auth import get_current_user
from src.services.rbac import require_role
from src.services.security import hash_password, verify_password

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DevLoginRequest(BaseModel):
    email: str

class PasswordLoginRequest(BaseModel):
    email: str
    password: str

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.audit, UserRole.administrator))
):
    return db.query(User).all()

@router.post("/users/bulk-upload")
def bulk_upload_users(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.administrator))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = file.file.read().decode("utf-8").splitlines()
    reader = csv.DictReader(content)
    
    success, failed = 0, 0
    errors = []

    for idx, row in enumerate(reader, start=1):
        try:
            email = row["email"]
            first_name = row["first_name"]
            last_name = row["last_name"]
            phone_number = row.get("phone_number", None)
            role = row.get("role", "user")

            if not email or not first_name or not last_name:
                raise ValueError("Missing required fields")

            if db.query(User).filter(User.email == email).first():
                raise ValueError(f"Email already exists: {email}")

            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                credentials=None,
                role=UserRole(role) if role in UserRole.__members__ else UserRole.user,
                password_hash=None,
                registered_at=datetime.utcnow(),
                failed_login_attempts=0
            )
            db.add(new_user)
            success += 1
        except Exception as e:
            failed += 1
            errors.append({"row": idx, "error": str(e)})

    db.commit()
    return {
        "successfully_added": success,
        "failed": failed,
        "errors": errors
    }

@router.post("/register", response_model=UserOut)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = user_data.role if os.getenv("ENV") != "production" else UserRole.user

    new_user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        credentials=user_data.credentials,
        role=role,
        registered_at=datetime.utcnow(),
        failed_login_attempts=0,
        password_hash=hash_password(user_data.password) if user_data.password else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/create-user", response_model=UserOut)
def create_user_as_admin(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.administrator))
):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        credentials=user_data.credentials,
        role=user_data.role or UserRole.user,
        registered_at=datetime.utcnow(),
        failed_login_attempts=0,
        password_hash=hash_password(user_data.password) if user_data.password else None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/dev-login")
def dev_login(payload: DevLoginRequest, db: Session = Depends(get_db)):
    if os.getenv("ENV") == "production":
        raise HTTPException(status_code=403, detail="Dev login disabled in production")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.last_login_at = datetime.utcnow()
    user.failed_login_attempts = 0
    db.commit()

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login-password")
def login_with_password(payload: PasswordLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login_at = datetime.utcnow()
    user.failed_login_attempts = 0
    db.commit()

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.administrator))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: UUID,
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.administrator))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email = user_data.email
    user.first_name = user_data.first_name
    user.last_name = user_data.last_name
    user.phone_number = user_data.phone_number
    user.role = user_data.role or user.role
    user.credentials = user_data.credentials
    user.password_hash = hash_password(user_data.password) if user_data.password else user.password_hash

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(require_role(UserRole.administrator))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}

