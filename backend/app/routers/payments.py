from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/", response_model=schemas.PaymentOut, status_code=201)
def create_payment(
    payment_in: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == payment_in.registrant_id
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")

    payment = models.Payment(**payment_in.model_dump())
    db.add(payment)

    # Keep convenience flags in sync
    if payment_in.product_type == "convention":
        registrant.convention = True
    elif payment_in.product_type == "boat_cruise":
        registrant.boat_cruise = True

    db.commit()
    db.refresh(payment)
    return payment


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
