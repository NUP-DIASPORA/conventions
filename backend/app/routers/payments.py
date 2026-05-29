from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("", response_model=schemas.PaymentOut, status_code=201)
def create_payment(
    payment_in: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    # If linked to a registrant, validate they exist and update flags
    if payment_in.registrant_id is not None:
        registrant = db.query(models.Registrant).filter(
            models.Registrant.id == payment_in.registrant_id
        ).first()
        if not registrant:
            raise HTTPException(status_code=404, detail="Registrant not found")
        if payment_in.product_type == "convention":
            registrant.convention = True
        elif payment_in.product_type == "boat_cruise":
            registrant.boat_cruise = True

    payment = models.Payment(**payment_in.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/unattributed", response_model=List[schemas.PaymentOut])
def list_unattributed_payments(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Payments not yet linked to a registrant."""
    return db.query(models.Payment).filter(models.Payment.registrant_id == None).all()


@router.patch("/{payment_id}/link", response_model=schemas.PaymentOut)
def link_payment_to_registrant(
    payment_id: int,
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Link an unattributed payment to a registrant."""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.registrant_id is not None:
        raise HTTPException(status_code=400, detail="Payment is already linked to a registrant")

    registrant = db.query(models.Registrant).filter(models.Registrant.id == registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")

    payment.registrant_id = registrant_id
    if payment.product_type == "convention":
        registrant.convention = True
    elif payment.product_type == "boat_cruise":
        registrant.boat_cruise = True

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/summary")
def payment_summary(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    from sqlalchemy import func, Numeric

    # Total collected per product type
    rows = (
        db.query(models.Payment.product_type, func.sum(models.Payment.amount.cast(Numeric)))
        .group_by(models.Payment.product_type)
        .all()
    )
    totals = {r[0]: float(r[1]) for r in rows}

    # Full vs partial per registrant
    # Convention: full = paid >= 280 (covers early bird $280 and standard $300)
    # Boat cruise: full = paid >= 220
    FULL_THRESHOLD = {"convention": 280, "boat_cruise": 220}

    def count_full_partial(product_type):
        threshold = FULL_THRESHOLD[product_type]
        paid_per_reg = (
            db.query(
                models.Payment.registrant_id,
                func.sum(models.Payment.amount.cast(Numeric)).label("paid")
            )
            .filter(
                models.Payment.product_type == product_type,
                models.Payment.registrant_id.isnot(None)
            )
            .group_by(models.Payment.registrant_id)
            .all()
        )
        full = sum(1 for r in paid_per_reg if float(r.paid) >= threshold)
        partial = len(paid_per_reg) - full
        return full, partial

    conv_full, conv_partial = count_full_partial("convention")
    cruise_full, cruise_partial = count_full_partial("boat_cruise")

    return {
        "convention": totals.get("convention", 0),
        "convention_full": conv_full,
        "convention_partial": conv_partial,
        "boat_cruise": totals.get("boat_cruise", 0),
        "boat_cruise_full": cruise_full,
        "boat_cruise_partial": cruise_partial,
        "donation": totals.get("donation", 0),
        "total": sum(totals.values()),
    }


@router.delete("/{payment_id}", status_code=204)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
