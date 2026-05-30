from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.post("", response_model=schemas.CheckInOut, status_code=201)
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
        existing = db.query(models.CheckIn).filter(
            models.CheckIn.registrant_id == checkin_in.registrant_id,
            models.CheckIn.event_type == "convention",
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already checked in for convention")
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


@router.get("", response_model=List[schemas.CheckInOut])
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
    vip_registrants = db.query(models.Registrant).filter(models.Registrant.is_vip == True).count()

    convention_registrants = db.query(models.Registrant).filter(
        models.Registrant.convention == True, models.Registrant.is_vip == False
    ).count()
    vip_convention = db.query(models.Registrant).filter(
        models.Registrant.convention == True, models.Registrant.is_vip == True
    ).count()

    boat_cruise_registrants = db.query(models.Registrant).filter(
        models.Registrant.boat_cruise == True, models.Registrant.is_vip == False
    ).count()
    vip_boat_cruise = db.query(models.Registrant).filter(
        models.Registrant.boat_cruise == True, models.Registrant.is_vip == True
    ).count()

    convention_checkins = db.query(models.CheckIn).filter(models.CheckIn.event_type == "convention").count()
    boat_cruise_checkins = db.query(models.CheckIn).filter(models.CheckIn.event_type == "boat_cruise").count()

    return {
        "total_registrants": total_registrants,
        "vip_registrants": vip_registrants,
        "convention_registrants": convention_registrants,
        "vip_convention": vip_convention,
        "boat_cruise_registrants": boat_cruise_registrants,
        "vip_boat_cruise": vip_boat_cruise,
        "convention_checkins": convention_checkins,
        "boat_cruise_checkins": boat_cruise_checkins,
    }


@router.get("/breakdown")
def checkin_breakdown(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    from sqlalchemy import func

    from sqlalchemy import case

    # Normalize USA variants to "United States", then title-case everything else
    normalized_country = case(
        (func.lower(func.trim(models.Registrant.country)).in_(["usa", "us", "united states", "u.s.a", "u.s.", "america"]), "United States"),
        else_=func.initcap(func.trim(models.Registrant.country))
    )

    country_rows = (
        db.query(normalized_country, func.count(models.Registrant.id))
        .filter(models.Registrant.country.isnot(None))
        .group_by(normalized_country)
        .order_by(func.count(models.Registrant.id).desc())
        .all()
    )

    STATE_MAP = {
        "al": "Alabama", "ak": "Alaska", "az": "Arizona", "ar": "Arkansas",
        "ca": "California", "co": "Colorado", "ct": "Connecticut", "de": "Delaware",
        "fl": "Florida", "ga": "Georgia", "hi": "Hawaii", "id": "Idaho",
        "il": "Illinois", "in": "Indiana", "ia": "Iowa", "ks": "Kansas",
        "ky": "Kentucky", "la": "Louisiana", "me": "Maine", "md": "Maryland",
        "ma": "Massachusetts", "mi": "Michigan", "mn": "Minnesota", "ms": "Mississippi",
        "mo": "Missouri", "mt": "Montana", "ne": "Nebraska", "nv": "Nevada",
        "nh": "New Hampshire", "nj": "New Jersey", "nm": "New Mexico", "ny": "New York",
        "nc": "North Carolina", "nd": "North Dakota", "oh": "Ohio", "ok": "Oklahoma",
        "or": "Oregon", "pa": "Pennsylvania", "ri": "Rhode Island", "sc": "South Carolina",
        "sd": "South Dakota", "tn": "Tennessee", "tx": "Texas", "ut": "Utah",
        "vt": "Vermont", "va": "Virginia", "wa": "Washington", "wv": "West Virginia",
        "wi": "Wisconsin", "wy": "Wyoming", "dc": "Washington DC",
    }

    normalized_state = case(
        *[(func.lower(func.trim(models.Registrant.state)) == abbr, full)
          for abbr, full in STATE_MAP.items()],
        else_=func.initcap(func.trim(models.Registrant.state))
    )

    state_rows = (
        db.query(normalized_state, func.count(models.Registrant.id))
        .filter(
            models.Registrant.state.isnot(None),
            func.lower(func.trim(models.Registrant.country)).in_(["usa", "united states", "us"])
        )
        .group_by(normalized_state)
        .order_by(func.count(models.Registrant.id).desc())
        .all()
    )

    age_rows = (
        db.query(models.Registrant.age_group, func.count(models.Registrant.id))
        .group_by(models.Registrant.age_group)
        .all()
    )

    return {
        "by_country": [{"name": r[0], "count": r[1]} for r in country_rows],
        "by_state": [{"name": r[0], "count": r[1]} for r in state_rows],
        "by_age_group": [{"name": r[0], "count": r[1]} for r in age_rows],
    }
