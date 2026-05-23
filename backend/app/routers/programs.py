from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/programs", tags=["programs"])


@router.get("", response_model=List[schemas.ProgramSessionOut])
def list_sessions(
    session_date: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """Public endpoint - returns all public sessions, optionally filtered by date."""
    query = db.query(models.ProgramSession).options(joinedload(models.ProgramSession.speaker))
    query = query.filter(models.ProgramSession.is_public == True)
    if session_date:
        query = query.filter(models.ProgramSession.session_date == session_date)
    return query.order_by(models.ProgramSession.session_date, models.ProgramSession.start_time).all()


@router.post("", response_model=schemas.ProgramSessionOut, status_code=201)
def create_session(
    session_in: schemas.ProgramSessionCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    session = models.ProgramSession(**session_in.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return db.query(models.ProgramSession).options(joinedload(models.ProgramSession.speaker)).filter(models.ProgramSession.id == session.id).first()


@router.get("/{session_id}", response_model=schemas.ProgramSessionOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.ProgramSession).options(joinedload(models.ProgramSession.speaker)).filter(models.ProgramSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.patch("/{session_id}", response_model=schemas.ProgramSessionOut)
def update_session(
    session_id: int,
    updates: schemas.ProgramSessionUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    session = db.query(models.ProgramSession).filter(models.ProgramSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    return db.query(models.ProgramSession).options(joinedload(models.ProgramSession.speaker)).filter(models.ProgramSession.id == session_id).first()


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    session = db.query(models.ProgramSession).filter(models.ProgramSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
