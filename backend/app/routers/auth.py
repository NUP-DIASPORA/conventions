from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..utils.auth import verify_password, get_password_hash, create_access_token, get_current_admin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.email == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": admin.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=schemas.AdminOut)
def register_admin(
    admin_in: schemas.AdminCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),  # must be logged in
):
    """Only an existing authenticated admin can create new admins."""
    existing = db.query(models.Admin).filter(models.Admin.email == admin_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    admin = models.Admin(
        email=admin_in.email,
        full_name=admin_in.full_name,
        hashed_password=get_password_hash(admin_in.password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.get("/me", response_model=schemas.AdminOut)
def get_me(current_admin=Depends(get_current_admin)):
    return current_admin


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePassword,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    if not verify_password(payload.current_password, current_admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_admin.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
