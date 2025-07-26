# Backend-Frontend Integration Gaps & Fixes

## ❌ Critical Issues Found

### 1. Projects Status Field Missing
**Problem:** Backend Project model lacks `status` field that frontend expects

**Backend Fix:**
```python
# src/models/project.py
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)  # ADD THIS
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Backend Schema Fix:**
```python
# src/schemas/project.py
class ProjectCreate(BaseModel):
    name: str
    description: str = None
    status: str = "active"  # ADD THIS

class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: str = None
    status: str  # ADD THIS
    created_at: datetime
```

### 2. Users Endpoint Missing
**Problem:** Frontend Reports calls `/users` but endpoint doesn't exist

**Backend Fix:**
```python
# Add to src/routes/auth.py
@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.manager, UserRole.audit))
):
    return db.query(User).all()
```

### 3. Chart Data Format Mismatch
**Problem:** Backend returns wrong structure for dashboard charts

**Backend Fix:**
```python
# Fix src/routes/dashboard.py @router.get("/charts")
return {
    "weeklyData": [{"day": "Mon", "hours": 0}],  # Format for frontend
    "projectData": [{"name": project, "hours": hours, "fill": color}]
}
```

### 4. API URL Inconsistencies
**Frontend Fix:**
```typescript
// In Reports.tsx line 84, change:
fetch('http://192.168.11.3:8200/timesheets/entries', {  // Use /entries consistently
```

## ✅ Working Features
- Authentication (login, passkey, JWT)
- Timesheet CRUD operations
- Dashboard stats
- Project CRUD (except status field)
- RBAC permissions
- Status mapping (draft/submitted/approved)

## 🔄 Database Migration Needed
```sql
-- Add status column to projects table
ALTER TABLE projects ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;
```

## 📋 Priority Order
1. **HIGH:** Add Project.status field to backend
2. **HIGH:** Add /users endpoint  
3. **MEDIUM:** Fix chart data format
4. **LOW:** Standardize API URLs

## 🎯 Frontend Validation Status
✅ All status mapping fixed for timesheet entries
✅ All CRUD operations properly implemented
✅ Permission system working
❌ Projects status field missing backend support
❌ Users list missing from backend