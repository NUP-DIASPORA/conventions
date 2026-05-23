from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.post("/", response_model=schemas.CheckInOut, status_code=201)
def check_in_registrant(
    checkin_in: schemas.CheckInCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == checkin_in.registrant_id
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")

    if checkin_in.event_type == "convention":
        if checkin_in.conference_day is None:
            raise HTTPException(status_code=400, detail="conference_day required for convention check-in")
        existing = db.query(models.CheckIn).filter(
            models.CheckIn.registrant_id == checkin_in.registrant_id,
            models.CheckIn.event_type == "convention",
            models.CheckIn.conference_day == checkin_in.conference_day,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Already checked in for day {checkin_in.conference_day}")
        registrant.checked_in = True

    elif checkin_in.event_type == "boat_cruise":
        existing = db.query(models.CheckIn).filter(
            models.CheckIn.registrant_id == checkin_in.registrant_id,
            models.CheckIn.event_type == "boat_cruise",
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already checked in for boat cruise")
        registrant.boat_cruise_checked_in = True

    else:
        raise HTTPException(status_code=400, detail="event_type must be 'convention' or 'boat_cruise'")

    checkin = models.CheckIn(
        registrant_id=checkin_in.registrant_id,
        event_type=checkin_in.event_type,
        conference_day=checkin_in.conference_day,
        checked_in_by=current_admin.email,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/", response_model=List[schemas.CheckInOut])
def list_checkins(
    event_type: Optional[str] = None,
    conference_day: Optional[int] = None,
    registrant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    query = db.query(models.CheckIn)
    if event_type:
        query = query.filter(models.CheckIn.event_type == event_type)
    if conference_day:
        query = query.filter(models.CheckIn.conference_day == conference_day)
    if registrant_id:
        query = query.filter(models.CheckIn.registrant_id == registrant_id)
    return query.all()


@router.get("/stats")
def checkin_stats(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    total_registrants = db.query(models.Registrant).count()
    convention_registrants = db.query(models.Registrant).filter(models.Registrant.convention == True).count()
    boat_cruise_registrants = db.query(models.Registrant).filter(models.Registrant.boat_cruise == True).count()

    convention_checkins = db.query(models.CheckIn).filter(models.CheckIn.event_type == "convention").count()
    boat_cruise_checkins = db.query(models.CheckIn).filter(models.CheckIn.event_type == "boat_cruise").count()

    by_day = {}
    for day in range(1, 5):  # 4-day convention
        by_day[f"day_{day}"] = db.query(models.CheckIn).filter(
            models.CheckIn.event_type == "convention",
            models.CheckIn.conference_day == day,
        ).count()

    return {
        "total_registrants": total_registrants,
        "convention_registrants": convention_registrants,
        "boat_cruise_registrants": boat_cruise_registrants,
        "convention_checkins": convention_checkins,
        "boat_cruise_checkins": boat_cruise_checkins,
        "checkins_by_day": by_day,
    }
