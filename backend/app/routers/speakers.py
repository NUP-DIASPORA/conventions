from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/speakers", tags=["speakers"])


@router.get("", response_model=List[schemas.SpeakerOut])
def list_speakers(db: Session = Depends(get_db)):
    """Public endpoint - no auth required."""
    return db.query(models.Speaker).order_by(models.Speaker.is_keynote.desc(), models.Speaker.last_name).all()


@router.post("", response_model=schemas.SpeakerOut, status_code=201)
def create_speaker(
    speaker_in: schemas.SpeakerCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    speaker = models.Speaker(**speaker_in.model_dump())
    db.add(speaker)
    db.commit()
    db.refresh(speaker)
    return speaker


@router.get("/{speaker_id}", response_model=schemas.SpeakerOut)
def get_speaker(speaker_id: int, db: Session = Depends(get_db)):
    """Public endpoint - no auth required."""
    speaker = db.query(models.Speaker).filter(models.Speaker.id == speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")
    return speaker


@router.patch("/{speaker_id}", response_model=schemas.SpeakerOut)
def update_speaker(
    speaker_id: int,
    updates: schemas.SpeakerUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    speaker = db.query(models.Speaker).filter(models.Speaker.id == speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(speaker, field, value)
    db.commit()
    db.refresh(speaker)
    return speaker


@router.delete("/{speaker_id}", status_code=204)
def delete_speaker(
    speaker_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    speaker = db.query(models.Speaker).filter(models.Speaker.id == speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")
    db.delete(speaker)
    db.commit()
